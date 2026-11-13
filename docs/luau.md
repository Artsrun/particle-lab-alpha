# Luau integration path

The right-hand script panel currently runs a **constrained JavaScript evaluator**, not the official Luau runtime.

## Why not yet

Building [luau-lang/luau](https://github.com/luau-lang/luau) to `wasm32-unknown-unknown` and exposing a safe host API is a non-trivial packaging step. It is the correct next engineering milestone, not a label we apply to the current evaluator.

## Intended host API (future)

```lua
particle.setSpeed(0.8)
particle.setAttraction(0.35)
particle.setTurbulence(1.2)
particle.setColor(0.4, 0.8, 1.0)
```

Scripts must not receive unrestricted filesystem, network, or raw GPU resource access. Execution time and memory must be bounded.

## Current evaluator contract

The textarea must contain a final:

```lua
return {
  particleCount = 50000,
  speed = 0.8,
  attraction = 0.35,
  turbulence = 1.2
}
```

Only numeric fields from that object are applied. No functions, no side effects.

## Example scripts

See `luau-examples/`.
