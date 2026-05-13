/* tslint:disable */
/* eslint-disable */

export class PrimeEngine {
    free(): void;
    [Symbol.dispose](): void;
    current_index(): number;
    disc_at_ptr(): number;
    discovery_history_len(): number;
    discovery_history_ptr(): number;
    ensure_primes_count(count: number): void;
    freq_ptr(): number;
    gh_idxs_len(): number;
    gh_idxs_ptr(): number;
    gh_keys_len(): number;
    gh_keys_ptr(): number;
    import_discovery_history(keys: Uint32Array): void;
    last_seen_ptr(): number;
    max_freq(): number;
    constructor();
    new_disc_idxs_ptr(): number;
    new_disc_intervals_ptr(): number;
    new_disc_keys_ptr(): number;
    new_disc_len(): number;
    primes_len(): number;
    primes_ptr(): number;
    rebuild_gap_history(): void;
    set_state(current_index: number, max_freq: number, unique_pairs: number): void;
    tick(n: number): number;
    unique_pairs(): number;
    updated_keys_len(): number;
    updated_keys_ptr(): number;
}

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
    readonly memory: WebAssembly.Memory;
    readonly __wbg_primeengine_free: (a: number, b: number) => void;
    readonly primeengine_current_index: (a: number) => number;
    readonly primeengine_disc_at_ptr: (a: number) => number;
    readonly primeengine_discovery_history_len: (a: number) => number;
    readonly primeengine_discovery_history_ptr: (a: number) => number;
    readonly primeengine_ensure_primes_count: (a: number, b: number) => void;
    readonly primeengine_freq_ptr: (a: number) => number;
    readonly primeengine_gh_idxs_len: (a: number) => number;
    readonly primeengine_gh_idxs_ptr: (a: number) => number;
    readonly primeengine_gh_keys_len: (a: number) => number;
    readonly primeengine_gh_keys_ptr: (a: number) => number;
    readonly primeengine_import_discovery_history: (a: number, b: number, c: number) => void;
    readonly primeengine_last_seen_ptr: (a: number) => number;
    readonly primeengine_max_freq: (a: number) => number;
    readonly primeengine_new: () => number;
    readonly primeengine_new_disc_idxs_ptr: (a: number) => number;
    readonly primeengine_new_disc_intervals_ptr: (a: number) => number;
    readonly primeengine_new_disc_keys_ptr: (a: number) => number;
    readonly primeengine_new_disc_len: (a: number) => number;
    readonly primeengine_primes_len: (a: number) => number;
    readonly primeengine_primes_ptr: (a: number) => number;
    readonly primeengine_rebuild_gap_history: (a: number) => void;
    readonly primeengine_set_state: (a: number, b: number, c: number, d: number) => void;
    readonly primeengine_tick: (a: number, b: number) => number;
    readonly primeengine_unique_pairs: (a: number) => number;
    readonly primeengine_updated_keys_len: (a: number) => number;
    readonly primeengine_updated_keys_ptr: (a: number) => number;
    readonly __wbindgen_externrefs: WebAssembly.Table;
    readonly __wbindgen_malloc: (a: number, b: number) => number;
    readonly __wbindgen_start: () => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;

/**
 * Instantiates the given `module`, which can either be bytes or
 * a precompiled `WebAssembly.Module`.
 *
 * @param {{ module: SyncInitInput }} module - Passing `SyncInitInput` directly is deprecated.
 *
 * @returns {InitOutput}
 */
export function initSync(module: { module: SyncInitInput } | SyncInitInput): InitOutput;

/**
 * If `module_or_path` is {RequestInfo} or {URL}, makes a request and
 * for everything else, calls `WebAssembly.instantiate` directly.
 *
 * @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
 *
 * @returns {Promise<InitOutput>}
 */
export default function __wbg_init (module_or_path?: { module_or_path: InitInput | Promise<InitInput> } | InitInput | Promise<InitInput>): Promise<InitOutput>;
