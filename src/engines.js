import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'

const clamp01 = (v) => Math.min(1, Math.max(0, v))
const smooth = (a, b, v) => {
  const x = clamp01((v - a) / (b - a))
  return x * x * (3 - 2 * x)
}

function face({ title, sub, lines, ink, accent, mark = false }) {
  const c = document.createElement('canvas')
  c.width = c.height = 1024
  const ctx = c.getContext('2d')
  ctx.clearRect(0, 0, 1024, 1024)
  if (mark) {
    ctx.strokeStyle = ink
    ctx.lineWidth = 22
    ctx.strokeRect(84, 84, 150, 150)
    ctx.fillStyle = ink
    ctx.fillRect(170, 170, 170, 170)
    ctx.fillStyle = '#ff3001'
    ctx.fillRect(150, 150, 92, 92)
  } else {
    ctx.font = '500 44px "JetBrains Mono"'
    ctx.fillStyle = accent
    ctx.fillText(sub, 80, 140)
  }
  ctx.font = '900 190px Inter'
  ctx.letterSpacing = '-10px'
  ctx.fillStyle = ink
  ctx.fillText(title, 70, 560)
  ctx.letterSpacing = '0px'
  ctx.font = '600 50px "JetBrains Mono"'
  lines.forEach((l, i) => {
    ctx.fillStyle = i === 0 ? accent : ink
    ctx.globalAlpha = i === 0 ? 1 : 0.85
    ctx.fillText(l, 80, 700 + i * 74)
  })
  ctx.globalAlpha = 1
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 8
  return t
}

function block(size, material, map) {
  const g = new THREE.Group()
  const body = new THREE.Mesh(new RoundedBoxGeometry(size, size, 0.6, 6, 0.12), material)
  const front = new THREE.Mesh(new THREE.PlaneGeometry(size * 0.94, size * 0.94), new THREE.MeshBasicMaterial({ map, transparent: true, toneMapped: false, color: 0xe8e8e8 }))
  front.position.z = 0.305
  g.add(body, front)
  return g
}

/** One core, two engines: the assessment engines dock into Praxis core through the Engine Contract. */
export async function createEngines(scene) {
  await document.fonts.load('900 190px Inter')
  const group = new THREE.Group()
  scene.add(group)

  const core = block(
    2.6,
    new THREE.MeshPhysicalMaterial({ color: 0x0b0b0b, metalness: 0.5, roughness: 0.2, clearcoat: 1 }),
    face({ title: 'core', lines: ['campaigns · invites', 'release · audit', 'reports · webhooks'], ink: '#efece6', accent: '#ff3001', mark: true }),
  )
  const pba = block(
    2.1,
    new THREE.MeshStandardMaterial({ color: 0x9c9993, roughness: 0.55, envMapIntensity: 0.4 }),
    face({ title: 'PBA', sub: '01 · engine', lines: ['project-based', 'cloud IDE · 14 stacks', 'hidden tests'], ink: '#0a0a0a', accent: '#c42400' }),
  )
  const pe = block(
    2.1,
    new THREE.MeshStandardMaterial({ color: 0xff3001, emissive: 0xff3001, emissiveIntensity: 0.35, roughness: 0.35 }),
    face({ title: 'PE', sub: '02 · engine', lines: ['prompt engineering', 'real models', 'hidden cases · cost'], ink: '#0a0a0a', accent: '#ffffff' }),
  )
  group.add(core, pba, pe)

  // The bus: a line through all three, with packets of work running along it once docked.
  const bus = new THREE.Mesh(new THREE.BoxGeometry(9, 0.02, 0.02), new THREE.MeshBasicMaterial({ color: 0x3a3a3a }))
  bus.position.y = -1.75
  group.add(bus)
  const packets = []
  for (let i = 0; i < 10; i++) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.05, 0.05), new THREE.MeshBasicMaterial({ color: 0xff3001, toneMapped: false }))
    m.material.color.multiplyScalar(3)
    m.userData = { o: i / 10, dir: i % 2 ? 1 : -1 }
    group.add(m)
    packets.push(m)
  }

  const api = {}
  api.update = ({ t, state, pointer }) => {
    const p = state.engines
    const out = smooth(0, 0.07, state.trust)
    group.visible = state.grade > 0.85 && out < 0.999
    if (!group.visible) return

    const enter = smooth(0, 0.1, p)
    const dock = smooth(0.05, 0.32, p)
    const hiPba = smooth(0.38, 0.48, p) * (1 - smooth(0.62, 0.7, p))
    const hiPe = smooth(0.66, 0.76, p)
    const wide = innerWidth / innerHeight > 1.2
    group.scale.setScalar(wide ? 1 : 0.62)
    group.position.set(0, wide ? 0.75 : 1.4, -6 * (1 - enter) - 8 * out)
    group.rotation.y = pointer.sx * 0.18
    group.rotation.x = -0.08 - pointer.sy * 0.1

    core.position.set(0, 0, 0)
    core.rotation.set(0, 0.25 * (1 - dock) + Math.sin(t * 0.5) * 0.03, 0)
    pba.position.set(-2.55 - 7 * (1 - dock), 0.3 * (1 - dock), hiPba * 1.4)
    pba.rotation.set(0, 1.3 * (1 - dock) + hiPba * 0.35, -0.4 * (1 - dock))
    pe.position.set(2.55 + 7 * (1 - dock), -0.3 * (1 - dock), hiPe * 1.4)
    pe.rotation.set(0, -1.3 * (1 - dock) - hiPe * 0.35, 0.4 * (1 - dock))
    const dim = (k) => 1 - 0.25 * k
    pba.scale.setScalar(1 + 0.12 * hiPba)
    pe.scale.setScalar(1 + 0.12 * hiPe)
    core.scale.setScalar(dim(Math.max(hiPba, hiPe)))

    const live = smooth(0.28, 0.36, p)
    bus.scale.x = Math.max(0.001, live)
    packets.forEach((m) => {
      const u = (m.userData.o + t * 0.18 * m.userData.dir + 10) % 1
      m.position.set(-4.5 + u * 9, -1.75, 0)
      m.visible = live > 0.5
    })
  }
  return api
}
