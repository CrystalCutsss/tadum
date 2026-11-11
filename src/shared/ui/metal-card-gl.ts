// WebGL2-рендерер поверхности MetalCard. Порт из React Bits «Reflective Card»
// (https://reactbits.dev, https://github.com/DavidHDev/react-bits, автор David Haz; лицензия MIT + Commons Clause —
// по репозиторию проекта, проверено по LICENSE.md на дату порта не удалось: сеть песочницы закрыта, см. отчёт).
// Взято: шейдер PLATE — скруглённая плита с фаской (chamfer), отражение через матрицу наклона, полосы с мягким
// краем (band/strip через erf), шлифовка (brushed grain). Убрано: видео, камера, проходы CAPTURE и BLUR.
// Изменено под Tadum (ревью Кирилла 2026-11-11: «блик — хаотичное пятно»): один ключевой свет сверху слева,
// неподвижный в пространстве комнаты. Он даёт (а) одну чистую диагональную полосу отражения софтбокса под −35°
// и (б) широкий мягкий ореол вокруг этой полосы (тот же источник). Обе части считаются по отражённому
// лучу, поэтому при наклоне карточки полоса скользит по плите — как отражение неподвижной лампы, а не пятно за
// курсором. Убраны блик за указателем, рябь (warp), вторичные полосы и «комната». Основа — синий металл из
// токенов (--metal-deep → --metal-mid → --metal-steel, градиент 330° как у CSS-слоёв); блики — экранное
// смешение к --metal-gl-highlight, их непрозрачность мягко ограничена потолком uCap (белый текст ≥ 4.5:1 в
// любой точке, без локальных затемнений); фаска согласована с тем же светом — светлая сверху слева, тёмная
// снизу справа. Числа в шейдере — геометрия и математика освещения; цвета и силы приходят из токенов.
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
in vec2 vUv;
out vec4 fragColor;

uniform vec2 uSize;
uniform float uRadius;
uniform float uScale;
uniform mat3 uRotate;
uniform float uView;
uniform float uRough;
uniform float uShine;
uniform float uHalo;
uniform float uHotspot;
uniform float uBevel;
uniform float uRim;
uniform vec3 uDeep;
uniform vec3 uMid;
uniform vec3 uSteel;
uniform vec3 uLight;
uniform float uCap;

const vec3 LUMA = vec3(0.2126, 0.7152, 0.0722);
// Ключевой свет: направление «сверху слева» (y вниз) и полоса софтбокса под −35° (идёт снизу слева вверх
// вправо), её центр в покое — чуть выше и левее центра плиты, полуширина и мягкость края. Единица — половина
// короткой стороны плиты: у широкой и высокой карточки полоса одной толщины и одного вида. Ореол — та же
// полоса, только широкая и слабая (один источник света, не отдельное пятно).
const vec2 LIGHT_DIR = vec2(-0.7071068, -0.7071068);
const vec2 STREAK_DIR = vec2(0.819152, -0.573576);
const vec2 STREAK_AT = vec2(-0.18, -0.22);
const float STREAK_HALF = 0.07;
const float STREAK_SOFT = 0.09;
const float HALO_SOFT = 0.55;

