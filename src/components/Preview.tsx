import { useEffect, useRef, useState, useCallback } from 'react'
import mermaid from 'mermaid'
import { useTheme } from '../contexts/ThemeContext'
import { extractMermaidCode } from '../utils/mermaidCodeBlock'
import { isEditableDiagram, parseMermaidFlowchart } from '../utils/mermaidParser'
import VisualEditor from './VisualEditor'
import { mermaidThemes } from '../utils/mermaidThemes'
import { parseInitBlock } from '../utils/mermaidConfig'
import './Preview.css'

interface PreviewProps {
  code: string
  setError: (error: string | null) => void
  onCodeChange?: (code: string) => void
  targetNodeId?: string | null
  onNodeClick?: (nodeId: string) => void
  isVisualEditMode?: boolean
  onToggleVisualEdit?: (isVisualEdit: boolean) => void
}

export default function Preview({
  code,
  setError,
  onCodeChange,
  targetNodeId,
  onNodeClick,
  isVisualEditMode = false,
  onToggleVisualEdit
}: PreviewProps) {
  const { mermaidTheme, textTransform } = useTheme()
  const mermaidContainerRef = useRef<HTMLDivElement>(null)
  const renderIdRef = useRef(0)

  // Zoom & Pan State
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState(false)
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 })

  const [layoutPositions, setLayoutPositions] = useState<Record<string, { x: number, y: number }>>({})

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
  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.1, 20))
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.1, 0.05))
  const handleZoomReset = () => {
    setZoom(1)
    setPan({ x: 0, y: 0 })
  }

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const delta = e.deltaY > 0 ? -0.1 : 0.1
    setZoom(prev => Math.min(Math.max(prev + delta, 0.05), 20))
  }

  // Pan Logic
  const handleMouseDown = (e: React.MouseEvent) => {
    if (isVisualEditMode) return
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

  // Initial mermaid setup
  useEffect(() => {
    mermaid.parseError = (err) => {
      console.log('Mermaid parsing error (suppressed default):', err);
    }
  }, [])

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (!mermaidContainerRef.current) return

      const currentId = ++renderIdRef.current
      const container = mermaidContainerRef.current

      if (isVisualEditMode && canEdit) {
        return
      }

      const trimmedCode = extractedCode.trim()

      if (!trimmedCode) {
        if (renderIdRef.current === currentId) {
          container.innerHTML = '<div class="empty-preview">Start typing your Mermaid diagram...</div>'
          setError(null)
          setLayoutPositions({})
        }
        return
      }

      try {
        // --- DIAMGRAM CONFIG LOGIC ---
        const { config: localConfig } = parseInitBlock(trimmedCode)
        const themes = mermaidThemes as any
        const selectedTheme = themes[mermaidTheme] || themes.slate

        const initConfig: any = {
          startOnLoad: false,
          securityLevel: 'loose',
          fontFamily: 'inherit',
        }

        // Apply Global or Local Theme
        if (localConfig?.theme) {
          initConfig.theme = localConfig.theme
        } else if (localConfig?.look === 'handDrawn') {
          // Hand-drawn look often conflicts with custom themeVariables
          // Use default theme or a simple one
          initConfig.theme = 'default'
        } else {
          initConfig.theme = selectedTheme.config.theme
          initConfig.themeVariables = selectedTheme.config.themeVariables
        }

        // Apply "look" (hand-drawn)
        if (localConfig?.look) {
          initConfig.look = localConfig.look
          if (localConfig.look === 'handDrawn') {
            initConfig.handDrawnSeed = 1
          }
        }

        // Explicitly set flowchart options
        if (!initConfig.flowchart) initConfig.flowchart = {}

        if (localConfig?.flowchart?.defaultRenderer) {
          initConfig.flowchart.defaultRenderer = localConfig.flowchart.defaultRenderer
        }
        if (localConfig?.flowchart?.nodeSpacing) initConfig.flowchart.nodeSpacing = localConfig.flowchart.nodeSpacing
        if (localConfig?.flowchart?.rankSpacing) initConfig.flowchart.rankSpacing = localConfig.flowchart.rankSpacing
        if (localConfig?.flowchart?.useMaxWidth !== undefined) initConfig.flowchart.useMaxWidth = localConfig.flowchart.useMaxWidth

        mermaid.initialize(initConfig)
        // ------------------------------

        mermaid.parse(trimmedCode)
        const id = `mermaid-${currentId}-${Date.now()}`

        const renderContainer = document.createElement('div')
        renderContainer.id = id
        renderContainer.style.position = 'absolute'
        renderContainer.style.left = '-9999px'
        renderContainer.style.top = '-9999px'
        // Apply text-transform via global style to ensure it overrides internal Mermaid styles during measurement
        const tempStyle = document.createElement('style')
        if (textTransform && textTransform !== 'none') {
          tempStyle.innerHTML = `#${id} *, #${id} text, #${id} tspan, #${id} span { text-transform: ${textTransform} !important; }`
          document.head.appendChild(tempStyle)
        }
        document.body.appendChild(renderContainer)

        try {
          const result = await mermaid.render(id, trimmedCode)

          if (renderIdRef.current === currentId && container) {
            container.innerHTML = result.svg

            const newPositions: Record<string, { x: number, y: number }> = {}
            const nodes = container.querySelectorAll('.node')

            nodes.forEach(node => {
              const fullId = node.id || ''
              let nodeId = ''
              if (fullId.startsWith('flowchart-')) {
                nodeId = fullId.split('-')[1]
              } else if (fullId.includes('-')) {
                nodeId = fullId.split('-')[0]
              } else {
                nodeId = fullId
              }
              if (!nodeId || nodeId === 'node' || nodeId === 'flowchart') {
                nodeId = node.textContent?.trim() || ''
              }

              const svgNode = node as unknown as SVGGraphicsElement
              if (nodeId && svgNode.getBBox && svgNode.getAttribute('transform')) {
                const transform = svgNode.getAttribute('transform')
                const translateMatch = transform?.match(/translate\(([^,]+),\s*([^)]+)\)/)
                if (translateMatch) {
                  const tx = parseFloat(translateMatch[1])
                  const ty = parseFloat(translateMatch[2])
                  try {
                    const bbox = svgNode.getBBox()
                    newPositions[nodeId] = { x: tx + bbox.x, y: ty + bbox.y }
                  } catch (e) {
                    console.warn('Failed to get BBox for node', nodeId, e)
                  }
                }
              }
            })
            setLayoutPositions(newPositions)

            nodes.forEach(node => {
              node.setAttribute('style', 'cursor: pointer;')
              node.addEventListener('click', (e) => {
                e.stopPropagation()
                const fullId = node.id || ''
                let nodeId = ''
                if (fullId.startsWith('flowchart-')) {
                  nodeId = fullId.split('-')[1]
                } else if (fullId.includes('-')) {
                  nodeId = fullId.split('-')[0]
                } else {
                  nodeId = fullId
                }
                if (!nodeId || nodeId === 'node' || nodeId === 'flowchart') {
                  nodeId = node.textContent?.trim() || ''
                }
                if (nodeId && onNodeClick) {
                  onNodeClick(nodeId)
                }
              })
            })

            const svg = container.querySelector('svg')
            if (svg) {
              const viewBox = svg.getAttribute('viewBox')?.split(' ')
              const originalWidth = viewBox ? parseFloat(viewBox[2]) : 0
              const originalHeight = viewBox ? parseFloat(viewBox[3]) : 0

              if (originalWidth && originalHeight) {
                svg.setAttribute('data-original-width', originalWidth.toString())
                svg.setAttribute('data-original-height', originalHeight.toString())
                svg.style.width = `${originalWidth * zoom}px`
                svg.style.height = `${originalHeight * zoom}px`
              } else {
                svg.style.width = '100%'
                svg.style.height = 'auto'
              }

              svg.removeAttribute('width')
              svg.removeAttribute('height')
              svg.style.maxWidth = 'none'

              svg.style.imageRendering = 'crisp-edges'
              svg.style.imageRendering = '-webkit-optimize-contrast'
              svg.style.shapeRendering = 'geometricPrecision'
              svg.style.textRendering = 'geometricPrecision'

              // Inject capitalization style
              if (textTransform) {
                const style = document.createElementNS('http://www.w3.org/2000/svg', 'style')
                style.textContent = `
                  text, tspan, .nodeLabel, .edgeLabel, .cluster-label, .label, .task, .actor, .messageText, .loopText, .noteText, .sectionTitle { 
                    text-transform: ${textTransform} !important; 
                  }
                `
                svg.querySelector('defs')?.appendChild(style) || svg.appendChild(style)
              }
            }
            setError(null)
          }
        } finally {
          if (renderContainer.parentNode) {
            renderContainer.parentNode.removeChild(renderContainer)
          }
          // Clean up the temporary style rule
          if (tempStyle.parentNode) {
            tempStyle.parentNode.removeChild(tempStyle)
          }
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Ungültige Mermaid-Syntax'
        setError(errorMsg)
        const errorDivs = document.querySelectorAll('[id^="dmermaid-"], #dmermaid');
        errorDivs.forEach(div => div.remove());
        if (renderIdRef.current === currentId && container) {
          container.innerHTML = `<div class="error-preview">
            <h3>Syntaxfehler im Diagramm</h3>
            <p style="margin: 8px 0; font-size: 0.9em; color: var(--text-secondary, #888);">Tipp: Verwende die <strong>[AI Fix]</strong> Schaltfläche im Chat-Panel, um den Fehler automatisch beheben zu lassen.</p>
            <pre>${errorMsg}</pre>
          </div>`
        }
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [code, setError, mermaidTheme, isVisualEditMode, canEdit, extractedCode, onNodeClick, textTransform])

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

  useEffect(() => {
    if (!targetNodeId || !mermaidContainerRef.current) return
    const container = mermaidContainerRef.current
    const element = container.querySelector(`[id^="${targetNodeId}-"]`) ||
      container.querySelector(`[id="${targetNodeId}"]`) ||
      container.querySelector(`.node[id*="${targetNodeId}"]`) ||
      Array.from(container.querySelectorAll('.node')).find(el => el.textContent?.trim() === targetNodeId)

    if (element) {
      const svg = container.querySelector('svg')
      if (svg) {
        const elBox = element.getBoundingClientRect()
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
          setZoom(prev => Math.max(prev, 2.0))
        }
      }
    }
  }, [targetNodeId])

  if (isVisualEditMode && canEdit && parsedDiagram) {
    return (
      <div className="preview-container">
        <div className="preview-header">
          <span>Visual Editor</span>
          <button
            className="mode-toggle-btn"
            onClick={() => onToggleVisualEdit?.(false)}
            title="Switch to preview mode"
          >
            Preview Mode
          </button>
        </div>
        <VisualEditor
          parsedDiagram={parsedDiagram}
          code={code}
          onCodeChange={handleCodeChange}
          layoutPositions={layoutPositions}
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
              onClick={() => onToggleVisualEdit?.(true)}
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
          <div
            ref={mermaidContainerRef}
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center'
            }}
          >
            <div className="empty-preview">Loading...</div>
          </div>
        </div>
      </div>
    </div>
  )
}
