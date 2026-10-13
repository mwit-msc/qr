import test from 'node:test'
import assert from 'node:assert/strict'
import { captionMetrics, wrapCaptionText } from './qr-caption-layout.mjs'

const measure = text => text.length

test('wraps captions at words and keeps every word', () => {
  assert.deepEqual(wrapCaptionText('Open House 2026', 11, measure), ['Open House', '2026'])
  assert.deepEqual(wrapCaptionText('  ', 11, measure), [])
  assert.deepEqual(wrapCaptionText('First\nSecond', 11, measure), ['First', 'Second'])
})

test('long unbroken titles wrap instead of being cut off', () => {
  const title = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const lines = wrapCaptionText(title, 6, measure)
  assert.equal(lines.join(''), title)
  assert.ok(lines.every(line => measure(line) <= 6))
})

test('Thai combining marks and emoji stay together at a narrow width', () => {
  const segmenter = new Intl.Segmenter('th', { granularity: 'grapheme' })
  const text = 'เก้าอี้💙'
  const countGraphemes = value => [...segmenter.segment(value)].length
  const lines = wrapCaptionText(text, 1, countGraphemes)
  assert.equal(lines.join(''), text)
  assert.ok(lines.every(line => countGraphemes(line) === 1))
  assert.ok(lines.every(line => !/^[\u0E31\u0E34-\u0E3A\u0E47-\u0E4E]/.test(line)))
})

test('caption typography scales with high-resolution exports', () => {
  const normal = captionMetrics(400, 'medium')
  const highResolution = captionMetrics(2048, 'medium')
  for (const key of Object.keys(normal)) {
    assert.ok(Math.abs(highResolution[key] / normal[key] - 5.12) < 0.00001)
  }
  assert.ok(captionMetrics(400, 'small').titleSize < normal.titleSize)
  assert.ok(captionMetrics(400, 'large').titleSize > normal.titleSize)
})
