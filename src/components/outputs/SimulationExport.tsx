'use client'

import { useRef, useEffect, useCallback, useState } from 'react'
import { useDesignStore } from '@/lib/store/designStore'

// Color name → hex lookup table
const COLOR_MAP: Record<string, string> = {
  'ivory': '#FFFFF0', 'cream': '#FFFDD0', 'white': '#FFFFFF', 'black': '#1B1F3B',
  'navy': '#1B1F3B', 'navy blue': '#1B1F3B', 'red': '#C41E3A', 'maroon': '#800020',
  'gold': '#E8A838', 'amber': '#E8A838', 'yellow': '#F4D03F', 'orange': '#E67E22',
  'green': '#27AE60', 'olive': '#808000', 'teal': '#008080', 'blue': '#2980B9',
  'royal blue': '#2B60DE', 'pink': '#E8909C', 'magenta': '#C2185B', 'purple': '#7B1FA2',
  'grey': '#888888', 'gray': '#888888', 'silver': '#C0C0C0', 'brown': '#6D4C41',
  'beige': '#F5F5DC', 'peach': '#FFDAB9', 'coral': '#FF6F61', 'turquoise': '#40E0D0',
  'lavender': '#B388FF', 'rose': '#E8909C',
}

function resolveColor(code: string | undefined, fallback: string): string {
  if (!code) return fallback
  if (code.startsWith('#')) return code
  const lower = code.toLowerCase().trim()
  return COLOR_MAP[lower] || fallback
}

interface SimulationPreviewProps {
  matrix: number[][]
  warpColor: string
  weftColor: string   // fallback single weft color
  designName: string
}

