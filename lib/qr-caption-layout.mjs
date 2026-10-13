/** @param {number} width @param {'small' | 'medium' | 'large'} preset */
export function captionMetrics(width, preset) {
  const scale = width / 400
  const sizes = { small: [18, 14], medium: [24, 16], large: [30, 20] }
  const [titleSize, descriptionSize] = sizes[preset]
  return {
    padding: 24 * scale,
    topPadding: 18 * scale,
    bottomPadding: 20 * scale,
    gap: 5 * scale,
    titleSize: titleSize * scale,
    descriptionSize: descriptionSize * scale,
    titleLineHeight: titleSize * 1.6 * scale,
    descriptionLineHeight: descriptionSize * 1.6 * scale,
  }
}

/**
 * Wrap on word boundaries, falling back to graphemes for a word wider than
 * the caption. Thai vowel/tone marks stay attached to their base character.
 * @param {string} text
 * @param {number} maxWidth
 * @param {(text: string) => number} measure
 * @returns {string[]}
 */
export function wrapCaptionText(text, maxWidth, measure) {
  if (!text.trim()) return []
  const words = new Intl.Segmenter('th', { granularity: 'word' })
  const graphemes = new Intl.Segmenter('th', { granularity: 'grapheme' })
  const lines = []
  for (const paragraph of text.trim().split(/\r?\n/)) {
    let line = ''
    for (const { segment } of words.segment(paragraph)) {
      if (measure((line + segment).trimEnd()) <= maxWidth) {
        line += segment
        continue
      }
      if (line.trim()) lines.push(line.trimEnd())
      line = ''
      const token = segment.trimStart()
      if (measure(token) <= maxWidth) {
        line = token
        continue
      }
      for (const { segment: grapheme } of graphemes.segment(token)) {
        if (line && measure(line + grapheme) > maxWidth) {
          lines.push(line)
          line = ''
        }
        line += grapheme
      }
    }
    lines.push(line.trimEnd())
  }
  return lines
}
