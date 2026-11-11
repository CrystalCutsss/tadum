// WebGL2-рендерер поверхности MetalCard. Порт из React Bits «Reflective Card»
// (https://reactbits.dev, https://github.com/DavidHDev/react-bits, автор David Haz; лицензия MIT + Commons Clause —
// по репозиторию проекта, проверено по LICENSE.md на дату порта не удалось: сеть песочницы закрыта, см. отчёт).
// Взято: шейдер PLATE — фаска (chamfer) с бликом, рябь (warp), шлифовка (brushed grain), софтбоксы (ключевая
// полоса, верхняя и боковая), двойной экспоненциальный блик у указателя, матрица наклона. Убрано: видео, камера,
// проходы CAPTURE и BLUR (capture = 0 — отражается только процедурная «комната»).
// Изменено под Tadum: основа — синий металл из токенов (--metal-deep → --metal-mid → --metal-steel, градиент 330°
// как у CSS-слоёв), блики — светлая лазурь --metal-gl-highlight; кромка — светлая сверху слева и тёмная снизу
// справа; под строками текста (маска с мягким краем) яркость ограничена потолком uCap — белый текст ≥ 4.5:1 в любой
// точке. Числа в шейдере — математика освещения, не дизайн-значения; цвета и силы приходят из токенов.
// Здесь же пружина наклона, указатель и чтение токенов (mountMetal): модуль грузится динамическим import() из
// metal-card.tsx и в первый чанк не попадает. Без WebGL2 mountMetal всё равно ведёт наклон CSS-слоёв.

const VERTEX = `#version 300 es
in vec2 aPosition;
out vec2 vUv;
void main() {
  vUv = aPosition * 0.5 + 0.5;
  gl_Position = vec4(aPosition, 0.0, 1.0);
}`