float hash(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
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

  // Шлифовка: тонкая горизонтальная «щётка», слегка колеблет нормаль.
  float grain = valueNoise(vec2(p.x * 0.008, p.y * 0.55)) * 0.6 + valueNoise(vec2(p.x * 0.019 + 3.7, p.y * 0.23)) * 0.4;
  slope.y += (grain - 0.5) * uRough * uRough * 0.004;

  // Отражённый луч: плоская плита без наклона даёт q = p / uView; наклон сдвигает q (вдвое против угла).
  vec3 normal = uRotate * normalize(vec3(slope, 1.0));
  vec3 position = uRotate * vec3(p, 0.0);
  vec3 view = normalize(position - vec3(0.0, 0.0, uView));
  vec3 bounce = reflect(view, normal);
  vec2 q = bounce.xy / max(bounce.z, 0.2);
  // В долях половины короткой стороны: геометрия света одинакова у широкой и высокой карточки.
  float unit = min(halfSize.x, halfSize.y);
  vec2 n = q * uView / unit;
  // Центр полосы в покое — от угла: у широкой карточки сдвигается к левому краю вместе с углом.
  vec2 at = STREAK_AT * vec2(halfSize.x / unit, 1.0);
  float soft = STREAK_SOFT + length(fwidth(n)) * 0.5;

  // (а) Полоса отражения софтбокса.
  vec2 across = vec2(-STREAK_DIR.y, STREAK_DIR.x);
  float offset = dot(n - at, across);
  float streak = band(offset, STREAK_HALF, soft);
  // (б) Ореол той же полосы: широкий мягкий спад света по обе стороны от неё — один источник.
  float halo = exp(-offset * offset / (2.0 * HALO_SOFT * HALO_SOFT));
  // Едва заметное широкое ядро в середине полосы.
  vec2 along = n - at;
  float hotspot = exp(-dot(along, along) * 1.5) * streak;

  vec2 dir = vec2(-0.5, -0.8660254);
  float t = clamp(dot(p, dir) / (abs(uSize.x * dir.x) + abs(uSize.y * dir.y)) + 0.5, 0.0, 1.0);
  vec3 base = t < 0.5 ? mix(uDeep, uMid, t * 2.0) : mix(uMid, uSteel, (t - 0.5) * 2.0);
  vec3 metal = base * mix(0.88, 1.1, halo) * (1.0 + (grain - 0.5) * uRough * 0.12);
  metal *= min(1.0, uCap / max(dot(metal, LUMA), 0.00001));

  // Свет — экранное смешение к --metal-gl-highlight. Яркость screen растёт линейно с непрозрачностью s, поэтому
  // потолок uCap (белый текст ≥ AA в любой точке) ограничивает непрозрачность: s мягко подходит к sMax.
  float s = streak * uShine + halo * uHalo + hotspot * uHotspot;
  float gain = max(dot(LUMA, (1.0 - metal) * uLight), 0.0001);
  float sMax = max(uCap - dot(metal, LUMA), 0.0) / gain;
  float knee = sMax * 0.6;
  s = s <= knee ? s : knee + (sMax - knee) * (1.0 - exp(-(s - knee) / max(sMax - knee, 0.00001)));
  vec3 color = 1.0 - (1.0 - metal) * (1.0 - s * uLight);

  // Фаска — тот же свет: светлая сверху слева, тёмная снизу справа.
  float rim = chamfer * dot(outward, LIGHT_DIR);
  color += uLight * max(rim, 0.0) * uRim;
  color *= 1.0 - max(-rim, 0.0) * 0.75;

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
}

/** Материал из токенов: цвета — линейный sRGB, длины — CSS-пиксели. */
type MetalMaterial = {
  deep: number[]
  mid: number[]
  steel: number[]
  light: number[]
  cap: number
  radius: number
  view: number
  shine: number
  halo: number
  hotspot: number
  bevel: number
  rim: number
  rough: number
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
    gl.uniform1f(u.uShine!, m.shine)
    gl.uniform1f(u.uHalo!, m.halo)
    gl.uniform1f(u.uHotspot!, m.hotspot)
    gl.uniform1f(u.uBevel!, m.bevel)
    gl.uniform1f(u.uRim!, m.rim)
    gl.uniform3fv(u.uDeep!, m.deep)
    gl.uniform3fv(u.uMid!, m.mid)
    gl.uniform3fv(u.uSteel!, m.steel)
    gl.uniform3fv(u.uLight!, m.light)
    gl.uniform1f(u.uCap!, m.cap)
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
// Положение указателя для CSS-слоёв (запасной вариант) без наведения: 30 % / 20 % карточки (−1…1 от центра).
const REST_X = -0.4
const REST_Y = -0.6
const EPSILON = 0.0005

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
    view: toPx(token("--metal-perspective"), rootFont),
    shine: num("--metal-gl-shine"),
    halo: num("--metal-gl-halo"),
    hotspot: num("--metal-gl-hotspot"),
    bevel: toPx(token("--metal-gl-bevel"), rootFont),
    rim: num("--metal-gl-rim"),
    rough: num("--metal-gl-rough"),
  }
}

/** Наибольший выход края карточки за исходный прямоугольник (px) при наклоне rotateX(ax) rotateY(ay) с
 *  перспективой p (как у CSS: сначала rotateY, затем rotateX, проекция из центра). */
function overshoot(hx: number, hy: number, ax: number, ay: number, p: number): number {
  let worst = 0
  for (const sx of [-1, 1]) {
    for (const sy of [-1, 1]) {
      const x1 = sx * hx * Math.cos(ay)
      const z1 = -sx * hx * Math.sin(ay)
      const y2 = sy * hy * Math.cos(ax) - z1 * Math.sin(ax)
      const z2 = sy * hy * Math.sin(ax) + z1 * Math.cos(ax)
      const k = p / Math.max(1, p - z2)
      worst = Math.max(worst, Math.abs(x1 * k) - hx, Math.abs(y2 * k) - hy)
    }
  }
  return worst
}