export default function SimulationPreview({ matrix, warpColor, weftColor, designName }: SimulationPreviewProps) {
  const previewRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [rendered, setRendered] = useState(false)

  // Read multi-color weft data from global store
  const rowYarnMap = useDesignStore(s => s.rowYarnMap)
  const cellYarnMap = useDesignStore(s => s.cellYarnMap)
  const draftSequence = useDesignStore(s => s.draftSequence)
  const weftYarns   = useDesignStore(s => s.weftSystem.yarns)

  const warpHex = resolveColor(warpColor, '#1B3A6B')
  const weftFallbackHex = resolveColor(weftColor, '#E8A838')

  // Build a per-row color array for the simulation
  const getRowColor = useCallback((rowIndex: number): string => {
    const rows = matrix.length
    if (rows === 0) return weftFallbackHex

    // The peg plan is tiled: actual row in the repeat
    const repeatRow = rowIndex % rows
    const yarnId = rowYarnMap[repeatRow]
    if (yarnId) {
      const yarn = weftYarns.find(y => y.id === yarnId)
      if (yarn?.colour_hex) return yarn.colour_hex
    }
    return weftFallbackHex
  }, [rowYarnMap, weftYarns, weftFallbackHex, matrix.length])

  const renderSimulation = useCallback((canvas: HTMLCanvasElement, canvasSize: number) => {
    const rows = matrix.length
    const cols = matrix[0]?.length || 0
    if (rows === 0 || cols === 0) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = typeof window !== 'undefined' ? (window.devicePixelRatio || 1) : 1

    const cellSize = 2
    const tilesX = Math.ceil(canvasSize / (cols * cellSize))
    const tilesY = Math.ceil(canvasSize / (rows * cellSize))

    const totalW = canvasSize
    const totalH = canvasSize

    canvas.width = totalW * dpr
    canvas.height = totalH * dpr
    canvas.style.width = `${totalW}px`
    canvas.style.height = `${totalH}px`
    ctx.scale(dpr, dpr)

    // Fill background with the first weft color
    ctx.fillStyle = getRowColor(0)
    ctx.fillRect(0, 0, totalW, totalH)

    // Draw tiled pattern
    for (let ty = 0; ty < tilesY; ty++) {
      for (let tx = 0; tx < tilesX; tx++) {
        for (let r = 0; r < rows; r++) {
          const absoluteRow = ty * rows + r
          const weftRowColor = getRowColor(absoluteRow)

          for (let c = 0; c < cols; c++) {
            const x = (tx * cols + c) * cellSize
            const y = absoluteRow * cellSize

            if (x >= totalW || y >= totalH) continue

            // In this specific CAD workflow, filling a peg (1) indicates WEFT is visible.
            // 1 = Weft up (show weft color), 0 = Warp up (show warp color)
            let cellWeftColor = weftRowColor
            
            // Map the warp end 'c' to its corresponding shaft to look up the peg plan color overlay
            // Use the repeat pattern row 'r', not the canvas absoluteRow!
            const shaftIndex = (draftSequence[c] ?? 1) - 1
            const cellYarnId = cellYarnMap[`${r}_${shaftIndex}`]
            
            if (cellYarnId) {
              const yarn = weftYarns.find(y => y.id === cellYarnId)
              if (yarn) cellWeftColor = yarn.colour_hex
            }
            
            ctx.fillStyle = matrix[r][c] === 1 ? cellWeftColor : warpHex
            ctx.fillRect(x, y, cellSize, cellSize)
          }
        }
      }
    }

    setRendered(true)
  }, [matrix, warpHex, getRowColor])

  useEffect(() => {
    if (previewRef.current && matrix.length > 0 && matrix[0]?.length > 0) {
      const timer = setTimeout(() => {
        if (previewRef.current) {
          renderSimulation(previewRef.current, 320)
        }
      }, 50)
      return () => clearTimeout(timer)
    }
  }, [renderSimulation, matrix, rowYarnMap, cellYarnMap])   // re-render when colors change

  const downloadPNG = () => {
    const canvas = document.createElement('canvas')
    renderSimulation(canvas, 1200)

    canvas.toBlob((blob) => {
      if (!blob) return
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${designName.replace(/\s+/g, '_')}_fabric_simulation.png`
      a.click()
      URL.revokeObjectURL(url)
    }, 'image/png')
  }

  const copyToClipboard = async () => {
    const canvas = document.createElement('canvas')
    renderSimulation(canvas, 1200)

    canvas.toBlob(async (blob) => {
      if (!blob) return
      try {
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob })
        ])
        alert('Image copied to clipboard!')
      } catch {
        alert('Could not copy to clipboard. Try downloading instead.')
      }
    }, 'image/png')
  }

  // Unique yarn colors used (for legend)
  const usedYarns = weftYarns.filter(yarn =>
    Object.values(rowYarnMap).includes(yarn.id) || Object.values(cellYarnMap).includes(yarn.id)
  )
  const hasMultiColor = usedYarns.length > 1

  if (!matrix.length || !matrix[0]?.length) {
    return (
      <div style={{
        textAlign: 'center', padding: 40,
        color: 'var(--text-3)', fontSize: 13,
        background: 'var(--bg)',
        borderRadius: 14,
        border: '1.5px dashed var(--border)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
      }}>
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="rgba(0,0,0,0.15)" strokeWidth="1.5" style={{ marginBottom: 4 }}>
          <rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 15l6-6 4 4 4-4 4 4" />
        </svg>
        <div style={{ fontWeight: 500, color: 'var(--text-2)' }}>No simulation yet</div>
        <div style={{ fontSize: 11, color: 'var(--text-4)' }}>Enter a peg plan to see the fabric preview</div>
      </div>
    )
  }

  return (
    <div style={{ width: '100%' }} ref={containerRef}>
      {/* Preview */}
      <div className="flex justify-center mb-4">
        <div style={{
          width: 320, height: 320,
          borderRadius: 16, overflow: 'hidden',
          border: '1px solid var(--border-light)',
          background: 'var(--bg)',
          boxShadow: 'var(--shadow-md)',
          flexShrink: 0,
        }}>
          <canvas
            ref={previewRef}
            style={{ display: 'block', width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </div>
      </div>

      {/* Color Legend */}
      <div style={{
        display: 'flex', gap: 12, justifyContent: 'center',
        marginBottom: 16, fontSize: 12, flexWrap: 'wrap',
      }}>
        {/* Warp */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 16, height: 16, borderRadius: 4, background: warpHex, border: '1px solid var(--border)', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }} />
          <span style={{ color: 'var(--text-2)', fontWeight: 500 }}>Warp</span>
        </div>

        {/* Multi-color weft legend */}
        {hasMultiColor ? (
          usedYarns.map((yarn, i) => (
            <div key={yarn.id} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{
                width: 16, height: 16, borderRadius: 4,
                background: yarn.colour_hex,
                border: '1px solid var(--border)',
                boxShadow: `0 1px 3px ${yarn.colour_hex}55`,
              }} />
              <span style={{ color: 'var(--text-2)', fontWeight: 500 }}>
                {yarn.label || `Weft ${String.fromCharCode(65 + i)}`}
              </span>
            </div>
          ))
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 16, height: 16, borderRadius: 4, background: weftFallbackHex, border: '1px solid var(--border)', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }} />
            <span style={{ color: 'var(--text-2)', fontWeight: 500 }}>Weft</span>
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 11, color: 'var(--text-3)' }}>
            {matrix.length}×{matrix[0]?.length} repeat
            {hasMultiColor && ` · ${usedYarns.length} weft colors`}
          </span>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex flex-wrap gap-2 sm:gap-3 justify-center">
        <button onClick={downloadPNG} className="btn-primary" style={{ fontSize: 12, height: 36, padding: '0 16px' }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M7 1v8M4 6l3 3 3-3M2 11h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          Download Fabric Image
        </button>
        <button onClick={copyToClipboard} className="btn-secondary" style={{ fontSize: 12, height: 36 }}>
          Copy for WhatsApp
        </button>
      </div>
    </div>
  )
}