const PLATE = `#version 300 es
precision highp float;
#define MAX_TEXT 16
in vec2 vUv;
out vec4 fragColor;

uniform vec2 uSize;
uniform float uRadius;
uniform float uScale;
uniform mat3 uRotate;
uniform float uView;
uniform float uRough;
uniform float uWarp;
uniform float uShine;
uniform float uBevel;
uniform float uRim;
uniform float uGlare;
uniform float uGlareSize;
uniform vec2 uPointer;
uniform vec3 uDeep;
uniform vec3 uMid;
uniform vec3 uSteel;
uniform vec3 uLight;
uniform float uCap;
uniform vec4 uText[MAX_TEXT];
uniform int uTextCount;
uniform float uTextPad;
uniform float uTextFeather;

const float BLUR = 6.0;

const vec3 LUMA = vec3(0.2126, 0.7152, 0.0722);
const vec2 SWEEP = vec2(0.5, 0.86);

float hash(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

vec2 hash2(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * vec3(0.1031, 0.103, 0.0973));
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.xx + p3.yz) * p3.zy) * 2.0 - 1.0;
}

vec3 gradientNoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
  vec2 du = 30.0 * f * f * (f * (f - 2.0) + 1.0);
  vec2 ga = hash2(i);
  vec2 gb = hash2(i + vec2(1.0, 0.0));
  vec2 gc = hash2(i + vec2(0.0, 1.0));
  vec2 gd = hash2(i + vec2(1.0, 1.0));
  float va = dot(ga, f);
  float vb = dot(gb, f - vec2(1.0, 0.0));
  float vc = dot(gc, f - vec2(0.0, 1.0));
  float vd = dot(gd, f - vec2(1.0, 1.0));
  float k = va - vb - vc + vd;
  float value = va + u.x * (vb - va) + u.y * (vc - va) + u.x * u.y * k;
  vec2 slope = ga + u.x * (gb - ga) + u.y * (gc - ga) + u.x * u.y * (ga - gb - gc + gd) + du * (u.yx * k + vec2(vb, vc) - va);
  return vec3(value, slope);
}

float valueNoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

float erf(float x) {
  float x2 = x * x;
  return sign(x) * sqrt(1.0 - exp(-x2 * (1.2732395 + 0.147 * x2) / (1.0 + 0.147 * x2)));
}

float band(float x, float halfWidth, float sigma) {
  float s = 1.4142136 * max(sigma, 0.0001);
  return 0.5 * (erf((x + halfWidth) / s) - erf((x - halfWidth) / s));
}

float strip(vec2 q, vec2 center, vec2 dir, float halfWidth, vec2 sigma) {
  vec2 normal = vec2(-dir.y, dir.x);
  return band(dot(q - center, normal), halfWidth, length(sigma * normal));
}

float softbox(vec2 q, vec2 sigma) {
  float key = strip(q, vec2(-0.1, -0.16), normalize(SWEEP), 0.022, sigma + 0.018);
  float top = band(q.y + 0.6, 0.12, sigma.y + 0.05);
  float side = band(q.x - 0.46, 0.05, sigma.x + 0.05);
  return key + top * 0.8 + side * 0.35;
}

float room(vec2 q, vec2 sigma) {
  float fall = smoothstep(-0.55, 0.5, q.y);
  float flag = strip(q, vec2(0.24, -0.02), normalize(SWEEP), 0.09, sigma + 0.08);
  return mix(0.85, 0.12, fall) * (1.0 - 0.6 * flag);
}

// Расстояние до скруглённого прямоугольника (центр в нуле, полуразмер b, радиус r); < 0 — внутри.
float sdRoundBox(vec2 p, vec2 b, float r) {
  vec2 q = abs(p) - b + r;
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
}

// Маска текста: 1 на строках текста (с полем uTextPad), плавно до 0 на ширине uTextFeather.
float textMask(vec2 p) {
  float mask = 0.0;
  for (int i = 0; i < MAX_TEXT; i++) {
    if (i >= uTextCount) break;
    vec4 box = uText[i];
    float s = sdRoundBox(p - box.xy, box.zw + uTextPad, uTextPad);
    mask = max(mask, 1.0 - smoothstep(0.0, uTextFeather, s));
  }
  return mask;
}

vec3 toSrgb(vec3 c) {
  c = clamp(c, 0.0, 1.0);
  return mix(c * 12.92, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(0.0031308, c));
}

void main() {
  vec2 p = vec2(vUv.x - 0.5, 0.5 - vUv.y) * uSize;
  vec2 halfSize = uSize * 0.5;
  float r = min(uRadius, min(halfSize.x, halfSize.y));
  vec2 corner = abs(p) - halfSize + r;
  vec2 side = vec2(p.x >= 0.0 ? 1.0 : -1.0, p.y >= 0.0 ? 1.0 : -1.0);
  float d;
  vec2 outward;
  if (corner.x > 0.0 && corner.y > 0.0) {
    d = length(corner) - r;
    outward = normalize(corner) * side;
  } else if (corner.x > corner.y) {
    d = corner.x - r;
    outward = vec2(side.x, 0.0);
  } else {
    d = corner.y - r;
    outward = vec2(0.0, side.y);
  }
  float coverage = clamp(0.5 - d * uScale, 0.0, 1.0);

  float chamferWidth = min(uBevel, max(r, 1.0));
  float chamfer = chamferWidth > 0.01 ? 1.0 - smoothstep(0.0, chamferWidth, -d) : 0.0;
  vec2 slope = outward * chamfer;

  vec2 wp = p / 220.0;
  vec3 w1 = gradientNoise(wp);
  vec3 w2 = gradientNoise(wp * 2.07 + 13.7);
  vec2 ripple = (w1.yz + w2.yz * 0.5) * uWarp;
  slope += ripple * 0.008;

  float grain = valueNoise(vec2(p.x * 0.008, p.y * 0.55)) * 0.45 + valueNoise(vec2(p.x * 0.019 + 3.7, p.y * 0.23)) * 0.35 + valueNoise(vec2(p.x * 0.004 + 9.2, p.y * 0.09)) * 0.2;
  float brush = uRough * uRough;
  slope.y += (grain - 0.5) * brush * 0.004;

  vec3 normal = uRotate * normalize(vec3(slope, 1.0));
  vec3 position = uRotate * vec3(p, 0.0);
  vec3 view = normalize(position - vec3(0.0, 0.0, uView));
  vec3 bounce = reflect(view, normal);
  vec2 q = bounce.xy / max(bounce.z, 0.2);

  vec2 footprint = fwidth(q);
  vec2 sigma = sqrt(vec2(BLUR / uView) * vec2(BLUR / uView) + footprint * footprint * 0.5);
  sigma += vec2(0.004, 0.05) * uRough;

  float scene = room(q, sigma) * (1.0 + (grain - 0.5) * brush * 0.3);

  vec2 toPointer = (uPointer - p) / uGlareSize;
  vec2 spread = toPointer * vec2(1.0, 1.0 / (1.0 + 2.5 * uRough));
  float reach = dot(spread, spread);
  float glint = max(1.0 + 3.0 * dot(slope, toPointer), 0.0);
  float glare = (exp(-reach * 1.6) + exp(-reach * 0.35) * 0.15) * glint * uGlare * (1.0 + 0.8 * (grain - 0.5) * brush);
  float highlight = softbox(q, sigma) * uShine + glare;

  // Основа — синий металл: градиент 330° (как CSS-слой), свет сверху слева.
  vec2 dir = vec2(-0.5, -0.8660254);
  float t = clamp(dot(p, dir) / (abs(uSize.x * dir.x) + abs(uSize.y * dir.y)) + 0.5, 0.0, 1.0);
  vec3 base = t < 0.5 ? mix(uDeep, uMid, t * 2.0) : mix(uMid, uSteel, (t - 0.5) * 2.0);
  // «Комната» отражается в металле: светлее сверху, дымчато-темнее снизу.
  vec3 color = base * mix(0.62, 1.3, clamp(scene, 0.0, 1.0)) + uLight * highlight * 0.35;

  // Кромка: фаска светлая сверху слева, тёмная снизу справа.
  float rim = chamfer * dot(outward, vec2(-0.7071068, -0.7071068));
  color += uLight * max(rim, 0.0) * uRim;
  color *= 1.0 - max(-rim, 0.0) * 0.75;

  // Под строками текста — мягкий потолок яркости (белый текст сохраняет AA); маска с широким мягким краем,
  // поэтому блик между строками и вокруг них непрерывен, без видимой «панели».
  float inner = textMask(p);
  float y = dot(color, LUMA);
  float knee = uCap * 0.7;
  float capped = y <= knee ? y : knee + (uCap - knee) * (1.0 - exp(-(y - knee) / (uCap - knee)));
  color *= mix(1.0, capped / max(y, 0.00001), inner);

  vec3 outColor = toSrgb(color) + (hash(gl_FragCoord.xy) - 0.5) / 255.0;
  outColor = clamp(outColor, 0.0, 1.0);
  fragColor = vec4(outColor * coverage, coverage);
}`

