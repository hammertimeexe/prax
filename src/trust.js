import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'

const clamp01 = (v) => Math.min(1, Math.max(0, v))
const smooth = (a, b, v) => {
  const x = clamp01((v - a) / (b - a))
  return x * x * (3 - 2 * x)
}

const W = 1400
const H = 900
const INK = '#efece6'
const MUTED = '#8b8984'
const OR = '#ff3001'
const GREEN = '#2fd27a'

function canvas(draw) {
  const c = document.createElement('canvas')
  c.width = W
  c.height = H
  const ctx = c.getContext('2d')
  ctx.fillStyle = 'rgba(8,8,8,0.55)'
  ctx.beginPath()
  ctx.roundRect(0, 0, W, H, 36)
  ctx.fill()
  ctx.strokeStyle = 'rgba(255,255,255,0.14)'
  ctx.lineWidth = 3
  ctx.stroke()
  draw(ctx)
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 8
  return t
}

const head = (ctx, n, title) => {
  ctx.font = '500 30px "JetBrains Mono"'
  ctx.fillStyle = OR
  ctx.fillText(n, 70, 100)
  ctx.font = '800 64px Inter'
  ctx.fillStyle = INK
  ctx.fillText(title, 70, 180)
}
const pill = (ctx, x, y, text, bg, fg) => {
  ctx.font = '600 26px "JetBrains Mono"'
  const w = ctx.measureText(text).width + 40
  ctx.fillStyle = bg
  ctx.beginPath()
  ctx.roundRect(x, y - 32, w, 46, 23)
  ctx.fill()
  ctx.fillStyle = fg
  ctx.fillText(text, x + 20, y)
  return w
}

// Signal names and audit actions are the real ones from praxis-pba and praxis-core.
const integrity = () =>
  canvas((ctx) => {
    head(ctx, 'INTEGRITY', 'Signals, not verdicts.')
    ctx.fillStyle = '#2a2a2a'
    ctx.fillRect(70, 330, W - 140, 6)
    ctx.fillStyle = OR
    ctx.fillRect(70, 330, (W - 140) * 0.78, 6)
    ctx.font = '500 26px "JetBrains Mono"'
    ctx.fillStyle = MUTED
    ctx.fillText('00:00', 70, 380)
    ctx.textAlign = 'right'
    ctx.fillText('90:00', W - 70, 380)
    ctx.textAlign = 'left'
    const ev = [[0.12, 'tab_hidden', '14 s'], [0.38, 'paste', '212 chars'], [0.61, 'fullscreen_exit', ''], [0.7, 'tab_hidden', '6 s']]
    ev.forEach(([u, name, d], i) => {
      const x = 70 + (W - 140) * u
      ctx.fillStyle = INK
      ctx.beginPath()
      ctx.arc(x, 333, 13, 0, Math.PI * 2)
      ctx.fill()
      ctx.font = '500 26px "JetBrains Mono"'
      ctx.fillStyle = INK
      ctx.fillText(name, x - 20, i % 2 ? 290 : 280 - 0)
      if (d) {
        ctx.fillStyle = MUTED
        ctx.fillText(d, x - 20, 250 + (i % 2 ? 10 : 0) - 0)
      }
    })
    const rows = [['Away from the tab', '2 times · 20 s', 'warn'], ['Left full screen', '1 time', 'warn'], ['Pasted text', '1 time · 212 chars', 'flag']]
    rows.forEach(([a, b, c], i) => {
      const y = 500 + i * 92
      ctx.fillStyle = 'rgba(255,255,255,0.08)'
      ctx.fillRect(70, y + 30, W - 140, 2)
      ctx.font = '600 34px Inter'
      ctx.fillStyle = INK
      ctx.fillText(a, 70, y)
      ctx.font = '400 30px "JetBrains Mono"'
      ctx.fillStyle = MUTED
      ctx.fillText(b, 560, y)
      pill(ctx, W - 230, y, c, c === 'flag' ? OR : '#262626', '#fff')
    })
    ctx.font = '400 30px Inter'
    ctx.fillStyle = MUTED
    ctx.fillText('Rules can warn or auto-submit. A person reads them in context.', 70, H - 70)
  })

const release = () =>
  canvas((ctx) => {
    head(ctx, 'RELEASE CONTROL', 'Nothing ships unreviewed.')
    const flow = ['graded', 'in review', 'released']
    let x = 70
    flow.forEach((f, i) => {
      x += pill(ctx, x, 290, f, i === 2 ? OR : '#262626', '#fff') + 18
      if (i < 2) {
        ctx.fillStyle = MUTED
        ctx.font = '500 30px Inter'
        ctx.fillText('→', x, 290)
        x += 52
      }
    })
    const rows = [
      ['Candidate 0412', 'Todo list · React', '81', 'Shortlist', 'released', OR],
      ['Candidate 0398', 'Orders API · FastAPI', '64', 'Review', 'in review', '#262626'],
      ['Candidate 0377', 'Support triage · PE', '—', 'regraded', 'in review', '#262626'],
      ['Candidate 0351', 'Todo list · Vue', '—', 'share link revoked', 'withdrawn', '#3a1a12'],
    ]
    rows.forEach(([n, task, sc, rec, st, bg], i) => {
      const y = 420 + i * 100
      ctx.fillStyle = 'rgba(255,255,255,0.08)'
      ctx.fillRect(70, y + 36, W - 140, 2)
      ctx.font = '600 32px Inter'
      ctx.fillStyle = INK
      ctx.fillText(n, 70, y)
      ctx.font = '400 28px "JetBrains Mono"'
      ctx.fillStyle = MUTED
      ctx.fillText(task, 400, y)
      ctx.font = '800 36px Inter'
      ctx.fillStyle = INK
      ctx.fillText(sc, 820, y)
      ctx.font = '400 26px Inter'
      ctx.fillStyle = MUTED
      ctx.fillText(rec, 900, y)
      ctx.textAlign = 'left'
      pill(ctx, W - 260, y, st, bg, '#fff')
    })
  })

