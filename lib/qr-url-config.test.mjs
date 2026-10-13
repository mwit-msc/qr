import test from 'node:test'
import assert from 'node:assert/strict'
import { parseQrUrlConfig } from './qr-url-config.mjs'

const options = {
  logoIds: ['none', 'alvis', 'openhouse2025', 'premwit2026', 'openhouse2026'],
  styleIds: ['square', 'dots', 'rounded', 'extra-rounded', 'classy', 'classy-rounded'],
}
const parse = search => parseQrUrlConfig(search, options)

test('homepage and unrelated tracking parameters preserve existing defaults', () => {
  const home = parse('')
  assert.equal(home.link, 'https://mwit.ac.th')
  assert.equal(home.caption, true)
  assert.equal(home.title, 'QR Code')
  assert.equal(home.description, 'mwit.link')
  assert.deepEqual(parse('?utm_source=school'), home)
})

test('link-only config hides the caption and decodes the payload exactly once', () => {
  const link = 'https://example.com/register?name=เก้าอี้&tag=a+b&encoded=%2F#details'
  const config = parse(new URLSearchParams({ link }).toString())
  assert.equal(config.link, link)
  assert.equal(config.caption, false)
  assert.equal(config.title, '')
  assert.equal(config.description, '')
  assert.equal(config.logo, 'alvis')
})

test('all configurable settings are parsed without losing Thai or special characters', () => {
  const query = { link: 'Registration', title: 'เปิดบ้าน 💙', description: 'A & B + C', logo: 'openhouse2026', style: 'classy-rounded', fontSize: 'large', align: 'right', foreground: '123abc', background: '#FAFAFA', size: '2048' }
  const config = parse(new URLSearchParams(query).toString())
  assert.deepEqual(config, { ...query, caption: true, foreground: '#123ABC', background: '#FAFAFA', size: 2048 })
})

test('blank captions and explicit caption=false suppress text; icon is a logo alias', () => {
  assert.equal(parse('?title=&description=').caption, false)
  assert.equal(parse('?description=Only+description').caption, true)
  assert.equal(parse('?description=Only+description').title, '')
  const hidden = parse('?title=Keep+this&caption=false&icon=none')
  assert.equal(hidden.caption, false)
  assert.equal(hidden.title, 'Keep this')
  assert.equal(hidden.logo, 'none')
  assert.equal(parse('?caption=true').caption, true)
  assert.equal(parse('?logo=alvis&icon=none').logo, 'alvis')
})

test('invalid choices and colors use defaults without altering the encoded content', () => {
  const config = parse('?link=&logo=custom&style=invalid&fontSize=huge&align=up&size=999999&foreground=red&background=FFF&title=Visible&caption=maybe')
  assert.equal(config.link, '')
  assert.equal(config.logo, 'alvis')
  assert.equal(config.style, 'rounded')
  assert.equal(config.fontSize, 'medium')
  assert.equal(config.align, 'center')
  assert.equal(config.size, 400)
  assert.equal(config.foreground, '#0B1220')
  assert.equal(config.background, '#FFFFFF')
  assert.equal(config.caption, true)
})

test('URL captions respect input lengths without splitting a surrogate pair', () => {
  const config = parse(new URLSearchParams({ title: 'a'.repeat(79) + '💙', description: 'ข'.repeat(121) }).toString())
  assert.equal(config.title, 'a'.repeat(79))
  assert.equal(config.description.length, 120)
})
