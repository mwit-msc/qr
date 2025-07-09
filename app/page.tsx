'use client'

import { useEffect, useRef, useState } from 'react'
import QRCode from 'qrcode'
import { toast, Toaster } from 'react-hot-toast'
import { Download, Copy, QrCode, Sparkles, Zap, ChevronDown } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

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

// Animation variants
const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 }
}

const cardVariants = {
  initial: { opacity: 0, scale: 0.95, y: 30 },
  animate: { 
    opacity: 1, 
    scale: 1, 
    y: 0,
    transition: {
      duration: 0.6,
      ease: "easeOut"
    }
  }
}

const headerVariants = {
  initial: { opacity: 0, y: -30 },
  animate: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.8,
      ease: "easeOut"
    }
  }
}

const inputVariants = {
  initial: { opacity: 0, x: -20 },
  animate: { 
    opacity: 1, 
    x: 0,
    transition: {
      duration: 0.5,
      ease: "easeOut"
    }
  }
}

const dropdownVariants = {
  initial: { opacity: 0, x: 20 },
  animate: { 
    opacity: 1, 
    x: 0,
    transition: {
      duration: 0.5,
      ease: "easeOut"
    }
  }
}

const qrCodeVariants = {
  initial: { opacity: 0, scale: 0.8, rotateY: 90 },
  animate: { 
    opacity: 1, 
    scale: 1, 
    rotateY: 0,
    transition: {
      duration: 0.7,
      ease: "easeOut"
    }
  },
  exit: { 
    opacity: 0, 
    scale: 0.8,
    transition: {
      duration: 0.3
    }
  }
}

const buttonVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.4,
      ease: "easeOut"
    }
  },
  hover: { 
    scale: 1.05, 
    y: -2,
    transition: {
      duration: 0.2,
      ease: "easeInOut"
    }
  },
  tap: { 
    scale: 0.95,
    transition: {
      duration: 0.1
    }
  }
}

