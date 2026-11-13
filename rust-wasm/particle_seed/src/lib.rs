use wasm_bindgen::prelude::*;

/// CPU-side particle seeding. Returns flat [x, y, vx, vy, ...] for n particles.
/// Intended as the first real Rust/WASM module (approach B).
#[wasm_bindgen]
pub fn seed_particles(n: u32, seed: f32) -> Vec<f32> {
    let mut out = Vec::with_capacity((n as usize) * 4);
    let mut s = seed;
    for i in 0..n {
        s = (s * 127.1 + f32::from(i) * 0.001).fract();
        let a = s * 6.2831853;
        let r = (s * 0.7 + 0.25).sqrt() * 0.95;
        out.push(a.cos() * r);
        out.push(a.sin() * r);
        out.push(-a.sin() * 0.04);
        out.push(a.cos() * 0.04);
    }
    out
}
