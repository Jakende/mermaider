import { useEffect, useRef, useState, useMemo } from 'react'
import {diagramRenderCache} from '../utils/renderCache'
import { useTheme } from '../contexts/ThemeContext'
import { extractMermaidCode } from '../utils/mermaidCodeBlock'
import { parseMermaidFlowchart } from '../utils/mermaidParser'
import VisualEditor from './VisualEditor'
import { mermaidThemes, diagramThemeVariables } from '../utils/mermaidThemes'
import { parseInitBlock } from '../utils/mermaidConfig'
import { queueMermaidRender } from '../utils/renderQueue'
import { applyDecisionOverlay } from '../decision/overlay'
import type { flowPath } from '../decision/flow'
import { useDiagramGestures } from '../hooks/useDiagramGestures'
import './Preview.css'

interface PreviewProps {
  decisionHighlights?: ReturnType<typeof flowPath>
  autoFit?: boolean
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
  onToggleVisualEdit,
  decisionHighlights,
  autoFit = false
}: PreviewProps) {
  const { theme, mermaidTheme, textTransform } = useTheme()
  const mermaidContainerRef = useRef<HTMLDivElement>(null)
  const renderIdRef = useRef(0)
  const [renderedVersion, setRenderedVersion] = useState(0)
  const onNodeClickRef = useRef(onNodeClick)
  const zoomRef = useRef(1)
  const followsFit = useRef(autoFit)
  useEffect(() => { onNodeClickRef.current = onNodeClick }, [onNodeClick])

  // Zoom & Pan State
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const { viewportRef, isPanning, handlers: gestureHandlers } = useDiagramGestures(zoom, pan, setZoom, setPan, !isVisualEditMode, () => { followsFit.current = false })

  const [layoutPositions, setLayoutPositions] = useState<Record<string, { x: number, y: number }>>({})

  zoomRef.current = zoom
  const extractedCode = useMemo(() => extractMermaidCode(code), [code])
  const trimmedCode = extractedCode.trim()
  const parsedDiagram = useMemo(() => trimmedCode ? parseMermaidFlowchart(trimmedCode) : null, [trimmedCode])
  const canEdit = parsedDiagram !== null

  const handleCodeChange = (newCode: string) => {
    if (onCodeChange) {
      onCodeChange(newCode)
    }
  }

  useEffect(() => {
    if (!mermaidContainerRef.current) return
    return applyDecisionOverlay(mermaidContainerRef.current, decisionHighlights)
  }, [decisionHighlights, renderedVersion])

  // Zoom Logic
  const handleZoomIn = () => { followsFit.current = false; setZoom(prev => Math.min(prev + 0.1, 20)) }
  const handleZoomOut = () => { followsFit.current = false; setZoom(prev => Math.max(prev - 0.1, 0.05)) }
  const handleZoomReset = () => {
    followsFit.current = false
    setZoom(1)
    setPan({ x: 0, y: 0 })
  }

  useEffect(() => {
    const currentId = ++renderIdRef.current
    let cancelled = false
    const isCurrent = () => !cancelled && renderIdRef.current === currentId
    const timer = setTimeout(() => {
      void queueMermaidRender(async () => {
      if (!isCurrent() || !mermaidContainerRef.current) return
      const container = mermaidContainerRef.current

      if (isVisualEditMode && canEdit) {
        return
      }

      const trimmedCode = extractedCode.trim()

      if (!trimmedCode) {
        if (isCurrent()) {
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
          initConfig.themeVariables = diagramThemeVariables(mermaidTheme, theme)
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

        const mermaid=(await import('mermaid')).default
        if(!isCurrent())return
        mermaid.parseError=()=>{}
        mermaid.initialize(initConfig)
        // ------------------------------

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
          const cacheKey=JSON.stringify([trimmedCode,initConfig,textTransform])
          const cached=diagramRenderCache.get(cacheKey,id),started=performance.now()
          const result=cached?{svg:cached}:await mermaid.render(id, trimmedCode)
          if(!cached)diagramRenderCache.put(cacheKey,id,result.svg)
          const elapsed=performance.now()-started

          if (isCurrent() && container) {
            let svgMarkup = result.svg
            // Sanitize empty width/height attributes generated by certain Mermaid diagram renders (e.g. width="")
            svgMarkup = svgMarkup.replace(/\b(width|height)=""/g, '')
            container.innerHTML = svgMarkup
            container.querySelector('svg')?.setAttribute('data-render-ms',String(Math.round(elapsed)))
            container.querySelector('svg')?.setAttribute('data-render-cache',cached?'hit':'miss')
            setRenderedVersion(currentId)

            const newPositions: Record<string, { x: number, y: number }> = {}
            const nodes = container.querySelectorAll('.node')

            nodes.forEach(node => {
              const fullId = node.id || ''
              let nodeId = ''
              if (fullId.startsWith('flowchart-')) {
                nodeId = fullId.replace(/^flowchart-/, '').replace(/-\d+$/, '')
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
                  nodeId = fullId.replace(/^flowchart-/, '').replace(/-\d+$/, '')
                } else if (fullId.includes('-')) {
                  nodeId = fullId.split('-')[0]
                } else {
                  nodeId = fullId
                }
                if (!nodeId || nodeId === 'node' || nodeId === 'flowchart') {
                  nodeId = node.textContent?.trim() || ''
                }
                if (nodeId) onNodeClickRef.current?.(nodeId)
              })
            })

            const svg = container.querySelector('svg')
            if (svg) {
              const viewBox = svg.getAttribute('viewBox')?.split(' ')
              const originalWidth = viewBox ? parseFloat(viewBox[2]) : 0
              const originalHeight = viewBox ? parseFloat(viewBox[3]) : 0

              if (originalWidth && originalHeight) {
                followsFit.current = autoFit
                if (autoFit) {
                  const viewport = container.closest('.preview-container')?.querySelector('.preview-viewport')
                  const width = Math.max(1, (viewport?.clientWidth || container.clientWidth) - 32)
                  const height = Math.max(1, (viewport?.clientHeight || container.clientHeight) - 32)
                  const fitted = Math.max(0.05, Math.min(1, width / originalWidth, height / originalHeight))
                  zoomRef.current = fitted; setZoom(fitted); setPan({x:0,y:0})
                }
                svg.setAttribute('data-original-width', originalWidth.toString())
                svg.setAttribute('data-original-height', originalHeight.toString())
                svg.style.width = `${originalWidth * zoomRef.current}px`
                svg.style.height = `${originalHeight * zoomRef.current}px`
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
          document.getElementById(`d${id}`)?.remove()
          if (renderContainer.parentNode) {
            renderContainer.parentNode.removeChild(renderContainer)
          }
          // Clean up the temporary style rule
          if (tempStyle.parentNode) {
            tempStyle.parentNode.removeChild(tempStyle)
          }
        }
      } catch (err) {
        if (!isCurrent()) return
        const errorMsg = err instanceof Error ? err.message : 'Ungültige Mermaid-Syntax'
        setError(errorMsg)
        container.innerHTML = '<div class="error-preview"><h3>Syntaxfehler im Diagramm</h3><p>Verwende AI Fix, um den Fehler beheben zu lassen.</p><pre></pre></div>'
        container.querySelector('pre')!.textContent = errorMsg
      }
      })
    }, 150)

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [setError, theme, mermaidTheme, isVisualEditMode, canEdit, extractedCode, textTransform, autoFit])

  useEffect(() => {
    const viewport = viewportRef.current
    if (!autoFit || !viewport || isVisualEditMode) return
    const observer = new ResizeObserver(() => {
      if (!followsFit.current) return
      const svg = mermaidContainerRef.current?.querySelector('svg')
      const width = Number(svg?.getAttribute('data-original-width'))
      const height = Number(svg?.getAttribute('data-original-height'))
      if (!width || !height) return
      const fitted = Math.max(0.05, Math.min(1, Math.max(1, viewport.clientWidth - 32) / width, Math.max(1, viewport.clientHeight - 32) / height))
      zoomRef.current = fitted
      setZoom(fitted)
    })
    observer.observe(viewport)
    return () => observer.disconnect()
  }, [autoFit, renderedVersion, isVisualEditMode, viewportRef])

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
        ref={viewportRef}
        {...gestureHandlers}
        style={{ cursor: isPanning ? 'grabbing' : 'grab' }}
      >
        <div
          className="preview-content"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px)`,
            transformOrigin: 'center center',
            transition: 'none'
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