const isolation = () =>
  canvas((ctx) => {
    head(ctx, 'ISOLATION · AUDIT', 'Enforced by the database.')
    ctx.fillStyle = '#0c0c0c'
    ctx.beginPath()
    ctx.roundRect(70, 230, W - 140, 200, 18)
    ctx.fill()
    ctx.font = '400 30px "JetBrains Mono"'
    const sql = [
      [['CREATE POLICY ', OR], ['principals_isolation ', INK], ['ON ', OR], ['principals', INK]],
      [['  USING ', OR], ['(app_is_platform() ', INK], ['OR ', OR], ['tenant_id = app_tenant_id())', INK]],
      [['-- FORCE: applies to the table owner too', MUTED]],
    ]
    sql.forEach((line, i) => {
      let x = 100
      line.forEach(([s, c]) => {
        ctx.fillStyle = c
        ctx.fillText(s, x, 300 + i * 52)
        x += ctx.measureText(s).width
      })
    })
    const audit = [
      ['10:42:07', 'result.approved', 'staff'],
      ['10:42:31', 'result.share', 'client'],
      ['11:03:12', 'credentials.revealed', 'admin'],
      ['11:20:55', 'export.downloaded', 'client'],
      ['11:31:40', 'result.withdrawn', 'staff'],
    ]
    audit.forEach(([t, a, who], i) => {
      const y = 500 + i * 66
      ctx.font = '400 28px "JetBrains Mono"'
      ctx.fillStyle = MUTED
      ctx.fillText(t, 70, y)
      ctx.fillStyle = i === audit.length - 1 ? OR : INK
      ctx.fillText(a, 260, y)
      ctx.fillStyle = MUTED
      ctx.textAlign = 'right'
      ctx.fillText(who, W - 70, y)
      ctx.textAlign = 'left'
    })
  })

/** Three glass panes; scrolling pulls each one forward and lays it over the last. */
export async function createTrust(scene) {
  await document.fonts.load('800 64px Inter')
  const group = new THREE.Group()
  scene.add(group)
  const pw = 5.6
  const ph = (pw * H) / W
  const glass = new THREE.MeshPhysicalMaterial({
    color: 0xffffff, roughness: 0.18, transmission: 1, thickness: 0.4, ior: 1.4,
    clearcoat: 1, clearcoatRoughness: 0.05, transparent: true, opacity: 1,
  })
  const panes = [integrity(), release(), isolation()].map((tex) => {
    const g = new THREE.Group()
    const slab = new THREE.Mesh(new RoundedBoxGeometry(pw + 0.12, ph + 0.12, 0.08, 4, 0.04), glass)
    const front = new THREE.Mesh(
      new THREE.PlaneGeometry(pw, ph),
      new THREE.MeshBasicMaterial({ map: tex, transparent: true, toneMapped: false, color: 0xe6e6e6, depthWrite: false }),
    )
    front.position.z = 0.045
    g.add(slab, front)
    group.add(g)
    return { g, front }
  })

  // An orange light behind the stack, tinting the glass edges.
  const back = new THREE.PointLight(0xff3001, 14, 14, 1.5)
  back.position.set(0, 0, -3)
  group.add(back)

  const api = {}
  api.update = ({ t, state, pointer }) => {
    const p = state.trust
    const out = Math.max(smooth(0.94, 1, p), smooth(0, 0.05, state.teams))
    group.visible = state.engines > 0.85 && out < 0.999
    if (!group.visible) return
    const enter = smooth(0, 0.1, p)
    const wide = innerWidth / innerHeight > 1.2
    group.position.set(wide ? 1.9 : 0, wide ? 0 : 1.3, -5 * (1 - enter) - 6 * out)
    group.scale.setScalar(wide ? 0.88 : 0.62)
    group.rotation.y = -0.32 + pointer.sx * 0.15
    group.rotation.x = 0.06 - pointer.sy * 0.1

    // Pane i arrives over beat i: from deep and tilted, to the front of the stack.
    panes.forEach(({ g, front }, i) => {
      const a = smooth(i / 3, i / 3 + 0.22, p)
      const covered = smooth((i + 1) / 3, (i + 1) / 3 + 0.22, p)
      g.position.set(-0.5 * covered + 7 * (1 - a), 0.32 * covered, i * 1.0)
      g.rotation.set(0, -0.25 * (1 - a), 0)
      g.visible = a > 0.001
      front.material.opacity = a * (1 - 0.75 * covered)
    })
  }
  return api
}
