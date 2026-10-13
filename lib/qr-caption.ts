import { captionMetrics, wrapCaptionText } from './qr-caption-layout.mjs'

export type QrCaption = {
  enabled: boolean
  title: string
  description: string
  size: 'small' | 'medium' | 'large'
  alignment: 'left' | 'center' | 'right'
}

export type RenderedQrImage = { blob: Blob; width: number; height: number }

export async function appendQrCaption(blob: Blob, width: number, caption: QrCaption | undefined, foreground: string, background: string): Promise<RenderedQrImage> {
  if (!caption?.enabled || (!caption.title.trim() && !caption.description.trim())) {
    return { blob, width, height: width }
  }
  const metrics = captionMetrics(width, caption.size)
  const fontFamily = getComputedStyle(document.body).fontFamily
  const titleFont = `600 ${metrics.titleSize}px ${fontFamily}`
  const descriptionFont = `400 ${metrics.descriptionSize}px ${fontFamily}`
  // Load the same local Latin/Thai faces used in the interface before measuring.
  await Promise.all([
    document.fonts.load(titleFont, caption.title || 'QR'),
    document.fonts.load(descriptionFont, caption.description || 'QR'),
  ])

  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d')
  if (!context) throw new Error('เบราว์เซอร์นี้ไม่รองรับการสร้างรูปภาพ')
  const maxTextWidth = width - metrics.padding * 2
  context.font = titleFont
  const titleLines = wrapCaptionText(caption.title, maxTextWidth, text => context.measureText(text).width)
  context.font = descriptionFont
  const descriptionLines = wrapCaptionText(caption.description, maxTextWidth, text => context.measureText(text).width)
  const gap = titleLines.length && descriptionLines.length ? metrics.gap : 0
  const captionHeight = Math.ceil(metrics.topPadding + titleLines.length * metrics.titleLineHeight + gap + descriptionLines.length * metrics.descriptionLineHeight + metrics.bottomPadding)
  canvas.width = width
  canvas.height = width + captionHeight

  const image = await createImageBitmap(blob)
  try {
    context.fillStyle = background
    context.fillRect(0, 0, canvas.width, canvas.height)
    context.drawImage(image, 0, 0)
    context.strokeStyle = foreground
    context.globalAlpha = 0.16
    context.lineWidth = width / 400
    context.beginPath()
    // Keep the divider entirely below the QR's original quiet zone.
    const dividerY = width + context.lineWidth / 2
    context.moveTo(metrics.padding, dividerY)
    context.lineTo(width - metrics.padding, dividerY)
    context.stroke()
    context.globalAlpha = 1
    context.fillStyle = foreground
    context.textAlign = caption.alignment
    context.textBaseline = 'top'
    const x = caption.alignment === 'left' ? metrics.padding : caption.alignment === 'right' ? width - metrics.padding : width / 2
    let y = width + metrics.topPadding
    context.font = titleFont
    for (const line of titleLines) {
      context.fillText(line, x, y)
      y += metrics.titleLineHeight
    }
    y += gap
    context.font = descriptionFont
    context.globalAlpha = 0.7
    for (const line of descriptionLines) {
      context.fillText(line, x, y)
      y += metrics.descriptionLineHeight
    }
    const result = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(value => value ? resolve(value) : reject(new Error('เพิ่มข้อความไม่สำเร็จ ลองใหม่อีกครั้ง')), 'image/png')
    })
    return { blob: result, width, height: canvas.height }
  } finally {
    image.close()
  }
}
