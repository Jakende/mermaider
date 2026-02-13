import { useState, useEffect } from 'react'
import { MermaidConfig, parseInitBlock, updateInitBlock } from '../utils/mermaidConfig'
import { parseMermaidFlowchart } from '../utils/mermaidParser'
import { MermaidModifier } from '../utils/mermaidModifier'
import { useTheme } from '../contexts/ThemeContext'
import './MermaidConfigPanel.css'

interface MermaidConfigPanelProps {
    code: string
    setCode: (code: string) => void
    onClose: () => void
}

export default function MermaidConfigPanel({ code, setCode, onClose }: MermaidConfigPanelProps) {
    const { mermaidTheme, setMermaidTheme } = useTheme()
    const [config, setConfig] = useState<MermaidConfig>({})
    const [direction, setDirection] = useState<'TD' | 'BT' | 'LR' | 'RL'>('TD')

    useEffect(() => {
        const { config: parsedConfig } = parseInitBlock(code)
        if (parsedConfig) {
            setConfig(parsedConfig)
        } else {
            setConfig({})
        }

        const diagram = parseMermaidFlowchart(code)
        if (diagram) {
            setDirection(diagram.direction)
        }
    }, [code])

    const applyUpdate = (newConfig: MermaidConfig, newDir: 'TD' | 'BT' | 'LR' | 'RL') => {
        let updatedCode = updateInitBlock(code, newConfig)
        updatedCode = MermaidModifier.setDirection(updatedCode, newDir)
        setCode(updatedCode)
    }

    const updateConfig = (newPartialConfig: MermaidConfig) => {
        const nextConfig = { ...config, ...newPartialConfig }
        if (newPartialConfig.flowchart) {
            nextConfig.flowchart = { ...config.flowchart, ...newPartialConfig.flowchart }
        }

        setConfig(nextConfig)
        applyUpdate(nextConfig, direction)
    }

    const handleDirectionChange = (newDir: 'TD' | 'BT' | 'LR' | 'RL') => {
        setDirection(newDir)
        applyUpdate(config, newDir)
    }

    const handleReset = () => {
        if (confirm('Clear all custom configurations from this diagram?')) {
            const { remainingCode } = parseInitBlock(code)
            setCode(remainingCode)
            setConfig({})
            onClose()
        }
    }

    return (
        <div className="mermaid-config-panel">
            <div className="config-header">
                <span>Diagram Config</span>
                <button className="close-btn" onClick={onClose}>×</button>
            </div>

            <div className="config-content">
                <div className="config-group">
                    <label>App Preset (Global)</label>
                    <select
                        value={mermaidTheme}
                        onChange={(e) => setMermaidTheme(e.target.value as any)}
                        className="theme-select"
                    >
                        <option value="slate">Slate (Default)</option>
                        <option value="earth">Earth (Organic)</option>
                        <option value="cosmic">Cosmic (Vibrant)</option>
                        <option value="sage">Sage (Soft)</option>
                        <option value="royal">Royal (Classic)</option>
                    </select>
                </div>

                <div className="config-group">
                    <label>Main Direction</label>
                    <div className="config-options direction-grid">
                        <button
                            className={direction === 'TD' ? 'active' : ''}
                            onClick={() => handleDirectionChange('TD')}
                        >
                            Top-Down
                        </button>
                        <button
                            className={direction === 'LR' ? 'active' : ''}
                            onClick={() => handleDirectionChange('LR')}
                        >
                            Left-Right
                        </button>
                        <button
                            className={direction === 'BT' ? 'active' : ''}
                            onClick={() => handleDirectionChange('BT')}
                        >
                            Bottom-Up
                        </button>
                        <button
                            className={direction === 'RL' ? 'active' : ''}
                            onClick={() => handleDirectionChange('RL')}
                        >
                            Right-Left
                        </button>
                    </div>
                </div>

                <div className="config-group">
                    <label>Spacing & Layout</label>
                    <div className="config-slider-group">
                        <div className="slider-item">
                            <div className="slider-header">
                                <span>Node Spacing</span>
                                <span>{config.flowchart?.nodeSpacing || 50}</span>
                            </div>
                            <input
                                type="range" min="10" max="200"
                                value={config.flowchart?.nodeSpacing || 50}
                                onChange={(e) => updateConfig({ flowchart: { nodeSpacing: parseInt(e.target.value) } })}
                            />
                        </div>
                        <div className="slider-item">
                            <div className="slider-header">
                                <span>Rank Spacing</span>
                                <span>{config.flowchart?.rankSpacing || 50}</span>
                            </div>
                            <input
                                type="range" min="10" max="200"
                                value={config.flowchart?.rankSpacing || 50}
                                onChange={(e) => updateConfig({ flowchart: { rankSpacing: parseInt(e.target.value) } })}
                            />
                        </div>
                    </div>
                </div>

                <div className="config-group">
                    <label>Layout Engine</label>
                    <div className="config-options">
                        <button
                            className={(config.flowchart?.defaultRenderer === 'dagre' || !config.flowchart?.defaultRenderer) ? 'active' : ''}
                            onClick={() => updateConfig({ flowchart: { defaultRenderer: 'dagre' } })}
                        >
                            Dagre
                        </button>
                        <button
                            className={config.flowchart?.defaultRenderer === 'elk' ? 'active' : ''}
                            onClick={() => updateConfig({ flowchart: { defaultRenderer: 'elk' } })}
                        >
                            ELK
                        </button>
                    </div>
                </div>

                <div className="config-group">
                    <label>Visual Look</label>
                    <div className="config-options">
                        <button
                            className={config.look === 'classic' || !config.look ? 'active' : ''}
                            onClick={() => updateConfig({ look: 'classic' })}
                        >
                            Classic
                        </button>
                        <button
                            className={config.look === 'handDrawn' ? 'active' : ''}
                            onClick={() => updateConfig({ look: 'handDrawn' })}
                        >
                            Hand-drawn
                        </button>
                    </div>
                </div>

                <div className="config-group">
                    <label>Flowchart Options</label>
                    <div className="config-row">
                        <div className="config-field">
                            <span className="field-label">Curve</span>
                            <select
                                value={config.flowchart?.curve || 'linear'}
                                onChange={(e) => updateConfig({ flowchart: { curve: e.target.value as any } })}
                                className="compact-select"
                            >
                                <option value="linear">Linear</option>
                                <option value="basis">Basis</option>
                                <option value="cardinal">Cardinal</option>
                                <option value="step">Step</option>
                                <option value="monotoneX">Monotone X</option>
                                <option value="monotoneY">Monotone Y</option>
                            </select>
                        </div>
                    </div>
                    <div className="config-checkboxes">
                        <label className="checkbox-label">
                            <input
                                type="checkbox"
                                checked={config.flowchart?.htmlLabels !== false}
                                onChange={(e) => updateConfig({ flowchart: { htmlLabels: e.target.checked } })}
                            />
                            HTML Labels
                        </label>
                        <label className="checkbox-label">
                            <input
                                type="checkbox"
                                checked={config.flowchart?.useMaxWidth !== false}
                                onChange={(e) => updateConfig({ flowchart: { useMaxWidth: e.target.checked } })}
                            />
                            Auto Stretch
                        </label>
                    </div>
                </div>

                <div className="config-group">
                    <label>Theme Overwrite</label>
                    <select
                        value={config.theme || ''}
                        onChange={(e) => updateConfig({ theme: e.target.value || undefined })}
                    >
                        <option value="">(Use App Theme)</option>
                        <option value="default">Default</option>
                        <option value="neutral">Neutral</option>
                        <option value="dark">Dark</option>
                        <option value="forest">Forest</option>
                        <option value="base">Base (Custom)</option>
                    </select>
                </div>
            </div>

            <div className="config-footer">
                <button className="reset-btn" onClick={handleReset} title="Remove config block from code">
                    Clear All Config
                </button>
            </div>
        </div>
    )
}
