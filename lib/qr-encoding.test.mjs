import test from 'node:test'
import assert from 'node:assert/strict'
import { encodeQrData } from './qr-encoding.mjs'

test('ASCII links and numeric data keep their exact bytes', () => {
  for (const text of ['1234567890', 'https://example.com/?a=1&b=%2F#details']) {
    assert.equal(encodeQrData(text), text)
  }
})

test('QR byte data preserves Thai and emoji as UTF-8', () => {
  // Previously the library truncated ก (U+0E01) into the byte 0x01.
  assert.deepEqual([...encodeQrData('ก💙')].map(char => char.charCodeAt(0)), [0xE0, 0xB8, 0x81, 0xF0, 0x9F, 0x92, 0x99])
  const link = 'https://example.com/?name=เก้าอี้&tag=a+b&encoded=%2F'
  assert.equal(Buffer.from(encodeQrData(link), 'latin1').toString('utf8'), link)
})
