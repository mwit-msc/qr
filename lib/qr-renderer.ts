import QRCodeStyling, { type Options } from 'qr-code-styling'

export type LogoOption = {
  id: string
  name: string
  path: string | null
  description: string
  sizePercent: number
  removeWhiteBg?: boolean
  circleCrop?: boolean
}

function loadImage(source: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('โหลดรูปภาพไม่สำเร็จ ลองเลือกรูปอื่น'))
    image.src = source
  })
}

function prepareLogo(image: HTMLImageElement, logo: LogoOption): HTMLCanvasElement {
  // Keep uploads bounded, while retaining enough detail for a 2,048 px export.
  const scale = Math.min(1, 1024 / Math.max(image.naturalWidth, image.naturalHeight))
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(image.naturalWidth * scale))
  canvas.height = Math.max(1, Math.round(image.naturalHeight * scale))
  const context = canvas.getContext('2d', { willReadFrequently: true })
  if (!context) throw new Error('เบราว์เซอร์นี้ไม่รองรับการสร้างรูปภาพ')
  context.drawImage(image, 0, 0, canvas.width, canvas.height)

  if (logo.removeWhiteBg ?? true) {
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height)
    for (let i = 0; i < pixels.data.length; i += 4) {
      if (pixels.data[i] > 245 && pixels.data[i + 1] > 245 && pixels.data[i + 2] > 245) {
        pixels.data[i + 3] = 0
      }
    }
    context.putImageData(pixels, 0, 0)
  }
  if (logo.circleCrop) {
    context.globalCompositeOperation = 'destination-in'
    context.beginPath()
    context.arc(canvas.width / 2, canvas.height / 2, Math.min(canvas.width, canvas.height) / 2, 0, Math.PI * 2)
    context.fill()
  }
  return canvas
}

function createLogoOutline(logo: HTMLCanvasElement, width: number, height: number): HTMLCanvasElement {
  // Trace alpha at the original 400 px working scale. This keeps the outline
  // proportional at every export size without thousands of full-size draws.
  const outlineWidth = 6
  const mask = document.createElement('canvas')
  mask.width = width
  mask.height = height
  const maskContext = mask.getContext('2d')
  if (!maskContext) throw new Error('เบราว์เซอร์นี้ไม่รองรับการสร้างรูปภาพ')
  maskContext.drawImage(logo, 0, 0, width, height)

  const outline = document.createElement('canvas')
  outline.width = width + outlineWidth * 2
  outline.height = height + outlineWidth * 2
  const context = outline.getContext('2d')
  if (!context) throw new Error('เบราว์เซอร์นี้ไม่รองรับการสร้างรูปภาพ')
  for (let x = -outlineWidth; x <= outlineWidth; x++) {
    for (let y = -outlineWidth; y <= outlineWidth; y++) {
      if (x * x + y * y <= outlineWidth * outlineWidth) {
        context.drawImage(mask, outlineWidth + x, outlineWidth + y)
      }
    }
  }
  context.globalCompositeOperation = 'source-in'
  context.fillStyle = '#FFFFFF'
  context.fillRect(0, 0, outline.width, outline.height)
  return outline
}

export async function readCustomLogo(file: File): Promise<LogoOption> {
  if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
    throw new Error('เลือกไฟล์ PNG, JPG หรือ WebP')
  }
  if (file.size > 5 * 1024 * 1024) throw new Error('รูปภาพต้องมีขนาดไม่เกิน 5 MB')
  const objectUrl = URL.createObjectURL(file)
  try {
    const image = await loadImage(objectUrl)
    const logo: LogoOption = {
      id: `custom-${crypto.randomUUID()}`,
      name: file.name,
      path: null,
      description: 'โลโก้ของคุณ',
      sizePercent: 100,
      removeWhiteBg: false,
    }
    return { ...logo, path: prepareLogo(image, logo).toDataURL('image/png') }
  } finally {
    URL.revokeObjectURL(objectUrl)
  }
}

export async function renderQrCode({ text, style, logo, size, foreground, background }: {
  text: string
  style: string
  logo?: LogoOption
  size: number
  foreground: string
  background: string
}): Promise<Blob> {
  const logoCanvas = logo?.path ? prepareLogo(await loadImage(logo.path), logo) : null
  const options: Options = {
    width: size,
    height: size,
    type: 'canvas',
    data: text,
    margin: Math.round(size * 0.04),
    qrOptions: { errorCorrectionLevel: logoCanvas ? 'H' : 'Q' },
    dotsOptions: { color: foreground, type: style as NonNullable<Options['dotsOptions']>['type'] },
    cornersSquareOptions: { color: foreground, type: style === 'dots' ? 'dot' : style === 'extra-rounded' ? 'extra-rounded' : 'square' },
    cornersDotOptions: { color: foreground, type: style === 'dots' ? 'dot' : 'square' },
    backgroundOptions: { color: background },
  }
  const blob = await new QRCodeStyling(options).getRawData('png')
  if (!(blob instanceof Blob)) throw new Error('สร้าง QR ไม่สำเร็จ ลองใหม่อีกครั้ง')
  if (!logoCanvas) return blob

  const objectUrl = URL.createObjectURL(blob)
  try {
    const qrImage = await loadImage(objectUrl)
    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size
    const context = canvas.getContext('2d')
    if (!context) throw new Error('เบราว์เซอร์นี้ไม่รองรับการสร้างรูปภาพ')
    context.drawImage(qrImage, 0, 0)

    const maxLogoSize = 100 * ((logo?.sizePercent ?? 100) / 100)
    const aspectRatio = logoCanvas.width / logoCanvas.height
    const width = Math.max(1, Math.round(aspectRatio >= 1 ? maxLogoSize : maxLogoSize * aspectRatio))
    const height = Math.max(1, Math.round(aspectRatio >= 1 ? maxLogoSize / aspectRatio : maxLogoSize))
    const outline = createLogoOutline(logoCanvas, width, height)
    const scale = size / 400
    context.drawImage(outline, (size - outline.width * scale) / 2, (size - outline.height * scale) / 2, outline.width * scale, outline.height * scale)
    // Draw the original prepared logo at export resolution, so the logo itself
    // stays sharp even though the small outline mask is scaled up.
    context.drawImage(logoCanvas, (size - width * scale) / 2, (size - height * scale) / 2, width * scale, height * scale)
    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(result => result ? resolve(result) : reject(new Error('สร้าง QR ไม่สำเร็จ ลองใหม่อีกครั้ง')), 'image/png')
    })
  } finally {
    URL.revokeObjectURL(objectUrl)
  }
}