/** Параметры кадра: размеры в CSS-пикселях, координаты от центра карточки (y вниз), углы в радианах. */
type MetalFrame = {
  width: number
  height: number
  rotateX: number
  rotateY: number
  pointerX: number
  pointerY: number
  glare: number
  /** Строки текста: [cx, cy, halfW, halfH] × count, координаты от центра карточки (y вниз). */
  text: Float32Array
  textCount: number
}

/** Материал из токенов: цвета — линейный sRGB, длины — CSS-пиксели. */
type MetalMaterial = {
  deep: number[]
  mid: number[]
  steel: number[]
  light: number[]
  cap: number
  radius: number
  textPad: number
  textFeather: number
  view: number
  shine: number
  glare: number
  glareSize: number
  bevel: number
  rim: number
  rough: number
  warp: number
}

type MetalRenderer = {
  render: (frame: MetalFrame, material: MetalMaterial) => void
  dispose: () => void
}

function compile(gl: WebGL2RenderingContext, type: number, source: string) {
  const shader = gl.createShader(type)
  if (!shader) return null
  gl.shaderSource(shader, source)
  gl.compileShader(shader)
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader)
    return null
  }
  return shader
}

function link(gl: WebGL2RenderingContext) {
  const vertex = compile(gl, gl.VERTEX_SHADER, VERTEX)
  const fragment = compile(gl, gl.FRAGMENT_SHADER, PLATE)
  const program = vertex && fragment ? gl.createProgram() : null
  if (!vertex || !fragment || !program) {
    if (vertex) gl.deleteShader(vertex)
    if (fragment) gl.deleteShader(fragment)
    return null
  }
  gl.attachShader(program, vertex)
  gl.attachShader(program, fragment)
  gl.bindAttribLocation(program, 0, "aPosition")
  gl.linkProgram(program)
  gl.deleteShader(vertex)
  gl.deleteShader(fragment)
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    gl.deleteProgram(program)
    return null
  }
  const uniforms: Record<string, WebGLUniformLocation | null> = {}
  const count = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS) as number
  for (let index = 0; index < count; index++) {
    const info = gl.getActiveUniform(program, index)
    if (info) uniforms[info.name] = gl.getUniformLocation(program, info.name)
  }
  return { program, uniforms }
}

