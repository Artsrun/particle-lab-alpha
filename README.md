# Particle Lab α v0.8

Browser-native programmable GPU particle simulation experiment.

**Live (prod branch):** deploy is active from `prod`. Merge or push this to `prod` to update the live site.

## Status

Working WebGPU compute + render pipeline (JavaScript host).  
Trail fade is live.  
GPU timestamp queries are feature-detected (shown in the FPS pill when supported).  
Mobile support: lower default particle count, reduced DPR, orientation handling, reduced-motion respect, touch-friendly controls.  
Rust seed module source is present (not loaded at runtime).  
Luau remains a documented next step — not a real runtime.  
No fake performance numbers.

## Quick start

```bash
npm install
npm run dev
```

Open the printed localhost URL in a WebGPU-capable browser (recent Chrome or Edge).  
Hardware acceleration must be enabled. Secure context required.  
On mobile, particle count is capped and DPR is lowered automatically.

## Architecture (current)

- **Host**: Vanilla JS + Vite. Owns the WebGPU device, command encoder, and UI.
- **GPU**: WGSL compute shader updates particle state. WGSL render shader draws instanced soft quads.
- **Parameters**: Uniform buffer written every frame.
- **Trails**: `loadOp: 'load'` + reduced clear when trail > 0.
- **Timing**: Optional timestamp queries; `requestAnimationFrame` fallback.
- **Mobile**: Detects small screens / mobile UA, caps particles (~20k default, 25k max), lowers DPR, handles orientation, respects `prefers-reduced-motion`.
- **Script panel**: Constrained evaluator (not official Luau).
- **Rust**: `rust-wasm/particle_seed` — CPU seeding source (approach B).

## Modes

| Mode | Status | Notes |
|------|--------|-------|
| JavaScript baseline | Working | Full compute + render + trail + timestamps + mobile |
| Rust/WASM | Source present | Seed module only |
| Luau script | Planned | See `docs/luau.md` |

## Benchmark methodology

- Particle counts: 10k / 50k / 100k (desktop); lower cap on mobile.
- FPS is the rolling `requestAnimationFrame` interval.
- GPU compute time shown when `timestamp-query` is available.
- Do not treat this as a language benchmark.

## Known limitations

- Official Luau runtime is not compiled to WASM.
- Rust WASM seed is source-only.
- No Rust `wgpu` device ownership.
- Trail is a simple fade.
- Particle size change rebuilds the render pipeline.
- Timestamp read-back is best-effort.
- Mobile WebGPU support still varies by browser/OS; error overlay is the graceful path.

## Next practical steps

1. Official Luau WASM runtime + narrow host API.
2. Wire the Rust seed module into Reset.
3. Ping-pong accumulation texture for better trails.
4. Device-loss recovery that fully re-creates pipelines.

## Changelog

- **0.8** — mobile support (particle cap, lower DPR, orientation, reduced-motion, touch-friendly CSS).
- **0.7** — polish + visibility pause + better resize.
- **0.6** — reduced-motion respect, device-loss note.
- **0.5** — log fix, mobile detection groundwork.
- **0.4** — timestamp queries, Rust seed source.
- **0.3** — trail fade.
- **0.2** — Vite modular structure.

## Files

- `index.html` — layout
- `src/main.js` — WebGPU host + UI + mobile
- `src/style.css` — instrument styling + mobile refinements
- `shaders/*.wgsl` — compute and render
- `rust-wasm/` — seed module source
- `docs/` — integration notes
- `luau-examples/` — example scripts
