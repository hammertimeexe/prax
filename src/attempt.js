import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'

const clamp01 = (v) => Math.min(1, Math.max(0, v))
const smooth = (a, b, v) => {
  const x = clamp01((v - a) / (b - a))
  return x * x * (3 - 2 * x)
}

const W = 1920
const H = 1160
const C = {
  bg: '#0b0b0b', panel: '#111', line: '#232323', ink: '#ece9e3', muted: '#7d7a75',
  orange: '#ff3001', green: '#2fd27a', kw: '#ff7a59', str: '#f2c48d', tag: '#8fb8ff', fn: '#f4f2ee', com: '#5b5955',
}

// The reference solution for the PBA "Todo list" task (praxis-pba packages/tasks, React + Vite).
const CODE = `import { useState } from 'react'

export default function App() {
  const [items, setItems] = useState([])
  const [text, setText] = useState('')

  function add(e) {
    e.preventDefault()
    if (!text.trim()) return
    setItems([...items, { id: Date.now(), text, done: false }])
    setText('')
  }

  const toggle = (id) =>
    setItems(items.map((i) => (i.id === id ? { ...i, done: !i.done } : i)))

  return (
    <main>
      <form onSubmit={add}>
        <input value={text} onChange={(e) => setText(e.target.value)} />
        <button>Add</button>
      </form>
      <ul>
        {items.map((i) => (
          <li key={i.id} className={i.done ? 'done' : ''} onClick={() => toggle(i.id)}>
            {i.text}
          </li>
        ))}
      </ul>
    </main>
  )
}`

const TESTS = [
  ['ui-01', 'renders the input and Add button'],
  ['st-01', 'adds an item on submit'],
  ['st-02', 'ignores empty input'],
  ['st-03', 'toggles an item done'],
]
const TODOS = ['Review the PR', 'Write the tests', 'Ship it']

function tokens(line) {
  // Tiny highlighter: strings, keywords, JSX tags, everything else plain.
  const out = []
  const re = /('[^']*')|(<\/?[a-z]+)|\b(import|from|export|default|function|const|return|if)\b|(useState|setItems|setText|map|preventDefault|trim|now)/g
  let last = 0
  let m
  while ((m = re.exec(line))) {
    if (m.index > last) out.push([line.slice(last, m.index), C.ink])
    out.push([m[0], m[1] ? C.str : m[2] ? C.tag : m[3] ? C.kw : C.fn])
    last = m.index + m[0].length
  }
  if (last < line.length) out.push([line.slice(last), C.ink])
  return out
}

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.roundRect(x, y, w, h, r)
}

