use wasm_bindgen::prelude::*;

const GRID_SIZE: u32 = 60;
const GRID_CELLS: usize = (GRID_SIZE * GRID_SIZE) as usize;
const INITIAL_SIEVE_LIMIT: u32 = 100_000;
const SEG_SIZE: usize = 1 << 20; // 1M per segment

#[wasm_bindgen]
pub struct PrimeEngine {
    primes: Vec<u32>,
    freq: Vec<u32>,
    disc_at: Vec<i32>,
    last_seen: Vec<i32>,
    discovery_history: Vec<u32>,
    gh_keys: Vec<u32>,
    gh_idxs: Vec<u32>,
    // Per-tick event buffers (read by JS after each tick)
    updated_keys: Vec<u32>,
    new_disc_keys: Vec<u32>,
    new_disc_idxs: Vec<u32>,
    new_disc_intervals: Vec<u32>,
    // Scalars
    current_index: u32,
    max_freq: u32,
    unique_pairs: u32,
    last_discovery_idx: u32,
    // Sieve state
    sieve_pos: u64,
}

#[wasm_bindgen]
impl PrimeEngine {
    #[wasm_bindgen(constructor)]
    pub fn new() -> PrimeEngine {
        let mut engine = PrimeEngine {
            primes: Vec::with_capacity(200_000),
            freq: vec![0u32; GRID_CELLS],
            disc_at: vec![-1i32; GRID_CELLS],
            last_seen: vec![-1i32; GRID_CELLS],
            discovery_history: Vec::with_capacity(4000),
            gh_keys: Vec::with_capacity(100_000),
            gh_idxs: Vec::with_capacity(100_000),
            updated_keys: Vec::with_capacity(512),
            new_disc_keys: Vec::with_capacity(64),
            new_disc_idxs: Vec::with_capacity(64),
            new_disc_intervals: Vec::with_capacity(64),
            current_index: 0,
            max_freq: 1,
            unique_pairs: 0,
            last_discovery_idx: 0,
            sieve_pos: 0,
        };
        engine.simple_sieve(INITIAL_SIEVE_LIMIT);
        engine
    }

    // ─── Tick: generate n new gaps ──────────────────────────────
    pub fn tick(&mut self, n: u32) -> u32 {
        self.updated_keys.clear();
        self.new_disc_keys.clear();
        self.new_disc_idxs.clear();
        self.new_disc_intervals.clear();

        let needed = self.current_index + n + 3;
        self.ensure_primes(needed as usize);

        let mut generated = 0u32;
        for _ in 0..n {
            let i = self.current_index as usize;
            if i + 2 >= self.primes.len() {
                break;
            }
            self.record_gap(i);
            self.current_index += 1;
            generated += 1;
        }
        generated
    }

    // ─── Bulk prime generation (for load recovery) ──────────────
    pub fn ensure_primes_count(&mut self, count: u32) {
        self.ensure_primes(count as usize);
    }

    // ─── Gap history rebuild (for replay after load) ────────────
    pub fn rebuild_gap_history(&mut self) {
        self.gh_keys.clear();
        self.gh_idxs.clear();
        let ci = self.current_index as usize;
        for i in 0..ci {
            if i + 2 >= self.primes.len() {
                break;
            }
            let g1 = self.primes[i + 1] - self.primes[i];
            let g2 = self.primes[i + 2] - self.primes[i + 1];
            let x = if g1 <= 1 { g1 } else { g1 / 2 };
            let y = if g2 <= 1 { g2 } else { g2 / 2 };
            if x >= GRID_SIZE || y >= GRID_SIZE {
                continue;
            }
            let key = y * GRID_SIZE + x;
            self.gh_keys.push(key);
            self.gh_idxs.push(i as u32);
        }
    }

    // ─── State import (for localStorage restore) ────────────────
    pub fn set_state(&mut self, current_index: u32, max_freq: u32, unique_pairs: u32) {
        self.current_index = current_index;
        self.max_freq = max_freq;
        self.unique_pairs = unique_pairs;
        self.last_discovery_idx = current_index;
    }

    pub fn import_discovery_history(&mut self, keys: &[u32]) {
        self.discovery_history.clear();
        self.discovery_history.extend_from_slice(keys);
    }

    // ─── Pointer / length getters for JS memory access ──────────
    pub fn primes_ptr(&self) -> *const u32 {
        self.primes.as_ptr()
    }
    pub fn primes_len(&self) -> u32 {
        self.primes.len() as u32
    }

    pub fn freq_ptr(&self) -> *const u32 {
        self.freq.as_ptr()
    }
    pub fn disc_at_ptr(&self) -> *const i32 {
        self.disc_at.as_ptr()
    }
    pub fn last_seen_ptr(&self) -> *const i32 {
        self.last_seen.as_ptr()
    }

    pub fn discovery_history_ptr(&self) -> *const u32 {
        self.discovery_history.as_ptr()
    }
    pub fn discovery_history_len(&self) -> u32 {
        self.discovery_history.len() as u32
    }

    pub fn gh_keys_ptr(&self) -> *const u32 {
        self.gh_keys.as_ptr()
    }
    pub fn gh_keys_len(&self) -> u32 {
        self.gh_keys.len() as u32
    }
    pub fn gh_idxs_ptr(&self) -> *const u32 {
        self.gh_idxs.as_ptr()
    }
    pub fn gh_idxs_len(&self) -> u32 {
        self.gh_idxs.len() as u32
    }

