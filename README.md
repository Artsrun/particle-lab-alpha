# Particle Lab α v0.3

Browser-native programmable GPU particle simulation experiment.

**Live (prod branch):** if GitHub Pages / Vercel is set to deploy from `prod`, the site updates after this push is merged or pushed to `prod`.

## Status

Working WebGPU compute + render pipeline (JavaScript host).  
Trail intensity now fades the previous frame (load + reduced clear).  
Luau and Rust/WASM remain documented integration targets — not real runtimes in this build.  
No fake performance numbers. FPS is the browser’s `requestAnimationFrame` interval.

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
- **Trails**: When trail > 0 the render pass uses `loadOp: 'load'` and a reduced clear so previous particles linger.
- **Script panel**: Constrained evaluator that accepts a simple `return { ... }` object and applies numeric parameters. This is **not** the official Luau runtime.

## Modes

| Mode | Status | Notes |
|------|--------|-------|
| JavaScript baseline | Working | Full compute + render + trail fade |
| Rust/WASM | Planned | See `docs/rust-wasm.md` |
| Luau script | Planned | See `docs/luau.md` |

## Benchmark methodology

- Particle counts: 10k / 50k / 100k (slider).
- FPS shown is rolling average from `requestAnimationFrame` timestamps (CPU-side frame interval).
- GPU timestamp queries are not yet implemented.
- Do not compare this against a CPU particle loop and call the result a language benchmark. The interesting work is on the GPU.

## Known limitations

- Official Luau runtime is not compiled to WASM in this tree.
- No Rust `wgpu` device ownership in the browser.
- Trail is a simple fade (load previous frame); not a multi-frame history buffer.
- Particle size change rebuilds the render pipeline.
- No device-loss recovery beyond the basic `device.lost` handler.
- Mobile / Safari WebGPU support varies; the error overlay is the intended graceful path.

## Next practical steps

1. Build the official Luau runtime for `wasm32-unknown-unknown` and expose a narrow host API (`particle.setSpeed`, etc.).
2. Add a small Rust WASM module for CPU-side seeding / parameter packing (approach B in `docs/rust-wasm.md`).
3. Add GPU timestamp queries when `timestamp-query` is available.
4. Replace the simple trail fade with a short history buffer or ping-pong accumulation texture.

## Changelog

- **0.3** — trail fade wired, script log fixed, version bump, deploy note.
- **0.2** — Vite modular structure, scientific UI, docs, constrained script evaluator.

## Files

- `index.html` — layout
- `src/main.js` — WebGPU host + UI wiring
- `src/style.css` — instrument styling
- `shaders/*.wgsl` — compute and render
- `docs/` — integration notes
- `luau-examples/` — example scripts (intended for the future runtime)