function draw(ctx, s) {
  ctx.fillStyle = C.bg
  ctx.fillRect(0, 0, W, H)

  // Top bar: mark, task, server-owned timer, submit.
  ctx.fillStyle = '#070707'
  ctx.fillRect(0, 0, W, 76)
  ctx.fillStyle = C.line
  ctx.fillRect(0, 76, W, 2)
  ctx.strokeStyle = C.ink
  ctx.lineWidth = 4
  ctx.strokeRect(34, 22, 24, 24)
  ctx.fillStyle = C.ink
  ctx.fillRect(46, 34, 24, 24)
  ctx.fillStyle = C.orange
  ctx.fillRect(46, 34, 12, 12)
  ctx.font = '700 26px Inter'
  ctx.fillStyle = C.ink
  ctx.fillText('Todo list', 96, 49)
  ctx.font = '500 20px "JetBrains Mono"'
  ctx.fillStyle = C.muted
  ctx.fillText('React + Vite · intermediate', 222, 49)

  const left = Math.max(0, Math.round(5400 * (1 - s.clock)))
  const mm = String(Math.floor(left / 60)).padStart(2, '0')
  const ss = String(left % 60).padStart(2, '0')
  ctx.font = '600 30px "JetBrains Mono"'
  ctx.fillStyle = C.ink
  ctx.textAlign = 'right'
  ctx.fillText(`${mm}:${ss}`, W - 250, 50)
  ctx.textAlign = 'left'
  rr(ctx, W - 214, 18, 180, 42, 21)
  ctx.fillStyle = s.submitted ? C.green : C.orange
  ctx.fill()
  ctx.font = '700 20px Inter'
  ctx.fillStyle = '#fff'
  ctx.textAlign = 'center'
  ctx.fillText(s.submitted ? 'Submitted' : 'Submit', W - 124, 46)
  ctx.textAlign = 'left'

  // Task panel.
  ctx.fillStyle = C.panel
  ctx.fillRect(0, 78, 380, H - 78)
  ctx.fillStyle = C.line
  ctx.fillRect(380, 78, 2, H - 78)
  ctx.font = '600 16px "JetBrains Mono"'
  ctx.fillStyle = C.orange
  ctx.fillText('TASK', 34, 132)
  ctx.font = '700 30px Inter'
  ctx.fillStyle = C.ink
  ctx.fillText('Build a todo list', 34, 178)
  ctx.font = '400 19px Inter'
  ctx.fillStyle = '#b5b2ac'
  ;['Add items from a form.', 'Ignore empty input.', 'Click an item to mark', 'it done.'].forEach((l, i) => ctx.fillText(l, 34, 226 + i * 30))
  ctx.font = '600 16px "JetBrains Mono"'
  ctx.fillStyle = C.orange
  ctx.fillText('FILES', 34, 400)
  ctx.font = '400 19px "JetBrains Mono"'
  ;['src/', '  App.jsx', '  main.jsx', '  index.css', 'package.json'].forEach((f, i) => {
    if (i === 1) {
      ctx.fillStyle = '#1d1d1d'
      ctx.fillRect(20, 420 + i * 34, 340, 32)
    }
    ctx.fillStyle = i === 1 ? C.ink : C.muted
    ctx.fillText(f, 34, 442 + i * 34)
  })
  ctx.font = '500 16px "JetBrains Mono"'
  ctx.fillStyle = C.muted
  ctx.fillText(s.saved ? '● saved' : '○ saving…', 34, H - 40)

  // Editor.
  const ex = 382
  const ew = 1000
  ctx.fillStyle = '#0d0d0d'
  ctx.fillRect(ex, 78, ew, 760)
  ctx.fillStyle = '#151515'
  ctx.fillRect(ex, 78, ew, 48)
  ctx.fillStyle = C.bg
  ctx.fillRect(ex, 78, 160, 48)
  ctx.fillStyle = C.orange
  ctx.fillRect(ex, 124, 160, 2)
  ctx.font = '500 18px "JetBrains Mono"'
  ctx.fillStyle = C.ink
  ctx.fillText('App.jsx', ex + 30, 109)

  const typed = CODE.slice(0, s.chars)
  const lines = typed.split('\n')
  const lh = 22.5
  const first = Math.max(0, lines.length - 30)
  ctx.font = '400 17px "JetBrains Mono"'
  lines.slice(first).forEach((line, k) => {
    const y = 158 + k * lh
    ctx.fillStyle = '#3a3936'
    ctx.textAlign = 'right'
    ctx.fillText(String(first + k + 1), ex + 52, y)
    ctx.textAlign = 'left'
    let x = ex + 76
    for (const [txt, col] of tokens(line)) {
      ctx.fillStyle = col
      ctx.fillText(txt, x, y)
      x += ctx.measureText(txt).width
    }
    if (k === lines.length - 1 - first && s.caret) {
      ctx.fillStyle = C.orange
      ctx.fillRect(x + 2, y - 16, 3, 21)
    }
  })

  // Terminal.
  ctx.fillStyle = '#080808'
  ctx.fillRect(ex, 840, ew, H - 840)
  ctx.fillStyle = C.line
  ctx.fillRect(ex, 838, ew, 2)
  ctx.font = '600 15px "JetBrains Mono"'
  ctx.fillStyle = C.muted
  ctx.fillText('TERMINAL', ex + 30, 874)
  ctx.font = '400 18px "JetBrains Mono"'
  const term = [['$ npm run dev', C.ink], ['  VITE ready in 312 ms · preview live', C.muted]]
  if (s.selfCheck) term.push(['$ npm test', C.ink], ['  ✓ self-check  1/1 passed', C.green])
  if (s.hidden > 0) term.push(['» hidden tests · fresh sandbox', C.orange])
  term.slice(-6).forEach(([l, col], i) => {
    ctx.fillStyle = col
    ctx.fillText(l, ex + 30, 912 + i * 36)
  })

  // Preview: the candidate's app, live.
  const px = ex + ew + 2
  const pw = W - px
  ctx.fillStyle = C.line
  ctx.fillRect(px - 2, 78, 2, H - 78)
  ctx.fillStyle = '#151515'
  ctx.fillRect(px, 78, pw, 48)
  ctx.font = '500 16px "JetBrains Mono"'
  ctx.fillStyle = C.muted
  ctx.fillText('PREVIEW  localhost:5173', px + 26, 108)
  ctx.fillStyle = '#f6f4f0'
  ctx.fillRect(px + 22, 146, pw - 44, 460)
  ctx.font = '800 32px Inter'
  ctx.fillStyle = '#111'
  ctx.fillText('Todos', px + 52, 206)
  rr(ctx, px + 52, 232, pw - 230, 50, 8)
  ctx.strokeStyle = '#d6d3cd'
  ctx.lineWidth = 2
  ctx.stroke()
  rr(ctx, px + pw - 166, 232, 114, 50, 8)
  ctx.fillStyle = '#111'
  ctx.fill()
  ctx.font = '600 19px Inter'
  ctx.fillStyle = '#fff'
  ctx.fillText('Add', px + pw - 128, 264)
  TODOS.slice(0, s.todos).forEach((t, i) => {
    const y = 330 + i * 64
    const done = i < s.done
    rr(ctx, px + 52, y - 24, 26, 26, 6)
    ctx.fillStyle = done ? C.orange : '#fff'
    ctx.fill()
    ctx.strokeStyle = done ? C.orange : '#bdbab4'
    ctx.stroke()
    ctx.font = '500 22px Inter'
    ctx.fillStyle = done ? '#9b9893' : '#111'
    ctx.fillText(t, px + 96, y - 3)
    if (done) ctx.fillRect(px + 96, y - 11, ctx.measureText(t).width, 2)
  })

  // Hidden tests, graded in a fresh sandbox after submit.
  ctx.font = '600 15px "JetBrains Mono"'
  ctx.fillStyle = C.orange
  ctx.fillText('HIDDEN TESTS', px + 26, 662)
  TESTS.forEach(([id, name], i) => {
    const y = 706 + i * 52
    const st = i < s.hidden ? 'pass' : s.hidden > 0 && i === s.hidden ? 'run' : 'wait'
    ctx.beginPath()
    ctx.arc(px + 36, y - 6, 9, 0, Math.PI * 2)
    ctx.fillStyle = st === 'pass' ? C.green : st === 'run' ? C.orange : '#2a2a2a'
    ctx.fill()
    ctx.font = '500 17px "JetBrains Mono"'
    ctx.fillStyle = st === 'wait' ? C.muted : C.ink
    ctx.fillText(id, px + 58, y)
    ctx.font = '400 17px Inter'
    ctx.fillStyle = st === 'wait' ? '#55534f' : '#b5b2ac'
    ctx.fillText(name, px + 136, y)
  })
  if (s.score) {
    rr(ctx, px + 22, 940, pw - 44, 190, 14)
    ctx.fillStyle = C.orange
    ctx.fill()
    ctx.fillStyle = '#fff'
    ctx.font = '600 16px "JetBrains Mono"'
    ctx.fillText('SCORE', px + 52, 984)
    ctx.font = '900 84px Inter'
    ctx.fillText('100', px + 50, 1080)
    ctx.font = '700 26px Inter'
    ctx.textAlign = 'right'
    ctx.fillText('Shortlist →', px + pw - 52, 1074)
    ctx.textAlign = 'left'
  }
}