/** Рендерер на canvas; null — WebGL2 недоступен или шейдер не собрался (тогда остаются CSS-слои). */
function createMetalRenderer(canvas: HTMLCanvasElement): MetalRenderer | null {
  const gl = canvas.getContext("webgl2", {
    alpha: true,
    premultipliedAlpha: true,
    antialias: false,
    depth: false,
    stencil: false,
    powerPreference: "low-power",
  })
  if (!gl) return null
  const linked = link(gl)
  if (!linked) return null
  const { program, uniforms: u } = linked

  const vao = gl.createVertexArray()
  gl.bindVertexArray(vao)
  const buffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
  gl.enableVertexAttribArray(0)
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0)
  gl.disable(gl.BLEND)
  gl.disable(gl.DEPTH_TEST)
  const rotation = new Float32Array(9)

  const render = (frame: MetalFrame, m: MetalMaterial) => {
    if (gl.isContextLost()) return
    const cx = Math.cos(frame.rotateX)
    const sx = Math.sin(frame.rotateX)
    const cy = Math.cos(frame.rotateY)
    const sy = Math.sin(frame.rotateY)
    rotation.set([cy, sx * sy, -cx * sy, 0, cx, sx, sy, -sx * cy, cx * cy])
    gl.bindFramebuffer(gl.FRAMEBUFFER, null)
    gl.viewport(0, 0, canvas.width, canvas.height)
    gl.useProgram(program)
    gl.bindVertexArray(vao)
    gl.uniform2f(u.uSize!, frame.width, frame.height)
    gl.uniform1f(u.uRadius!, m.radius)
    gl.uniform1f(u.uScale!, canvas.width / Math.max(1, frame.width))
    gl.uniformMatrix3fv(u.uRotate!, false, rotation)
    gl.uniform1f(u.uView!, m.view)
    gl.uniform1f(u.uRough!, m.rough)
    gl.uniform1f(u.uWarp!, m.warp)
    gl.uniform1f(u.uShine!, m.shine)
    gl.uniform1f(u.uBevel!, m.bevel)
    gl.uniform1f(u.uRim!, m.rim)
    gl.uniform1f(u.uGlare!, m.glare * frame.glare)
    gl.uniform1f(u.uGlareSize!, m.glareSize)
    gl.uniform2f(u.uPointer!, frame.pointerX, frame.pointerY)
    gl.uniform3fv(u.uDeep!, m.deep)
    gl.uniform3fv(u.uMid!, m.mid)
    gl.uniform3fv(u.uSteel!, m.steel)
    gl.uniform3fv(u.uLight!, m.light)
    gl.uniform1f(u.uCap!, m.cap)
    gl.uniform4fv(u["uText[0]"]!, frame.text)
    gl.uniform1i(u.uTextCount!, frame.textCount)
    gl.uniform1f(u.uTextPad!, m.textPad)
    gl.uniform1f(u.uTextFeather!, m.textFeather)
    gl.drawArrays(gl.TRIANGLES, 0, 3)
  }

  const dispose = () => {
    if (gl.isContextLost()) return
    gl.deleteBuffer(buffer)
    gl.deleteVertexArray(vao)
    gl.deleteProgram(program)
  }

  return { render, dispose }
}