export default function QRCodeGenerator() {
  const [text, setText] = useState('https://mwit.ac.th')
  const [qrCodeUrl, setQrCodeUrl] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [selectedLogo, setSelectedLogo] = useState('alvis')
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Trigger animations on mount
  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 100)
    return () => clearTimeout(timer)
  }, [])

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
    <motion.div 
      className="h-screen relative overflow-hidden"
      initial="initial"
      animate="animate"
      variants={pageVariants}
      transition={{ duration: 0.8, ease: "easeOut" }}
      style={{
        backgroundImage: 'url(/coverbg.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {/* Gradient overlay for background only */}
      <motion.div 
        className="absolute inset-0 bg-gradient-to-b via-transparent from-blue-500/60 to-yellow-300/60 pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.2, delay: 0.3 }}
      />

      {/* Enhanced animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div 
          className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-yellow-200/20 to-blue-300/20 rounded-full blur-3xl"
          animate={{ 
            scale: [1, 1.1, 1],
            opacity: [0.3, 0.5, 0.3]
          }}
          transition={{ 
            duration: 4, 
            repeat: Infinity, 
            ease: "easeInOut" 
          }}
        />
        <motion.div 
          className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-blue-200/20 to-yellow-300/20 rounded-full blur-3xl"
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.2, 0.4, 0.2]
          }}
          transition={{ 
            duration: 5, 
            repeat: Infinity, 
            ease: "easeInOut",
            delay: 1
          }}
        />
        
        {/* Floating particles */}
        <motion.div 
          className="absolute top-1/4 left-1/4 w-2 h-2 bg-yellow-300/40 rounded-full"
          animate={{ 
            y: [-10, 10, -10],
            opacity: [0.4, 0.8, 0.4]
          }}
          transition={{ 
            duration: 3, 
            repeat: Infinity, 
            ease: "easeInOut" 
          }}
        />
        <motion.div 
          className="absolute top-3/4 right-1/3 w-1 h-1 bg-blue-400/40 rounded-full"
          animate={{ 
            scale: [1, 1.5, 1],
            opacity: [0.3, 0.7, 0.3]
          }}
          transition={{ 
            duration: 2, 
            repeat: Infinity, 
            ease: "easeInOut",
            delay: 0.5 
          }}
        />
        <motion.div 
          className="absolute bottom-1/3 left-1/2 w-1.5 h-1.5 bg-amber-300/40 rounded-full"
          animate={{ 
            x: [-5, 5, -5],
            opacity: [0.2, 0.6, 0.2]
          }}
          transition={{ 
            duration: 4, 
            repeat: Infinity, 
            ease: "easeInOut",
            delay: 1.2 
          }}
        />
      </div>

      <div className="h-full flex flex-col relative z-10">
        <div className="container mx-auto px-4 py-3 max-w-4xl flex-1 flex flex-col min-h-0">
          {/* Animated Header */}
          <motion.div 
            className="text-center mb-3"
            variants={headerVariants}
            initial="initial"
            animate="animate"
          >
            <div className="flex items-center justify-center gap-2 mb-2">
              <motion.div 
                className="relative"
                whileHover={{ scale: 1.1, rotate: 5 }}
                transition={{ duration: 0.3 }}
              >
                <QrCode className="w-8 h-8 text-slate-800 drop-shadow-lg" />
                <motion.div
                  animate={{ 
                    scale: [1, 1.2, 1],
                    opacity: [0.7, 1, 0.7]
                  }}
                  transition={{ 
                    duration: 2, 
                    repeat: Infinity, 
                    ease: "easeInOut" 
                  }}
                >
                  <Sparkles className="w-4 h-4 text-amber-600 absolute -top-1 -right-1 drop-shadow-lg" />
                </motion.div>
              </motion.div>
              <motion.h1 
                className="text-3xl md:text-4xl font-bold text-slate-900 drop-shadow-lg"
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.2 }}
              >
                QR Generator
              </motion.h1>
            </div>
          </motion.div>
          
          {/* Animated Main Card */}
          <motion.div 
            className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl border border-white/60 p-4 mb-3 hover:shadow-2xl transition-all duration-500 relative z-20 flex-1 flex flex-col min-h-0"
            variants={cardVariants}
            initial="initial"
            animate="animate"
            whileHover={{ 
              scale: 1.02,
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)"
            }}
            transition={{ duration: 0.3 }}
          >
            <div className="space-y-3">
              {/* Animated Text Input */}
              <motion.div
                variants={inputVariants}
                initial="initial"
                animate="animate"
                transition={{ delay: 0.2 }}
              >
                <label htmlFor="text-input" className="text-base font-semibold text-slate-800 flex items-center gap-2 mb-1">
                  <motion.div 
                    className="w-2 h-2 bg-gradient-to-r from-sky-500 to-blue-500 rounded-full"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                  Enter your content
                </label>
                <div className="relative">
                  <motion.input
                    id="text-input"
                    type="text"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Enter text, URL, or any content to generate QR code..."
                    className="w-full text-sm py-2.5 px-4 border-2 border-slate-200 focus:border-blue-500 rounded-xl bg-white shadow-inner transition-all duration-300 hover:shadow-md focus:shadow-lg focus:outline-none text-slate-900"
                    whileFocus={{ scale: 1.02 }}
                    transition={{ duration: 0.2 }}
                  />
                  <AnimatePresence>
                    {isGenerating && (
                      <motion.div 
                        className="absolute right-3 top-1/2 transform -translate-y-1/2"
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <motion.div 
                          className="w-4 h-4 border-2 border-sky-500 border-t-transparent rounded-full"
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>

              {/* Animated Logo Selection Dropdown */}
              <motion.div
                variants={dropdownVariants}
                initial="initial"
                animate="animate"
                transition={{ delay: 0.4 }}
              >
                <label className="text-base font-semibold text-slate-800 flex items-center gap-2 mb-1">
                  <motion.div 
                    className="w-2 h-2 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                  />
                  Choose Logo Overlay
                </label>
                <div className="relative" ref={dropdownRef}>
                  <motion.button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      setIsDropdownOpen(!isDropdownOpen)
                    }}
                    className="w-full text-sm py-2.5 px-4 border-2 border-slate-200 hover:border-amber-400 focus:border-amber-500 rounded-xl bg-white shadow-inner transition-all duration-300 hover:shadow-md focus:shadow-lg focus:outline-none text-slate-900 flex items-center justify-between"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="flex items-center gap-2">
                      {selectedLogo !== 'none' && logoOptions.find(logo => logo.id === selectedLogo)?.path && (
                        <motion.div 
                          className="w-5 h-5 bg-slate-100 rounded border flex items-center justify-center"
                          whileHover={{ scale: 1.1 }}
                          transition={{ duration: 0.2 }}
                        >
                          <img 
                            src={logoOptions.find(logo => logo.id === selectedLogo)?.path || ''} 
                            alt="" 
                            className="w-3 h-3 object-contain"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                            }}
                          />
                        </motion.div>
                      )}
                      <span>{logoOptions.find(logo => logo.id === selectedLogo)?.name || 'Select Logo'}</span>
                    </div>
                    <motion.div
                      animate={{ rotate: isDropdownOpen ? 180 : 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <ChevronDown className="w-4 h-4 text-slate-500" />
                    </motion.div>
                  </motion.button>
                  
                  {/* Enhanced Animated Dropdown Menu */}
                  <AnimatePresence>
                    {isDropdownOpen && (
                      <motion.div 
                        className="absolute top-full left-0 right-0 mt-1 bg-white border-2 border-slate-200 rounded-xl shadow-xl z-[999] max-h-48 overflow-y-auto"
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                      >
                        {logoOptions.map((logo, index) => (
                          <motion.button
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
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05, duration: 0.2 }}
                            whileHover={{ scale: 1.02, x: 5 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            {logo.path ? (
                              <motion.div 
                                className="w-6 h-6 bg-slate-100 rounded border flex items-center justify-center flex-shrink-0"
                                whileHover={{ scale: 1.1 }}
                                transition={{ duration: 0.2 }}
                              >
                                <img 
                                  src={logo.path} 
                                  alt={logo.name} 
                                  className="w-4 h-4 object-contain"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.style.display = 'none';
                                  }}
                                />
                              </motion.div>
                            ) : (
                              <motion.div 
                                className="w-6 h-6 bg-slate-200 rounded border flex items-center justify-center flex-shrink-0"
                                whileHover={{ scale: 1.1 }}
                                transition={{ duration: 0.2 }}
                              >
                                <QrCode className="w-3 h-3 text-slate-500" />
                              </motion.div>
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-sm text-slate-900">{logo.name}</div>
                              <div className="text-xs text-slate-500 truncate">{logo.description}</div>
                            </div>
                            {selectedLogo === logo.id && (
                              <motion.div 
                                className="w-2 h-2 bg-amber-500 rounded-full flex-shrink-0"
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ duration: 0.3 }}
                              />
                            )}
                          </motion.button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            </div>
            
            <div className="pt-1"></div>
            
            <motion.div 
              className="text-center flex-1 flex flex-col min-h-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.5 }}
            >
              <motion.h2 
                className="text-xl font-bold text-slate-800 flex items-center justify-center gap-2"
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.2 }}
              >
                Your QR Code
              </motion.h2>
              <div className="pt-2"></div>

              <AnimatePresence mode="wait">
                {qrCodeUrl ? (
                  <motion.div 
                    className=" flex flex-col items-center justify-center min-h-0"
                    key="qr-code"
                    variants={qrCodeVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                  >
                    <motion.div 
                      className="relative group flex-shrink-0"
                      whileHover={{ 
                        scale: 1.05,
                        rotateY: 5,
                        rotateX: 5
                      }}
                      transition={{ duration: 0.3 }}
                    >
                      <motion.div 
                        className="absolute -inset-2 rounded-2xl blur-lg opacity-40 group-hover:opacity-60 transition-opacity duration-500 bg-gradient-to-r from-sky-200 to-blue-300"
                        animate={{ 
                          scale: [1, 1.05, 1],
                          opacity: [0.4, 0.6, 0.4]
                        }}
                        transition={{ 
                          duration: 3, 
                          repeat: Infinity, 
                          ease: "easeInOut" 
                        }}
                      />
                      <div className="relative p-3 bg-white rounded-2xl shadow-lg border border-slate-100">
                        <img
                          src={qrCodeUrl}
                          alt="Generated QR Code"
                          className="w-48 h-48 md:w-56 md:h-56 object-contain rounded-xl shadow-md select-none"
                          onContextMenu={(e) => {
                            if (isMobile()) {
                              return true
                            }
                          }}
                        />
                        {isMobile() && (
                          <motion.div 
                            className="absolute bottom-1 left-1 right-1 bg-black/70 text-white text-xs px-2 py-1 rounded-lg text-center opacity-75"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 0.75 }}
                            transition={{ delay: 0.5 }}
                          >
                            💡 Long press to save to photos
                          </motion.div>
                        )}
                      </div>
                    </motion.div>
                    <div className="pt-8"></div>
                    
                    <motion.div 
                      className="flex flex-col sm:flex-row gap-2 justify-center"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3, duration: 0.4 }}
                    >
                      <motion.button
                        onClick={saveAsPNG}
                        className="group flex items-center justify-center gap-2 bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-700 hover:to-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-lg hover:shadow-xl transform transition-all duration-300"
                        variants={buttonVariants}
                        initial="initial"
                        animate="animate"
                        whileHover="hover"
                        whileTap="tap"
                      >
                        <motion.div
                          animate={{ y: [0, -2, 0] }}
                          transition={{ duration: 1, repeat: Infinity }}
                        >
                          <Download className="w-4 h-4" />
                        </motion.div>
                        {isMobile() ? 'Save to Phone' : 'Save as PNG'}
                      </motion.button>
                      <motion.button
                        onClick={copyToClipboard}
                        className="group flex items-center justify-center gap-2 border-2 border-slate-300 hover:border-sky-400 hover:bg-sky-50 px-5 py-2.5 rounded-xl text-sm font-semibold bg-white shadow-lg hover:shadow-xl transform transition-all duration-300 text-slate-700"
                        variants={buttonVariants}
                        initial="initial"
                        animate="animate"
                        whileHover="hover"
                        whileTap="tap"
                        transition={{ delay: 0.1 }}
                      >
                        <motion.div
                          animate={{ 
                            scale: [1, 1.1, 1],
                            opacity: [1, 0.7, 1]
                          }}
                          transition={{ duration: 2, repeat: Infinity }}
                        >
                          <Copy className="w-4 h-4" />
                        </motion.div>
                        {isMobile() ? 'Share/Copy' : 'Copy to Clipboard'}
                      </motion.button>
                    </motion.div>
                  </motion.div>
                ) : (
                  <motion.div 
                    className="flex-1 flex items-center justify-center min-h-0"
                    key="placeholder"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                  >
                    <motion.div 
                      className="w-48 h-48 bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl flex items-center justify-center border-2 border-dashed border-slate-300 shadow-inner"
                      whileHover={{ scale: 1.05 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="text-center text-slate-500">
                        <div className="relative mb-3">
                          <motion.div
                            animate={isGenerating ? { rotate: 360 } : { scale: [1, 1.1, 1] }}
                            transition={isGenerating ? { duration: 1, repeat: Infinity, ease: "linear" } : { duration: 2, repeat: Infinity }}
                          >
                            <QrCode className="w-12 h-12 mx-auto opacity-40" />
                          </motion.div>
                          <motion.div 
                            className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-r from-sky-400 to-blue-500 rounded-full"
                            animate={{ 
                              scale: [1, 1.5, 1],
                              opacity: [0.5, 1, 0.5]
                            }}
                            transition={{ 
                              duration: 1.5, 
                              repeat: Infinity 
                            }}
                          />
                        </div>
                        <motion.p 
                          className="text-base font-medium"
                          animate={{ opacity: [0.7, 1, 0.7] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        >
                          {isGenerating ? 'Generating...' : 'Start typing to generate'}
                        </motion.p>
                        <motion.p 
                          className="text-xs mt-1 opacity-70"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 0.7 }}
                          transition={{ delay: 0.5 }}
                        >
                          {isGenerating ? 'Please wait' : 'Your QR code will appear here'}
                        </motion.p>
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </motion.div>
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
    </motion.div>
  )
}