# Rust WASM seed module (v0.4)

Minimal `wasm-bindgen` crate that generates initial particle positions/velocities on the CPU.

This is approach B from the architecture notes: Rust does not own the WebGPU device.

## Build

```bash
cd rust-wasm/particle_seed
rustup target add wasm32-unknown-unknown
cargo build --target wasm32-unknown-unknown --release
wasm-bindgen --target web target/wasm32-unknown-unknown/release/particle_seed.wasm --out-dir ../pkg
```

Then load the generated `particle_seed.js` from the host if you want to replace the JS `makeParticles` path.

Not yet wired into the live page — the source is here so the integration can be verified independently.
