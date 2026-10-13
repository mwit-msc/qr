import { normalizeHexColor } from './qr-colors.mjs'

/**
 * @typedef {Object} QrUrlConfig
 * @property {string} link
 * @property {string} logo
 * @property {string} style
 * @property {string} title
 * @property {string} description
 * @property {boolean} caption
 * @property {'small' | 'medium' | 'large'} fontSize
 * @property {'left' | 'center' | 'right'} align
 * @property {string} foreground
 * @property {string} background
 * @property {number} size
 */

/** @type {QrUrlConfig} */
const defaults = {
  link: 'https://mwit.ac.th', logo: 'alvis', style: 'rounded',
  title: 'QR Code', description: 'mwit.link', caption: true,
  fontSize: 'medium', align: 'center', foreground: '#0B1220', background: '#FFFFFF', size: 400,
}
/** @type {QrUrlConfig['fontSize'][]} */
const fontSizes = ['small', 'medium', 'large']
/** @type {QrUrlConfig['align'][]} */
const alignments = ['left', 'center', 'right']
const parameterNames = ['link', 'title', 'description', 'logo', 'icon', 'style', 'fontSize', 'align', 'foreground', 'background', 'size', 'caption']

/** @template {string} T @param {string | null} value @param {readonly T[]} allowed @param {T} fallback @returns {T} */
const pick = (value, allowed, fallback) => allowed.find(option => option === value) ?? fallback

// Match the input limits without leaving half of an emoji at the boundary.
/** @param {string} value @param {number} limit */
const limitText = (value, limit) => value.slice(0, limit).replace(/[\uD800-\uDBFF]$/, '')

/**
 * Parse once-decoded URL values; nested query strings must stay intact.
 * Valid preset IDs come from the interface's existing options.
 * @param {string} search
 * @param {{ logoIds: string[], styleIds: string[] }} options
 * @returns {QrUrlConfig}
 */
export function parseQrUrlConfig(search, { logoIds, styleIds }) {
  const params = new URLSearchParams(search)
  if (!parameterNames.some(name => params.has(name))) return { ...defaults }
  const title = limitText(params.get('title') ?? '', 80)
  const description = limitText(params.get('description') ?? '', 120)
  const captionValue = params.get('caption')
  return {
    ...defaults,
    link: params.get('link') ?? defaults.link,
    logo: pick(params.get('logo') ?? params.get('icon'), logoIds, defaults.logo),
    style: pick(params.get('style'), styleIds, defaults.style),
    title,
    description,
    caption: captionValue === 'false' ? false : captionValue === 'true' ? true : Boolean(title.trim() || description.trim()),
    fontSize: pick(params.get('fontSize'), fontSizes, defaults.fontSize),
    align: pick(params.get('align'), alignments, defaults.align),
    foreground: normalizeHexColor(params.get('foreground') ?? '') ?? defaults.foreground,
    background: normalizeHexColor(params.get('background') ?? '') ?? defaults.background,
    size: Number(pick(params.get('size'), ['400', '1024', '2048'], String(defaults.size))),
  }
}
