import React, { useState, useEffect, useCallback } from 'react'

interface ResizableSplitterProps {
    onResize: (width: number) => void
}

export default function ResizableSplitter({ onResize }: ResizableSplitterProps) {
    const [isDragging, setIsDragging] = useState(false)

    const handleMouseDown = (e: React.MouseEvent) => {
        e.preventDefault()
        setIsDragging(true)
        document.body.style.cursor = 'col-resize'
        document.body.style.userSelect = 'none'
    }

    const handleMouseUp = useCallback(() => {
        setIsDragging(false)
        document.body.style.cursor = ''
        document.body.style.userSelect = ''
    }, [])

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!isDragging) return
        onResize(e.clientX)
    }, [isDragging, onResize])

    useEffect(() => {
        if (isDragging) {
            document.addEventListener('mousemove', handleMouseMove)
            document.addEventListener('mouseup', handleMouseUp)
        } else {
            document.removeEventListener('mousemove', handleMouseMove)
            document.removeEventListener('mouseup', handleMouseUp)
        }

        return () => {
            document.removeEventListener('mousemove', handleMouseMove)
            document.removeEventListener('mouseup', handleMouseUp)
        }
    }, [isDragging, handleMouseMove, handleMouseUp])

    return (
        <div
            onMouseDown={handleMouseDown}
            style={{
                width: '4px',
                backgroundColor: isDragging ? 'var(--accent)' : 'var(--border)',
                cursor: 'col-resize',
                transition: 'background-color 0.2s',
                zIndex: 10
            }}
        />
    )
}
