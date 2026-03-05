"""
Build script for Wordcluster data files.

Downloads are NOT automatic. User must download GloVe 6B manually:
  https://nlp.stanford.edu/data/glove.6B.zip
  Extract glove.6B.50d.txt into this build/ directory.

Usage:
  pip install -r requirements.txt
  python build.py
"""

import json
import struct
import os
import sys
import numpy as np
from pathlib import Path

GLOVE_FILE = "glove.6B.50d.txt"
DATA_DIR = Path(__file__).parent.parent / "data"
TARGET_VOCAB = 5000
PCA_DIMS = 30
NUM_NEIGHBORS = 30
CANDIDATE_POOL = 80       # top-N raw similar words to score
DIVERSITY_THRESHOLD = 0.82 # angular diversity: skip if too close to existing pick
MIN_RANK = 200
MAX_RANK = 30000
MIN_LEN = 3
MAX_LEN = 12

STOPWORDS = set("""
a an the and or but if then else when while for to of in on at by with from
is am are was were be been being have has had do does did will would shall
should can could may might must need dare ought about above after again
against all also although among any as because before between both
during each either enough even every few from further get gets got had
has have having he her here hers herself him himself his how however
i its itself just least less let like made make many me might more most
much my myself neither no nor not now of off often on once one only
other our ours ourselves out over own per perhaps quite rather really
said same she should since so some still such take than that the their
theirs them themselves then there therefore these they this those though
through thus to too under until up upon us use used using very want was
we well were what whatever when where whether which while who whom whose
why will with within without would yet you your yours yourself yourselves
able across ago already always another anything away back became become
been being came come could did different does done each enough even every
everything far few found gave get give go going gone got great had has
have her here him his how however into its just keep kind know large last
let like little long look made make many may might more most much must
never new next now number off often old only other our out over own part
place point put quite rather really right run said same say second see
seem set shall she show side since small so some something sometimes
still such sure take tell than that the their them then there these
they thing think this those three through time to together too toward
try turn two under until up upon us use very want was way we well went
were what when where which while who why will with without work world
would year you young your
""".split())

BANNED = set("""
fuck shit damn ass bitch cunt dick cock pussy bastard whore slut nigger
faggot retard crap piss
""".split())


def load_glove(path):
    """Load GloVe vectors, return (words, vectors) in file order."""
    print(f"Loading {path}...")
    words = []
    vecs = []
    with open(path, "r", encoding="utf-8") as f:
        for i, line in enumerate(f):
            parts = line.rstrip().split(" ")
            word = parts[0]
            vec = [float(x) for x in parts[1:]]
            words.append(word)
            vecs.append(vec)
            if (i + 1) % 100000 == 0:
                print(f"  {i+1} lines read...")
    print(f"  Loaded {len(words)} words, dim={len(vecs[0])}")
    return words, np.array(vecs, dtype=np.float32)


def filter_vocab(words, vecs):
    """Filter to ~5000 curated words."""
    print("Filtering vocabulary...")
    selected_indices = []
    for i, w in enumerate(words):
        if i < MIN_RANK or i >= MAX_RANK:
            continue
        if len(w) < MIN_LEN or len(w) > MAX_LEN:
            continue
        if not w.isalpha():
            continue
        if w.lower() in STOPWORDS or w.lower() in BANNED:
            continue
        selected_indices.append(i)
        if len(selected_indices) >= TARGET_VOCAB:
            break

    sel_words = [words[i] for i in selected_indices]
    sel_vecs = vecs[selected_indices]
    print(f"  Selected {len(sel_words)} words")
    return sel_words, sel_vecs


def reduce_and_normalize(vecs):
    """PCA reduce to PCA_DIMS and L2-normalize."""
    from sklearn.decomposition import PCA

    print(f"PCA {vecs.shape[1]}d -> {PCA_DIMS}d...")
    pca = PCA(n_components=PCA_DIMS)
    reduced = pca.fit_transform(vecs).astype(np.float32)
    variance = sum(pca.explained_variance_ratio_) * 100
    print(f"  Explained variance: {variance:.1f}%")

    norms = np.linalg.norm(reduced, axis=1, keepdims=True)
    norms[norms == 0] = 1
    reduced = reduced / norms
    return reduced


