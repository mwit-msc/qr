'use client'

import { Suspense, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { readCustomLogo, renderQrCode, type LogoOption } from '@/lib/qr-renderer'
import type { QrCaption } from '@/lib/qr-caption'
import { normalizeHexColor, assessQrColors } from '@/lib/qr-colors.mjs'
import { parseQrUrlConfig } from '@/lib/qr-url-config.mjs'
import { toast, Toaster } from 'react-hot-toast'
import { Download, Copy, QrCode, Check, Link2, Palette, Image as ImageIcon, ArrowUpRight, LoaderCircle, Upload, X, RotateCcw, TriangleAlert, Type, AlignLeft, AlignCenter, AlignRight } from 'lucide-react'

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

const isMobile = () =>
  typeof navigator !== 'undefined' &&
  /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)

const urlConfigOptions = { logoIds: logoOptions.map(logo => logo.id), styleIds: qrStyleOptions.map(style => style.id) }

export default function QRCodeGenerator() {
  // A static homepage remains available while the browser resolves URL settings.
  return <Suspense fallback={<QRStudio config={parseQrUrlConfig('', urlConfigOptions)} />}><ConfiguredQRStudio /></Suspense>
}

function ConfiguredQRStudio() {
  const search = useSearchParams().toString()
  const config = parseQrUrlConfig(search, urlConfigOptions)
  return <QRStudio key={search} config={config} />
}

