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

@group(0) @binding(0) var<storage, read_write> particles: array<vec4<f32>>;
@group(0) @binding(1) var<uniform> u: Params;

fn hash(n: f32) -> f32 {
  return fract(sin(n * 127.1) * 43758.5453);
}

@compute @workgroup_size(256)
fn update(@builtin(global_invocation_id) gid: vec3<u32>) {
  let i = gid.x;
  if (i >= u.count) { return; }
  var p = particles[i];
  let pos = p.xy;
  let phase = atan2(pos.y, pos.x);
  let radius = length(pos) + 0.0001;
  let swirl = vec2<f32>(-pos.y, pos.x) / radius;
  let wave = vec2<f32>(
    sin(pos.y * 5.0 + u.time * 0.7 + f32(i) * 0.0003),
    cos(pos.x * 4.0 - u.time * 0.55 + f32(i) * 0.0002)
  );
  var force = swirl * u.attraction + wave * u.turbulence * 0.24;
  if (u.mouseActive == 1u) {
    let d = u.mouse - pos;
    let r = length(d) + 0.001;
    force += d / (r * r) * 0.012 * clamp(1.0 - r / 1.2, 0.0, 1.0);
  }
  p.zw += force * u.delta;
  p.zw *= 0.996;
  let vlen = length(p.zw);
  if (vlen > 1.8) { p.zw = p.zw / vlen * 1.8; }
  p.xy += p.zw * u.delta * u.speed;
  if (abs(p.x) > 1.18 || abs(p.y) > 1.18) {
    let a = hash(f32(i) + u.time) * 6.2831853;
    p.xy = vec2<f32>(cos(a), sin(a)) * 0.96;
    p.zw = vec2<f32>(-sin(a), cos(a)) * 0.08;
  }
  particles[i] = p;
}
