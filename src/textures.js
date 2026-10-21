import * as THREE from 'three'

/** One line of big type on a transparent canvas texture. Returns the texture and its aspect ratio. */
export function textTexture(text, { font, color, accent, dot = false, tracking = 0, pad = 40 }) {
  const c = document.createElement('canvas')
  const ctx = c.getContext('2d')
  ctx.font = font
  const size = parseInt(font.match(/(\d+)px/)[1], 10)
  ctx.letterSpacing = `${tracking * size}px`
  const w = Math.ceil(ctx.measureText(text + (dot ? '.' : '')).width) + pad * 2
  const h = Math.ceil(size * 1.05) + pad * 2
  c.width = w
  c.height = h
  ctx.font = font
  ctx.letterSpacing = `${tracking * size}px`
  ctx.textBaseline = 'alphabetic'
  ctx.fillStyle = color
  const y = pad + size * 0.86
  ctx.fillText(text, pad, y)
  if (dot) {
    ctx.fillStyle = accent
    ctx.fillText('.', pad + ctx.measureText(text).width, y)
  }
  const texture = new THREE.CanvasTexture(c)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 8
  return { texture, aspect: w / h }
}

/** A generic CV page: the "claim" every application makes. Greyscale, deliberately interchangeable. */
export function cvTexture() {
  const c = document.createElement('canvas')
  c.width = 360
  c.height = 500
  const ctx = c.getContext('2d')
  ctx.fillStyle = '#f3f1ec'
  ctx.fillRect(0, 0, c.width, c.height)
  ctx.fillStyle = '#cfccc6'
  ctx.fillRect(28, 30, 66, 66)
  ctx.fillStyle = '#2b2b2b'
  ctx.fillRect(110, 36, 170, 16)
  ctx.fillStyle = '#9d9a95'
  ctx.fillRect(110, 62, 120, 9)
  ctx.fillRect(110, 78, 90, 9)
  const block = (y, rows) => {
    ctx.fillStyle = '#3b3b3b'
    ctx.fillRect(28, y, 96, 10)
    ctx.fillStyle = '#bab7b1'
    for (let i = 0; i < rows; i++) ctx.fillRect(28, y + 22 + i * 15, 304 - ((i * 53) % 90), 7)
  }
  block(124, 5)
  block(232, 6)
  block(352, 5)
  ctx.strokeStyle = '#e2dfda'
  ctx.lineWidth = 2
  ctx.strokeRect(1, 1, c.width - 2, c.height - 2)
  const texture = new THREE.CanvasTexture(c)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 4
  return texture
}
