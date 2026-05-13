/* @ts-self-types="./prime_engine.d.ts" */

export class PrimeEngine {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        PrimeEngineFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_primeengine_free(ptr, 0);
    }
    /**
     * @returns {number}
     */
    current_index() {
        const ret = wasm.primeengine_current_index(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * @returns {number}
     */
    disc_at_ptr() {
        const ret = wasm.primeengine_disc_at_ptr(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * @returns {number}
     */
    discovery_history_len() {
        const ret = wasm.primeengine_discovery_history_len(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * @returns {number}
     */
    discovery_history_ptr() {
        const ret = wasm.primeengine_discovery_history_ptr(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * @param {number} count
     */
    ensure_primes_count(count) {
        wasm.primeengine_ensure_primes_count(this.__wbg_ptr, count);
    }
    /**
     * @returns {number}
     */
    freq_ptr() {
        const ret = wasm.primeengine_freq_ptr(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * @returns {number}
     */
    gh_idxs_len() {
        const ret = wasm.primeengine_gh_idxs_len(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * @returns {number}
     */
    gh_idxs_ptr() {
        const ret = wasm.primeengine_gh_idxs_ptr(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * @returns {number}
     */
    gh_keys_len() {
        const ret = wasm.primeengine_gh_keys_len(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * @returns {number}
     */
    gh_keys_ptr() {
        const ret = wasm.primeengine_gh_keys_ptr(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * @param {Uint32Array} keys
     */
    import_discovery_history(keys) {
        const ptr0 = passArray32ToWasm0(keys, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        wasm.primeengine_import_discovery_history(this.__wbg_ptr, ptr0, len0);
    }
    /**
     * @returns {number}
     */
    last_seen_ptr() {
        const ret = wasm.primeengine_last_seen_ptr(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * @returns {number}
     */
    max_freq() {
        const ret = wasm.primeengine_max_freq(this.__wbg_ptr);
        return ret >>> 0;
    }
    constructor() {
        const ret = wasm.primeengine_new();
        this.__wbg_ptr = ret >>> 0;
        PrimeEngineFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * @returns {number}
     */
    new_disc_idxs_ptr() {
        const ret = wasm.primeengine_new_disc_idxs_ptr(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * @returns {number}
     */
    new_disc_intervals_ptr() {
        const ret = wasm.primeengine_new_disc_intervals_ptr(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * @returns {number}
     */
    new_disc_keys_ptr() {
        const ret = wasm.primeengine_new_disc_keys_ptr(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * @returns {number}
     */
    new_disc_len() {
        const ret = wasm.primeengine_new_disc_len(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * @returns {number}
     */
    primes_len() {
        const ret = wasm.primeengine_primes_len(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * @returns {number}
     */
    primes_ptr() {
        const ret = wasm.primeengine_primes_ptr(this.__wbg_ptr);
        return ret >>> 0;
    }
    rebuild_gap_history() {
        wasm.primeengine_rebuild_gap_history(this.__wbg_ptr);
    }
    /**
     * @param {number} current_index
     * @param {number} max_freq
     * @param {number} unique_pairs
     */
    set_state(current_index, max_freq, unique_pairs) {
        wasm.primeengine_set_state(this.__wbg_ptr, current_index, max_freq, unique_pairs);
    }
    /**
     * @param {number} n
     * @returns {number}
     */
    tick(n) {
        const ret = wasm.primeengine_tick(this.__wbg_ptr, n);
        return ret >>> 0;
    }
    /**
     * @returns {number}
     */
    unique_pairs() {
        const ret = wasm.primeengine_unique_pairs(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * @returns {number}
     */
    updated_keys_len() {
        const ret = wasm.primeengine_updated_keys_len(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * @returns {number}
     */
    updated_keys_ptr() {
        const ret = wasm.primeengine_updated_keys_ptr(this.__wbg_ptr);
        return ret >>> 0;
    }
}
if (Symbol.dispose) PrimeEngine.prototype[Symbol.dispose] = PrimeEngine.prototype.free;

function __wbg_get_imports() {
    const import0 = {
        __proto__: null,
        __wbg___wbindgen_throw_81fc77679af83bc6: function(arg0, arg1) {
            throw new Error(getStringFromWasm0(arg0, arg1));
        },
        __wbindgen_init_externref_table: function() {
            const table = wasm.__wbindgen_externrefs;
            const offset = table.grow(4);
            table.set(0, undefined);
            table.set(offset + 0, undefined);
            table.set(offset + 1, null);
            table.set(offset + 2, true);
            table.set(offset + 3, false);
        },
    };
    return {
        __proto__: null,
        "./prime_engine_bg.js": import0,
    };
}

const PrimeEngineFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_primeengine_free(ptr >>> 0, 1));

function getStringFromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return decodeText(ptr, len);
}

let cachedUint32ArrayMemory0 = null;
function getUint32ArrayMemory0() {
    if (cachedUint32ArrayMemory0 === null || cachedUint32ArrayMemory0.byteLength === 0) {
        cachedUint32ArrayMemory0 = new Uint32Array(wasm.memory.buffer);
    }
    return cachedUint32ArrayMemory0;
}

let cachedUint8ArrayMemory0 = null;
function getUint8ArrayMemory0() {
    if (cachedUint8ArrayMemory0 === null || cachedUint8ArrayMemory0.byteLength === 0) {
        cachedUint8ArrayMemory0 = new Uint8Array(wasm.memory.buffer);
    }
    return cachedUint8ArrayMemory0;
}

function passArray32ToWasm0(arg, malloc) {
    const ptr = malloc(arg.length * 4, 4) >>> 0;
    getUint32ArrayMemory0().set(arg, ptr / 4);
    WASM_VECTOR_LEN = arg.length;
    return ptr;
}

let cachedTextDecoder = new TextDecoder('utf-8', { ignoreBOM: true, fatal: true });
cachedTextDecoder.decode();
const MAX_SAFARI_DECODE_BYTES = 2146435072;
let numBytesDecoded = 0;
function decodeText(ptr, len) {
    numBytesDecoded += len;
    if (numBytesDecoded >= MAX_SAFARI_DECODE_BYTES) {
        cachedTextDecoder = new TextDecoder('utf-8', { ignoreBOM: true, fatal: true });
        cachedTextDecoder.decode();
        numBytesDecoded = len;
    }
    return cachedTextDecoder.decode(getUint8ArrayMemory0().subarray(ptr, ptr + len));
}

let WASM_VECTOR_LEN = 0;

let wasmModule, wasm;
function __wbg_finalize_init(instance, module) {
    wasm = instance.exports;
    wasmModule = module;
    cachedUint32ArrayMemory0 = null;
    cachedUint8ArrayMemory0 = null;
    wasm.__wbindgen_start();
    return wasm;
}

async function __wbg_load(module, imports) {
    if (typeof Response === 'function' && module instanceof Response) {
        if (typeof WebAssembly.instantiateStreaming === 'function') {
            try {
                return await WebAssembly.instantiateStreaming(module, imports);
            } catch (e) {
                const validResponse = module.ok && expectedResponseType(module.type);

                if (validResponse && module.headers.get('Content-Type') !== 'application/wasm') {
                    console.warn("`WebAssembly.instantiateStreaming` failed because your server does not serve Wasm with `application/wasm` MIME type. Falling back to `WebAssembly.instantiate` which is slower. Original error:\n", e);

                } else { throw e; }
            }
        }

        const bytes = await module.arrayBuffer();
        return await WebAssembly.instantiate(bytes, imports);
    } else {
        const instance = await WebAssembly.instantiate(module, imports);

        if (instance instanceof WebAssembly.Instance) {
            return { instance, module };
        } else {
            return instance;
        }
    }

    function expectedResponseType(type) {
        switch (type) {
            case 'basic': case 'cors': case 'default': return true;
        }
        return false;
    }
}

function initSync(module) {
    if (wasm !== undefined) return wasm;


    if (module !== undefined) {
        if (Object.getPrototypeOf(module) === Object.prototype) {
            ({module} = module)
        } else {
            console.warn('using deprecated parameters for `initSync()`; pass a single object instead')
        }
    }

    const imports = __wbg_get_imports();
    if (!(module instanceof WebAssembly.Module)) {
        module = new WebAssembly.Module(module);
    }
    const instance = new WebAssembly.Instance(module, imports);
    return __wbg_finalize_init(instance, module);
}

async function __wbg_init(module_or_path) {
    if (wasm !== undefined) return wasm;


    if (module_or_path !== undefined) {
        if (Object.getPrototypeOf(module_or_path) === Object.prototype) {
            ({module_or_path} = module_or_path)
        } else {
            console.warn('using deprecated parameters for the initialization function; pass a single object instead')
        }
    }

    if (module_or_path === undefined) {
        module_or_path = new URL('prime_engine_bg.wasm', import.meta.url);
    }
    const imports = __wbg_get_imports();

    if (typeof module_or_path === 'string' || (typeof Request === 'function' && module_or_path instanceof Request) || (typeof URL === 'function' && module_or_path instanceof URL)) {
        module_or_path = fetch(module_or_path);
    }

    const { instance, module } = await __wbg_load(await module_or_path, imports);

    return __wbg_finalize_init(instance, module);
}

export { initSync, __wbg_init as default };
