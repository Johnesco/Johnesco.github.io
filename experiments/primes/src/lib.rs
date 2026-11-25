use wasm_bindgen::prelude::*;

const GRID_SIZE: u32 = 60;
const GRID_CELLS: usize = (GRID_SIZE * GRID_SIZE) as usize;
const INITIAL_SIEVE_LIMIT: u32 = 100_000;
const SEG_SIZE: usize = 1 << 20; // 1M odd numbers (a 2M range) per segment

#[wasm_bindgen]
pub struct PrimeEngine {
    primes: Vec<u32>,
    freq: Vec<u32>,
    disc_at: Vec<i32>,
    last_seen: Vec<i32>,
    discovery_history: Vec<u32>,
    gh_keys: Vec<u16>, // keys are < GRID_CELLS (3600), so u16 is enough
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
        self.last_seen.fill(-1);
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
            self.gh_keys.push(key as u16);
            self.gh_idxs.push(i as u32);
            // last_seen isn't saved, so recover it from the replayed history
            self.last_seen[key as usize] = i as i32;
        }
        // Interval for the next discovery counts from the latest saved discovery,
        // not from the reload point.
        self.last_discovery_idx = self.disc_at.iter().copied().max().unwrap_or(-1).max(0) as u32;
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

    pub fn gh_keys_ptr(&self) -> *const u16 {
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

    /// True once every prime below 2^32 has been generated and consumed:
    /// primes are stored as u32, so the run cannot go further.
    pub fn limit_reached(&self) -> bool {
        self.sieve_pos > u32::MAX as u64 && self.current_index as usize + 2 >= self.primes.len()
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

        self.gh_keys.push(key as u16);
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
        self.sieve_pos = (limit as u64 + 1) | 1; // segmented sieve works on odd numbers
    }

    /// Extend primes list using segmented sieve until we have at least `count` primes
    /// (or every prime below 2^32 has been found).
    fn ensure_primes(&mut self, count: usize) {
        if self.primes.len() >= count {
            return;
        }

        // Upper bound for the count-th prime (Rosser: p_n < n(ln n + ln ln n) for n >= 6),
        // capped at u32::MAX because primes are stored as u32.
        let n = count as f64;
        let ln = n.ln();
        let upper = ((n * (ln + ln.ln() + 2.0)) as u64 + 10_000).min(u32::MAX as u64);
        if self.sieve_pos > upper {
            return; // already sieved everything we can
        }

        // Divisors needed: all primes <= sqrt(upper). sqrt(u32::MAX) < 65_536, and the
        // initial sieve covers 100_000, so the list always already holds them.
        let sqrt_upper = (upper as f64).sqrt() as u64 + 1;
        debug_assert!(*self.primes.last().unwrap() as u64 >= sqrt_upper);
        let small_prime_count = self.primes.partition_point(|&p| (p as u64) <= sqrt_upper);

        // Odd numbers only: seg[j] stands for low + 2j, so each segment covers
        // 2 * SEG_SIZE numbers and even numbers are never touched.
        // sieve_pos starts odd (INITIAL_SIEVE_LIMIT + 1) and always advances by an even amount.
        debug_assert!(self.sieve_pos % 2 == 1);
        let mut seg = vec![0u8; SEG_SIZE];

        while self.primes.len() < count && self.sieve_pos <= upper {
            let low = self.sieve_pos;
            let seg_len = (((upper - low) / 2 + 1) as usize).min(SEG_SIZE);
            let seg = &mut seg[..seg_len];
            seg.fill(0);

            // Mark composites with each odd small prime (skip 2): start at the first
            // odd multiple >= max(p*p, low); consecutive odd multiples are 2p apart,
            // which is p slots in the odd-only segment.
            for pi in 1..small_prime_count {
                let p = self.primes[pi] as u64;
                let mut start = (p * p).max(low.div_ceil(p) * p);
                if start % 2 == 0 {
                    start += p;
                }
                let mut j = ((start - low) / 2) as usize;
                let step = p as usize;
                while j < seg_len {
                    seg[j] = 1;
                    j += step;
                }
            }

            // Collect primes from segment (low > INITIAL_SIEVE_LIMIT, so no 0/1 to skip)
            for (j, &b) in seg.iter().enumerate() {
                if b == 0 {
                    self.primes.push((low + 2 * j as u64) as u32);
                }
            }

            self.sieve_pos = low + 2 * seg_len as u64;
        }
    }
}
