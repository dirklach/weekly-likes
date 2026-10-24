// Turns '#RRGGBB' into the value @sanity/color-input stores (hex, rgb, hsl, hsv), keyed for use in an array.
import {randomUUID} from 'node:crypto'

export function colorValue(hex) {
  const [r, g, b] = [1, 3, 5].map((i) => Number.parseInt(hex.slice(i, i + 2), 16))
  const [rf, gf, bf] = [r, g, b].map((c) => c / 255)
  const max = Math.max(rf, gf, bf)
  const min = Math.min(rf, gf, bf)
  const d = max - min

  let h = 0
  if (d) {
    if (max === rf) h = ((gf - bf) / d) % 6
    else if (max === gf) h = (bf - rf) / d + 2
    else h = (rf - gf) / d + 4
    h = (h * 60 + 360) % 360
  }
  const l = (max + min) / 2
  const sl = d ? d / (1 - Math.abs(2 * l - 1)) : 0
  const sv = max ? d / max : 0

  return {
    _key: randomUUID().slice(0, 12),
    _type: 'color',
    alpha: 1,
    hex: hex.toLowerCase(),
    rgb: {_type: 'rgbaColor', r, g, b, a: 1},
    hsl: {_type: 'hslaColor', h, s: sl, l, a: 1},
    hsv: {_type: 'hsvaColor', h, s: sv, v: max, a: 1},
  }
}