/** The PBA attempt as a physical object: a real IDE, a real timer, hidden tests turning green. */
export async function createAttempt(scene) {
  await Promise.all([document.fonts.load('400 17px "JetBrains Mono"'), document.fonts.load('600 17px "JetBrains Mono"')])
  const group = new THREE.Group()
  scene.add(group)

  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')
  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 8

  const sw = 6.4
  const sh = (sw * H) / W
  const slab = new THREE.Mesh(
    new RoundedBoxGeometry(sw + 0.28, sh + 0.28, 0.22, 6, 0.1),
    new THREE.MeshPhysicalMaterial({ color: 0x0a0a0a, roughness: 0.22, metalness: 0.6, clearcoat: 1, clearcoatRoughness: 0.08 }),
  )
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(sw, sh), new THREE.MeshBasicMaterial({ map: tex, color: 0xe6e6e6, toneMapped: false }))
  screen.position.z = 0.112
  const tilt = new THREE.Group()
  tilt.add(slab, screen)
  group.add(tilt)

  // A thin orange underglow, like the slab is sitting on light.
  const glow = new THREE.Mesh(
    new THREE.PlaneGeometry(sw * 1.1, 0.06),
    new THREE.MeshBasicMaterial({ color: 0xff3001, toneMapped: false, transparent: true }),
  )
  glow.position.set(0, -sh / 2 - 0.28, 0)
  tilt.add(glow)

  let key = ''
  const api = {}
  api.update = ({ t, state, pointer }) => {
    const p = state.attempt
    const enter = smooth(0.0, 0.14, p)
    const gone = smooth(0, 0.07, state.grade)
    group.visible = enter > 0.002 && gone < 0.999
    if (!group.visible) return

    const s = {
      chars: Math.round(CODE.length * smooth(0.08, 0.5, p)),
      caret: p < 0.55 && Math.floor(t * 2) % 2 === 0,
      clock: 0.2 + 0.6 * clamp01(p / 0.62),
      saved: Math.floor(p * 60) % 3 !== 0,
      todos: Math.round(3 * smooth(0.3, 0.5, p)),
      done: p > 0.5 ? 1 : 0,
      selfCheck: p > 0.52,
      submitted: p > 0.6,
      hidden: p > 0.62 ? Math.min(4, Math.floor((p - 0.62) / 0.05) + 1) : 0,
      score: p > 0.84,
    }
    s.clock = Math.round(s.clock * 5400) / 5400
    const k = JSON.stringify(s)
    if (k !== key) {
      key = k
      draw(ctx, s)
      tex.needsUpdate = true
    }

    const wide = innerWidth / innerHeight > 1.2
    const scale = wide ? 0.8 : 0.72
    group.scale.setScalar(scale * (0.85 + 0.15 * enter))
    const face = smooth(0.05, 0.4, p)
    group.position.set(wide ? 2.35 : 0, (wide ? 0.15 : 1.3) - (1 - enter) * 3 + Math.sin(t * 0.8) * 0.05, -2 * (1 - enter))
    tilt.rotation.set(
      -0.55 * (1 - face) + 0.06 - pointer.sy * 0.12,
      (wide ? -0.5 : 0) * (1 - face) - 0.18 + pointer.sx * 0.2,
      0.06 * (1 - face),
    )
    glow.material.opacity = enter * (s.score ? 1 : 0.55)
    const out = smooth(0.94, 1, p)
    group.position.y += out * 2
    group.position.z -= gone * 8
  }
  return api
}
