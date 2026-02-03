import { useState, useRef, useImperativeHandle, forwardRef } from 'react'
import html2canvas from 'html2canvas'
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
}

const Toolbar = forwardRef<ToolbarRef, ToolbarProps>(({ code, setCode, error, onToggleChat, isEditorVisible, onToggleEditor, diagramName, onUpdateDiagramName, onNewTab }, ref) => {
  const { theme, toggleTheme, mermaidTheme, setMermaidTheme } = useTheme()
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

    // Ensure xmlns is present
    if (!clonedSvg.getAttribute('xmlns')) {
      clonedSvg.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
    }

    // Collect all Mermaid-related styles from the document
    // Mermaid often injects styles into the <head> that are needed for the SVG
    const svgStyles = document.querySelectorAll('style[id^="mermaid-"]');
    const defs = clonedSvg.querySelector('defs') || document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    if (!clonedSvg.querySelector('defs')) {
      clonedSvg.insertBefore(defs, clonedSvg.firstChild);
    }

    svgStyles.forEach(style => {
      const styleClone = style.cloneNode(true);
      defs.appendChild(styleClone);
    });

    // Fix: Ensure all text has a readable font and explicit fill if possible
    const texts = clonedSvg.querySelectorAll('text')
    texts.forEach(text => {
      const style = window.getComputedStyle(text)
      if (style.fontFamily === 'inherit' || !style.fontFamily) {
        text.style.fontFamily = 'Inter, system-ui, -apple-system, sans-serif'
      }

      // If the color isn't set explicitly, use the computed color to ensure visibility in external viewers
      if (!text.getAttribute('fill')) {
        text.setAttribute('fill', style.fill || (theme === 'dark' ? '#ffffff' : '#000000'))
      }
    })

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
    const previewContainer = document.querySelector('.preview-content')
    const svgElement = previewContainer?.querySelector('svg') as SVGSVGElement | null

    if (!svgElement || !previewContainer) {
      alert('No diagram to export')
      return
    }

    try {
      const canvas = await html2canvas(previewContainer as HTMLElement, {
        backgroundColor: theme === 'dark' ? '#1e1e1e' : '#ffffff',
        scale: 2,
        logging: false,
        useCORS: true,
        allowTaint: false,
      } as any)

      canvas.toBlob((blob) => {
        if (!blob) {
          alert('Failed to generate PNG')
          return
        }

        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${filename}.png`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
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
              {isFixing ? '[FIXING...]' : '[AI FIX]'}
            </button>
          )}
          <button onClick={onToggleChat} className="toolbar-btn text-btn" title="Toggle AI Chat">
            [CHAT]
          </button>
          <button onClick={onToggleEditor} className="toolbar-btn text-btn" title="Toggle Editor / Full Preview">
            {isEditorVisible ? '[FULL PREVIEW]' : '[SHOW EDITOR]'}
          </button>
        </div>

        <div className="toolbar-section">
          <select
            value={mermaidTheme}
            onChange={(e) => setMermaidTheme(e.target.value as any)}
            className="toolbar-select"
            title="Mermaid Theme"
          >
            <option value="slate">Slate</option>
            <option value="earth">Earth</option>
            <option value="cosmic">Cosmic</option>
            <option value="sage">Sage</option>
            <option value="royal">Royal</option>
          </select>
          <button onClick={toggleTheme} className="toolbar-btn text-btn" title="Toggle Theme">
            {theme === 'light' ? '[DARK]' : '[LIGHT]'}
          </button>
          <button onClick={() => setShowSettings(true)} className="toolbar-btn text-btn" title="Settings">
            [SETTINGS]
          </button>
        </div>

        <div className="toolbar-section toolbar-section-right">
          <button
            onClick={() => setShowHelp(true)}
            className="toolbar-btn text-btn"
            title="App Documentation & Features"
          >
            [INFO]
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
