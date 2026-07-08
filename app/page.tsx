'use client'

import { useEffect, useRef, useState } from 'react'
import QRCodeStyling, { type Options } from 'qr-code-styling'
import { toast, Toaster } from 'react-hot-toast'
import { Download, Copy, QrCode, ChevronDown, Check, Link2, Palette, Image as ImageIcon } from 'lucide-react'

// Logo options — sizePercent controls logo size (100 = default, 200 = 2x larger).
// removeWhiteBg strips near-white pixels (good for logos on white); turn off for
// artwork that is meant to keep its dark/starry background.
// circleCrop masks the logo into a circle (for square badge artwork).
type LogoOption = {
  id: string
  name: string
  path: string | null
  description: string
  sizePercent: number
  removeWhiteBg?: boolean
  circleCrop?: boolean
}

const logoOptions: LogoOption[] = [
  { id: 'none', name: 'ไม่มีโลโก้', path: null, description: 'QR โค้ดล้วน ไม่มีโลโก้', sizePercent: 100 },
  { id: 'alvis', name: 'Alvis', path: '/logo_alvis.png', description: 'โลโก้ Alvis เริ่มต้น', sizePercent: 100 },
  { id: 'openhouse2025', name: 'Open House 2025', path: '/logo_openhouse2025.png', description: 'งานโอเพนเฮาส์ 2025', sizePercent: 100 },
  { id: 'premwit2026', name: 'PRE-MWIT 2026', path: '/logo_premwit2026.png', description: 'งานพรีมหิดล 2026', sizePercent: 200 },
  { id: 'openhouse2026', name: 'Open House 2026', path: '/logo_openhouse2026.jpg', description: 'งานโอเพนเฮาส์ 2026', sizePercent: 130, removeWhiteBg: false, circleCrop: true },
]

// QR module style options
const qrStyleOptions = [
  { id: 'square', name: 'เหลี่ยม', description: 'โมดูลสี่เหลี่ยมคลาสสิก' },
  { id: 'dots', name: 'จุด', description: 'โมดูลทรงกลม' },
  { id: 'rounded', name: 'มน', description: 'สี่เหลี่ยมมุมมน' },
  { id: 'extra-rounded', name: 'มนมาก', description: 'มุมมนพิเศษ' },
  { id: 'classy', name: 'หรู', description: 'สไตล์เรียบหรู' },
  { id: 'classy-rounded', name: 'หรูมน', description: 'เรียบหรู ขอบมน' },
]

