import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { textTexture } from './textures.js'

const ORANGE = new THREE.Color(0xff3001)
const clamp01 = (v) => Math.min(1, Math.max(0, v))
const smooth = (a, b, v) => {
  const x = clamp01((v - a) / (b - a))
  return x * x * (3 - 2 * x)
}
const easeOutBack = (x) => 1 + 2.4 * Math.pow(x - 1, 3) + 1.4 * Math.pow(x - 1, 2)

/**
 * The Praxis mark as a monument: theory (the outline frame) and practice (the
 * solid block) slide together, and the orange core ignites where they meet.
 */
export async function createHero(scene) {
  const group = new THREE.Group()
  scene.add(group)

  // Giant type behind the mark, inside the scene so the mark truly occludes it.
  await document.fonts.load('900 200px Inter')
  const word = textTexture('PROOF', { font: '900 420px Inter', color: '#efece6', accent: '#FF3001', dot: true, tracking: -0.06 })
  const wordMat = new THREE.MeshBasicMaterial({ map: word.texture, transparent: true, toneMapped: false, depthWrite: false })
  const wordMesh = new THREE.Mesh(new THREE.PlaneGeometry(15, 15 / word.aspect), wordMat)
  wordMesh.position.set(0, -0.15, -3.2)
  scene.add(wordMesh)

  const gltf = await new GLTFLoader().loadAsync('/models/mark.glb')
  const mark = gltf.scene
  const parts = {}
  mark.traverse((o) => {
    if (o.isMesh) parts[o.name] = o
  })
  parts.frame.material = new THREE.MeshPhysicalMaterial({ color: 0xb4b1ab, roughness: 0.5, clearcoat: 0.3, clearcoatRoughness: 0.3, envMapIntensity: 0.45 })
  parts.solid.material = new THREE.MeshPhysicalMaterial({ color: 0x060606, roughness: 0.16, metalness: 0.35, clearcoat: 1, clearcoatRoughness: 0.04 })
  const coreMat = new THREE.MeshStandardMaterial({ color: ORANGE, emissive: ORANGE, emissiveIntensity: 0, roughness: 0.35 })
  parts.core.material = coreMat

  const pivot = new THREE.Group()
  pivot.add(mark)
  group.add(pivot)

  // An orange light that follows the cursor across the front of the mark.
  const cursorLight = new THREE.PointLight(0xff3001, 0, 9, 1.6)
  cursorLight.position.set(0, 0, 3)
  group.add(cursorLight)
  const fill = new THREE.PointLight(0xffffff, 2.5, 12, 2)
  fill.position.set(-3, 2.5, 4)
  group.add(fill)

  const home = { frame: parts.frame.position.clone(), solid: parts.solid.position.clone() }
  const api = { glow: 0 }

  api.update = ({ t, state, pointer, reduced }) => {
    // Intro: the two halves converge, then the core ignites.
    const intro = reduced ? 1 : clamp01((t - 0.35) / 2.4)
    const meet = smooth(0, 0.72, intro)
    parts.frame.position.set(home.frame.x - 3.4 * (1 - meet), home.frame.y + 0.6 * (1 - meet), home.frame.z + 1.6 * (1 - meet))
    parts.frame.rotation.z = -0.35 * (1 - meet)
    parts.solid.position.set(home.solid.x + 3.4 * (1 - meet), home.solid.y - 0.5 * (1 - meet), home.solid.z - 1.4 * (1 - meet))
    parts.solid.rotation.z = 0.25 * (1 - meet)
    const ignite = clamp01((intro - 0.68) / 0.32)
    parts.core.scale.setScalar(Math.max(0.001, easeOutBack(ignite)))
    const pulse = 0.25 * Math.sin(t * 1.6) + 0.25

    // Scroll: the monument turns away and recedes; the chapter after takes over.
    const p = state.hero
    const back = smooth(0.05, 0.6, state.cta)
    const out = smooth(0.0, 0.35, state.noise) * (1 - back)
    const mix = (a, b) => a + (b - a) * back
    pivot.rotation.y = mix(-0.5 - p * 1.25, -0.45 + Math.sin(t * 0.35) * 0.25) + pointer.sx * 0.38
    pivot.rotation.x = mix(0.12 + p * 0.25, 0.18) - pointer.sy * 0.22
    pivot.position.set(0, mix(p * 0.8 + out * 1.5, 1.6), mix(-p * 2.2 - out * 6, -2.5))
    const s = mix(1 - 0.25 * p, 0.8)
    pivot.scale.setScalar(s)
    coreMat.emissiveIntensity = ignite * (2.2 + pulse) * (1 - out)

    cursorLight.intensity = ignite * 7 * (1 - out)
    cursorLight.position.set(pointer.sx * 4.5, pointer.sy * 2.8, 2.6)

    wordMesh.position.y = -0.15 - p * 2.2
    wordMat.opacity = clamp01(intro * 1.6) * (1 - smooth(0.35, 0.9, p))

    group.visible = out < 0.999
    wordMesh.visible = wordMat.opacity > 0.001
    api.glow = ignite * (1 - out)
  }
  return api
}
