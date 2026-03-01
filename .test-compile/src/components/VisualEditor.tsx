import { useCallback, useEffect } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Node,
  Edge,
  addEdge,
  useNodesState,
  useEdgesState,
  Connection,
  MarkerType,
  NodeTypes,
  Handle,
  Position,
  NodeToolbar,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { ParsedMermaidDiagram } from '../utils/mermaidParser'
import { MermaidModifier } from '../utils/mermaidModifier'
import { useTheme } from '../contexts/ThemeContext'
import './VisualEditor.css'

interface VisualEditorProps {
  parsedDiagram: ParsedMermaidDiagram
  code: string
  onCodeChange: (code: string) => void
  layoutPositions?: Record<string, {x: number, y: number}>
}

const COLORS = [
  { name: 'Default', value: '' },
  { name: 'Red', value: '#ffcccc' },
  { name: 'Green', value: '#ccffcc' },
  { name: 'Blue', value: '#ccccff' },
  { name: 'Yellow', value: '#ffffcc' },
  { name: 'Orange', value: '#ffe5cc' },
  { name: 'Purple', value: '#e5ccff' },
  { name: 'Pink', value: '#ffcce5' },
  { name: 'Teal', value: '#ccffeb' },
]

// Custom node component with Toolbar
const CustomNode = ({ data, selected, id }: { data: any; selected: boolean; id: string }) => {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const getShapeStyle = () => {
    const shape = data.shape || 'rect'
    switch (shape) {
      case 'rounded':
        return { borderRadius: '20px' }
      case 'diamond':
        return {
          clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
          border: '1px solid currentColor',
        }
      case 'circle':
        return { borderRadius: '50%', aspectRatio: '1/1', display: 'flex', alignItems: 'center', justifyContent: 'center' }
      default:
        return { borderRadius: '4px' }
    }
  }

  return (
    <>
      <NodeToolbar isVisible={selected} position={Position.Top}>
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column',
          gap: '4px', 
          background: isDark ? '#333' : 'white', 
          padding: '6px', 
          borderRadius: '8px', 
          border: '1px solid var(--border)',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
        }}>
          <div style={{ display: 'flex', gap: '4px' }}>
            {COLORS.map(c => (
               <button
                  key={c.name}
                  onClick={() => data.onColorChange && data.onColorChange(id, c.value)}
                  style={{
                    width: '18px',
                    height: '18px',
                    backgroundColor: c.value || (isDark ? '#555' : '#fff'),
                    border: '1px solid var(--border)',
                    cursor: 'pointer',
                    borderRadius: '50%'
                  }}
                  title={c.name}
               />
            ))}
          </div>
          <div style={{ borderTop: '1px solid var(--border)', marginTop: '2px', paddingTop: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
             <span style={{ fontSize: '10px', color: 'var(--muted)' }}>Styles</span>
             <button 
                onClick={() => data.onDelete && data.onDelete(id)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#ff4d4d',
                  cursor: 'pointer',
                  fontSize: '11px',
                  padding: '2px 4px',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '2px'
                }}
             >
               Delete Node
             </button>
          </div>
        </div>
      </NodeToolbar>

      <div
        className={`visual-node ${isDark ? 'dark' : ''} ${selected ? 'selected' : ''}`}
        style={{
          ...getShapeStyle(),
          backgroundColor: data.style?.fill || (isDark ? '#2d2d2d' : '#ffffff'),
          borderColor: data.style?.stroke || (isDark ? '#555' : '#333'),
          borderWidth: data.style?.strokeWidth || '1px',
          borderStyle: 'solid',
          color: data.style?.color || (isDark ? '#d4d4d4' : '#333'),
          position: 'relative',
          minWidth: '100px',
          minHeight: '40px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '10px'
        }}
      >
        <Handle type="source" position={Position.Top} id="top-s" style={{ left: '70%' }} className="visible-handle source-handle" />
        <Handle type="source" position={Position.Right} id="right-s" style={{ top: '70%' }} className="visible-handle source-handle" />
        <Handle type="source" position={Position.Bottom} id="bottom-s" style={{ left: '70%' }} className="visible-handle source-handle" />
        <Handle type="source" position={Position.Left} id="left-s" style={{ top: '70%' }} className="visible-handle source-handle" />
        
        <Handle type="target" position={Position.Top} id="top-t" style={{ left: '30%' }} className="visible-handle target-handle" />
        <Handle type="target" position={Position.Right} id="right-t" style={{ top: '30%' }} className="visible-handle target-handle" />
        <Handle type="target" position={Position.Bottom} id="bottom-t" style={{ left: '30%' }} className="visible-handle target-handle" />
        <Handle type="target" position={Position.Left} id="left-t" style={{ top: '30%' }} className="visible-handle target-handle" />

        <div style={{ textAlign: 'center', pointerEvents: 'none', userSelect: 'none' }}>
          {data.label || id}
        </div>
      </div>
    </>
  )
}

const nodeTypes: NodeTypes = {
  custom: CustomNode,
}

