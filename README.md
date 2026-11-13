# Particle Lab α v0.2

Browser-native programmable GPU particle simulation experiment.

## Status

Working WebGPU compute + render pipeline (JavaScript host).  
Luau and Rust/WASM are documented integration targets, not yet real runtimes in this build.  
No fake performance numbers. Measured frame time is the browser’s own.

## Quick start

```bash
npm install
npm run dev
```

Open the printed localhost URL in a WebGPU-capable browser (recent Chrome or Edge).  
Hardware acceleration must be enabled. Secure context required.

## Architecture (current)

- **Host**: Vanilla JS + Vite. Owns the WebGPU device, command encoder, and UI.
- **GPU**: WGSL compute shader updates particle state in a storage buffer. WGSL render shader draws instanced soft quads.
- **Parameters**: Uniform buffer written every frame (delta, speed, attraction, turbulence, mouse, time).
- **Script panel**: Constrained evaluator that accepts a simple `return { ... }` object and applies numeric parameters. This is **not** the official Luau runtime. It exists so the UI and host API contract can be exercised today.

## Modes

| Mode | Status | Notes |
|------|--------|-------|
| JavaScript baseline | Working | Full compute + render |
| Rust/WASM | Planned | See `docs/rust-wasm.md` |
| Luau script | Planned | See `docs/luau.md` |

## Benchmark methodology

- Particle counts: 10k / 50k / 100k (slider).
- FPS shown is rolling average from `requestAnimationFrame` timestamps (CPU-side frame interval).
- GPU timestamp queries are not yet implemented (feature detection + query set would be the next step).
- Do not compare this against a CPU particle loop and call the result a language benchmark. The interesting work is on the GPU.

## Known limitations

- Official Luau runtime is not compiled to WASM in this tree.
- No Rust `wgpu` device ownership in the browser.
- Trail intensity control is present in the UI but not yet wired to a history buffer.
- Particle size change rebuilds the render pipeline (acceptable for an experiment).
- No device-loss recovery beyond the basic `device.lost` handler.
- Mobile / Safari WebGPU support varies; the error overlay is the intended graceful path.

## Next practical steps

1. Build the official Luau runtime for `wasm32-unknown-unknown` and expose a narrow host API (`particle.setSpeed`, etc.).
2. Decide whether a Rust WASM module should own the WebGPU device or only do CPU-side work (seeding, validation, parameter packing).
3. Add GPU timestamp queries when `timestamp-query` is available.
4. Implement a short particle history buffer for trails.

## Files

- `index.html` — layout
- `src/main.js` — WebGPU host + UI wiring
- `src/style.css` — instrument styling
- `shaders/*.wgsl` — compute and render
- `docs/` — integration notes
- `luau-examples/` — example scripts (intended for the future runtime)
