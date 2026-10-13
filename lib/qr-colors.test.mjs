import test from 'node:test'
import assert from 'node:assert/strict'
import { normalizeHexColor, relativeLuminance, assessQrColors } from './qr-colors.mjs'

test('accepts complete hex colors and rejects incomplete or invalid values', () => {
  assert.equal(normalizeHexColor(' 85a9ff '), '#85A9FF')
  assert.equal(normalizeHexColor('#ffffff'), '#FFFFFF')
  for (const value of ['#fff', '#12', '#GGGGGG', 'red', '#1234567', '']) {
    assert.equal(normalizeHexColor(value), null)
  }
})

test('computes luminance endpoints and black/white contrast', () => {
  assert.equal(relativeLuminance('#000000'), 0)
  assert.equal(relativeLuminance('#FFFFFF'), 1)
  assert.deepEqual(assessQrColors('#000000', '#FFFFFF'), { ratio: 21, lowContrast: false, inverted: false })
})

test('flags equal colors, subtle colors, and inverted colors', () => {
  assert.equal(assessQrColors('#85A9FF', '#FFFFFF').lowContrast, true)
  assert.equal(assessQrColors('#111111', '#111111').ratio, 1)
  assert.equal(assessQrColors('#111111', '#111111').lowContrast, true)
  assert.equal(assessQrColors('#FFFFFF', '#000000').inverted, true)
  assert.equal(assessQrColors('#0B1220', '#FFFFFF').lowContrast, false)
  assert.throws(() => relativeLuminance('oops'))
})
