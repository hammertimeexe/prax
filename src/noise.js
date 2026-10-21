import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import { cvTexture } from './textures.js'

const N = 900
const clamp01 = (v) => Math.min(1, Math.max(0, v))
const smooth = (a, b, v) => {
  const x = clamp01((v - a) / (b - a))
  return x * x * (3 - 2 * x)
}

const vertex = /* glsl */ `
  attribute float aSeed;
  varying vec2 vUv;
  varying float vSeed;
  varying float vFace;
  void main() {
    vUv = uv;
    vSeed = aSeed;
    vec4 world = modelMatrix * instanceMatrix * vec4(position, 1.0);
    vec3 n = normalize(mat3(modelMatrix * instanceMatrix) * normal);
    vFace = abs(dot(n, normalize(cameraPosition - world.xyz)));
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`

const fragment = /* glsl */ `
  uniform sampler2D uMap;
  uniform float uBurn;
  uniform vec3 uOrange;
  varying vec2 vUv;
  varying float vSeed;
  varying float vFace;
  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float noise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
  }
  void main() {
    // Each page burns along its own noise field, starting from a corner.
    float n = noise(vUv * 5.0 + vSeed * 17.0) * 0.65 + noise(vUv * 13.0 - vSeed * 9.0) * 0.35;
    n = n * 0.8 + (1.0 - vUv.y) * 0.2;
    float t = uBurn * (0.9 + 0.35 * fract(vSeed * 7.3)) * 1.2 - 0.1;
    if (n < t) discard;
    vec3 paper = texture2D(uMap, vUv).rgb * (0.35 + 0.4 * vFace);
    float edge = 1.0 - smoothstep(t, t + 0.07, n);
    vec3 col = mix(paper, uOrange * 4.0, edge * step(0.001, uBurn));
    gl_FragColor = vec4(col, 1.0);
    #include <colorspace_fragment>
  }
`

/** A thousand interchangeable claims, swirling; then they burn and one block of real work is left. */
export async function createNoise(scene) {
  const group = new THREE.Group()
  scene.add(group)

  const geo = new THREE.PlaneGeometry(0.62, 0.86)
  const seeds = new Float32Array(N)
  const params = []
  for (let i = 0; i < N; i++) {
    seeds[i] = Math.random()
    params.push({
      r: 2.2 + Math.random() * 6.5,
      a: Math.random() * Math.PI * 2,
      z: -38 + Math.random() * 40,
      speed: (0.12 + Math.random() * 0.25) * (Math.random() < 0.5 ? -1 : 1),
      spin: new THREE.Vector3(Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1).multiplyScalar(0.8),
      tilt: Math.random() * Math.PI,
    })
  }
  geo.setAttribute('aSeed', new THREE.InstancedBufferAttribute(seeds, 1))
  const mat = new THREE.ShaderMaterial({
    vertexShader: vertex,
    fragmentShader: fragment,
    side: THREE.DoubleSide,
    uniforms: { uMap: { value: cvTexture() }, uBurn: { value: 0 }, uOrange: { value: new THREE.Color(0xff3001) } },
  })
  const papers = new THREE.InstancedMesh(geo, mat, N)
  papers.frustumCulled = false
  group.add(papers)

  // The work: a solid block of orange, the one thing left standing.
  const work = new THREE.Mesh(
    new RoundedBoxGeometry(1.5, 1.5, 1.5, 6, 0.12),
    new THREE.MeshStandardMaterial({ color: 0xff3001, emissive: 0xff3001, emissiveIntensity: 1.6, roughness: 0.3 }),
  )
  group.add(work)

  const dummy = new THREE.Object3D()
  const api = { glow: 0 }

  api.update = ({ t, state, pointer }) => {
    const p = state.noise
    const enter = smooth(0.0, 0.25, p) * (1 - smooth(0.0, 0.3, state.attempt))
    const burn = smooth(0.52, 0.86, p)
    mat.uniforms.uBurn.value = burn
    group.visible = state.hero > 0.55 && state.attempt < 0.32

    const tighten = smooth(0.2, 0.55, p)
    for (let i = 0; i < N; i++) {
      const q = params[i]
      const ang = q.a + t * q.speed + p * 3.2
      const r = q.r * (1 - 0.5 * tighten)
      const z = q.z + p * 22 - (1 - enter) * 30
      dummy.position.set(Math.cos(ang) * r, Math.sin(ang) * r * 0.62, z)
      dummy.rotation.set(q.tilt + t * q.spin.x, t * q.spin.y + ang, t * q.spin.z)
      dummy.scale.setScalar(burn >= 0.999 ? 0 : 1)
      dummy.updateMatrix()
      papers.setMatrixAt(i, dummy.matrix)
    }
    papers.instanceMatrix.needsUpdate = true

    const into = smooth(0.0, 0.2, state.attempt)
    const w = smooth(0.62, 0.9, p) * (1 - into)
    work.scale.setScalar(Math.max(0.001, w * 0.8))
    work.rotation.set(0.5 + t * 0.2 + pointer.sy * 0.4, 0.7 + t * 0.35 + pointer.sx * 0.6, 0)
    work.position.set(2.35 * into, 1.75 * (1 - into), 1.5 * (1 - into))
    work.visible = w > 0.002
    api.glow = w
    group.position.x = pointer.sx * -0.4
    group.position.y = pointer.sy * -0.25
  }
  return api
}
