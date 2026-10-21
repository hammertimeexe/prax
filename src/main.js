import * as THREE from 'three'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { createHero } from './hero.js'
import { createNoise } from './noise.js'
import { createAttempt } from './attempt.js'
import { createGrade, SKILLS, SCORE, skillPct } from './grade.js'
import { createEngines } from './engines.js'
import { createTrust } from './trust.js'

gsap.registerPlugin(ScrollTrigger)
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches

// ── Renderer, scene, camera ─────────────────────────────────────────────────
const canvas = document.getElementById('stage')
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' })
renderer.setPixelRatio(Math.min(devicePixelRatio, 2))
renderer.setSize(innerWidth, innerHeight)
renderer.toneMapping = THREE.ACESFilmicToneMapping
renderer.toneMappingExposure = 1.05
renderer.outputColorSpace = THREE.SRGBColorSpace

const scene = new THREE.Scene()
scene.background = new THREE.Color(0x040404)
scene.fog = new THREE.Fog(0x040404, 14, 38)
const camera = new THREE.PerspectiveCamera(35, innerWidth / innerHeight, 0.1, 120)
camera.position.set(0, 0, 12)

const pmrem = new THREE.PMREMGenerator(renderer)
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
scene.add(new THREE.AmbientLight(0xffffff, 0.12))
const key = new THREE.DirectionalLight(0xffffff, 1.7)
key.position.set(-5, 6, 7)
scene.add(key)
const rim = new THREE.DirectionalLight(0xff3001, 2.4)
rim.position.set(6, -2, -5)
scene.add(rim)

const composer = new EffectComposer(renderer)
composer.addPass(new RenderPass(scene, camera))
const bloom = new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), 0.85, 0.55, 1.02)
composer.addPass(bloom)
composer.addPass(new OutputPass())

// ── Input ───────────────────────────────────────────────────────────────────
const pointer = { x: 0, y: 0, sx: 0, sy: 0 }
addEventListener('pointermove', (e) => {
  pointer.x = (e.clientX / innerWidth) * 2 - 1
  pointer.y = -((e.clientY / innerHeight) * 2 - 1)
})

// ── Scroll ──────────────────────────────────────────────────────────────────
const lenis = new Lenis({ lerp: reduced ? 1 : 0.085, smoothWheel: !reduced })
lenis.on('scroll', ScrollTrigger.update)
document.querySelectorAll('a[href^="#"]').forEach((a) =>
  a.addEventListener('click', (e) => {
    const target = document.querySelector(a.getAttribute('href'))
    if (!target) return
    e.preventDefault()
    lenis.scrollTo(target, { duration: reduced ? 0 : 1.6 })
  }),
)

const state = { hero: 0, noise: 0, attempt: 0, grade: 0, engines: 0, trust: 0, teams: 0, cta: 0 }
for (const id of Object.keys(state)) {
  ScrollTrigger.create({
    trigger: `#${id}`,
    start: 'top top',
    end: 'bottom bottom',
    onUpdate: (s) => (state[id] = s.progress),
  })
}

/** Lines of copy that take turns inside a pinned chapter. The last one stays. */
function beats(section, p) {
  const list = section.querySelectorAll('.beat')
  const n = list.length
  list.forEach((b, i) => {
    const local = (p - i / n) * n
    let o = 0
    if (local > 0) o = i === n - 1 ? Math.min(1, local * 3.5) : Math.max(0, Math.min(1, local * 3.5, (1 - local) * 3.5))
    b.style.opacity = o.toFixed(3)
    b.style.visibility = o > 0.01 ? 'visible' : 'hidden'
    b.style.setProperty('--y', `${((1 - o) * (local < 0.5 ? 40 : -40)).toFixed(1)}px`)
  })
}
const beatSections = ['noise', 'attempt', 'grade', 'engines', 'trust'].map((id) => [id, document.getElementById(id)])
const stacksEl = document.querySelector('#attempt .stacks')

// The sample report card, filled from the same evidence the constellation shows.
const band = (pct) => (pct >= 76 ? 'strong' : pct >= 51 ? 'solid' : pct >= 26 ? 'partial' : 'weak')
document.querySelector('[data-score]').textContent = SCORE
document.querySelector('[data-skills]').innerHTML = SKILLS.map((s) => {
  const pct = skillPct(s)
  return `<li class="${band(pct)}"><span>${s.key}</span><span class="bar"><i style="width:${pct}%"></i></span><span class="band">${band(pct)}</span></li>`
}).join('')

// For teams: cards rise in as they enter.
gsap.utils.toArray('.reveal').forEach((el, i) => {
  gsap.to(el, { opacity: 1, y: 0, duration: reduced ? 0 : 1, ease: 'power3.out', delay: (i % 3) * 0.08, scrollTrigger: { trigger: el, start: 'top 88%' } })
})

// ── Chapters ────────────────────────────────────────────────────────────────
const loaderBar = document.querySelector('#loader b')
loaderBar.style.width = '30%'
const faces = ['400 20px Inter', '500 20px Inter', '600 20px Inter', '700 20px Inter', '800 20px Inter', '900 20px Inter',
  '400 20px "JetBrains Mono"', '500 20px "JetBrains Mono"', '600 20px "JetBrains Mono"', '700 20px "JetBrains Mono"']
await Promise.all(faces.map((f) => document.fonts.load(f))).catch(() => {})
await document.fonts.ready
const chapters = await Promise.all([createHero(scene, camera), createNoise(scene), createAttempt(scene), createGrade(scene), createEngines(scene), createTrust(scene)])
loaderBar.style.width = '100%'
setTimeout(() => document.getElementById('loader').classList.add('done'), 350)
const [hero, noise, attempt] = chapters
const start = performance.now()

function layout() {
  const aspect = innerWidth / innerHeight
  camera.aspect = aspect
  camera.position.z = aspect < 0.75 ? 19 : aspect < 1.2 ? 15 : 12
  camera.updateProjectionMatrix()
  renderer.setSize(innerWidth, innerHeight)
  composer.setSize(innerWidth, innerHeight)
  bloom.resolution.set(innerWidth, innerHeight)
}
addEventListener('resize', layout)
layout()

gsap.ticker.lagSmoothing(0)
let last = performance.now()
gsap.ticker.add((time) => {
  lenis.raf(time * 1000)
  const now = performance.now()
  const dt = Math.min(0.05, (now - last) / 1000)
  last = now
  const t = (now - start) / 1000
  const ease = 1 - Math.pow(0.0015, dt)
  pointer.sx += (pointer.x - pointer.sx) * ease
  pointer.sy += (pointer.y - pointer.sy) * ease

  const ctx = { t, dt, state, pointer, reduced }
  for (const c of chapters) c.update(ctx)

  for (const [id, el] of beatSections) beats(el, state[id])
  stacksEl.style.opacity = Math.max(0, Math.min(1, (state.attempt - 0.04) * 8, (0.97 - state.attempt) * 10)).toFixed(3)

  // Bloom breathes with the story: strongest when the orange core is the subject.
  bloom.strength = 0.7 + 0.5 * Math.max(hero.glow ?? 0, noise.glow ?? 0)
  composer.render()
})