// Пружина наклона и указателя — как в оригинале (жёсткость 120, демпфирование 16, шаг интегрирования 1/120 с).
const STIFFNESS = 120
const DAMPING = 16
const STEP = 1 / 120
// Блик: появление и угасание (с), как в оригинале.
const LIGHT_IN = 0.18
const LIGHT_OUT = 0.45
// Положение блика без указателя: 30 % / 20 % карточки (−1…1 от центра).
const REST_X = -0.4
const REST_Y = -0.6
const EPSILON = 0.0005
// Предел строк текста в маске шейдера (MAX_TEXT в PLATE).
const MAX_TEXT = 16

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

type Axis = { p: number; v: number; target: number }

function stepAxis(axis: Axis, h: number) {
  axis.v += (STIFFNESS * (axis.target - axis.p) - DAMPING * axis.v) * h
  axis.p += axis.v * h
}

const settled = (axis: Axis) => Math.abs(axis.target - axis.p) < EPSILON && Math.abs(axis.v) < EPSILON

/** sRGB-канал 0…1 → линейный. */
const linear = (c: number) => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4))

/** Цвет CSS (любой синтаксис, включая oklch и color-mix) → линейный sRGB через 2D-canvas. */
function makeColorReader() {
  const probe = document.createElement("canvas")
  probe.width = 1
  probe.height = 1
  const ctx = probe.getContext("2d", { willReadFrequently: true })
  return (value: string): number[] => {
    if (!ctx) return [1, 1, 1]
    ctx.clearRect(0, 0, 1, 1)
    ctx.fillStyle = value || "transparent"
    ctx.fillRect(0, 0, 1, 1)
    const [r = 0, g = 0, b = 0] = ctx.getImageData(0, 0, 1, 1).data
    return [r, g, b].map((channel) => linear(channel / 255))
  }
}

/** Длина токена (rem или px) → CSS-пиксели. */
function toPx(value: string, rootFont: number): number {
  const number = parseFloat(value)
  if (Number.isNaN(number)) return 0
  return value.trim().endsWith("rem") ? number * rootFont : number
}

function readMaterial(root: HTMLElement, read: (value: string) => number[]): MetalMaterial {
  const style = getComputedStyle(root)
  const token = (name: string) => style.getPropertyValue(name).trim()
  const num = (name: string) => parseFloat(token(name)) || 0
  const rootFont = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16
  const fg = read(token("--primary-foreground"))
  const fgLum = 0.2126 * fg[0]! + 0.7152 * fg[1]! + 0.0722 * fg[2]!
  // Потолок яркости фона под текстом: (L_текста + 0.05) / целевой контраст − 0.05.
  const cap = (fgLum + 0.05) / num("--metal-gl-contrast") - 0.05
  return {
    deep: read(token("--metal-deep")),
    mid: read(token("--metal-mid")),
    steel: read(token("--metal-steel")),
    light: read(token("--metal-gl-highlight")),
    cap,
    radius: parseFloat(style.borderTopLeftRadius) || 0,
    textPad: toPx(token("--metal-gl-text-pad"), rootFont),
    textFeather: toPx(token("--metal-gl-text-feather"), rootFont),
    view: toPx(token("--metal-perspective"), rootFont),
    shine: num("--metal-gl-shine"),
    glare: num("--metal-gl-glare"),
    glareSize: toPx(token("--metal-gl-glare-size"), rootFont),
    bevel: toPx(token("--metal-gl-bevel"), rootFont),
    rim: num("--metal-gl-rim"),
    rough: num("--metal-gl-rough"),
    warp: num("--metal-gl-warp"),
  }
}

