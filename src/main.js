const canvas = document.querySelector('#gpu');
const statusEl = document.querySelector('#status');
const errorEl = document.querySelector('#error');
const $ = id => document.getElementById(id);

let device, context, computePipeline, renderPipeline, particleBuffer, paramBuffer, computeBG, renderBG;
let count = 50000, paused = false, frame = 0, last = 0, fpsFrames = 0, fpsTime = 0;
let mouse = [0, 0], mouseActive = 0, raf = 0;
let sizeScale = 1.0;
let trail = 0.0;
let querySet = null;
let queryBuffer = null;
let gpuTimeMs = 0;

const fmt = n => Math.round(n).toLocaleString('en-US');

async function loadShader(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to load ${url}`);
  return res.text();
}

function showError(msg) {
  errorEl.style.display = 'grid';
  $('errorText').textContent = msg;
  statusEl.textContent = 'WEBGPU UNAVAILABLE';
  statusEl.style.color = '#f0bd67';
}

function params() {
  const b = new ArrayBuffer(48);
  const f = new Float32Array(b);
  const u = new Uint32Array(b);
  f[0] = Math.min(last ? 1 / 60 : 1 / 60, 0.033);
  f[1] = +$('speed').value;
  f[2] = +$('attraction').value;
  f[3] = +$('turbulence').value;
  f[4] = mouse[0];
  f[5] = mouse[1];
  u[6] = mouseActive;
  u[7] = count;
  f[8] = performance.now() / 1000;
  return new Uint8Array(b);
}

function makeParticles(n) {
  const data = new Float32Array(n * 4);
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = Math.sqrt(Math.random()) * 0.95;
    const k = i * 4;
    data[k] = Math.cos(a) * r;
    data[k + 1] = Math.sin(a) * r;
    data[k + 2] = -Math.sin(a) * (0.025 + Math.random() * 0.04);
    data[k + 3] = Math.cos(a) * (0.025 + Math.random() * 0.04);
  }
  return data;
}

function createBuffers(n) {
  if (particleBuffer) particleBuffer.destroy();
  count = n;
  particleBuffer = device.createBuffer({
    size: n * 16,
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
  });
  device.queue.writeBuffer(particleBuffer, 0, makeParticles(n));
  if (!paramBuffer) {
    paramBuffer = device.createBuffer({
      size: 48,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    });
  }
  computeBG = device.createBindGroup({
    layout: computePipeline.getBindGroupLayout(0),
    entries: [
      { binding: 0, resource: { buffer: particleBuffer } },
      { binding: 1, resource: { buffer: paramBuffer } }
    ]
  });
  renderBG = device.createBindGroup({
    layout: renderPipeline.getBindGroupLayout(0),
    entries: [
      { binding: 0, resource: { buffer: particleBuffer } },
      { binding: 1, resource: { buffer: paramBuffer } }
    ]
  });
  $('countMetric').textContent = fmt(n);
  $('countOut').textContent = fmt(n);
}

async function rebuildRenderPipeline(format = navigator.gpu.getPreferredCanvasFormat()) {
  const renderSrc = await loadShader('/shaders/render.wgsl');
  const code = renderSrc.replace('let sizeScale = 1.0;', `let sizeScale = ${sizeScale.toFixed(3)};`);
  const module = device.createShaderModule({ code });
  renderPipeline = device.createRenderPipeline({
    layout: 'auto',
    vertex: { module, entryPoint: 'vs' },
    fragment: {
      module,
      entryPoint: 'fs',
      targets: [{
        format,
        blend: {
          color: { srcFactor: 'src-alpha', dstFactor: 'one', operation: 'add' },
          alpha: { srcFactor: 'one', dstFactor: 'one-minus-src-alpha', operation: 'add' }
        }
      }]
    },
    primitive: { topology: 'triangle-list' }
  });
  if (particleBuffer) {
    computeBG = device.createBindGroup({
      layout: computePipeline.getBindGroupLayout(0),
      entries: [
        { binding: 0, resource: { buffer: particleBuffer } },
        { binding: 1, resource: { buffer: paramBuffer } }
      ]
    });
    renderBG = device.createBindGroup({
      layout: renderPipeline.getBindGroupLayout(0),
      entries: [
        { binding: 0, resource: { buffer: particleBuffer } },
        { binding: 1, resource: { buffer: paramBuffer } }
      ]
    });
  }
}

function resize() {
  if (!device) return;
  const dpr = Math.min(devicePixelRatio || 1, 2);
  const w = Math.max(1, Math.floor(canvas.clientWidth * dpr));
  const h = Math.max(1, Math.floor(canvas.clientHeight * dpr));
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w;
    canvas.height = h;
    context.configure({
      device,
      format: navigator.gpu.getPreferredCanvasFormat(),
      alphaMode: 'premultiplied'
    });
  }
}

function render(now) {
  raf = requestAnimationFrame(render);
  if (!device || paused) return;
  resize();
  const dt = Math.min((now - (last || now)) / 1000, 0.033);
  last = now;
  const b = params();
  new Float32Array(b.buffer)[0] = dt;
  device.queue.writeBuffer(paramBuffer, 0, b);
  const encoder = device.createCommandEncoder();
  if (querySet) encoder.writeTimestamp(querySet, 0);
  const cp = encoder.beginComputePass();
  cp.setPipeline(computePipeline);
  cp.setBindGroup(0, computeBG);
  cp.dispatchWorkgroups(Math.ceil(count / 256));
  cp.end();
  if (querySet) encoder.writeTimestamp(querySet, 1);
  const view = context.getCurrentTexture().createView();
  const fade = Math.max(0, 1 - trail * 0.92);
  const rp = encoder.beginRenderPass({
    colorAttachments: [{
      view,
      clearValue: { r: 0.018 * fade, g: 0.025 * fade, b: 0.043 * fade, a: 1 },
      loadOp: trail > 0.01 ? 'load' : 'clear',
      storeOp: 'store'
    }]
  });
  rp.setPipeline(renderPipeline);
  rp.setBindGroup(0, renderBG);
  rp.draw(6, count);
  rp.end();
  if (querySet) {
    encoder.writeTimestamp(querySet, 2);
    encoder.resolveQuerySet(querySet, 0, 3, queryBuffer, 0);
    encoder.writeTimestamp(querySet, 3);
  }
  device.queue.submit([encoder.finish()]);
  if (queryBuffer && frame % 30 === 0) {
    const staging = device.createBuffer({ size: 32, usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST });
    const enc2 = device.createCommandEncoder();
    enc2.copyBufferToBuffer(queryBuffer, 0, staging, 0, 32);
    device.queue.submit([enc2.finish()]);
    staging.mapAsync(GPUMapMode.READ).then(() => {
      const ts = new BigUint64Array(staging.getMappedRange());
      if (ts[1] > ts[0]) gpuTimeMs = Number(ts[1] - ts[0]) / 1e6;
      staging.unmap();
      staging.destroy();
    }).catch(() => {});
  }
  frame++;
  $('frameMetric').textContent = fmt(frame);
  fpsFrames++;
  if (now - fpsTime > 500) {
    const fps = Math.round(fpsFrames * 1000 / (now - fpsTime));
    const extra = gpuTimeMs > 0 ? ` · GPU ${gpuTimeMs.toFixed(2)}ms` : '';
    $('fpsPill').textContent = `FPS ${fps}${extra}`;
    fpsFrames = 0;
    fpsTime = now;
  }
}

async function init() {
  if (!navigator.gpu) {
    showError('WebGPU is not available. Use a recent Chrome or Edge with hardware acceleration, served over HTTPS or localhost.');
    return;
  }
  try {
    const adapter = await navigator.gpu.requestAdapter();
    if (!adapter) throw Error('No compatible GPU adapter found.');
    const features = [];
    if (adapter.features.has('timestamp-query')) features.push('timestamp-query');
    device = await adapter.requestDevice({ requiredFeatures: features });
    if (device.features.has('timestamp-query')) {
      querySet = device.createQuerySet({ type: 'timestamp', count: 4 });
      queryBuffer = device.createBuffer({ size: 32, usage: GPUBufferUsage.QUERY_RESOLVE | GPUBufferUsage.COPY_SRC });
    }
    context = canvas.getContext('webgpu');
    if (!context) throw Error('Could not create WebGPU canvas context.');
    const format = navigator.gpu.getPreferredCanvasFormat();
    context.configure({ device, format, alphaMode: 'premultiplied' });

    const computeSrc = await loadShader('/shaders/compute.wgsl');
    computePipeline = device.createComputePipeline({
      layout: 'auto',
      compute: { module: device.createShaderModule({ code: computeSrc }), entryPoint: 'update' }
    });

    await rebuildRenderPipeline(format);
    createBuffers(count);
    statusEl.textContent = 'WEBGPU ACTIVE';
    log('v0.4 · timestamp queries + trail fade');
    statusEl.style.color = '#91e7ce';
    $('gpuMetric').textContent = adapter.info?.device || 'GPU';
    $('runtimePill').textContent = 'JS';
    resize();
    raf = requestAnimationFrame(render);
    device.lost.then(info => showError('GPU device lost: ' + info.message));
  } catch (e) {
    console.error(e);
    showError(e.message || 'WebGPU initialization failed.');
  }
}

// Controls
['speed', 'attraction', 'turbulence', 'size', 'trail'].forEach(id => {
  $(id).addEventListener('input', () => {
    const v = +$(id).value;
    $(id + 'Out').textContent = v.toFixed(2);
    if (id === 'size') {
      sizeScale = v;
      if (device) rebuildRenderPipeline();
    }
    if (id === 'trail') trail = v;
  });
});

$('count').addEventListener('input', e => {
  $('countOut').textContent = fmt(+e.target.value);
  $('countMetric').textContent = fmt(+e.target.value);
});
$('count').addEventListener('change', e => {
  if (device) createBuffers(+e.target.value);
});

$('pause').addEventListener('click', () => {
  paused = !paused;
  $('pause').textContent = paused ? 'Resume' : 'Pause';
  if (!paused) last = 0;
});

$('reset').addEventListener('click', () => {
  if (device) device.queue.writeBuffer(particleBuffer, 0, makeParticles(count));
});

$('clear').addEventListener('click', () => {
  if (device) device.queue.writeBuffer(particleBuffer, 0, new Float32Array(count * 4));
});

$('fullscreen').addEventListener('click', () => {
  if (!document.fullscreenElement) canvas.requestFullscreen?.();
  else document.exitFullscreen?.();
});

canvas.addEventListener('pointermove', e => {
  const r = canvas.getBoundingClientRect();
  mouse = [
    ((e.clientX - r.left) / r.width) * 2 - 1,
    1 - ((e.clientY - r.top) / r.height) * 2
  ];
  mouseActive = 1;
});
canvas.addEventListener('pointerleave', () => mouseActive = 0);

// Simple script runner (not real Luau — see docs)
function applyConfig(cfg) {
  if (cfg.particleCount) {
    $('count').value = cfg.particleCount;
    $('countOut').textContent = fmt(cfg.particleCount);
    if (device) createBuffers(cfg.particleCount);
  }
  if (cfg.speed != null) { $('speed').value = cfg.speed; $('speedOut').textContent = (+cfg.speed).toFixed(2); }
  if (cfg.attraction != null) { $('attraction').value = cfg.attraction; $('attractionOut').textContent = (+cfg.attraction).toFixed(2); }
  if (cfg.turbulence != null) { $('turbulence').value = cfg.turbulence; $('turbulenceOut').textContent = (+cfg.turbulence).toFixed(2); }
  log('Applied config: ' + JSON.stringify(cfg));
}

function log(msg) {
  const c = $('console');
  c.textContent += (c.textContent ? '\n' : '') + `[${new Date().toISOString().slice(11, 19)}] ${msg}`;
  c.scrollTop = c.scrollHeight;
  $('log').textContent = msg;
}

$('runScript').addEventListener('click', () => {
  const src = $('script').value;
  try {
    const m = src.match(/return\s+({[\s\S]*})/);
    if (!m) throw new Error('Script must end with return { ... }');
    const objSrc = m[1].replace(/(\w+)\s*:/g, '"$1":');
    const cfg = JSON.parse(objSrc);
    applyConfig(cfg);
    $('scriptStatus').textContent = 'OK';
    $('scriptStatus').style.color = '#91e7ce';
  } catch (e) {
    $('scriptStatus').textContent = 'Error';
    $('scriptStatus').style.color = '#f0bd67';
    log('Script error: ' + e.message);
  }
});

$('resetScript').addEventListener('click', () => {
  $('script').value = `local config = {
  particleCount = 50000,
  speed = 0.8,
  attraction = 0.35,
  turbulence = 1.2
}
return config`;
  $('scriptStatus').textContent = 'Reset';
  log('Script reset');
});

init();
