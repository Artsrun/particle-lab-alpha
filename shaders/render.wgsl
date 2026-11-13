struct Params {
  delta: f32,
  speed: f32,
  attraction: f32,
  turbulence: f32,
  mouse: vec2<f32>,
  mouseActive: u32,
  count: u32,
  time: f32,
  pad0: f32,
  pad1: f32,
  pad2: f32,
}

@group(0) @binding(0) var<storage, read> particles: array<vec4<f32>>;
@group(0) @binding(1) var<uniform> u: Params;

struct Out {
  @builtin(position) pos: vec4<f32>,
  @location(0) uv: vec2<f32>,
  @location(1) velocity: f32,
  @location(2) tint: f32,
}

@vertex
fn vs(@builtin(vertex_index) vi: u32, @builtin(instance_index) ii: u32) -> Out {
  let corners = array<vec2<f32>, 6>(
    vec2<f32>(-1.0, -1.0), vec2<f32>(1.0, -1.0), vec2<f32>(-1.0, 1.0),
    vec2<f32>(-1.0, 1.0), vec2<f32>(1.0, -1.0), vec2<f32>(1.0, 1.0)
  );
  let p = particles[ii];
  let c = corners[vi];
  // size scale injected at pipeline build time
  let sizeScale = 1.0;
  var o: Out;
  o.pos = vec4<f32>(p.xy + c * 0.0028 * sizeScale, 0.0, 1.0);
  o.uv = c;
  o.velocity = length(p.zw);
  o.tint = atan2(p.y, p.x);
  return o;
}

@fragment
fn fs(i: Out) -> @location(0) vec4<f32> {
  let r = length(i.uv);
  if (r > 1.0) { discard; }
  let edge = 1.0 - smoothstep(0.72, 1.0, r);
  let hue = 0.5 + 0.5 * sin(i.tint + u.time * 0.12);
  let col = mix(vec3<f32>(0.22, 0.78, 0.92), vec3<f32>(0.68, 0.48, 1.0), hue);
  let glow = 1.0 + min(i.velocity * 0.7, 0.8);
  return vec4<f32>(col * edge * glow, edge * 0.92);
}
