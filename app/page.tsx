'use client'

import { useEffect, useRef, useState } from 'react'
import QRCode from 'qrcode'
import { toast, Toaster } from 'react-hot-toast'
import { Download, Copy, QrCode, Sparkles, Zap, ChevronDown } from 'lucide-react'

// Logo options in JSON format
const logoOptions = [
  {
    id: 'none',
    name: 'No Logo',
    path: null,
    description: 'QR code without logo overlay'
  },
  {
    id: 'alvis',
    name: 'Alvis Logo',
    path: '/logo_alvis.png',
    description: 'Default Alvis logo'
  },
  {
    id: 'openhouse2025',
    name: 'Open House 2025 Logo',
    path: '/logo_openhouse2025.png',
    description: 'Open House 2025 event logo'
  }
]

export default function QRCodeGenerator() {
  const [text, setText] = useState('https://mwit.ac.th')
  const [qrCodeUrl, setQrCodeUrl] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [selectedLogo, setSelectedLogo] = useState('alvis')
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  useEffect(() => {
    const generateQR = async () => {
      const canvas = canvasRef.current
      if (!canvas || !text.trim()) {
        setQrCodeUrl('')
        return
      }

      setIsGenerating(true)

      try {
        // Step 1: Generate QR code
        await QRCode.toCanvas(canvas, text, {
          width: 400,
          margin: 3,
          color: {
            dark: '#1e293b',
            light: '#ffffff',
          },
          errorCorrectionLevel: 'H', // High EC for logo
        })

        // Step 2: Draw logo at center (if selected)
        const selectedLogoOption = logoOptions.find(logo => logo.id === selectedLogo)
        
        if (selectedLogoOption && selectedLogoOption.path) {
          const ctx = canvas.getContext('2d')
          if (!ctx) return

          const logo = new Image()
          logo.src = selectedLogoOption.path
          logo.onload = () => {
            const logoSize = canvas.width * 0.2 // 20% of canvas width
            const x = (canvas.width - logoSize) / 2
            const y = (canvas.height - logoSize) / 2

            // Create white background with subtle shadow for logo
            ctx.fillStyle = '#ffffff'
            ctx.shadowColor = 'rgba(0, 0, 0, 0.1)'
            ctx.shadowBlur = 10
            ctx.fillRect(x - 8, y - 8, logoSize + 16, logoSize + 16)

            // Reset shadow
            ctx.shadowColor = 'transparent'
            ctx.shadowBlur = 0

            // Draw logo
            ctx.drawImage(logo, x, y, logoSize, logoSize)

            // Convert to data URL for display
            const dataUrl = canvas.toDataURL('image/png', 1.0)
            setQrCodeUrl(dataUrl)
            setIsGenerating(false)
          }

          logo.onerror = () => {
            // If logo fails to load, just use QR code without logo
            const dataUrl = canvas.toDataURL('image/png', 1.0)
            setQrCodeUrl(dataUrl)
            setIsGenerating(false)
            toast.error(`Failed to load ${selectedLogoOption.name}`)
          }
        } else {
          // No logo selected, just use plain QR code
          const dataUrl = canvas.toDataURL('image/png', 1.0)
          setQrCodeUrl(dataUrl)
          setIsGenerating(false)
        }
      } catch (error) {
        console.error('Error generating QR code:', error)
        toast.error('Failed to generate QR code')
        setIsGenerating(false)
      }
    }

    const timeoutId = setTimeout(() => {
      generateQR()
    }, 300) // Debounce for 300ms

    return () => clearTimeout(timeoutId)
  }, [text, selectedLogo])

  // Detect if device is mobile
  const isMobile = () => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  }

  // Save QR code as PNG with mobile-friendly approach
  const saveAsPNG = () => {
    if (!qrCodeUrl) {
      toast.error('No QR code to save')
      return
    }

    if (isMobile()) {
      // For mobile, try Web Share API first, then provide instructions
      if (navigator.share) {
        fetch(qrCodeUrl)
          .then(response => response.blob())
          .then(blob => {
            const file = new File([blob], `qrcode-${Date.now()}.png`, { type: 'image/png' })
            return navigator.share({
              title: 'QR Code',
              text: 'Save this QR code to your photos',
              files: [file]
            })
          })
          .then(() => {
            toast.success('📱 Share menu opened! Choose "Save to Photos"')
          })
          .catch(() => {
            // Fall back to download and show instructions
            const link = document.createElement('a')
            link.download = `qrcode-${Date.now()}.png`
            link.href = qrCodeUrl
            link.click()
            toast('📱 File downloaded! Check your Downloads folder, then save to Photos', {
              duration: 6000,
              icon: '💡'
            })
          })
      } else {
        // Standard download with mobile instructions
        const link = document.createElement('a')
        link.download = `qrcode-${Date.now()}.png`
        link.href = qrCodeUrl
        link.click()
        toast('📱 File downloaded! Check your Downloads folder, then save to Photos', {
          duration: 6000,
          icon: '💡'
        })
      }
    } else {
      // Desktop download
      const link = document.createElement('a')
      link.download = `qrcode-${Date.now()}.png`
      link.href = qrCodeUrl
      link.click()
      toast.success('🎉 QR code saved successfully!')
    }
  }

  // Copy QR code to clipboard or provide mobile-friendly alternative
  const copyToClipboard = async () => {
    if (!qrCodeUrl) {
      toast.error('No QR code to copy')
      return
    }

    // Check if we're on mobile
    if (isMobile()) {
      // For mobile devices, use Web Share API if available, otherwise show instructions
      if (navigator.share) {
        try {
          const response = await fetch(qrCodeUrl)
          const blob = await response.blob()
          const file = new File([blob], `qrcode-${Date.now()}.png`, { type: 'image/png' })
          
          await navigator.share({
            title: 'QR Code',
            text: 'Check out this QR code!',
            files: [file]
          })
          toast.success('📱 Shared successfully!')
          return
        } catch (error) {
          // Fall through to instructions
        }
      }
      
      // Show mobile-friendly instructions
      toast('📱 Long press the QR code image above and select "Save to Photos" or "Add to Photos"', {
        duration: 6000,
        icon: '💡'
      })
      return
    }

    // Desktop/laptop clipboard functionality
    try {
      // Check if clipboard API supports images
      if (navigator.clipboard && navigator.clipboard.write) {
        const response = await fetch(qrCodeUrl)
        const blob = await response.blob()
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
        toast.success('📋 QR code copied to clipboard!')
      } else {
        // Fallback for older browsers
        toast('💡 Right-click the QR code image and select "Copy image"', {
          duration: 5000,
          icon: '💡'
        })
      }
    } catch (error) {
      console.error('Error copying to clipboard:', error)
      toast('💡 Right-click the QR code image and select "Copy image"', {
        duration: 5000,
        icon: '💡'
      })
    }
  }

  // Handle logo selection
  const handleLogoSelect = (logoId: string) => {
    setSelectedLogo(logoId)
    setIsDropdownOpen(false)
    const selectedLogoOption = logoOptions.find(logo => logo.id === logoId)
    if (selectedLogoOption) {
      toast.success(`${selectedLogoOption.name} selected!`)
    }
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
      {/* Gradient overlay for background only */}
      <div className="absolute inset-0 bg-gradient-to-b via-transparent from-blue-500/60 to-yellow-300/60 pointer-events-none"></div>

      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-yellow-200/20 to-blue-300/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-blue-200/20 to-yellow-300/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="h-full flex flex-col relative z-10">
        <div className="container mx-auto px-4 py-3 max-w-4xl flex-1 flex flex-col min-h-0">
          {/* Compact Header */}
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

              {/* Logo Selection Dropdown */}
              <div>
                <label className="text-base font-semibold text-slate-800 flex items-center gap-2 mb-1">
                  <div className="w-2 h-2 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full"></div>
                  Choose Logo Overlay
                </label>
                <div className="relative" ref={dropdownRef}>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      setIsDropdownOpen(!isDropdownOpen)
                    }}
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
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                            }}
                          />
                        </div>
                      )}
                      <span>{logoOptions.find(logo => logo.id === selectedLogo)?.name || 'Select Logo'}</span>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {/* Fixed Dropdown Menu */}
                  {isDropdownOpen && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border-2 border-slate-200 rounded-xl shadow-xl z-[999] max-h-48 overflow-y-auto">
                      {logoOptions.map((logo) => (
                        <button
                          key={logo.id}
                          type="button"
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            handleLogoSelect(logo.id)
                          }}
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
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
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
          <div className="pt-1"></div>
            <div className="text-center flex-1 flex flex-col min-h-0">
              <h2 className="text-xl font-bold text-slate-800 flex items-center justify-center gap-2">
                Your QR Code
              </h2>

              {qrCodeUrl ? (
                <div className="flex-1 flex flex-col items-center justify-center min-h-0">
                  <div className="relative group flex-shrink-0">
                    <div className="absolute -inset-2 rounded-2xl blur-lg opacity-40 group-hover:opacity-60 transition-opacity duration-500"></div>
                    <div className="relative p-3 bg-white rounded-2xl shadow-lg border border-slate-100">
                      <img
                        src={qrCodeUrl}
                        alt="Generated QR Code"
                        className="w-48 h-48 md:w-56 md:h-56 object-contain rounded-xl shadow-md select-none"
                        onContextMenu={(e) => {
                          // Allow context menu on mobile for save option
                          if (isMobile()) {
                            return true
                          }
                        }}
                      />
                      {isMobile() && (
                        <div className="absolute bottom-1 left-1 right-1 bg-black/70 text-white text-xs px-2 py-1 rounded-lg text-center opacity-75">
                          💡 Long press to save to photos
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
                <div className="flex-1 flex items-center justify-center min-h-0">
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

      {/* Hidden canvas for QR generation */}
      <canvas ref={canvasRef} className="hidden" />

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