function QRStudio({ config }: { config: ReturnType<typeof parseQrUrlConfig> }) {
  const [text, setText] = useState(config.link)
  const [selectedLogo, setSelectedLogo] = useState(config.logo)
  const [selectedStyle, setSelectedStyle] = useState(config.style)
  const [customLogo, setCustomLogo] = useState<LogoOption | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [foregroundInput, setForegroundInput] = useState(config.foreground)
  const [backgroundInput, setBackgroundInput] = useState(config.background)
  const [exportSize, setExportSize] = useState(config.size)
  const [captionEnabled, setCaptionEnabled] = useState(config.caption)
  const [captionTitle, setCaptionTitle] = useState(config.title)
  const [captionDescription, setCaptionDescription] = useState(config.description)
  const [captionSize, setCaptionSize] = useState<QrCaption['size']>(config.fontSize)
  const [captionAlignment, setCaptionAlignment] = useState<QrCaption['alignment']>(config.align)
  const [generatedCode, setGeneratedCode] = useState<{ key: string; url: string; blob: Blob; width: number; height: number } | null>(null)
  const [generationError, setGenerationError] = useState<{ key: string; message: string } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const currentLogo = customLogo?.id === selectedLogo ? customLogo : logoOptions.find(logo => logo.id === selectedLogo)
  const currentStyle = qrStyleOptions.find(style => style.id === selectedStyle)
  const foreground = normalizeHexColor(foregroundInput)
  const background = normalizeHexColor(backgroundInput)
  const colorAssessment = foreground && background ? assessQrColors(foreground, background) : null
  const renderKey = JSON.stringify([text, selectedLogo, selectedStyle, exportSize, foreground, background, captionEnabled, captionTitle, captionDescription, captionSize, captionAlignment])
  const currentError = generationError?.key === renderKey ? generationError.message : null
  const isGenerating = Boolean(text.trim() && foreground && background && generatedCode?.key !== renderKey && !currentError)
  const canExport = Boolean(text.trim() && foreground && background && generatedCode?.key === renderKey && !isUploading)
  const qrCodeUrl = generatedCode?.url ?? ''

  useEffect(() => {
    if (!text.trim() || !foreground || !background) return
    let cancelled = false
    const timeout = setTimeout(async () => {
      try {
        const rendered = await renderQrCode({ text, style: selectedStyle, logo: currentLogo, size: exportSize, foreground, background,
          caption: { enabled: captionEnabled, title: captionTitle, description: captionDescription, size: captionSize, alignment: captionAlignment },
        })
        if (cancelled) return
        setGeneratedCode({ key: renderKey, url: URL.createObjectURL(rendered.blob), ...rendered })
        setGenerationError(null)
      } catch (error) {
        if (cancelled) return
        const message = error instanceof Error ? error.message : 'สร้าง QR ไม่สำเร็จ ลองใหม่อีกครั้ง'
        setGenerationError({ key: renderKey, message })
        toast.error(message)
      }
    }, 300)
    return () => { cancelled = true; clearTimeout(timeout) }
  }, [text, selectedStyle, currentLogo, exportSize, foreground, background, captionEnabled, captionTitle, captionDescription, captionSize, captionAlignment, renderKey])

  useEffect(() => {
    if (!generatedCode) return
    return () => URL.revokeObjectURL(generatedCode.url)
  }, [generatedCode])

  const uploadLogo = async (file: File) => {
    setIsUploading(true)
    try {
      const logo = await readCustomLogo(file)
      setCustomLogo(logo)
      setSelectedLogo(logo.id)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'โหลดรูปภาพไม่สำเร็จ ลองเลือกรูปอื่น')
    } finally {
      setIsUploading(false)
    }
  }

  const removeCustomLogo = () => {
    if (selectedLogo === customLogo?.id) setSelectedLogo('alvis')
    setCustomLogo(null)
  }

  const getFinalBlob = async (): Promise<Blob | null> => canExport ? generatedCode?.blob ?? null : null

  const saveAsPNG = async () => {
    const blob = await getFinalBlob()
    if (!blob) {
      toast.error('ยังไม่มีโค้ดให้บันทึก')
      return
    }

    const file = new File([blob], `qrcode-${exportSize}px-${Date.now()}.png`, { type: 'image/png' })

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

    const file = new File([blob], `qrcode-${exportSize}px-${Date.now()}.png`, { type: 'image/png' })

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

  return (
    <main className="qr-app">
      <div className="page-texture" aria-hidden="true" />
      <header className="site-header">
        <Link className="brand" href="/" aria-label="MWIT LINK QR Studio">
          <span className="brand-icon"><QrCode size={23} strokeWidth={1.7} /></span>
          <span className="brand-name">MWIT LINK<span className="brand-divider" /><span className="brand-product">QR Studio</span></span>
        </Link>
        <a className="school-link" href="https://mwit.ac.th" target="_blank" rel="noreferrer">
          MWIT <ArrowUpRight size={16} />
        </a>
      </header>

      <div className="studio">
        <div className="page-heading">
          <div>
            <h1>สร้าง QR โค้ดของคุณ</h1>
          </div>
        </div>

        <div className="workspace">
          <section className="settings-panel" aria-labelledby="settings-heading">
            <div className="panel-heading">
              <h2 id="settings-heading">ตั้งค่า</h2>
              <span className="panel-caption">ปรับแต่ง QR โค้ด</span>
            </div>

            <div className="setting-section content-section">
              <label className="field-label" htmlFor="text-input"><Link2 size={17} /> ลิงก์หรือข้อความ</label>
              <textarea
                id="text-input"
                value={text}
                onChange={event => setText(event.target.value)}
                placeholder="วางลิงก์ หรือข้อความใดก็ได้…"
                rows={2}
                spellCheck={false}
                aria-describedby="content-help"
              />
              <p className="field-help" id="content-help">QR โค้ดจะอัปเดตเมื่อคุณพิมพ์</p>
            </div>

            <fieldset className="setting-section caption-section">
              <legend className="field-label"><Type size={17} /> ข้อความใต้ QR โค้ด</legend>
              <label className="caption-toggle"><input type="checkbox" checked={captionEnabled} onChange={event => setCaptionEnabled(event.target.checked)} />แสดงข้อความใต้โค้ด</label>
              {captionEnabled && (
                <div className="caption-controls">
                  <div className="caption-text-field">
                    <label htmlFor="caption-title">ชื่อ QR โค้ด</label>
                    <input id="caption-title" type="text" value={captionTitle} maxLength={80} onChange={event => setCaptionTitle(event.target.value)} placeholder="เช่น Open House 2026" />
                  </div>
                  <div className="caption-text-field">
                    <label htmlFor="caption-description">ข้อความเพิ่มเติม <span>ไม่บังคับ</span></label>
                    <input id="caption-description" type="text" value={captionDescription} maxLength={120} onChange={event => setCaptionDescription(event.target.value)} placeholder="เช่น วันที่จัดงาน หรือคำอธิบายสั้น ๆ" />
                  </div>
                  <div className="caption-format-row">
                    <fieldset className="caption-choice-group">
                      <legend>ขนาดตัวอักษร</legend>
                      <div className="caption-choices">
                        {([{id:'small', name:'เล็ก'}, {id:'medium', name:'กลาง'}, {id:'large', name:'ใหญ่'}] as const).map(option => (
                          <label key={option.id} className={captionSize === option.id ? 'selected' : ''}>
                            <input type="radio" name="caption-size" value={option.id} checked={captionSize === option.id} onChange={() => setCaptionSize(option.id)} />{option.name}
                          </label>
                        ))}
                      </div>
                    </fieldset>
                    <fieldset className="caption-choice-group">
                      <legend>จัดตำแหน่ง</legend>
                      <div className="caption-choices">
                        {([{id:'left', name:'ซ้าย', Icon:AlignLeft}, {id:'center', name:'กลาง', Icon:AlignCenter}, {id:'right', name:'ขวา', Icon:AlignRight}] as const).map(({id,name,Icon}) => (
                          <label key={id} className={captionAlignment === id ? 'selected' : ''}>
                            <input type="radio" name="caption-alignment" value={id} checked={captionAlignment === id} onChange={() => setCaptionAlignment(id)} />
                            <Icon size={15} aria-hidden="true" /><span className="sr-only">{name}</span>
                          </label>
                        ))}
                      </div>
                    </fieldset>
                  </div>
                </div>
              )}
            </fieldset>

            <fieldset className="setting-section">
              <legend className="field-label"><Palette size={17} /> สไตล์โมดูล</legend>
              <div className="style-grid">
                {qrStyleOptions.map(style => (
                  <label key={style.id} className={`style-option ${selectedStyle === style.id ? 'selected' : ''}`}>
                    <input type="radio" name="qr-style" value={style.id} checked={selectedStyle === style.id} onChange={() => setSelectedStyle(style.id)} />
                    <span className={`style-sample sample-${style.id}`} aria-hidden="true">
                      {[1,1,0,1,1,1,0,1,0,1,0,1,1,1,0,1,0,1,0,1,1,1,0,1,1].map((filled, index) => <span key={index} className={filled ? 'filled' : ''} />)}
                    </span>
                    <span className="option-name">{style.name}</span>
                    {selectedStyle === style.id && <Check className="selection-check" size={13} aria-hidden="true" />}
                  </label>
                ))}
              </div>
            </fieldset>

            <fieldset className="setting-section logo-section">
              <legend className="field-label"><ImageIcon size={17} /> โลโก้ตรงกลาง</legend>
              <div className="logo-grid">
                {logoOptions.map(logo => (
                  <label key={logo.id} className={`logo-option ${selectedLogo === logo.id ? 'selected' : ''}`}>
                    <input type="radio" name="qr-logo" value={logo.id} checked={selectedLogo === logo.id} onChange={() => setSelectedLogo(logo.id)} />
                    <span className={`logo-thumbnail ${logo.path ? '' : 'no-logo'}`}>
                      {logo.path ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={logo.path} alt="" />
                      ) : <QrCode size={24} strokeWidth={1.4} />}
                    </span>
                    <span className="logo-name">{logo.name}</span>
                    {selectedLogo === logo.id && <Check className="selection-check" size={13} aria-hidden="true" />}
                  </label>
                ))}
              </div>
              <p className="field-help logo-description">{currentLogo?.description}</p>
              {customLogo && (
                <div className="custom-logo-row">
                  <label className={`custom-logo-option ${selectedLogo === customLogo.id ? 'selected' : ''}`}>
                    <input type="radio" name="qr-logo" value={customLogo.id} checked={selectedLogo === customLogo.id} onChange={() => setSelectedLogo(customLogo.id)} />
                    <span className="logo-thumbnail">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={customLogo.path!} alt="" />
                    </span>
                    <span className="custom-logo-copy"><strong>โลโก้ของคุณ</strong><span title={customLogo.name}>{customLogo.name}</span></span>
                    {selectedLogo === customLogo.id && <Check size={16} aria-hidden="true" />}
                  </label>
                  <button type="button" className="remove-logo-button" onClick={removeCustomLogo} aria-label="ลบโลโก้ที่อัปโหลด"><X size={17} /></button>
                </div>
              )}
              <input ref={fileInputRef} className="upload-input" type="file" accept="image/png,image/jpeg,image/webp" aria-label="เลือกไฟล์โลโก้" disabled={isUploading} onChange={event => {
                const file = event.target.files?.[0]
                event.target.value = ''
                if (file) void uploadLogo(file)
              }} />
              <button type="button" className="upload-button" disabled={isUploading} onClick={() => fileInputRef.current?.click()} aria-describedby="upload-help">
                {isUploading ? <LoaderCircle className="loading-icon" size={16} /> : <Upload size={16} />}
                {isUploading ? 'กำลังโหลดโลโก้' : customLogo ? 'เปลี่ยนรูปโลโก้' : 'อัปโหลดโลโก้ของคุณ'}
              </button>
              <p className="field-help" id="upload-help">PNG, JPG, WebP ไม่เกิน 5 MB</p>
            </fieldset>

            <fieldset className="setting-section color-section">
              <legend className="field-label"><Palette size={17} /> สี QR โค้ด</legend>
              <div className="color-grid">
                <ColorField id="foreground" label="สีโค้ด" value={foregroundInput} onChange={setForegroundInput} fallback="#0B1220" />
                <ColorField id="background" label="สีพื้นหลัง" value={backgroundInput} onChange={setBackgroundInput} fallback="#FFFFFF" />
              </div>
              {colorAssessment && (
                <p className={`contrast-hint ${colorAssessment.lowContrast || colorAssessment.inverted ? 'contrast-warning' : ''}`} role="status">
                  {colorAssessment.lowContrast || colorAssessment.inverted ? <TriangleAlert size={16} /> : <Check size={16} />}
                  <span>{colorAssessment.inverted ? 'แนะนำให้ใช้โค้ดสีเข้มบนพื้นหลังสีอ่อน' : colorAssessment.lowContrast ? 'สีใกล้กันเกินไป อาจสแกนได้ยาก' : 'สีตัดกันชัดเจน'}<small>ความต่างสี {colorAssessment.ratio.toFixed(1)}:1</small></span>
                </p>
              )}
              <button className="reset-colors-button" type="button" onClick={() => { setForegroundInput('#0B1220'); setBackgroundInput('#FFFFFF') }}><RotateCcw size={13} />ใช้สีเริ่มต้น</button>
            </fieldset>
          </section>

          <section className="preview-panel" aria-labelledby="preview-heading">
            <div className="panel-heading">
              <h2 id="preview-heading">ตัวอย่าง</h2>
              {(isUploading || isGenerating || !foreground || !background || currentError) && (
                <span className="preview-status" role="status">
                  {(isUploading || isGenerating) && <LoaderCircle className="loading-icon" size={13} />}
                  {isUploading ? 'กำลังโหลดโลโก้' : isGenerating ? 'กำลังสร้าง' : !foreground || !background ? 'ตรวจสอบรหัสสี' : 'สร้างไม่สำเร็จ'}
                </span>
              )}
            </div>

            <div className={`preview-stage ${isGenerating ? 'preview-updating' : ''}`} aria-busy={isGenerating}>
              <div className="qr-paper">
                <div className="qr-image" style={{ aspectRatio: generatedCode ? `${generatedCode.width} / ${generatedCode.height}` : '1' }}>
                  {qrCodeUrl && text.trim() ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={qrCodeUrl} alt="QR โค้ดที่สร้างจากลิงก์หรือข้อความของคุณ" width={generatedCode?.width ?? 400} height={generatedCode?.height ?? 400} />
                  ) : (
                    <div className="empty-preview">{isGenerating ? <LoaderCircle className="loading-icon" size={32} /> : <QrCode size={52} strokeWidth={1} />}<p>{isGenerating ? 'กำลังสร้าง QR โค้ด' : 'พิมพ์เพื่อเริ่มสร้าง'}</p></div>
                  )}
                </div>
              </div>
            </div>

            <div className="export-area">
              {currentError && <p className="render-error" role="alert">{currentError}</p>}
              <div className="preview-details">
                <span className="file-icon"><ImageIcon size={19} strokeWidth={1.5} /></span>
                <div><strong title={captionEnabled ? captionTitle : undefined}>{captionEnabled && captionTitle.trim() ? captionTitle : 'QR Code'}</strong><span>PNG <span aria-hidden="true">·</span> {generatedCode?.key === renderKey ? `${generatedCode.width.toLocaleString()} × ${generatedCode.height.toLocaleString()} px` : 'กำลังอัปเดตขนาด'}</span></div>
                <span className="style-summary">{currentStyle?.name}</span>
              </div>
              <div className="export-size-field">
                <label htmlFor="export-size">ความกว้างรูปภาพ</label>
                <select id="export-size" value={exportSize} onChange={event => setExportSize(Number(event.target.value))}>
                  <option value={400}>400 px</option>
                  <option value={1024}>1,024 px</option>
                  <option value={2048}>2,048 px</option>
                </select>
              </div>
              <button className="download-button" onClick={saveAsPNG} disabled={!canExport}>
                <Download size={18} />{isMobile() ? 'บันทึก PNG' : 'ดาวน์โหลด PNG'}
              </button>
              <button className="copy-button" onClick={copyToClipboard} disabled={!canExport}>
                <Copy size={16} />{isMobile() ? 'แชร์รูปภาพ' : 'คัดลอกรูปภาพ'}
              </button>
            </div>
          </section>
        </div>

        <footer className="site-footer"><span lang="en">Made with 💙 by MWIT-LINK Development Team</span><a href="https://mwit.link" target="_blank" rel="noreferrer">mwit.link <ArrowUpRight size={13} /></a></footer>
      </div>

      <Toaster position="bottom-center" toastOptions={{
        duration: 4000,
        style: { background: '#292929', color: '#f3f3f5', border: '1px solid #424e65', borderRadius: '12px', fontSize: '14px', padding: '12px 16px' },
        success: { iconTheme: { primary: '#85A9FF', secondary: '#292929' } },
        error: { iconTheme: { primary: '#ff9ca7', secondary: '#292929' } },
      }} />
    </main>
  )
}

function ColorField({ id, label, value, onChange, fallback }: {
  id: string; label: string; value: string; onChange: (value: string) => void; fallback: string
}) {
  const normalized = normalizeHexColor(value)
  return (
    <div className="color-field">
      <label htmlFor={`${id}-hex`}>{label}</label>
      <div className="color-input-row">
        <input type="color" value={normalized ?? fallback} onChange={event => onChange(event.target.value.toUpperCase())} aria-label={`เลือก${label}`} />
        <input id={`${id}-hex`} type="text" value={value} maxLength={7} onChange={event => onChange(event.target.value)} spellCheck={false} autoComplete="off" aria-invalid={!normalized} aria-describedby={!normalized ? `${id}-error` : undefined} />
      </div>
      {!normalized && <p className="color-error" id={`${id}-error`}>ใช้รหัสสี 6 หลัก เช่น #85A9FF</p>}
    </div>
  )
}
