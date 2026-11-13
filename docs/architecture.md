# Architecture

## Ownership

```
Browser
  └── JavaScript host (src/main.js)
        ├── WebGPU device / queue / encoder
        ├── Storage buffer (particles: vec4 pos.xy + vel.zw)
        ├── Uniform buffer (Params)
        ├── Compute pipeline  ← shaders/compute.wgsl
        └── Render pipeline   ← shaders/render.wgsl
```

## Frame

1. Write current parameters + delta into the uniform buffer.
2. Compute pass: `dispatchWorkgroups(ceil(count / 256))`.
3. Render pass: `draw(6, count)` instanced quads.
4. Present.

## Why this split

- Keeps the GPU experiment independent of language runtimes so timing stays honest.
- Luau (future) only mutates the parameter block or emits a small behavior description.
- Rust WASM (future) can prepare data or, later, own the device if the ownership model proves viable.

## Resizing

Canvas is sized to its CSS box × min(devicePixelRatio, 2). Context is reconfigured on size change.
