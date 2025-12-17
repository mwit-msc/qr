'use client'

import { useEffect, useRef, useState } from 'react'
import QRCodeStyling, { type Options } from 'qr-code-styling'
import { toast, Toaster } from 'react-hot-toast'
import { Download, Copy, QrCode, Sparkles, ChevronDown } from 'lucide-react'

// Logo options - sizePercent controls logo size (100 = default, 200 = 2x larger, etc.)
const logoOptions = [
  {
    id: 'none',
    name: 'No Logo',
    path: null,
    description: 'QR code without logo overlay',
    sizePercent: 100
  },
  {
    id: 'alvis',
    name: 'Alvis Logo',
    path: '/logo_alvis.png',
    description: 'Default Alvis logo',
    sizePercent: 100
  },
  {
    id: 'openhouse2025',
    name: 'Open House 2025 Logo',
    path: '/logo_openhouse2025.png',
    description: 'Open House 2025 event logo',
    sizePercent: 100
  },
  {
    id: 'premwit2026',
    name: 'PRE-MWIT 2026 Logo',
    path: '/logo_premwit2026.png',
    description: 'PRE-MWIT 2026 Logo',
    sizePercent: 200
  }
]

// QR Style options
const qrStyleOptions = [
  { id: 'square', name: 'Square', description: 'Classic square modules' },
  { id: 'dots', name: 'Dots', description: 'Circular dot modules' },
  { id: 'rounded', name: 'Rounded', description: 'Rounded square modules' },
  { id: 'extra-rounded', name: 'Extra Rounded', description: 'Very rounded modules' },
  { id: 'classy', name: 'Classy', description: 'Elegant classy style' },
  { id: 'classy-rounded', name: 'Classy Rounded', description: 'Classy with rounded edges' },
]

