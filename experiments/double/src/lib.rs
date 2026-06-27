//! Double Pendulum Field — physics core.
//!
//! One independent double pendulum per grid cell. State lives in flat
//! `Vec<f64>` arrays (no per-pendulum objects). `step()` advances every
//! pendulum with inlined RK4, then packs the two angles of each pendulum into
//! an interleaved `f32` buffer `[θ1, θ2, θ1, θ2, ...]`. JS maps that buffer
//! straight out of wasm linear memory and hands the pointer to WebGL as an
//! instanced vertex attribute — the GPU does color + geometry, the CPU never
//! touches a pixel.

use wasm_bindgen::prelude::*;

const G: f64 = 9.81;
const L1: f64 = 1.0;
const L2: f64 = 1.0;
const M1: f64 = 1.0;
const M2: f64 = 1.0;
const MAX_DT: f64 = 0.008; // largest stable RK4 step
const PI: f64 = std::f64::consts::PI;
const TAU: f64 = std::f64::consts::TAU;
const HALF_PI: f64 = std::f64::consts::FRAC_PI_2;

#[wasm_bindgen]
pub struct Field {
    cols: u32,
    rows: u32,
    n: usize,
    a1: Vec<f64>, // inner arm angle
    a2: Vec<f64>, // outer arm angle
    v1: Vec<f64>, // inner angular velocity
    v2: Vec<f64>, // outer angular velocity
    render: Vec<f32>, // interleaved [a1,a2] for the GPU
}

#[wasm_bindgen]
impl Field {
    #[wasm_bindgen(constructor)]
    pub fn new() -> Field {
        Field {
            cols: 0,
            rows: 0,
            n: 0,
            a1: Vec::new(),
            a2: Vec::new(),
            v1: Vec::new(),
            v2: Vec::new(),
            render: Vec::new(),
        }
    }

    /// (Re)allocate for a `cols × rows` grid. Reallocates Vecs, so any JS
    /// typed-array view over `render_ptr()` must be rebuilt afterwards.
    pub fn resize(&mut self, cols: u32, rows: u32) {
        self.cols = cols;
        self.rows = rows;
        self.n = cols as usize * rows as usize;
        self.a1 = vec![0.0; self.n];
        self.a2 = vec![0.0; self.n];
        self.v1 = vec![0.0; self.n];
        self.v2 = vec![0.0; self.n];
        self.render = vec![0.0; self.n * 2];
    }

    /// Seed starting angles. Smooth spatial gradients read as a coherent
    /// pattern that chaos then tears apart.
    pub fn seed(&mut self, pattern: u32) {
        let cols = self.cols.max(1);
        let rows = self.rows.max(1);
        for r in 0..rows {
            let fr = if rows > 1 { r as f64 / (rows - 1) as f64 } else { 0.5 };
            for c in 0..cols {
                let fc = if cols > 1 { c as f64 / (cols - 1) as f64 } else { 0.5 };
                let i = (r * cols + c) as usize;
                let (t1, t2) = match pattern {
                    // rainbow: full spread of energy & hue across the grid
                    1 => (HALF_PI + (fc - 0.5) * PI, fr * TAU),
                    // twins: nearly identical -> dramatic sync-to-chaos reveal
                    2 => (HALF_PI + (fc - 0.5) * 0.05 + (fr - 0.5) * 0.05, HALF_PI),
                    // cascade: diagonal interference waves
                    3 => (
                        PI + ((fc + fr) * PI).sin() * 1.1,
                        PI + ((fc - fr) * PI).cos() * 1.1,
                    ),
                    // ripple: gentle gradient, lively everywhere
                    _ => (HALF_PI + (fc - 0.5) * 0.6, HALF_PI + (fr - 0.5) * 0.6),
                };
                self.a1[i] = t1;
                self.a2[i] = t2;
                self.v1[i] = 0.0;
                self.v2[i] = 0.0;
            }
        }
        self.fill_render();
    }

    /// Advance the whole field by `sim_dt` seconds, split into stable substeps
    /// (capped at `max_sub` to bound worst-case frame cost at high speed).
    pub fn step(&mut self, sim_dt: f64, max_sub: u32) {
        if sim_dt <= 0.0 || self.n == 0 {
            return;
        }
        let want = (sim_dt / MAX_DT).ceil() as u32;
        let sub = want.clamp(1, max_sub.max(1));
        // Cap dt at MAX_DT for stability. When `max_sub` caps the substep count
        // (huge fields), this advances less than requested -> graceful slow
        // motion instead of an unstable, blown-up integration.
        let dt = (sim_dt / sub as f64).min(MAX_DT);
        for _ in 0..sub {
            self.integrate(dt);
        }
        self.fill_render();
    }

