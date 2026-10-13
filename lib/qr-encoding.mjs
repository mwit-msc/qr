/**
 * qr-code-styling 1.9 embeds qrcode-generator's single-byte string encoder.
 * Supply a byte string so Thai and emoji become UTF-8 instead of truncated
 * Unicode code points. ASCII data is unchanged, including numeric-mode data.
 * @param {string} text
 */
export function encodeQrData(text) {
  return Array.from(new TextEncoder().encode(text), byte => String.fromCharCode(byte)).join('')
}
