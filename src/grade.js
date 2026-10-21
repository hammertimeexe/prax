import * as THREE from 'three'

const clamp01 = (v) => Math.min(1, Math.max(0, v))
const smooth = (a, b, v) => {
  const x = clamp01((v - a) / (b - a))
  return x * x * (3 - 2 * x)
}

// Library skills (praxis contracts skills.ts) with the evidence a sample attempt produced.
// Test levels set weight: basic ×1, intermediate ×2, advanced ×3.
export const SKILLS = [
  { key: 'fe.rendering', label: 'Rendering', tests: [1, 1, 2, 3], fail: [] },
  { key: 'fe.components', label: 'Component design', tests: [1, 2, 2], fail: [] },
  { key: 'fe.state', label: 'State', tests: [1, 2, 3, 3], fail: [3] },
  { key: 'fe.forms', label: 'Forms', tests: [1, 1, 2], fail: [] },
  { key: 'fe.effects', label: 'Effects', tests: [1, 2], fail: [1] },
  { key: 'fe.async', label: 'Async data', tests: [1, 2, 3], fail: [2] },
  { key: 'fe.a11y', label: 'Accessibility', tests: [1, 2], fail: [] },
  { key: 'fe.resilience', label: 'Resilience', tests: [1, 2, 3], fail: [] },
]
const pct = (s) => s.tests.reduce((n, w, k) => n + (s.fail.includes(k) ? 0 : w), 0) / s.tests.reduce((n, w) => n + w, 0)
/** Weighted over every test, like engine-kit scoring: 81 for this sample, so Shortlist (≥ 75). */
export const SCORE = Math.round(
  (100 * SKILLS.reduce((n, s) => n + pct(s) * s.tests.reduce((a, w) => a + w, 0), 0)) / SKILLS.reduce((n, s) => n + s.tests.reduce((a, w) => a + w, 0), 0),
)
export const skillPct = (s) => Math.round(pct(s) * 100)

function labelTexture(key, label) {
  const c = document.createElement('canvas')
  c.width = 512
  c.height = 128
  const ctx = c.getContext('2d')
  ctx.font = '500 34px "JetBrains Mono"'
  ctx.fillStyle = '#ff3001'
  ctx.fillText(key, 8, 46)
  ctx.font = '700 44px Inter'
  ctx.fillStyle = '#efece6'
  ctx.fillText(label, 8, 104)
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  return t
}

