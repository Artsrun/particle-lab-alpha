# Particle Lab α v0.4

Browser-native programmable GPU particle simulation experiment.

**Live (prod branch):** deploy is active from `prod`. Merge or push this to `prod` to update the live site.

## Status

Working WebGPU compute + render pipeline (JavaScript host).  
Trail fade is live.  
GPU timestamp queries are feature-detected and reported in the FPS pill when the adapter supports `timestamp-query` (CPU frame interval remains the fallback).  
A minimal Rust/WASM seed module source is included under `rust-wasm/` (not yet loaded at runtime).  
Luau remains a documented next step — not a real runtime in this build.  
No fake performance numbers.

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
- **Trails**: When trail > 0 the render pass uses `loadOp: 'load'` and a reduced clear.
- **Timing**: Optional timestamp query set (compute start/end + resolve). Falls back to `requestAnimationFrame` deltas.
- **Script panel**: Constrained evaluator that accepts a simple `return { ... }` object. This is **not** the official Luau runtime.
- **Rust**: `rust-wasm/particle_seed` — CPU-side seeding crate (approach B). Build instructions in `rust-wasm/README.md`.

## Modes

| Mode | Status | Notes |
|------|--------|-------|
| JavaScript baseline | Working | Full compute + render + trail + optional timestamps |
| Rust/WASM | Source present | Seed module only; not yet loaded in the page |
| Luau script | Planned | See `docs/luau.md` |

## Benchmark methodology

- Particle counts: 10k / 50k / 100k (slider).
- FPS is the rolling `requestAnimationFrame` interval.
- When `timestamp-query` is available, GPU compute interval is shown next to FPS.
- Do not compare this against a CPU particle loop and call the result a language benchmark.

## Known limitations

- Official Luau runtime is not compiled to WASM in this tree.
- Rust WASM seed is source-only; not linked into the live page yet.
- No Rust `wgpu` device ownership.
- Trail is still a simple fade (load previous frame).
- Particle size change rebuilds the render pipeline.
- Timestamp query read-back is best-effort and not on every frame.
- Mobile / Safari WebGPU support varies; the error overlay is the intended graceful path.

## Next practical steps

1. Build the official Luau runtime for `wasm32-unknown-unknown` and expose a narrow host API.
2. Wire the Rust seed module (`wasm-bindgen` output) into the host so Reset can call it.
3. Replace the simple trail fade with a short history buffer or ping-pong accumulation texture.
4. Add device-loss recovery and a reduced-motion mode.

## Changelog

- **0.4** — timestamp queries (feature-detected), Rust seed module source, README update.
- **0.3** — trail fade, script log fix, deploy note.
- **0.2** — Vite modular structure, scientific UI, docs, constrained script evaluator.

## Files

- `index.html` — layout
- `src/main.js` — WebGPU host + UI wiring
- `src/style.css` — instrument styling
- `shaders/*.wgsl` — compute and render
- `rust-wasm/` — seed module source + build notes
- `docs/` — integration notes
- `luau-examples/` — example scripts (intended for the future runtime)
