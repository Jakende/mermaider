import { useEffect, useRef, useState, useCallback } from 'react'
import mermaid from 'mermaid'
import { useTheme } from '../contexts/ThemeContext'
import { extractMermaidCode } from '../utils/mermaidCodeBlock'
import { isEditableDiagram, parseMermaidFlowchart } from '../utils/mermaidParser'
import VisualEditor from './VisualEditor'
import { mermaidThemes } from '../utils/mermaidThemes'
import './Preview.css'

interface PreviewProps {
  code: string
  setError: (error: string | null) => void
  onCodeChange?: (code: string) => void
  targetNodeId?: string | null
}

export default function Preview({ code, setError, onCodeChange, targetNodeId }: PreviewProps) {
  const { mermaidTheme } = useTheme()
  const mermaidContainerRef = useRef<HTMLDivElement>(null)
  const renderIdRef = useRef(0)
  const [isEditMode, setIsEditMode] = useState(false)

  // Zoom & Pan State
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState(false)
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 })

  const extractedCode = extractMermaidCode(code)
  const trimmedCode = extractedCode.trim()
  const parsedDiagram = trimmedCode ? parseMermaidFlowchart(trimmedCode) : null
  const canEdit = parsedDiagram !== null && isEditableDiagram(trimmedCode)

  const handleCodeChange = (newCode: string) => {
    if (onCodeChange) {
      onCodeChange(newCode)
    }
  }

  // Zoom Logic
  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.1, 20)) // Increased to 20x
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.1, 0.05)) // Decreased to 0.05x
  const handleZoomReset = () => {
    setZoom(1)
    setPan({ x: 0, y: 0 })
  }

  const handleWheel = (e: React.WheelEvent) => {
    // User requested mouse wheel zoom (usually implies without modifier, or standard behavior)
    // Standard CAD/Map behavior: Scroll to zoom, Drag to Pan.
    // However, in a document flow, Scroll usually scrolls.
    // If we want purely zoom on scroll:
    e.preventDefault()
    e.stopPropagation()
    const delta = e.deltaY > 0 ? -0.1 : 0.1
    setZoom(prev => Math.min(Math.max(prev + delta, 0.05), 20))
  }

  // Pan Logic
  const handleMouseDown = (e: React.MouseEvent) => {
    if (isEditMode) return
    setIsPanning(true)
    setLastMousePos({ x: e.clientX, y: e.clientY })
    document.body.style.cursor = 'grabbing'
  }

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isPanning) return
    e.preventDefault()
    const dx = e.clientX - lastMousePos.x
    const dy = e.clientY - lastMousePos.y
    setPan(prev => ({ x: prev.x + dx, y: prev.y + dy }))
    setLastMousePos({ x: e.clientX, y: e.clientY })
  }, [isPanning, lastMousePos])

  const handleMouseUp = useCallback(() => {
    setIsPanning(false)
    document.body.style.cursor = ''
  }, [])

  useEffect(() => {
    if (isPanning) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
    } else {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isPanning, handleMouseMove, handleMouseUp])


  useEffect(() => {
    // Get the configuration for the selected theme, defaulting to slate if somehow invalid
    // Cast to any to avoid strict indexing issues if types aren't perfectly aligned
    const themes = mermaidThemes as any
    const selectedTheme = themes[mermaidTheme] || themes.slate

    mermaid.initialize({
      startOnLoad: false,
      theme: selectedTheme.config.theme,
      themeVariables: selectedTheme.config.themeVariables,
      securityLevel: 'loose',
      fontFamily: 'inherit',
    })

    // Suppress Mermaid's default error rendering to the DOM
    mermaid.parseError = (err) => {
      console.log('Mermaid parsing error (suppressed default):', err);
    }

  }, [mermaidTheme])


  useEffect(() => {
    const timer = setTimeout(async () => {
      if (!mermaidContainerRef.current) return

      const currentId = ++renderIdRef.current
      const container = mermaidContainerRef.current

      // Don't render preview if we're in edit mode
      if (isEditMode && canEdit) {
        return
      }

      const trimmedCode = extractedCode.trim()

      if (!trimmedCode) {
        if (renderIdRef.current === currentId) {
          container.innerHTML = '<div class="empty-preview">Start typing your Mermaid diagram...</div>'
          setError(null)
        }
        return
      }

      try {
        // Validate syntax first
        mermaid.parse(trimmedCode)
        const id = `mermaid-${currentId}-${Date.now()}`

        // Render into a hidden element first
        const renderContainer = document.createElement('div')
        renderContainer.id = id
        renderContainer.style.position = 'absolute'
        renderContainer.style.left = '-9999px'
        renderContainer.style.top = '-9999px'
        document.body.appendChild(renderContainer)

        try {
          const result = await mermaid.render(id, trimmedCode)

          if (renderIdRef.current === currentId && container) {
            container.innerHTML = result.svg
            const svg = container.querySelector('svg')
            if (svg) {
              // Extract original dimensions from viewBox if possible
              const viewBox = svg.getAttribute('viewBox')?.split(' ')
              const originalWidth = viewBox ? parseFloat(viewBox[2]) : 0
              const originalHeight = viewBox ? parseFloat(viewBox[3]) : 0

              if (originalWidth && originalHeight) {
                // Store original dimensions for later use
                svg.setAttribute('data-original-width', originalWidth.toString())
                svg.setAttribute('data-original-height', originalHeight.toString())

                // Set current size based on zoom
                svg.style.width = `${originalWidth * zoom}px`
                svg.style.height = `${originalHeight * zoom}px`
              } else {
                // Fallback if viewBox is missing
                svg.style.width = '100%'
                svg.style.height = 'auto'
              }

              svg.removeAttribute('width')
              svg.removeAttribute('height')
              svg.style.maxWidth = 'none'

              // Apply rendering hints
              svg.style.imageRendering = 'crisp-edges'
              svg.style.imageRendering = '-webkit-optimize-contrast'
              svg.style.shapeRendering = 'geometricPrecision'
              svg.style.textRendering = 'geometricPrecision'
            }
            setError(null)
          }
        } finally {
          // Clean up
          if (renderContainer.parentNode) {
            renderContainer.parentNode.removeChild(renderContainer)
          }
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Invalid Mermaid syntax'
        setError(errorMsg)

        // Aggressively remove any error divs that Mermaid might have appended to the body
        const errorDivs = document.querySelectorAll('[id^="dmermaid-"], #dmermaid');
        errorDivs.forEach(div => div.remove());

        if (renderIdRef.current === currentId && container) {
          // Render error directly in preview container, centered or top
          container.innerHTML = `<div class="error-preview">
            <h3>Syntax Error</h3>
            <pre>${errorMsg}</pre>
          </div>`
        }
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [code, setError, mermaidTheme, isEditMode, canEdit, extractedCode])

  // Effect to handle zoom changes on existing SVG
  useEffect(() => {
    if (!mermaidContainerRef.current) return
    const svg = mermaidContainerRef.current.querySelector('svg')
    if (svg) {
      const originalWidth = svg.getAttribute('data-original-width')
      const originalHeight = svg.getAttribute('data-original-height')
      if (originalWidth && originalHeight) {
        svg.style.width = `${parseFloat(originalWidth) * zoom}px`
        svg.style.height = `${parseFloat(originalHeight) * zoom}px`
      }
    }
  }, [zoom])

  // Effect to zoom to targetNodeId
  useEffect(() => {
    if (!targetNodeId || !mermaidContainerRef.current) return

    const container = mermaidContainerRef.current
    // Try to find the element. Mermaid often uses nodeId as ID or class
    const element = container.querySelector(`[id^="${targetNodeId}-"]`) ||
      container.querySelector(`[id="${targetNodeId}"]`) ||
      container.querySelector(`.node[id*="${targetNodeId}"]`) ||
      Array.from(container.querySelectorAll('.node')).find(el => el.textContent?.trim() === targetNodeId)

    if (element) {
      const svg = container.querySelector('svg')
      if (svg) {
        // const svgBox = svg.getBoundingClientRect()
        const elBox = element.getBoundingClientRect()

        // Calculate position relative to container
        const centerX = (elBox.left + elBox.right) / 2
        const centerY = (elBox.top + elBox.bottom) / 2

        const viewport = container.closest('.preview-viewport')
        if (viewport) {
          const viewRect = viewport.getBoundingClientRect()
          const viewCenterX = (viewRect.left + viewRect.right) / 2
          const viewCenterY = (viewRect.top + viewRect.bottom) / 2

          const dx = viewCenterX - centerX
          const dy = viewCenterY - centerY

          setPan(prev => ({ x: prev.x + dx, y: prev.y + dy }))
          // Zoom in closer for better focus on the selected node
          setZoom(prev => Math.max(prev, 2.0))
        }
      }
    }
  }, [targetNodeId])

  // Show visual editor if in edit mode and diagram is editable
  if (isEditMode && canEdit && parsedDiagram) {
    return (
      <div className="preview-container">
        <div className="preview-header">
          <span>Visual Editor</span>
          <button
            className="mode-toggle-btn"
            onClick={() => setIsEditMode(false)}
            title="Switch to preview mode"
          >
            Preview Mode
          </button>
        </div>
        <VisualEditor
          parsedDiagram={parsedDiagram}
          onCodeChange={handleCodeChange}
        />
      </div>
    )
  }

  return (
    <div className="preview-container">
      <div className="preview-header">
        <span>Preview</span>
        <div className="preview-controls">
          <button onClick={handleZoomOut} className="zoom-btn" title="Zoom Out">-</button>
          <span className="zoom-level">{Math.round(zoom * 100)}%</span>
          <button onClick={handleZoomIn} className="zoom-btn" title="Zoom In">+</button>
          <button onClick={handleZoomReset} className="zoom-btn" title="Reset Zoom">⟲</button>
          {canEdit && (
            <button
              className="mode-toggle-btn"
              onClick={() => setIsEditMode(true)}
              title="Switch to visual edit mode"
              style={{ marginLeft: '8px' }}
            >
              Visual Edit
            </button>
          )}
        </div>
      </div>
      <div
        className="preview-viewport"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        style={{ cursor: isPanning ? 'grabbing' : 'grab' }}
      >
        <div
          className="preview-content"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px)`,
            transformOrigin: 'center center',
            transition: isPanning ? 'none' : 'transform 0.1s ease-out'
          }}
        >
          <div ref={mermaidContainerRef} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <div className="empty-preview">Loading...</div>
          </div>
        </div>
      </div>
    </div>
  )
}