// Helper to process logo with options
const processLogo = (
  logoImg: HTMLImageElement,
  maxSize: number,
  options: { removeWhiteBg: boolean; addOutline: boolean; outlineWidth?: number }
): Promise<string> => {
  return new Promise((resolve) => {
    const { removeWhiteBg, addOutline, outlineWidth = 6 } = options

    // Calculate scaled dimensions preserving aspect ratio
    const aspectRatio = logoImg.width / logoImg.height
    let scaledWidth: number, scaledHeight: number
    if (aspectRatio >= 1) {
      // Wider than tall
      scaledWidth = maxSize
      scaledHeight = Math.round(maxSize / aspectRatio)
    } else {
      // Taller than wide
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

    // Draw expanded version for outline
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
  const containerRef = useRef<HTMLDivElement>(null)

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
    const generateQR = async () => {
      if (!text.trim()) {
        setQrCodeUrl('')
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
                removeWhiteBg: true,
                addOutline: true,
                outlineWidth: 6
              })
              if (result && result.length > 0) {
                processedLogoUrl = result
              }
              resolve()
            }
            logoImg.onerror = () => {
              toast.error(`Failed to load ${selectedLogoOption.name}`)
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
            color: '#1e293b',
            type: selectedStyle as NonNullable<Options['dotsOptions']>['type'],
          },
          cornersSquareOptions: {
            color: '#1e293b',
            type: selectedStyle === 'dots' ? 'dot' : selectedStyle === 'extra-rounded' ? 'extra-rounded' : 'square',
          },
          cornersDotOptions: {
            color: '#1e293b',
            type: selectedStyle === 'dots' ? 'dot' : 'square',
          },
          backgroundOptions: {
            color: '#ffffff',
          },
        }

        // Create QR code instance (without image - we'll add it manually)
        const qrCode = new QRCodeStyling(options)
        qrRef.current = qrCode

        // Get QR as blob and convert to canvas for manual logo compositing
        const blob = await qrCode.getRawData('png')
        if (blob) {
          // If no logo, just use the QR code directly
          if (!processedLogoUrl) {
            const url = URL.createObjectURL(blob as Blob)
            setQrCodeUrl(url)
          } else {
            // Manually composite logo on top of QR code
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

            // Create final canvas
            const finalCanvas = document.createElement('canvas')
            finalCanvas.width = 400
            finalCanvas.height = 400
            const ctx = finalCanvas.getContext('2d')

            if (ctx) {
              // Draw QR code
              ctx.drawImage(qrImg, 0, 0, 400, 400)

              // Draw logo in center (use actual image dimensions)
              const x = (400 - logoImg.width) / 2
              const y = (400 - logoImg.height) / 2
              ctx.drawImage(logoImg, x, y)

              // Convert to blob URL
              await new Promise<void>((resolve) => {
                finalCanvas.toBlob((finalBlob) => {
                  if (finalBlob) {
                    const url = URL.createObjectURL(finalBlob)
                    setQrCodeUrl(url)
                  }
                  resolve()
                }, 'image/png', 1.0)
              })
            }

            URL.revokeObjectURL(qrUrl)
          }
        }

        setIsGenerating(false)
      } catch (error) {
        console.error('Error generating QR code:', error)
        toast.error('Failed to generate QR code')
        setIsGenerating(false)
      }
    }

    const timeoutId = setTimeout(generateQR, 300)
    return () => clearTimeout(timeoutId)
  }, [text, selectedLogo, selectedStyle])

  const isMobile = () => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  }

  const saveAsPNG = async () => {
    if (!qrRef.current) {
      toast.error('No QR code to save')
      return
    }

    if (isMobile()) {
      if (navigator.share) {
        try {
          const blob = await qrRef.current.getRawData('png')
          if (blob) {
            const file = new File([blob as Blob], `qrcode-${Date.now()}.png`, { type: 'image/png' })
            await navigator.share({
              title: 'QR Code',
              text: 'Save this QR code to your photos',
              files: [file]
            })
            toast.success('Share menu opened! Choose "Save to Photos"')
            return
          }
        } catch {
          // Fall through to download
        }
      }
    }

    qrRef.current.download({ name: `qrcode-${Date.now()}`, extension: 'png' })
    toast.success(isMobile() ? 'File downloaded! Check your Downloads folder' : 'QR code saved successfully!')
  }

  const copyToClipboard = async () => {
    if (!qrCodeUrl) {
      toast.error('No QR code to copy')
      return
    }

    if (isMobile()) {
      if (navigator.share && qrRef.current) {
        try {
          const blob = await qrRef.current.getRawData('png')
          if (blob) {
            const file = new File([blob as Blob], `qrcode-${Date.now()}.png`, { type: 'image/png' })
            await navigator.share({
              title: 'QR Code',
              text: 'Check out this QR code!',
              files: [file]
            })
            toast.success('Shared successfully!')
            return
          }
        } catch {
          // Fall through to instructions
        }
      }

      toast('Long press the QR code image above and select "Save to Photos"', {
        duration: 6000,
        icon: '\uD83D\uDCA1'
      })
      return
    }

    try {
      if (navigator.clipboard && navigator.clipboard.write && qrRef.current) {
        const blob = await qrRef.current.getRawData('png')
        if (blob) {
          await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob as Blob })])
          toast.success('QR code copied to clipboard!')
          return
        }
      }
      toast('Right-click the QR code image and select "Copy image"', {
        duration: 5000,
        icon: '\uD83D\uDCA1'
      })
    } catch {
      toast('Right-click the QR code image and select "Copy image"', {
        duration: 5000,
        icon: '\uD83D\uDCA1'
      })
    }
  }

  const handleLogoSelect = (logoId: string) => {
    setSelectedLogo(logoId)
    setIsLogoDropdownOpen(false)
    const option = logoOptions.find(logo => logo.id === logoId)
    if (option) toast.success(`${option.name} selected!`)
  }

  const handleStyleSelect = (styleId: string) => {
    setSelectedStyle(styleId)
    setIsStyleDropdownOpen(false)
    const option = qrStyleOptions.find(s => s.id === styleId)
    if (option) toast.success(`${option.name} style selected!`)
  }

  return (
    <div
      className="h-screen relative overflow-hidden"
      style={{
        backgroundImage: 'url(/coverbg.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-b via-transparent from-blue-500/60 to-yellow-300/60 pointer-events-none"></div>

      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-yellow-200/20 to-blue-300/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-blue-200/20 to-yellow-300/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="h-full flex flex-col relative z-10">
        <div className="container mx-auto px-4 py-3 max-w-4xl flex flex-col min-h-0">
          <div className="text-center mb-3">
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className="relative">
                <QrCode className="w-8 h-8 text-slate-800 drop-shadow-lg" />
                <Sparkles className="w-4 h-4 text-amber-600 absolute -top-1 -right-1 animate-pulse drop-shadow-lg" />
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-slate-900 drop-shadow-lg">
                QR Generator
              </h1>
            </div>
          </div>

          <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl border border-white/60 p-4 mb-3 hover:shadow-2xl transition-all duration-500 relative z-20 flex-1 flex flex-col min-h-0">
            <div className="space-y-3">
              {/* Text Input */}
              <div>
                <label htmlFor="text-input" className="text-base font-semibold text-slate-800 flex items-center gap-2 mb-1">
                  <div className="w-2 h-2 bg-gradient-to-r from-sky-500 to-blue-500 rounded-full"></div>
                  Enter your content
                </label>
                <div className="relative">
                  <input
                    id="text-input"
                    type="text"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Enter text, URL, or any content to generate QR code..."
                    className="w-full text-sm py-2.5 px-4 border-2 border-slate-200 focus:border-blue-500 rounded-xl bg-white shadow-inner transition-all duration-300 hover:shadow-md focus:shadow-lg focus:outline-none text-slate-900"
                  />
                  {isGenerating && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <div className="w-4 h-4 border-2 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  )}
                </div>
              </div>

              {/* Two dropdowns in a row */}
              <div className="grid grid-cols-2 gap-3">
                {/* QR Style Dropdown */}
                <div>
                  <label className="text-base font-semibold text-slate-800 flex items-center gap-2 mb-1">
                    <div className="w-2 h-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"></div>
                    QR Style
                  </label>
                  <div className="relative" ref={styleDropdownRef}>
                    <button
                      type="button"
                      onClick={() => setIsStyleDropdownOpen(!isStyleDropdownOpen)}
                      className="w-full text-sm py-2.5 px-4 border-2 border-slate-200 hover:border-purple-400 focus:border-purple-500 rounded-xl bg-white shadow-inner transition-all duration-300 hover:shadow-md focus:shadow-lg focus:outline-none text-slate-900 flex items-center justify-between"
                    >
                      <span>{qrStyleOptions.find(s => s.id === selectedStyle)?.name || 'Select Style'}</span>
                      <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform duration-200 ${isStyleDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {isStyleDropdownOpen && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border-2 border-slate-200 rounded-xl shadow-xl z-[999] max-h-48 overflow-y-auto">
                        {qrStyleOptions.map((style) => (
                          <button
                            key={style.id}
                            type="button"
                            onClick={() => handleStyleSelect(style.id)}
                            className={`w-full text-left px-3 py-2 hover:bg-slate-50 active:bg-slate-100 transition-colors duration-200 flex items-center gap-2 border-b border-slate-100 last:border-b-0 cursor-pointer ${
                              selectedStyle === style.id ? 'bg-purple-50 border-purple-200' : ''
                            }`}
                          >
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-sm text-slate-900">{style.name}</div>
                              <div className="text-xs text-slate-500 truncate">{style.description}</div>
                            </div>
                            {selectedStyle === style.id && (
                              <div className="w-2 h-2 bg-purple-500 rounded-full flex-shrink-0"></div>
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Logo Selection Dropdown */}
                <div>
                  <label className="text-base font-semibold text-slate-800 flex items-center gap-2 mb-1">
                    <div className="w-2 h-2 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full"></div>
                    Logo Overlay
                  </label>
                  <div className="relative" ref={logoDropdownRef}>
                    <button
                      type="button"
                      onClick={() => setIsLogoDropdownOpen(!isLogoDropdownOpen)}
                      className="w-full text-sm py-2.5 px-4 border-2 border-slate-200 hover:border-amber-400 focus:border-amber-500 rounded-xl bg-white shadow-inner transition-all duration-300 hover:shadow-md focus:shadow-lg focus:outline-none text-slate-900 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        {selectedLogo !== 'none' && logoOptions.find(logo => logo.id === selectedLogo)?.path && (
                          <div className="w-5 h-5 bg-slate-100 rounded border flex items-center justify-center">
                            <img
                              src={logoOptions.find(logo => logo.id === selectedLogo)?.path || ''}
                              alt=""
                              className="w-3 h-3 object-contain"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement
                                target.style.display = 'none'
                              }}
                            />
                          </div>
                        )}
                        <span>{logoOptions.find(logo => logo.id === selectedLogo)?.name || 'Select Logo'}</span>
                      </div>
                      <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform duration-200 ${isLogoDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {isLogoDropdownOpen && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border-2 border-slate-200 rounded-xl shadow-xl z-[999] max-h-48 overflow-y-auto">
                        {logoOptions.map((logo) => (
                          <button
                            key={logo.id}
                            type="button"
                            onClick={() => handleLogoSelect(logo.id)}
                            className={`w-full text-left px-3 py-2 hover:bg-slate-50 active:bg-slate-100 transition-colors duration-200 flex items-center gap-2 border-b border-slate-100 last:border-b-0 cursor-pointer ${
                              selectedLogo === logo.id ? 'bg-amber-50 border-amber-200' : ''
                            }`}
                          >
                            {logo.path ? (
                              <div className="w-6 h-6 bg-slate-100 rounded border flex items-center justify-center flex-shrink-0">
                                <img
                                  src={logo.path}
                                  alt={logo.name}
                                  className="w-4 h-4 object-contain"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement
                                    target.style.display = 'none'
                                  }}
                                />
                              </div>
                            ) : (
                              <div className="w-6 h-6 bg-slate-200 rounded border flex items-center justify-center flex-shrink-0">
                                <QrCode className="w-3 h-3 text-slate-500" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-sm text-slate-900">{logo.name}</div>
                              <div className="text-xs text-slate-500 truncate">{logo.description}</div>
                            </div>
                            {selectedLogo === logo.id && (
                              <div className="w-2 h-2 bg-amber-500 rounded-full flex-shrink-0"></div>
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

            </div>

            <div className="pt-1"></div>
            <div className="text-center flex flex-col min-h-0">
              <h2 className="text-xl font-bold text-slate-800 flex items-center justify-center gap-2">
                Your QR Code
              </h2>

              {qrCodeUrl ? (
                <div className="flex flex-col space-y-2 items-center justify-center min-h-0">
                  <div className="relative group flex-shrink-0">
                    <div className="absolute -inset-2 rounded-2xl blur-lg opacity-40 group-hover:opacity-60 transition-opacity duration-500"></div>
                    <div className="relative p-3 bg-white rounded-2xl shadow-lg border border-slate-100">
                      <img
                        src={qrCodeUrl}
                        alt="Generated QR Code"
                        className="w-48 h-48 md:w-56 md:h-56 object-contain rounded-xl shadow-md select-none"
                      />
                      {isMobile() && (
                        <div className="absolute bottom-1 left-1 right-1 bg-black/70 text-white text-xs px-2 py-1 rounded-lg text-center opacity-75">
                          Long press to save to photos
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 justify-center">
                    <button
                      onClick={saveAsPNG}
                      className="group flex items-center justify-center gap-2 bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-700 hover:to-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300"
                    >
                      <Download className="w-4 h-4 group-hover:animate-bounce" />
                      {isMobile() ? 'Save to Phone' : 'Save as PNG'}
                    </button>
                    <button
                      onClick={copyToClipboard}
                      className="group flex items-center justify-center gap-2 border-2 border-slate-300 hover:border-sky-400 hover:bg-sky-50 px-5 py-2.5 rounded-xl text-sm font-semibold bg-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300 text-slate-700"
                    >
                      <Copy className="w-4 h-4 group-hover:animate-pulse" />
                      {isMobile() ? 'Share/Copy' : 'Copy to Clipboard'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center min-h-0">
                  <div className="w-48 h-48 bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl flex items-center justify-center border-2 border-dashed border-slate-300 shadow-inner">
                    <div className="text-center text-slate-500">
                      <div className="relative mb-3">
                        <QrCode className="w-12 h-12 mx-auto opacity-40" />
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-r from-sky-400 to-blue-500 rounded-full animate-ping opacity-50"></div>
                      </div>
                      <p className="text-base font-medium">Start typing to generate</p>
                      <p className="text-xs mt-1 opacity-70">Your QR code will appear here</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div ref={containerRef} className="hidden" />

      <Toaster
        position="bottom-center"
        toastOptions={{
          duration: 4000,
          style: {
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            color: '#1e293b',
            border: '1px solid rgba(226, 232, 240, 0.5)',
            borderRadius: '16px',
            fontSize: '16px',
            padding: '16px 20px',
            fontWeight: '500',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#ffffff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#ffffff',
            },
          },
        }}
      />
    </div>
  )
}
