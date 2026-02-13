import { useState, useRef, useImperativeHandle, forwardRef } from 'react'
import { useTheme } from '../contexts/ThemeContext'
import { extractMermaidCode } from '../utils/mermaidCodeBlock'
import { fixMermaidErrorWithAI, getStoredConfig, convertJsonToMermaidWithAI } from '../utils/aiService'
import Settings from './Settings'
import HelpModal from './HelpModal'
import ExportModal from './ExportModal'
import './Toolbar.css'

interface ToolbarProps {
  code: string
  setCode: (code: string) => void
  error: string | null
  onToggleChat: () => void
  isEditorVisible: boolean
  onToggleEditor: () => void
  diagramName: string
  onUpdateDiagramName: (name: string) => void
  onNewTab: () => void
}

export interface ToolbarRef {
  handleNew: () => void
  handleOpen: () => void
  handleSave: () => void
  handleSettings: () => void
  handleHelp: () => void
}

const Toolbar = forwardRef<ToolbarRef, ToolbarProps>(({ code, setCode, error, onToggleChat, isEditorVisible, onToggleEditor, diagramName, onUpdateDiagramName, onNewTab }, ref) => {
  const { theme, toggleTheme } = useTheme()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [showSettings, setShowSettings] = useState(false)
  const [showHelp, setShowHelp] = useState(false)
  const [showExport, setShowExport] = useState(false)
  const [isFixing, setIsFixing] = useState(false)

  const handleNew = () => {
    onNewTab()
  }

  const handleOpen = () => {
    try {
      if (fileInputRef.current) {
        fileInputRef.current.click()
      } else {
        console.error('File input ref is not available')
        alert('Unable to open file dialog. Please try again.')
      }
    } catch (error) {
      console.error('Error opening file dialog:', error)
      alert('Failed to open file dialog. Please ensure your browser supports file selection.')
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) {
      return
    }

    // Validate file type
    const validExtensions = ['.mmd', '.txt', '.md', '.markdown', '.json']
    const fileName = file.name.toLowerCase()
    const isValid = validExtensions.some(ext => fileName.endsWith(ext))

    if (!isValid) {
      alert(`Invalid file type. Please select a file with one of these extensions: ${validExtensions.join(', ')}`)
      e.target.value = ''
      return
    }

    const reader = new FileReader()
    reader.onerror = () => {
      alert('Failed to read file. Please try again.')
      e.target.value = ''
    }

    reader.onload = async (event) => {
      try {
        const content = event.target?.result as string
        if (content) {
          if (fileName.endsWith('.json')) {
            if (confirm('A JSON file was detected. Should it be automatically converted to Mermaid syntax?')) {
              setIsFixing(true) // Reuse fixing state for loading indication
              try {
                const config = getStoredConfig()
                const convertedCode = await convertJsonToMermaidWithAI(content, config)
                setCode(convertedCode)
              } catch (err) {
                alert('Conversion failed: ' + (err instanceof Error ? err.message : 'Unknown error'))
              } finally {
                setIsFixing(false)
              }
            } else {
              // Just load as plain text if they refuse conversion
              setCode(content)
            }
          } else {
            // Extract Mermaid code from potential markdown code blocks
            const extractedCode = extractMermaidCode(content)
            setCode(extractedCode)
          }

          // Set diagram name from file name
          const nameWithoutExtension = file.name.replace(/\.[^/.]+$/, "")
          onUpdateDiagramName(nameWithoutExtension)

          console.log(`Successfully loaded file: ${file.name}`)
        } else {
          alert('File appears to be empty.')
        }
      } catch (error) {
        console.error('Error processing file:', error)
        alert('Failed to process file content.')
      }
      e.target.value = ''
    }

    reader.readAsText(file)
  }

  const handleSaveMMD = (filename: string) => {
    const blob = new Blob([code], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${filename}.mmd`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleExportSVG = (filename: string) => {
    const svgElement = document.querySelector('.preview-content svg') as SVGSVGElement | null
    if (!svgElement) {
      alert('No diagram to export')
      return
    }

    // Clone the SVG to avoid modifying the preview
    const clonedSvg = svgElement.cloneNode(true) as SVGSVGElement
    if (!clonedSvg.getAttribute('xmlns')) {
      clonedSvg.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
    }

    // 2. Prepare for style inlining
    const originalElements = svgElement.querySelectorAll('*')
    const clonedElements = clonedSvg.querySelectorAll('*')

    // Expanded property list to capture capitalization and spacing
    const stylesToCopy = [
      'fill', 'stroke', 'stroke-width', 'stroke-dasharray', 'opacity',
      'font-family', 'font-size', 'font-weight', 'text-anchor', 'display',
      'color', 'visibility', 'text-transform', 'letter-spacing'
    ]

    originalElements.forEach((origEl, i) => {
      const clonedEl = clonedElements[i] as SVGElement
      if (clonedEl && origEl instanceof Element) {
        const style = window.getComputedStyle(origEl)
        stylesToCopy.forEach(prop => {
          const val = style.getPropertyValue(prop)
          if (val && val !== 'none' && val !== 'normal') {
            clonedEl.style.setProperty(prop, val)
          }
        })

        // Force high quality system fonts for export consistency
        if (origEl.tagName === 'text') {
          clonedEl.style.fontFamily = 'Inter, system-ui, -apple-system, sans-serif'
        }
      }
    })

    // 3. Set proper dimensions and add background rect
    const bbox = svgElement.getBBox()
    const padding = 20
    const exportWidth = bbox.width + padding * 2
    const exportHeight = bbox.height + padding * 2

    clonedSvg.setAttribute('viewBox', `${bbox.x - padding} ${bbox.y - padding} ${exportWidth} ${exportHeight}`)
    clonedSvg.setAttribute('width', exportWidth.toString())
    clonedSvg.setAttribute('height', exportHeight.toString())

    // Add a physical background rectangle for the SVG
    const backgroundRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
    backgroundRect.setAttribute('x', (bbox.x - padding).toString())
    backgroundRect.setAttribute('y', (bbox.y - padding).toString())
    backgroundRect.setAttribute('width', exportWidth.toString())
    backgroundRect.setAttribute('height', exportHeight.toString())
    backgroundRect.setAttribute('fill', theme === 'dark' ? '#1e1e1e' : '#ffffff')
    clonedSvg.insertBefore(backgroundRect, clonedSvg.firstChild)

    // 4. Serialize and download
    const svgData = new XMLSerializer().serializeToString(clonedSvg)
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' })
    const url = URL.createObjectURL(svgBlob)

    const a = document.createElement('a')
    a.href = url
    a.download = `${filename}.svg`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleExportPNG = async (filename: string) => {
    const svgElement = document.querySelector('.preview-content svg') as SVGSVGElement | null
    if (!svgElement) {
      alert('No diagram to export. Please ensure you are in the Preview tab.')
      return
    }

    try {
      // 1. Get accurate dimensions
      const bbox = svgElement.getBBox()
      const padding = 20
      const width = bbox.width + padding * 2
      const height = bbox.height + padding * 2

      // 2. Calculate scale for 300 DPI (3.125 magnification)
      const scale = 3.125
      let targetWidth = width * scale
      let targetHeight = height * scale

      const MAX_SIDE = 12000
      if (targetWidth > MAX_SIDE || targetHeight > MAX_SIDE) {
        const ratio = Math.min(MAX_SIDE / targetWidth, MAX_SIDE / targetHeight)
        targetWidth *= ratio
        targetHeight *= ratio
        console.warn('Scaling down to fit browser canvas limits.')
      }

      // 3. Prepare the SVG clone with inlined styles
      const clonedSvg = svgElement.cloneNode(true) as SVGSVGElement
      clonedSvg.setAttribute('viewBox', `${bbox.x - padding} ${bbox.y - padding} ${width} ${height}`)
      clonedSvg.setAttribute('width', targetWidth.toString())
      clonedSvg.setAttribute('height', targetHeight.toString())

      const originalElements = svgElement.querySelectorAll('*')
      const clonedElements = clonedSvg.querySelectorAll('*')

      const stylesToCopy = [
        'fill', 'stroke', 'stroke-width', 'stroke-dasharray', 'opacity',
        'font-family', 'font-size', 'font-weight', 'text-anchor', 'display',
        'color', 'text-transform', 'letter-spacing'
      ]

      originalElements.forEach((origEl, i) => {
        const clonedEl = clonedElements[i] as SVGElement
        if (clonedEl && origEl instanceof Element) {
          const style = window.getComputedStyle(origEl)
          stylesToCopy.forEach(prop => {
            const val = style.getPropertyValue(prop)
            // Special handling: we WANT to copy 'none' for text-transform to force mixed case if needed
            if (prop === 'text-transform') {
              clonedEl.style.setProperty(prop, val)
            } else if (val && val !== 'none' && val !== 'normal') {
              clonedEl.style.setProperty(prop, val)
            }
          })

          if (origEl.tagName === 'text') {
            clonedEl.style.fontFamily = 'Inter, system-ui, -apple-system, sans-serif'
          }
        }
      })

      // 4. Convert SVG to Data URL
      const svgData = new XMLSerializer().serializeToString(clonedSvg)
      const base64 = btoa(unescape(encodeURIComponent(svgData)))
      const url = `data:image/svg+xml;base64,${base64}`

      // 5. Draw to Canvas
      const canvas = document.createElement('canvas')
      canvas.width = targetWidth
      canvas.height = targetHeight
      const ctx = canvas.getContext('2d', { willReadFrequently: true })
      if (!ctx) throw new Error('Could not create canvas context')

      ctx.fillStyle = theme === 'dark' ? '#1e1e1e' : '#ffffff'
      ctx.fillRect(0, 0, targetWidth, targetHeight)

      const img = new Image()
      await new Promise((resolve, reject) => {
        img.onload = () => {
          ctx.drawImage(img, 0, 0, targetWidth, targetHeight)
          resolve(null)
        }
        img.onerror = () => reject(new Error('Failed to render SVG to canvas'))
        img.src = url
      })

      // 6. Output Blob
      canvas.toBlob((blob) => {
        if (!blob) {
          alert('Failed to generate PNG blob')
          return
        }

        const pngUrl = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = pngUrl
        a.download = `${filename}.png`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(pngUrl)
      }, 'image/png')

    } catch (error) {
      console.error('PNG export error:', error)
      alert('Failed to export PNG: ' + (error instanceof Error ? error.message : 'Unknown error'))
    }
  }

  const handleExportClick = () => {
    setShowExport(true)
  }

  const onExport = (filename: string, format: 'svg' | 'png' | 'mmd') => {
    onUpdateDiagramName(filename)
    if (format === 'svg') handleExportSVG(filename)
    else if (format === 'png') handleExportPNG(filename)
    else if (format === 'mmd') handleSaveMMD(filename)
  }

  const handleCopyCode = () => {
    // Extract plain Mermaid code if wrapped, then wrap it for markdown
    const plainCode = extractMermaidCode(code)
    const codeBlock = `\`\`\`mermaid\n${plainCode}\n\`\`\``
    navigator.clipboard.writeText(codeBlock)
    alert('Code copied to clipboard!')
  }

  const handleAIFix = async () => {
    const config = getStoredConfig()

    if (!error || !code.trim()) {
      alert('No error to fix')
      return
    }

    setIsFixing(true)
    try {
      const fixedCode = await fixMermaidErrorWithAI(code, error, config)
      console.log('Setting fixed code:', fixedCode)
      setCode(fixedCode)
      alert('Code fixed! Check if the diagram renders correctly.')
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to fix code'
      console.error('AI Fix error:', err)
      alert(`AI Fix failed: ${errorMsg}`)
    } finally {
      setIsFixing(false)
    }
  }

  useImperativeHandle(ref, () => ({
    handleNew,
    handleOpen,
    handleSave: () => setShowExport(true),
    handleSettings: () => setShowSettings(true),
    handleHelp: () => setShowHelp(true),
  }))

  return (
    <>
      <div className={`toolbar ${theme}`}>
        <div className="toolbar-section">
          <button onClick={handleNew} className="toolbar-btn" title="New (⌘N)">
            New
          </button>
          <button onClick={handleOpen} className="toolbar-btn" title="Import / Open (⌘O)">
            Import...
          </button>
          <button onClick={handleExportClick} className="toolbar-btn button-primary" title="Export Diagram (⌘S)">
            Export...
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".mmd,.txt,.md,.markdown,.json"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
        </div>

        <div className="toolbar-section">
          <button onClick={handleCopyCode} className="toolbar-btn" title="Copy Code">
            Copy Code
          </button>
          {error && (
            <button
              onClick={handleAIFix}
              className="toolbar-btn ai-fix-btn"
              title="AI Fix Error (uses Ollama)"
              disabled={isFixing}
            >
              {isFixing ? 'FIXING...' : 'AI FIX'}
            </button>
          )}
          <button onClick={onToggleChat} className="toolbar-btn text-btn" title="Toggle AI Chat">
            CHAT
          </button>
          <button onClick={onToggleEditor} className="toolbar-btn text-btn" title="Toggle Editor / Full Preview">
            {isEditorVisible ? 'FULL PREVIEW' : 'SHOW EDITOR'}
          </button>
        </div>

        <div className="toolbar-section">
          <button onClick={toggleTheme} className="toolbar-btn text-btn" title="Toggle Theme">
            {theme === 'light' ? 'DARK' : 'LIGHT'}
          </button>
          <button onClick={() => setShowSettings(true)} className="toolbar-btn text-btn" title="Settings (⌘,)">
            SETTINGS
          </button>
        </div>

        <div className="toolbar-section toolbar-section-right">
          <button
            onClick={() => setShowHelp(true)}
            className="toolbar-btn text-btn"
            title="App Documentation & Features (⌘/)"
          >
            INFO
          </button>
        </div>
      </div>
      <Settings isOpen={showSettings} onClose={() => setShowSettings(false)} />
      <HelpModal isOpen={showHelp} onClose={() => setShowHelp(false)} />
      <ExportModal
        isOpen={showExport}
        onClose={() => setShowExport(false)}
        onExport={onExport}
        defaultFilename={diagramName}
      />
    </>
  )
})

Toolbar.displayName = 'Toolbar'

export default Toolbar