// Helper to process logo with options
const processLogo = (
  logoImg: HTMLImageElement,
  maxSize: number,
  options: { removeWhiteBg: boolean; addOutline: boolean; outlineWidth?: number; circleCrop?: boolean }
): Promise<string> => {
  return new Promise((resolve) => {
    const { removeWhiteBg, addOutline, outlineWidth = 6, circleCrop = false } = options

    // Calculate scaled dimensions preserving aspect ratio
    const aspectRatio = logoImg.width / logoImg.height
    let scaledWidth: number, scaledHeight: number
    if (aspectRatio >= 1) {
      scaledWidth = maxSize
      scaledHeight = Math.round(maxSize / aspectRatio)
    } else {
      scaledHeight = maxSize
      scaledWidth = Math.round(maxSize * aspectRatio)
    }

    // Step 1: Create canvas with logo
    const tempCanvas = document.createElement('canvas')
    tempCanvas.width = logoImg.width
    tempCanvas.height = logoImg.height
    const tempCtx = tempCanvas.getContext('2d', { willReadFrequently: true })
    if (!tempCtx) {
      resolve('')
      return
    }

    tempCtx.drawImage(logoImg, 0, 0)

    // Remove white background if enabled
    if (removeWhiteBg) {
      const imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height)
      const data = imageData.data
      const threshold = 245
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i]
        const g = data[i + 1]
        const b = data[i + 2]
        if (r > threshold && g > threshold && b > threshold) {
          data[i + 3] = 0 // Make transparent
        }
      }
      tempCtx.putImageData(imageData, 0, 0)
    }

    // Mask into a circle — corners become transparent
    if (circleCrop) {
      const radius = Math.min(tempCanvas.width, tempCanvas.height) / 2
      tempCtx.globalCompositeOperation = 'destination-in'
      tempCtx.beginPath()
      tempCtx.arc(tempCanvas.width / 2, tempCanvas.height / 2, radius, 0, Math.PI * 2)
      tempCtx.fill()
      tempCtx.globalCompositeOperation = 'source-over'
    }

    // If no outline needed, just return scaled logo
    if (!addOutline) {
      const finalCanvas = document.createElement('canvas')
      finalCanvas.width = scaledWidth
      finalCanvas.height = scaledHeight
      const finalCtx = finalCanvas.getContext('2d')
      if (!finalCtx) {
        resolve('')
        return
      }
      finalCtx.drawImage(tempCanvas, 0, 0, tempCanvas.width, tempCanvas.height, 0, 0, scaledWidth, scaledHeight)
      resolve(finalCanvas.toDataURL('image/png', 1.0))
      return
    }

    // Step 2: Create final canvas with outline
    const finalWidth = scaledWidth + outlineWidth * 2
    const finalHeight = scaledHeight + outlineWidth * 2
    const finalCanvas = document.createElement('canvas')
    finalCanvas.width = finalWidth
    finalCanvas.height = finalHeight
    const finalCtx = finalCanvas.getContext('2d')
    if (!finalCtx) {
      resolve('')
      return
    }

    // Step 3: Create outline by drawing logo multiple times with offset
    const outlineCanvas = document.createElement('canvas')
    outlineCanvas.width = finalWidth
    outlineCanvas.height = finalHeight
    const outlineCtx = outlineCanvas.getContext('2d')
    if (!outlineCtx) {
      resolve('')
      return
    }

    for (let ox = -outlineWidth; ox <= outlineWidth; ox++) {
      for (let oy = -outlineWidth; oy <= outlineWidth; oy++) {
        const dist = Math.sqrt(ox * ox + oy * oy)
        if (dist <= outlineWidth) {
          outlineCtx.drawImage(
            tempCanvas,
            0, 0, tempCanvas.width, tempCanvas.height,
            outlineWidth + ox, outlineWidth + oy, scaledWidth, scaledHeight
          )
        }
      }
    }

    // Turn the outline shape into white
    outlineCtx.globalCompositeOperation = 'source-in'
    outlineCtx.fillStyle = '#ffffff'
    outlineCtx.fillRect(0, 0, finalWidth, finalHeight)

    // Step 4: Composite - first draw white outline, then logo on top
    finalCtx.drawImage(outlineCanvas, 0, 0)
    finalCtx.drawImage(
      tempCanvas,
      0, 0, tempCanvas.width, tempCanvas.height,
      outlineWidth, outlineWidth, scaledWidth, scaledHeight
    )

    resolve(finalCanvas.toDataURL('image/png', 1.0))
  })
}

const isMobile = () =>
  typeof navigator !== 'undefined' &&
  /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)