def build_graph(words, vecs_full):
    """Build associative neighbor graph from full-dimensional vectors.

    Uses an association scoring function that peaks at moderate similarity
    (~0.7) and suppresses near-synonyms (0.9+), so neighbors are words
    that *evoke* the focal word rather than just mean the same thing.
    Angular diversity filtering ensures neighbors span different semantic
    directions rather than clustering into one synonym group.
    """
    print("Building associative neighbor graph...")

    # L2-normalize full-dimensional vectors for cosine similarity
    norms = np.linalg.norm(vecs_full, axis=1, keepdims=True)
    norms[norms == 0] = 1
    vecs_norm = vecs_full / norms

    sim = vecs_norm @ vecs_norm.T
    n = len(words)
    k = min(CANDIDATE_POOL, n - 1)

    graph = {}
    for i, w in enumerate(words):
        row = sim[i].copy()
        row[i] = -1

        # Get top-k by raw cosine similarity
        top_k = np.argpartition(row, -k)[-k:]
        top_k = top_k[np.argsort(row[top_k])[::-1]]

        # Association score: sim * (1 - sim^6)
        # Peaks around 0.7, suppresses synonyms at 0.9+
        scored = []
        for j in top_k:
            s = float(row[j])
            assoc = s * (1.0 - s ** 6)
            scored.append((j, assoc))
        scored.sort(key=lambda x: -x[1])

        # Diversity filter: greedily select, skipping words whose
        # direction is too close to an already-selected neighbor
        selected = []
        for j, score in scored:
            if len(selected) >= NUM_NEIGHBORS:
                break
            vec_j = vecs_norm[j]
            too_close = False
            for sel_j in selected:
                if float(np.dot(vec_j, vecs_norm[sel_j])) > DIVERSITY_THRESHOLD:
                    too_close = True
                    break
            if not too_close:
                selected.append(j)

        # If diversity filter was too strict, fill remaining from scored list
        if len(selected) < NUM_NEIGHBORS:
            used = set(selected)
            for j, score in scored:
                if len(selected) >= NUM_NEIGHBORS:
                    break
                if j not in used:
                    selected.append(j)
                    used.add(j)

        graph[w] = [words[j] for j in selected]
        if (i + 1) % 1000 == 0:
            print(f"  {i+1}/{n} words processed...")
    return graph


def export(words, vecs, graph):
    """Write data files."""
    DATA_DIR.mkdir(parents=True, exist_ok=True)

    # vocab.json
    vocab_path = DATA_DIR / "vocab.json"
    with open(vocab_path, "w") as f:
        json.dump(words, f)
    size = os.path.getsize(vocab_path)
    print(f"  vocab.json: {size/1024:.0f}KB ({len(words)} words)")

    # graph.json
    graph_path = DATA_DIR / "graph.json"
    with open(graph_path, "w") as f:
        json.dump(graph, f, separators=(",", ":"))
    size = os.path.getsize(graph_path)
    print(f"  graph.json: {size/1024:.0f}KB")

    # embeddings.bin (Float32, little-endian)
    emb_path = DATA_DIR / "embeddings.bin"
    with open(emb_path, "wb") as f:
        f.write(vecs.astype("<f4").tobytes())
    size = os.path.getsize(emb_path)
    print(f"  embeddings.bin: {size/1024:.0f}KB ({len(words)}x{vecs.shape[1]})")


def main():
    glove_path = Path(__file__).parent / GLOVE_FILE
    if not glove_path.exists():
        print(f"ERROR: {GLOVE_FILE} not found in build/ directory.")
        print("Download from: https://nlp.stanford.edu/data/glove.6B.zip")
        print(f"Extract {GLOVE_FILE} into: {glove_path.parent}")
        sys.exit(1)

    words, vecs = load_glove(glove_path)
    words, vecs = filter_vocab(words, vecs)
    vecs_reduced = reduce_and_normalize(vecs)
    graph = build_graph(words, vecs)  # full 50d for richer associations

    print("Exporting data files...")
    export(words, vecs_reduced, graph)
    print("Done!")


if __name__ == "__main__":
    main()
