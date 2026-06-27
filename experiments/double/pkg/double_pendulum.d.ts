/* tslint:disable */
/* eslint-disable */

export class Field {
    free(): void;
    [Symbol.dispose](): void;
    cols(): number;
    count(): number;
    constructor();
    render_ptr(): number;
    /**
     * (Re)allocate for a `cols × rows` grid. Reallocates Vecs, so any JS
     * typed-array view over `render_ptr()` must be rebuilt afterwards.
     */
    resize(cols: number, rows: number): void;
    rows(): number;
    /**
     * Seed starting angles. Smooth spatial gradients read as a coherent
     * pattern that chaos then tears apart.
     */
    seed(pattern: number): void;
    /**
     * Advance the whole field by `sim_dt` seconds, split into stable substeps
     * (capped at `max_sub` to bound worst-case frame cost at high speed).
     */
    step(sim_dt: number, max_sub: number): void;
}

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
    readonly memory: WebAssembly.Memory;
    readonly __wbg_field_free: (a: number, b: number) => void;
    readonly field_cols: (a: number) => number;
    readonly field_count: (a: number) => number;
    readonly field_new: () => number;
    readonly field_render_ptr: (a: number) => number;
    readonly field_resize: (a: number, b: number, c: number) => void;
    readonly field_rows: (a: number) => number;
    readonly field_seed: (a: number, b: number) => void;
    readonly field_step: (a: number, b: number, c: number) => void;
    readonly __wbindgen_externrefs: WebAssembly.Table;
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