export default function QRCodeGenerator() {
  const [text, setText] = useState('https://mwit.ac.th')
  const [qrCodeUrl, setQrCodeUrl] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [selectedLogo, setSelectedLogo] = useState('alvis')
  const [selectedStyle, setSelectedStyle] = useState('rounded')
  const [isLogoDropdownOpen, setIsLogoDropdownOpen] = useState(false)
  const [isStyleDropdownOpen, setIsStyleDropdownOpen] = useState(false)
  const logoDropdownRef = useRef<HTMLDivElement>(null)
  const styleDropdownRef = useRef<HTMLDivElement>(null)
  const qrRef = useRef<QRCodeStyling | null>(null)
  // Holds the FINAL rendered image (QR + composited logo). Copy/Download read from here
  // so the exported file matches exactly what's shown on screen.
  const finalBlobRef = useRef<Blob | null>(null)

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (logoDropdownRef.current && !logoDropdownRef.current.contains(event.target as Node)) {
        setIsLogoDropdownOpen(false)
      }
      if (styleDropdownRef.current && !styleDropdownRef.current.contains(event.target as Node)) {
        setIsStyleDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Generate QR code
  useEffect(() => {
    let objectUrl: string | null = null

    const generateQR = async () => {
      if (!text.trim()) {
        setQrCodeUrl('')
        finalBlobRef.current = null
        return
      }

      setIsGenerating(true)

      try {
        const selectedLogoOption = logoOptions.find(logo => logo.id === selectedLogo)
        let processedLogoUrl: string | undefined = undefined

        // Process logo if selected
        if (selectedLogoOption?.path) {
          const logoImg = new Image()
          logoImg.crossOrigin = 'anonymous'

          await new Promise<void>((resolve) => {
            logoImg.onload = async () => {
              const baseSize = 100
              const logoSize = baseSize * (selectedLogoOption.sizePercent / 100)
              const result = await processLogo(logoImg, logoSize, {
                removeWhiteBg: selectedLogoOption.removeWhiteBg ?? true,
                addOutline: true,
                outlineWidth: 6,
                circleCrop: selectedLogoOption.circleCrop ?? false,
              })
              if (result && result.length > 0) {
                processedLogoUrl = result
              }
              resolve()
            }
            logoImg.onerror = () => {
              toast.error(`โหลด ${selectedLogoOption.name} ไม่สำเร็จ`)
              resolve()
            }
            logoImg.src = selectedLogoOption.path!
          })
        }

        const options: Options = {
          width: 400,
          height: 400,
          type: 'canvas',
          data: text,
          margin: 10,
          dotsOptions: {
            color: '#0b1220',
            type: selectedStyle as NonNullable<Options['dotsOptions']>['type'],
          },
          cornersSquareOptions: {
            color: '#0b1220',
            type: selectedStyle === 'dots' ? 'dot' : selectedStyle === 'extra-rounded' ? 'extra-rounded' : 'square',
          },
          cornersDotOptions: {
            color: '#0b1220',
            type: selectedStyle === 'dots' ? 'dot' : 'square',
          },
          backgroundOptions: {
            color: '#ffffff',
          },
        }

        const qrCode = new QRCodeStyling(options)
        qrRef.current = qrCode

        // Render QR to a blob
        const blob = await qrCode.getRawData('png')
        if (blob) {
          if (!processedLogoUrl) {
            // No logo — the raw QR IS the final image
            finalBlobRef.current = blob as Blob
            objectUrl = URL.createObjectURL(blob as Blob)
            setQrCodeUrl(objectUrl)
          } else {
            // Composite the logo onto the QR, then keep the composited blob as the final image
            const qrImg = new Image()
            const logoImg = new Image()
            const qrUrl = URL.createObjectURL(blob as Blob)

            await new Promise<void>((resolve) => {
              let loaded = 0
              const checkDone = () => {
                loaded++
                if (loaded === 2) resolve()
              }
              qrImg.onload = checkDone
              logoImg.onload = checkDone
              qrImg.onerror = checkDone
              logoImg.onerror = checkDone
              qrImg.src = qrUrl
              logoImg.src = processedLogoUrl!
            })

            const finalCanvas = document.createElement('canvas')
            finalCanvas.width = 400
            finalCanvas.height = 400
            const ctx = finalCanvas.getContext('2d')

            if (ctx) {
              ctx.drawImage(qrImg, 0, 0, 400, 400)
              const x = (400 - logoImg.width) / 2
              const y = (400 - logoImg.height) / 2
              ctx.drawImage(logoImg, x, y)

              await new Promise<void>((resolve) => {
                finalCanvas.toBlob((finalBlob) => {
                  if (finalBlob) {
                    finalBlobRef.current = finalBlob
                    objectUrl = URL.createObjectURL(finalBlob)
                    setQrCodeUrl(objectUrl)
                  }
                  resolve()
                }, 'image/png', 1.0)
              })
            }

            URL.revokeObjectURL(qrUrl)
          }
        }
      } catch (error) {
        console.error('Error generating QR code:', error)
        toast.error('สร้าง QR ไม่สำเร็จ ลองใหม่อีกครั้ง')
      } finally {
        setIsGenerating(false)
      }
    }

    const timeoutId = setTimeout(generateQR, 300)
    return () => {
      clearTimeout(timeoutId)
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [text, selectedLogo, selectedStyle])

  // Single source of truth for the exported image — always the composited final blob.
  const getFinalBlob = async (): Promise<Blob | null> => {
    if (finalBlobRef.current) return finalBlobRef.current
    if (qrRef.current) return (await qrRef.current.getRawData('png')) as Blob | null
    return null
  }

  const saveAsPNG = async () => {
    const blob = await getFinalBlob()
    if (!blob) {
      toast.error('ยังไม่มีโค้ดให้บันทึก')
      return
    }

    const file = new File([blob], `qrcode-${Date.now()}.png`, { type: 'image/png' })

    if (isMobile() && navigator.share && navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ title: 'QR Code', text: 'บันทึก QR โค้ดนี้ลงรูปภาพ', files: [file] })
        toast.success('เปิดเมนูแชร์แล้ว — เลือก "บันทึกลงรูปภาพ"')
        return
      } catch {
        // user cancelled or unsupported — fall through to direct download
      }
    }

    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = file.name
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
    toast.success('บันทึก QR โค้ดแล้ว')
  }

  const copyToClipboard = async () => {
    const blob = await getFinalBlob()
    if (!blob) {
      toast.error('ยังไม่มีโค้ดให้คัดลอก')
      return
    }

    const file = new File([blob], `qrcode-${Date.now()}.png`, { type: 'image/png' })

    if (isMobile()) {
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        try {
          await navigator.share({ title: 'QR Code', text: 'ดู QR โค้ดนี้สิ!', files: [file] })
          toast.success('แชร์แล้ว')
          return
        } catch {
          // fall through to instructions
        }
      }
      toast('กดค้างที่ QR โค้ดด้านบน แล้วเลือก "บันทึกลงรูปภาพ"', { duration: 6000, icon: '💡' })
      return
    }

    try {
      if (navigator.clipboard && 'write' in navigator.clipboard) {
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
        toast.success('คัดลอกไปยังคลิปบอร์ดแล้ว')
        return
      }
      toast('คลิกขวาที่ QR โค้ด แล้วเลือก "คัดลอกรูปภาพ"', { duration: 5000, icon: '💡' })
    } catch {
      toast('คลิกขวาที่ QR โค้ด แล้วเลือก "คัดลอกรูปภาพ"', { duration: 5000, icon: '💡' })
    }
  }

  const handleLogoSelect = (logoId: string) => {
    setSelectedLogo(logoId)
    setIsLogoDropdownOpen(false)
  }

  const handleStyleSelect = (styleId: string) => {
    setSelectedStyle(styleId)
    setIsStyleDropdownOpen(false)
  }

  const currentStyle = qrStyleOptions.find(s => s.id === selectedStyle)
  const currentLogo = logoOptions.find(l => l.id === selectedLogo)

  return (
    <main className="cosmic-bg relative h-screen w-full overflow-hidden text-text">
      {/* Faint science-doodle texture behind everything */}
      <div className="doodle-layer pointer-events-none absolute inset-0" />

      <div className="relative z-10 flex h-full flex-col">
        {/* Top bar */}
        <header className="flex items-center justify-between px-5 py-4 sm:px-8">
          <div className="flex items-center gap-2.5">
            <div className="grid h-8 w-8 place-items-center rounded-lg border border-line bg-panel">
              <QrCode className="h-4 w-4 text-gold" />
            </div>
            <div className="leading-none">
              <div className="text-sm font-semibold tracking-tight">สร้าง QR โค้ด</div>
              <div className="eyebrow mt-1 text-muted">mwit.link</div>
            </div>
          </div>
          <a
            href="https://mwit.ac.th"
            target="_blank"
            rel="noreferrer"
            className="eyebrow rounded-full border border-line px-3 py-1.5 text-muted transition-colors hover:border-line-strong hover:text-text"
          >
            MWIT
          </a>
        </header>

        {/* Console */}
        <div className="flex flex-1 items-center justify-center overflow-y-auto px-4 pb-6 sm:px-8">
          <div className="rise grid w-full max-w-5xl grid-cols-1 rounded-3xl border border-line bg-[var(--ink-2)]/70 shadow-[0_40px_120px_-40px_rgba(0,0,0,0.9)] backdrop-blur-xl lg:grid-cols-[1fr_1.05fr]">
            {/* Left — controls */}
            <section className="border-b border-line p-6 sm:p-8 lg:border-b-0 lg:border-r">
              <p className="eyebrow text-gold">ตั้งค่า</p>
              <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-[1.75rem]">
                สร้าง QR โค้ดของคุณ
              </h1>
              <p className="mt-1.5 text-sm text-muted">
                พิมพ์ลิงก์ เลือกสไตล์ ใส่โลโก้ แล้วดูผลได้ทันที
              </p>

              <div className="mt-7 space-y-6">
                {/* Content */}
                <div>
                  <label htmlFor="text-input" className="eyebrow mb-2 flex items-center gap-2 text-muted">
                    <Link2 className="h-3.5 w-3.5" /> เนื้อหา
                  </label>
                  <div className="relative">
                    <input
                      id="text-input"
                      type="text"
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      placeholder="วางลิงก์ หรือข้อความใดก็ได้…"
                      className="w-full rounded-xl border border-line bg-[var(--panel)] px-4 py-3 text-sm text-text outline-none transition-colors placeholder:text-muted/70 focus:border-gold/60"
                    />
                    {isGenerating && (
                      <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-gold border-t-transparent" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Style */}
                <div>
                  <label className="eyebrow mb-2 flex items-center gap-2 text-muted">
                    <Palette className="h-3.5 w-3.5" /> สไตล์โมดูล
                  </label>
                  <div className="relative" ref={styleDropdownRef}>
                    <button
                      type="button"
                      onClick={() => setIsStyleDropdownOpen(!isStyleDropdownOpen)}
                      className="flex w-full items-center justify-between rounded-xl border border-line bg-[var(--panel)] px-4 py-3 text-sm text-text transition-colors hover:border-line-strong"
                    >
                      <span>{currentStyle?.name ?? 'เลือกสไตล์'}</span>
                      <ChevronDown className={`h-4 w-4 text-muted transition-transform duration-200 ${isStyleDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {isStyleDropdownOpen && (
                      <div className="thin-scroll absolute left-0 right-0 top-full z-30 mt-2 max-h-56 overflow-y-auto rounded-xl border border-line bg-[var(--panel-2)] p-1.5 shadow-2xl">
                        {qrStyleOptions.map((style) => (
                          <button
                            key={style.id}
                            type="button"
                            onClick={() => handleStyleSelect(style.id)}
                            className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-white/5 ${selectedStyle === style.id ? 'bg-white/5' : ''}`}
                          >
                            <div className="min-w-0 flex-1">
                              <div className="text-sm font-medium text-text">{style.name}</div>
                              <div className="truncate text-xs text-muted">{style.description}</div>
                            </div>
                            {selectedStyle === style.id && <Check className="h-4 w-4 flex-shrink-0 text-gold" />}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Logo */}
                <div>
                  <label className="eyebrow mb-2 flex items-center gap-2 text-muted">
                    <ImageIcon className="h-3.5 w-3.5" /> โลโก้ตรงกลาง
                  </label>
                  <div className="relative" ref={logoDropdownRef}>
                    <button
                      type="button"
                      onClick={() => setIsLogoDropdownOpen(!isLogoDropdownOpen)}
                      className="flex w-full items-center justify-between rounded-xl border border-line bg-[var(--panel)] px-4 py-3 text-sm text-text transition-colors hover:border-line-strong"
                    >
                      <span className="flex items-center gap-2.5">
                        {currentLogo?.path && (
                          <span className="grid h-6 w-6 place-items-center rounded-md bg-white/90">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={currentLogo.path} alt="" className="h-4 w-4 object-contain" />
                          </span>
                        )}
                        {currentLogo?.name ?? 'เลือกโลโก้'}
                      </span>
                      <ChevronDown className={`h-4 w-4 text-muted transition-transform duration-200 ${isLogoDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {isLogoDropdownOpen && (
                      <div className="thin-scroll absolute left-0 right-0 top-full z-30 mt-2 max-h-56 overflow-y-auto rounded-xl border border-line bg-[var(--panel-2)] p-1.5 shadow-2xl">
                        {logoOptions.map((logo) => (
                          <button
                            key={logo.id}
                            type="button"
                            onClick={() => handleLogoSelect(logo.id)}
                            className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-white/5 ${selectedLogo === logo.id ? 'bg-white/5' : ''}`}
                          >
                            <span className="grid h-8 w-8 flex-shrink-0 place-items-center rounded-md border border-line bg-white/90">
                              {logo.path ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={logo.path} alt={logo.name} className="h-5 w-5 object-contain" />
                              ) : (
                                <QrCode className="h-4 w-4 text-slate-500" />
                              )}
                            </span>
                            <div className="min-w-0 flex-1">
                              <div className="text-sm font-medium text-text">{logo.name}</div>
                              <div className="truncate text-xs text-muted">{logo.description}</div>
                            </div>
                            {selectedLogo === logo.id && <Check className="h-4 w-4 flex-shrink-0 text-gold" />}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </section>

            {/* Right — preview */}
            <section className="flex flex-col items-center justify-center gap-6 rounded-b-3xl bg-[var(--ink)]/40 p-6 sm:p-8 lg:rounded-b-none lg:rounded-r-3xl">
              <p className="eyebrow self-start text-sky">ตัวอย่าง</p>

              {/* Scanner viewport */}
              <div className="relative aspect-square w-full max-w-[300px]">
                {/* Corner brackets — echo QR finder patterns */}
                {[
                  'left-0 top-0 border-l-2 border-t-2 rounded-tl-lg',
                  'right-0 top-0 border-r-2 border-t-2 rounded-tr-lg',
                  'left-0 bottom-0 border-l-2 border-b-2 rounded-bl-lg',
                  'right-0 bottom-0 border-r-2 border-b-2 rounded-br-lg',
                ].map((c, i) => (
                  <span key={i} className={`pointer-events-none absolute h-7 w-7 border-gold/80 ${c}`} />
                ))}

                <div className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-xl p-3">
                  {qrCodeUrl ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={qrCodeUrl}
                        alt="Generated QR code"
                        className="h-full w-full select-none rounded-lg object-contain shadow-[0_20px_60px_-20px_rgba(0,0,0,0.8)]"
                      />
                      {isGenerating && (
                        <span className="scanline pointer-events-none absolute inset-x-3 top-3 h-px bg-gold shadow-[0_0_12px_2px_rgba(255,182,39,0.7)]" />
                      )}
                    </>
                  ) : (
                    <div className="flex h-full w-full flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-line text-muted">
                      <QrCode className="h-10 w-10 opacity-40" />
                      <p className="text-sm">พิมพ์เพื่อเริ่มสร้าง</p>
                    </div>
                  )}
                </div>
              </div>

              {isMobile() && qrCodeUrl && (
                <p className="text-center text-xs text-muted">กดค้างที่โค้ดเพื่อบันทึกลงรูปภาพ</p>
              )}

              {/* Actions */}
              <div className="flex w-full max-w-[300px] flex-col gap-2.5 sm:flex-row">
                <button
                  onClick={saveAsPNG}
                  disabled={!qrCodeUrl}
                  className="group flex flex-1 items-center justify-center gap-2 rounded-xl bg-gold px-5 py-3 text-sm font-semibold text-[#1a1200] shadow-[0_10px_30px_-10px_rgba(255,182,39,0.6)] transition-all hover:brightness-105 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Download className="h-4 w-4" />
                  {isMobile() ? 'บันทึก' : 'ดาวน์โหลด'}
                </button>
                <button
                  onClick={copyToClipboard}
                  disabled={!qrCodeUrl}
                  className="group flex flex-1 items-center justify-center gap-2 rounded-xl border border-line-strong bg-white/5 px-5 py-3 text-sm font-semibold text-text transition-all hover:bg-white/10 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Copy className="h-4 w-4" />
                  {isMobile() ? 'แชร์' : 'คัดลอก'}
                </button>
              </div>
            </section>
          </div>
        </div>

        <footer className="pb-4 text-center">
          <p className="eyebrow text-muted/60">Made with care · mwit.link</p>
        </footer>
      </div>

      <Toaster
        position="bottom-center"
        toastOptions={{
          duration: 4000,
          style: {
            background: 'rgba(18,26,43,0.92)',
            backdropFilter: 'blur(12px)',
            color: '#e8edf6',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '14px',
            fontSize: '14px',
            padding: '12px 16px',
            fontWeight: '500',
          },
          success: { iconTheme: { primary: '#ffb627', secondary: '#121a2b' } },
          error: { iconTheme: { primary: '#ef4444', secondary: '#121a2b' } },
        }}
      />
    </main>
  )
}
