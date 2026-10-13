/** @param {string} value @returns {string | null} */
export function normalizeHexColor(value) {
  const hex = value.trim().replace(/^#/, '')
  return /^[0-9a-f]{6}$/i.test(hex) ? `#${hex.toUpperCase()}` : null
}

/** @param {string} hex */
export function relativeLuminance(hex) {
  const color = normalizeHexColor(hex)
  if (!color) throw new Error('Invalid hex color')
  const channels = [1, 3, 5].map(offset => {
    const channel = parseInt(color.slice(offset, offset + 2), 16) / 255
    return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4
  })
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722
}

/** @param {string} foreground @param {string} background */
export function assessQrColors(foreground, background) {
  const foregroundLuminance = relativeLuminance(foreground)
  const backgroundLuminance = relativeLuminance(background)
  const ratio = (Math.max(foregroundLuminance, backgroundLuminance) + 0.05) /
    (Math.min(foregroundLuminance, backgroundLuminance) + 0.05)
  // A conservative hint, not a QR certification or a guarantee of scanning.
  return { ratio, lowContrast: ratio < 4.5, inverted: foregroundLuminance >= backgroundLuminance }
}