    pub fn render_ptr(&self) -> *const f32 {
        self.render.as_ptr()
    }
    pub fn count(&self) -> u32 {
        self.n as u32
    }
    pub fn cols(&self) -> u32 {
        self.cols
    }
    pub fn rows(&self) -> u32 {
        self.rows
    }
}

impl Field {
    #[inline]
    fn integrate(&mut self, dt: f64) {
        let h = dt;
        let h2 = dt * 0.5;
        let h6 = dt / 6.0;
        for i in 0..self.n {
            let t1 = self.a1[i];
            let t2 = self.a2[i];
            let w1 = self.v1[i];
            let w2 = self.v2[i];

            let (d1, d2) = deriv(t1, t2, w1, w2);
            let (k1t1, k1t2, k1w1, k1w2) = (w1, w2, d1, d2);

            let (d1, d2) = deriv(t1 + h2 * k1t1, t2 + h2 * k1t2, w1 + h2 * k1w1, w2 + h2 * k1w2);
            let (k2t1, k2t2, k2w1, k2w2) = (w1 + h2 * k1w1, w2 + h2 * k1w2, d1, d2);

            let (d1, d2) = deriv(t1 + h2 * k2t1, t2 + h2 * k2t2, w1 + h2 * k2w1, w2 + h2 * k2w2);
            let (k3t1, k3t2, k3w1, k3w2) = (w1 + h2 * k2w1, w2 + h2 * k2w2, d1, d2);

            let (d1, d2) = deriv(t1 + h * k3t1, t2 + h * k3t2, w1 + h * k3w1, w2 + h * k3w2);
            let (k4t1, k4t2, k4w1, k4w2) = (w1 + h * k3w1, w2 + h * k3w2, d1, d2);

            self.a1[i] = t1 + h6 * (k1t1 + 2.0 * k2t1 + 2.0 * k3t1 + k4t1);
            self.a2[i] = t2 + h6 * (k1t2 + 2.0 * k2t2 + 2.0 * k3t2 + k4t2);
            self.v1[i] = w1 + h6 * (k1w1 + 2.0 * k2w1 + 2.0 * k3w1 + k4w1);
            self.v2[i] = w2 + h6 * (k1w2 + 2.0 * k2w2 + 2.0 * k3w2 + k4w2);
        }
    }

    #[inline]
    fn fill_render(&mut self) {
        for i in 0..self.n {
            self.render[2 * i] = self.a1[i] as f32;
            self.render[2 * i + 1] = self.a2[i] as f32;
        }
    }
}

/// Fast simultaneous sine & cosine. Range-reduces to [-π/4, π/4] by quadrant,
/// then evaluates short minimax-ish polynomials (≈1e-9 accurate on that
/// interval). Many times cheaper than the bundled software `f64::sin/cos`,
/// which dominates the cost when integrating millions of pendulums.
#[inline(always)]
fn sincos(x: f64) -> (f64, f64) {
    const TWO_OVER_PI: f64 = 0.636619772367581343; // 2/π
    const HALF_PI: f64 = std::f64::consts::FRAC_PI_2;
    let q = (x * TWO_OVER_PI).round();
    let r = x - q * HALF_PI; // r ∈ [-π/4, π/4]
    let r2 = r * r;
    // sin(r), cos(r) — Taylor on the tiny reduced interval is plenty accurate
    let s = r * (1.0 - r2 * (1.0 / 6.0 - r2 * (1.0 / 120.0 - r2 * (1.0 / 5040.0))));
    let c = 1.0 - r2 * (0.5 - r2 * (1.0 / 24.0 - r2 * (1.0 / 720.0)));
    match (q as i64) & 3 {
        0 => (s, c),
        1 => (c, -s),
        2 => (-s, -c),
        _ => (-c, s),
    }
}

/// Angular accelerations of a double pendulum. θ measured from the downward
/// vertical, so θ=0 hangs straight down.
#[inline]
fn deriv(t1: f64, t2: f64, w1: f64, w2: f64) -> (f64, f64) {
    let d = t1 - t2;
    let (sd, cd) = sincos(d);
    let (st1, ct1) = sincos(t1);
    let (sm, _) = sincos(t1 - 2.0 * t2);
    let cos2d = 1.0 - 2.0 * sd * sd; // cos(2d), no extra trig
    let den = 2.0 * M1 + M2 - M2 * cos2d;
    let o1 = (-G * (2.0 * M1 + M2) * st1
        - M2 * G * sm
        - 2.0 * sd * M2 * (w2 * w2 * L2 + w1 * w1 * L1 * cd))
        / (L1 * den);
    let o2 = (2.0 * sd * (w1 * w1 * L1 * (M1 + M2) + G * (M1 + M2) * ct1 + w2 * w2 * L2 * M2 * cd))
        / (L2 * den);
    (o1, o2)
}
