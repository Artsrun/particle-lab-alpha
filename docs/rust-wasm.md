# Rust / WASM integration path

## Current state

JavaScript owns the `GPUDevice`, pipelines, and buffers. This is the simplest architecture that actually works in the browser today.

## Two investigated approaches

### A. Rust WASM as WebGPU host

Using `wgpu` with the WebGPU backend inside `wasm32-unknown-unknown`.

Blockers observed in practice:
- Device creation and surface/canvas interop must go through the browser’s `navigator.gpu`.
- Keeping GPU resources alive across the JS/WASM boundary requires careful ownership (usually the JS side still holds the device).
- Not every `wgpu` version has a production-ready browser WebGPU backend.

### B. Rust WASM as a computational module (preferred next step)

A small `wasm-bindgen` crate that:
- Generates initial particle positions / velocities on the CPU.
- Validates and packs the uniform parameter block.
- Optionally runs a short CPU-side flow-field sample for debugging.

The JS host continues to own the WebGPU device and only uploads the results. This avoids the hardest ownership problems and still demonstrates the Rust → WASM → browser path.

## Build sketch (not yet in CI)

```bash
# in rust-wasm/
cargo new --lib particle_seed
cd particle_seed
# add wasm-bindgen, wee_alloc, etc.
cargo build --target wasm32-unknown-unknown --release
wasm-bindgen --target web target/wasm32-unknown-unknown/release/particle_seed.wasm --out-dir pkg
```

Until that crate is added and tested, the runtime selector marks Rust as unavailable.

## Recommendation

Start with approach B. Measure whether the CPU-side work is actually a bottleneck before attempting to move device ownership into WASM.