/** Наибольшее t ∈ [0, 1], при котором fits(t) истинно (fits монотонна), бисекцией. */
function largest(fits: (t: number) => boolean): number {
  if (fits(1)) return 1
  let lo = 0
  let hi = 1
  for (let i = 0; i < 24; i++) {
    const mid = (lo + hi) / 2
    if (fits(mid)) lo = mid
    else hi = mid
  }
  return lo
}

/** Углы наклона по осям (рад): край выходит за прямоугольник не дальше budget px, каждый ≤ max. Сначала предел
 *  каждой оси отдельно (широкая карточка — меньше rotateY), затем общий множитель для угла (обе оси сразу). */
function tiltLimits(width: number, height: number, p: number, max: number, budget: number) {
  const hx = width / 2
  const hy = height / 2
  if (!hx || !hy || !p || !max) return { ax: 0, ay: 0 }
  const ax = max * largest((t) => overshoot(hx, hy, max * t, 0, p) <= budget)
  const ay = max * largest((t) => overshoot(hx, hy, 0, max * t, p) <= budget)
  const k = largest((t) => overshoot(hx, hy, ax * t, ay * t, p) <= budget)
  return { ax: ax * k, ay: ay * k }
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
  const size = { width: root.offsetWidth, height: root.offsetHeight }
  let renderer: MetalRenderer | null = null
  let material: MetalMaterial | null = null
  let read: ((value: string) => number[]) | null = null
  let raf = 0
  let last = 0
  let disposed = false

  // Пределы наклона по осям (рад) от текущего размера: край не выходит за ячейку дальше --metal-tilt-overshoot.
  const tilt = { ax: 0, ay: 0 }
  const updateTilt = () => {
    if (!tracking) return
    const style = getComputedStyle(root)
    const rootFont = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16
    const max = (parseFloat(style.getPropertyValue("--metal-tilt-max")) || 0) * (Math.PI / 180)
    const p = toPx(style.getPropertyValue("--metal-perspective").trim(), rootFont)
    const budget = toPx(style.getPropertyValue("--metal-tilt-overshoot").trim(), rootFont)
    Object.assign(tilt, tiltLimits(size.width, size.height, p, max, budget))
    // Те же углы — CSS-наклону слоёв и содержимого (rotateX ← --metal-tilt-x, rotateY ← --metal-tilt-y).
    root.style.setProperty("--metal-tilt-x", `${((tilt.ax * 180) / Math.PI).toFixed(3)}deg`)
    root.style.setProperty("--metal-tilt-y", `${((tilt.ay * 180) / Math.PI).toFixed(3)}deg`)
  }

  const write = () => {
    if (!tracking) return
    const style = root.style
    // Перелёт пружины за ±1 не пускаем в наклон — иначе край на миг выйдет за предел.
    style.setProperty("--metal-rx", clamp(x.p, -1, 1).toFixed(4))
    style.setProperty("--metal-ry", clamp(y.p, -1, 1).toFixed(4))
    style.setProperty("--metal-x", `${((px.p + 1) * 50).toFixed(2)}%`)
    style.setProperty("--metal-y", `${((py.p + 1) * 50).toFixed(2)}%`)
  }

  const draw = () => {
    if (!renderer || !material) return
    const frame: MetalFrame = {
      width: size.width,
      height: size.height,
      rotateX: clamp(y.p, -1, 1) * tilt.ax,
      rotateY: -clamp(x.p, -1, 1) * tilt.ay,
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
    const moving = ![x, y, px, py].every(settled)
    if (!moving) {
      for (const axis of [x, y, px, py]) {
        axis.p = axis.target
        axis.v = 0
      }
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
    updateTilt()
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
    wake()
  }
  const release = (event: PointerEvent) => {
    if (event.pointerType !== "mouse") return
    x.target = 0
    y.target = 0
    px.target = REST_X
    py.target = REST_Y
    wake()
  }
  if (tracking) {
    root.addEventListener("pointerenter", aimAt)
    root.addEventListener("pointermove", aimAt)
    root.addEventListener("pointerleave", release)
  }

  updateTilt()
  const resizeObserver = new ResizeObserver(resize)
  resizeObserver.observe(root)

  // Смена темы (класс или стиль на <html>) — перечитать токены и перерисовать.
  const themeObserver = new MutationObserver(() => {
    if (!read) return
    material = readMaterial(root, read)
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