/** Подключает пружину наклона, блик и WebGL-поверхность к корню; возвращает отписку. */
export function mountMetal(root: HTMLElement, canvas: HTMLCanvasElement): () => void {
  const tracking =
    window.matchMedia("(hover: hover) and (pointer: fine)").matches &&
    !window.matchMedia("(prefers-reduced-motion: reduce)").matches
  const x: Axis = { p: 0, v: 0, target: 0 }
  const y: Axis = { p: 0, v: 0, target: 0 }
  const px: Axis = { p: REST_X, v: 0, target: REST_X }
  const py: Axis = { p: REST_Y, v: 0, target: REST_Y }
  const rest = () => parseFloat(getComputedStyle(root).getPropertyValue("--metal-gl-rest-glare")) || 0
  const light = { p: rest(), target: rest() }
  const size = { width: root.offsetWidth, height: root.offsetHeight }
  let renderer: MetalRenderer | null = null
  let material: MetalMaterial | null = null
  let read: ((value: string) => number[]) | null = null
  const text = new Float32Array(MAX_TEXT * 4)
  let textCount = 0

  // Строки текста в координатах карточки (от центра, y вниз): каждая строка каждого текстового узла.
  // Меряется по статичному корню; при наклоне смещение строк ≤ нескольких px — его покрывает мягкий край маски.
  const measureText = () => {
    const rootRect = root.getBoundingClientRect()
    const cx = rootRect.left + rootRect.width / 2
    const cy = rootRect.top + rootRect.height / 2
    const boxes: DOMRect[] = []
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
    const range = document.createRange()
    while (walker.nextNode()) {
      const node = walker.currentNode
      if (!node.textContent?.trim()) continue
      range.selectNodeContents(node)
      for (const rect of range.getClientRects()) if (rect.width > 0 && rect.height > 0) boxes.push(rect)
    }
    // Больше MAX_TEXT строк — хвост объединяется в один общий прямоугольник.
    if (boxes.length > MAX_TEXT) {
      const tail = boxes.splice(MAX_TEXT - 1)
      const left = Math.min(...tail.map((r) => r.left))
      const top = Math.min(...tail.map((r) => r.top))
      const right = Math.max(...tail.map((r) => r.right))
      const bottom = Math.max(...tail.map((r) => r.bottom))
      boxes.push(new DOMRect(left, top, right - left, bottom - top))
    }
    textCount = boxes.length
    boxes.forEach((rect, index) => {
      text.set([rect.left + rect.width / 2 - cx, rect.top + rect.height / 2 - cy, rect.width / 2, rect.height / 2], index * 4)
    })
  }
  let raf = 0
  let last = 0
  let disposed = false

  const tiltMax = () => (parseFloat(getComputedStyle(root).getPropertyValue("--metal-tilt-max")) || 0) * (Math.PI / 180)

  const write = () => {
    if (!tracking) return
    const style = root.style
    style.setProperty("--metal-rx", x.p.toFixed(4))
    style.setProperty("--metal-ry", y.p.toFixed(4))
    style.setProperty("--metal-x", `${((px.p + 1) * 50).toFixed(2)}%`)
    style.setProperty("--metal-y", `${((py.p + 1) * 50).toFixed(2)}%`)
  }

  const draw = () => {
    if (!renderer || !material) return
    const angle = tracking ? tiltMax() : 0
    const frame: MetalFrame = {
      width: size.width,
      height: size.height,
      rotateX: y.p * angle,
      rotateY: -x.p * angle,
      pointerX: px.p * size.width * 0.5,
      pointerY: py.p * size.height * 0.5,
      glare: light.p,
      text,
      textCount,
    }
    renderer.render(frame, material)
  }

  const frame = (now: number) => {
    raf = 0
    const dt = Math.min(0.05, (now - last) / 1000 || 0)
    last = now
    const steps = Math.max(1, Math.ceil(dt / STEP))
    const h = dt / steps
    for (let i = 0; i < steps; i++) for (const axis of [x, y, px, py]) stepAxis(axis, h)
    const tau = light.target > light.p ? LIGHT_IN : LIGHT_OUT
    light.p += (light.target - light.p) * (1 - Math.exp(-dt / tau))
    const moving = ![x, y, px, py].every(settled) || Math.abs(light.target - light.p) > 0.002
    if (!moving) {
      for (const axis of [x, y, px, py]) {
        axis.p = axis.target
        axis.v = 0
      }
      light.p = light.target
    }
    write()
    draw()
    if (moving && !disposed) raf = requestAnimationFrame(frame)
  }

  const wake = () => {
    if (raf || disposed) return
    last = performance.now()
    raf = requestAnimationFrame(frame)
  }

  const resize = () => {
    size.width = root.offsetWidth
    size.height = root.offsetHeight
    const scale = Math.min(window.devicePixelRatio || 1, 2)
    canvas.width = Math.max(1, Math.round(size.width * scale))
    canvas.height = Math.max(1, Math.round(size.height * scale))
    if (read) material = readMaterial(root, read)
    measureText()
    draw()
  }

  // Указатель меряется по статичному корню: прямоугольник не меняется от наклона.
  const aimAt = (event: PointerEvent) => {
    if (event.pointerType !== "mouse") return
    const rect = root.getBoundingClientRect()
    if (!rect.width || !rect.height) return
    const nx = clamp(((event.clientX - rect.left) / rect.width) * 2 - 1, -1, 1)
    const ny = clamp(((event.clientY - rect.top) / rect.height) * 2 - 1, -1, 1)
    x.target = nx
    y.target = ny
    px.target = nx
    py.target = ny
    light.target = 1
    wake()
  }
  const release = (event: PointerEvent) => {
    if (event.pointerType !== "mouse") return
    x.target = 0
    y.target = 0
    px.target = REST_X
    py.target = REST_Y
    light.target = rest()
    wake()
  }
  if (tracking) {
    root.addEventListener("pointerenter", aimAt)
    root.addEventListener("pointermove", aimAt)
    root.addEventListener("pointerleave", release)
  }

  const resizeObserver = new ResizeObserver(resize)
  resizeObserver.observe(root)
  for (const child of root.children) if (child !== canvas) resizeObserver.observe(child)
  // Текст сменился (сумма, язык) или догрузился шрифт — перемерить строки.
  const contentObserver = new MutationObserver(() => {
    measureText()
    draw()
  })
  contentObserver.observe(root, { subtree: true, childList: true, characterData: true })
  void document.fonts?.ready.then(() => {
    if (disposed) return
    measureText()
    draw()
  })

  // Смена темы (класс или стиль на <html>) — перечитать токены и перерисовать.
  const themeObserver = new MutationObserver(() => {
    if (!read) return
    material = readMaterial(root, read)
    light.target = light.target === 1 ? 1 : rest()
    draw()
  })
  themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["class", "style", "data-theme"] })

  const fallback = () => {
    renderer?.dispose()
    renderer = null
    delete root.dataset.gl
  }
  const onLost = (event: Event) => {
    event.preventDefault()
    fallback()
  }
  canvas.addEventListener("webglcontextlost", onLost)

  renderer = createMetalRenderer(canvas)
  if (renderer) {
    read = makeColorReader()
    resize()
    root.dataset.gl = "on"
  }

  return () => {
    disposed = true
    cancelAnimationFrame(raf)
    resizeObserver.disconnect()
    contentObserver.disconnect()
    themeObserver.disconnect()
    canvas.removeEventListener("webglcontextlost", onLost)
    if (tracking) {
      root.removeEventListener("pointerenter", aimAt)
      root.removeEventListener("pointermove", aimAt)
      root.removeEventListener("pointerleave", release)
    }
    fallback()
  }
}
