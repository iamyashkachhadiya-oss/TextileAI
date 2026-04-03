'use client'

import { useRef, useEffect, useCallback, useState } from 'react'

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

function resolveColor(code: string, fallback: string): string {
  if (!code) return fallback
  if (code.startsWith('#')) return code
  const lower = code.toLowerCase().trim()
  return COLOR_MAP[lower] || fallback
}

interface SimulationPreviewProps {
  matrix: number[][]
  warpColor: string
  weftColor: string
  designName: string
}

export default function SimulationPreview({ matrix, warpColor, weftColor, designName }: SimulationPreviewProps) {
  const previewRef = useRef<HTMLCanvasElement>(null)
  const [rendered, setRendered] = useState(false)

  const warpHex = resolveColor(warpColor, '#1B1F3B')
  const weftHex = resolveColor(weftColor, '#E8A838')

  const renderSimulation = useCallback((canvas: HTMLCanvasElement, canvasSize: number) => {
    const rows = matrix.length
    const cols = matrix[0]?.length || 0
    if (rows === 0 || cols === 0) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = typeof window !== 'undefined' ? (window.devicePixelRatio || 1) : 1

    // To make it look like actual woven fabric, the threads (cells) should be very small.
    // We enforce a small cell size (e.g., 2px) so the pattern repeats many times.
    const cellSize = 2

    // How many repeats fit in the canvas
    const tilesX = Math.ceil(canvasSize / (cols * cellSize))
    const tilesY = Math.ceil(canvasSize / (rows * cellSize))

    const totalW = canvasSize
    const totalH = canvasSize

    // Set canvas dimensions with DPR for sharp rendering
    canvas.width = totalW * dpr
    canvas.height = totalH * dpr
    canvas.style.width = `${totalW}px`
    canvas.style.height = `${totalH}px`
    ctx.scale(dpr, dpr)

    // Fill background
    ctx.fillStyle = weftHex
    ctx.fillRect(0, 0, totalW, totalH)

    // Draw tiled pattern
    for (let ty = 0; ty < tilesY; ty++) {
      for (let tx = 0; tx < tilesX; tx++) {
        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            const x = (tx * cols + c) * cellSize
            const y = (ty * rows + r) * cellSize

            // Skip if outside canvas bounds
            if (x >= totalW || y >= totalH) continue

            // 1 = warp up (show warp color), 0 = weft up (show weft color)
            ctx.fillStyle = matrix[r][c] === 1 ? warpHex : weftHex
            ctx.fillRect(x, y, cellSize, cellSize)
          }
        }
      }
    }

    setRendered(true)
  }, [matrix, warpHex, weftHex])

  useEffect(() => {
    if (previewRef.current && matrix.length > 0 && matrix[0]?.length > 0) {
      // Small delay to ensure canvas is mounted and ready
      const timer = setTimeout(() => {
        if (previewRef.current) {
          renderSimulation(previewRef.current, 320)
        }
      }, 50)
      return () => clearTimeout(timer)
    }
  }, [renderSimulation, matrix])

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

  if (!matrix.length || !matrix[0]?.length) {
    return (
      <div style={{
        textAlign: 'center', padding: 40,
        color: 'var(--text-3)', fontSize: 13,
        background: '#F8F9FA', borderRadius: 12,
        border: '1.5px dashed var(--border)',
      }}>
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#CCC" strokeWidth="1.5" style={{ marginBottom: 12 }}>
          <rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 15l6-6 4 4 4-4 4 4" />
        </svg>
        <div>Enter a peg plan to see fabric simulation</div>
        <div style={{ fontSize: 11, marginTop: 4, color: '#BBB' }}>Go to Peg Plan tab → type or click the grid</div>
      </div>
    )
  }

  return (
    <div style={{ width: '100%' }}>
      {/* Preview */}
      <div style={{
        display: 'flex', justifyContent: 'center',
        marginBottom: 16,
      }}>
        <div style={{
          width: 320, height: 320,
          borderRadius: 12,
          overflow: 'hidden',
          border: '1px solid var(--border)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          background: '#F0F0F0',
        }}>
          <canvas
            ref={previewRef}
            style={{ display: 'block', width: 320, height: 320 }}
          />
        </div>
      </div>

      {/* Color Legend */}
      <div style={{
        display: 'flex', gap: 20, justifyContent: 'center', marginBottom: 16, fontSize: 12,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 16, height: 16, borderRadius: 4, background: warpHex, border: '1px solid var(--border)', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }} />
          <span style={{ color: 'var(--text-2)', fontWeight: 500 }}>Warp</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 16, height: 16, borderRadius: 4, background: weftHex, border: '1px solid var(--border)', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }} />
          <span style={{ color: 'var(--text-2)', fontWeight: 500 }}>Weft</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 11, color: 'var(--text-3)' }}>
            {matrix.length}×{matrix[0]?.length} repeat
          </span>
        </div>
      </div>

      {/* Buttons */}
      <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
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