export default function VisualEditor({ parsedDiagram, code, onCodeChange, layoutPositions }: VisualEditorProps) {
  const { theme } = useTheme()
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([])
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([])

  const handleColorChange = useCallback((nodeId: string, color: string) => {
    const newCode = MermaidModifier.updateNodeStyle(code, nodeId, { fill: color });
    onCodeChange(newCode);
    
    // Optimistic update for immediate feedback
    setNodes(nds => nds.map(n => {
        if (n.id === nodeId) {
            return {
                ...n,
                data: { ...n.data, style: { ...(n.data.style as any || {}), fill: color } }
            }
        }
        return n;
    }));
  }, [code, onCodeChange, setNodes]);

  const onEdgesDelete = useCallback((edgesToDelete: Edge[]) => {
    let newCode = code;
    edgesToDelete.forEach(edge => {
      newCode = MermaidModifier.deleteEdge(newCode, edge.source, edge.target);
    });
    onCodeChange(newCode);
  }, [code, onCodeChange]);

  const onNodesDelete = useCallback((nodesToDelete: Node[]) => {
    let newCode = code;
    nodesToDelete.forEach(node => {
      newCode = MermaidModifier.deleteNode(newCode, node.id);
    });
    onCodeChange(newCode);
  }, [code, onCodeChange]);

  const handleDeleteNode = useCallback((nodeId: string) => {
    const newCode = MermaidModifier.deleteNode(code, nodeId);
    onCodeChange(newCode);
  }, [code, onCodeChange]);

  useEffect(() => {
    // Merge new parsed nodes with existing nodes to preserve positions
    setNodes(prevNodes => {
      // Create a map of existing nodes for quick lookup
      const prevNodeMap = new Map(prevNodes.map(n => [n.id, n]));
      
      const newNodes = parsedDiagram.nodes.map((node, index) => {
        const existing = prevNodeMap.get(node.id);
        
        let position = { x: 0, y: 0 };

        if (existing) {
             position = existing.position;
        } else if (layoutPositions && layoutPositions[node.id]) {
             position = layoutPositions[node.id];
        } else {
             position = {
                x: (index % 4) * 250 + 50,
                y: Math.floor(index / 4) * 150 + 50,
             };
        }

        return {
          id: node.id,
          type: 'custom',
          position,
          data: {
            label: MermaidModifier.stripHtml(node.label),
            shape: node.shape,
            id: node.id,
            style: node.style ? { fill: '#eee' } : {}, 
            onColorChange: handleColorChange,
            onDelete: handleDeleteNode
          },
        };
      });
      return newNodes;
    });

    setEdges(parsedDiagram.edges.map(edge => ({
      id: `${edge.source}-${edge.target}`,
      source: edge.source,
      target: edge.target,
      label: edge.label ? MermaidModifier.stripHtml(edge.label) : undefined,
      type: 'smoothstep', 
      markerEnd: { type: MarkerType.ArrowClosed },
      animated: edge.type === 'dotted',
      style: { strokeWidth: edge.type === 'thick' ? 3 : 1 }
    })));
  }, [parsedDiagram, handleColorChange, layoutPositions, setNodes, setEdges]); 

  const onConnect = useCallback(
    (params: Connection) => {
      if (params.source && params.target) {
        console.log(`Connecting: ${params.source} -> ${params.target}`, params);
        setEdges((eds) => addEdge(params, eds))
        const newCode = MermaidModifier.addEdge(code, params.source, params.target, '');
        onCodeChange(newCode);
      }
    },
    [code, onCodeChange, setEdges]
  )

  const onNodeDoubleClick = useCallback((_event: React.MouseEvent, node: Node) => {
    const currentLabel = typeof node.data?.label === 'string' ? node.data.label : node.id || ''
    const newLabel = prompt('Enter new label:', currentLabel)
    if (newLabel !== null && newLabel !== currentLabel) {
       setNodes((nds) =>
        nds.map((n) =>
          n.id === node.id
            ? { ...n, data: { ...n.data, label: newLabel } }
            : n
        )
      )
      const newCode = MermaidModifier.updateNodeLabel(code, node.id, newLabel);
      onCodeChange(newCode);
    }
  }, [code, onCodeChange, setNodes])

  const isDark = theme === 'dark'

  return (
    <div className="visual-editor-container">
      <div className="visual-editor-header">
         <div className="visual-editor-hint-container">
            <span className="visual-editor-hint">
               Visual Edit Mode: Drag to rearrange • Double-click to rename • Select + Backspace to delete
            </span>
            <div className="handle-legend">
               <div className="legend-item">
                  <span className="legend-box source"></span>
                  <span>Start (Source)</span>
               </div>
               <div className="legend-item">
                  <span className="legend-circle target"></span>
                  <span>End (Target)</span>
               </div>
            </div>
         </div>
      </div>
      <div className="visual-editor-content">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onEdgesDelete={onEdgesDelete}
          onNodesDelete={onNodesDelete}
          onConnect={onConnect}
          onNodeDoubleClick={onNodeDoubleClick}
          nodeTypes={nodeTypes}
          fitView
          className={isDark ? 'dark' : ''}
          deleteKeyCode={['Backspace', 'Delete']}
          minZoom={0.1}
          nodesDraggable={true}
          nodesConnectable={true}
          elementsSelectable={true}
        >
          <Background color={isDark ? '#2d2d2d' : '#f5f5f5'} />
          <Controls />
          <MiniMap 
            nodeColor={isDark ? '#555' : '#ccc'} 
            maskColor={isDark ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.3)'}
          />
        </ReactFlow>
      </div>
    </div>
  )
}