/** Every hidden test is a point of evidence; they fly to the skills they prove and the skills light up. */
export async function createGrade(scene) {
  const group = new THREE.Group()
  scene.add(group)
  const orbit = new THREE.Group()
  group.add(orbit)

  const nodeGeo = new THREE.IcosahedronGeometry(1, 4)
  const testGeo = new THREE.OctahedronGeometry(0.07, 0)
  const passMat = new THREE.MeshStandardMaterial({ color: 0xff3001, emissive: 0xff3001, emissiveIntensity: 2.4 })
  const failMat = new THREE.MeshStandardMaterial({ color: 0x555555, emissive: 0x222222, roughness: 0.6 })

  const skills = []
  const tests = []
  const linePos = []
  SKILLS.forEach((s, i) => {
    const a = (i / SKILLS.length) * Math.PI * 2
    const pos = new THREE.Vector3(Math.cos(a) * 2.8, Math.sin(a) * 1.9, Math.sin(a * 2) * 0.9)
    const earned = s.tests.reduce((n, w, k) => n + (s.fail.includes(k) ? 0 : w), 0)
    const total = s.tests.reduce((n, w) => n + w, 0)
    const ratio = earned / total
    const mat = new THREE.MeshPhysicalMaterial({
      color: 0x101010, metalness: 0.2, roughness: 0.15, clearcoat: 1,
      emissive: 0xff3001, emissiveIntensity: 0,
    })
    const node = new THREE.Mesh(nodeGeo, mat)
    node.position.copy(pos)
    orbit.add(node)
    const label = new THREE.Sprite(new THREE.SpriteMaterial({ map: labelTexture(s.key, s.label), transparent: true, depthWrite: false, toneMapped: false }))
    label.scale.set(2.2, 0.55, 1)
    orbit.add(label)
    skills.push({ node, mat, label, pos, ratio, size: 0.16 + 0.2 * ratio })

    s.tests.forEach((w, k) => {
      const pass = !s.fail.includes(k)
      const m = new THREE.Mesh(testGeo, pass ? passMat : failMat)
      m.scale.setScalar(0.7 + 0.35 * w)
      orbit.add(m)
      // Each test starts at the submitted attempt (to the right) and settles in a shell around its skill.
      const dir = new THREE.Vector3().randomDirection()
      tests.push({
        m, pass, skill: i,
        from: new THREE.Vector3(2.4 + (Math.random() - 0.5) * 1.6, (Math.random() - 0.5) * 1.2, -1),
        to: pos.clone().add(dir.multiplyScalar(0.45 + Math.random() * 0.25)),
        delay: Math.random() * 0.35,
        spin: Math.random() * 6,
      })
      linePos.push(0, 0, 0, 0, 0, 0)
    })
  })

  // Evidence lines, test → skill.
  const lineGeo = new THREE.BufferGeometry()
  lineGeo.setAttribute('position', new THREE.Float32BufferAttribute(linePos, 3))
  const lineMat = new THREE.LineBasicMaterial({ color: 0xff3001, transparent: true, opacity: 0, toneMapped: false })
  orbit.add(new THREE.LineSegments(lineGeo, lineMat))

  // A thin ring that fills to the overall score.
  const ringMat = new THREE.MeshBasicMaterial({ color: 0xff3001, toneMapped: false, transparent: true, side: THREE.DoubleSide })
  const ring = new THREE.Mesh(new THREE.RingGeometry(3.95, 4.0, 160, 1, Math.PI / 2, -Math.PI * 2), ringMat)
  const ringBase = new THREE.Mesh(new THREE.RingGeometry(3.95, 4.0, 160), new THREE.MeshBasicMaterial({ color: 0x2a2a2a, transparent: true }))
  group.add(ringBase, ring)

  const tmp = new THREE.Vector3()
  const api = {}
  api.update = ({ t, state, pointer }) => {
    const p = state.grade
    const enter = smooth(0, 0.08, p)
    const out = smooth(0.0, 0.07, state.engines)
    group.visible = state.attempt > 0.9 && out < 0.999
    if (!group.visible) return

    const fly = smooth(0.04, 0.4, p)
    const light = smooth(0.3, 0.6, p)
    const wide = innerWidth / innerHeight > 1.2
    group.position.set(wide ? 2.3 : 0, wide ? 0 : 1.2, -1 - out * 8)
    group.scale.setScalar((wide ? 0.82 : 0.6) * (0.7 + 0.3 * enter))
    orbit.rotation.y = t * 0.08 + pointer.sx * 0.35 + (1 - fly) * 0.8
    orbit.rotation.x = -pointer.sy * 0.2 + 0.1

    const lp = lineGeo.attributes.position.array
    tests.forEach((q, i) => {
      const k = clamp01((fly - q.delay) / (1 - q.delay))
      const e = k * k * (3 - 2 * k)
      tmp.copy(q.from).lerp(q.to, e)
      tmp.y += Math.sin(e * Math.PI) * 1.2
      q.m.position.copy(tmp)
      q.m.rotation.set(t + q.spin, t * 1.3 + q.spin, 0)
      q.m.visible = p > 0.03
      const s = skills[q.skill].pos
      lp.set([tmp.x, tmp.y, tmp.z, s.x, s.y, s.z], i * 6)
    })
    lineGeo.attributes.position.needsUpdate = true
    lineMat.opacity = 0.35 * light

    skills.forEach((s, i) => {
      const own = smooth(0.3 + i * 0.03, 0.5 + i * 0.03, p)
      s.node.scale.setScalar(Math.max(0.001, s.size * (0.35 + 0.65 * own)))
      s.mat.emissiveIntensity = own * (0.4 + 2.6 * s.ratio * s.ratio)
      s.label.position.copy(s.pos).add(tmp.set(0.55, -0.55, 0))
      s.label.material.opacity = own * enter
    })

    const score = smooth(0.55, 0.8, p)
    ring.geometry.setDrawRange(0, 6 * Math.round(160 * score * (SCORE / 100)))
    ringMat.opacity = enter
    ringBase.material.opacity = enter * 0.8
  }
  return api
}