    pub fn updated_keys_ptr(&self) -> *const u32 {
        self.updated_keys.as_ptr()
    }
    pub fn updated_keys_len(&self) -> u32 {
        self.updated_keys.len() as u32
    }

    pub fn new_disc_keys_ptr(&self) -> *const u32 {
        self.new_disc_keys.as_ptr()
    }
    pub fn new_disc_idxs_ptr(&self) -> *const u32 {
        self.new_disc_idxs.as_ptr()
    }
    pub fn new_disc_intervals_ptr(&self) -> *const u32 {
        self.new_disc_intervals.as_ptr()
    }
    pub fn new_disc_len(&self) -> u32 {
        self.new_disc_keys.len() as u32
    }

    pub fn current_index(&self) -> u32 {
        self.current_index
    }
    pub fn max_freq(&self) -> u32 {
        self.max_freq
    }
    pub fn unique_pairs(&self) -> u32 {
        self.unique_pairs
    }
}

// ─── Private implementation ─────────────────────────────────────
impl PrimeEngine {
    fn record_gap(&mut self, i: usize) {
        let g1 = self.primes[i + 1] - self.primes[i];
        let g2 = self.primes[i + 2] - self.primes[i + 1];
        let x = if g1 <= 1 { g1 } else { g1 / 2 };
        let y = if g2 <= 1 { g2 } else { g2 / 2 };
        if x >= GRID_SIZE || y >= GRID_SIZE {
            return;
        }
        let key = y * GRID_SIZE + x;
        let ci = self.current_index;

        self.gh_keys.push(key);
        self.gh_idxs.push(ci);
        self.last_seen[key as usize] = ci as i32;
        self.updated_keys.push(key);

        let prev = self.freq[key as usize];
        if prev == 0 {
            self.unique_pairs += 1;
            self.disc_at[key as usize] = ci as i32;
            self.discovery_history.push(key);

            let interval = ci - self.last_discovery_idx;
            self.new_disc_keys.push(key);
            self.new_disc_idxs.push(ci);
            self.new_disc_intervals.push(interval);
            self.last_discovery_idx = ci;
        }

        let next = prev + 1;
        self.freq[key as usize] = next;
        if next > self.max_freq {
            self.max_freq = next;
        }
    }

    /// Simple sieve of Eratosthenes up to `limit`. Used for initial bootstrap.
    fn simple_sieve(&mut self, limit: u32) {
        let size = (limit + 1) as usize;
        let mut is_prime = vec![true; size];
        is_prime[0] = false;
        if size > 1 {
            is_prime[1] = false;
        }

        let sqrt_limit = (limit as f64).sqrt() as u32;
        for i in 2..=sqrt_limit {
            if is_prime[i as usize] {
                let mut j = (i * i) as usize;
                while j < size {
                    is_prime[j] = false;
                    j += i as usize;
                }
            }
        }

        self.primes.clear();
        for i in 2..=limit {
            if is_prime[i as usize] {
                self.primes.push(i);
            }
        }
        self.sieve_pos = (limit + 1) as u64;
    }

    /// Extend primes list using segmented sieve until we have at least `count` primes.
    fn ensure_primes(&mut self, count: usize) {
        if self.primes.len() >= count {
            return;
        }

        // Estimate upper bound for the count-th prime
        let n = count as f64;
        let upper: u64 = if count < 6 {
            15
        } else {
            let ln = n.ln();
            (n * (ln + ln.ln() + 2.0)) as u64 + 10000
        };

        // Ensure we have small primes up to sqrt(upper) for sieve divisors
        let sqrt_upper = ((upper as f64).sqrt() as u32) + 1;
        if self.primes.is_empty() || *self.primes.last().unwrap() < sqrt_upper {
            // Extend via trial division (only needed for very small ranges)
            if self.primes.is_empty() {
                self.simple_sieve(sqrt_upper.max(INITIAL_SIEVE_LIMIT));
                if self.primes.len() >= count {
                    return;
                }
            }
        }

        // Count small primes (up to sqrt of max value we'll sieve)
        let small_prime_count = self
            .primes
            .iter()
            .position(|&p| (p as u64) > (upper as f64).sqrt() as u64 + 1)
            .unwrap_or(self.primes.len());

        let mut seg = vec![0u8; SEG_SIZE];

        while self.primes.len() < count {
            let low = self.sieve_pos;
            let high = low + SEG_SIZE as u64 - 1;
            let high = high.min(upper);
            let seg_len = (high - low + 1) as usize;

            // Clear segment
            for b in seg[..seg_len].iter_mut() {
                *b = 0;
            }

            // Mark composites using small primes
            for pi in 0..small_prime_count {
                let p = self.primes[pi] as u64;
                if p < 2 {
                    continue;
                }
                // First multiple of p >= low, but not p itself
                let mut start = ((low + p - 1) / p) * p;
                if start == p {
                    start += p;
                }
                let mut j = (start - low) as usize;
                let step = p as usize;
                while j < seg_len {
                    seg[j] = 1;
                    j += step;
                }
            }

            // Collect primes from segment
            for i in 0..seg_len {
                if seg[i] == 0 {
                    let val = low + i as u64;
                    if val > 1 && val <= u32::MAX as u64 {
                        self.primes.push(val as u32);
                    }
                }
            }

            self.sieve_pos = high + 1;

            if self.sieve_pos > upper {
                break;
            }
        }
    }
}
