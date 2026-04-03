'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { textToMatrix, matrixToText } from '@/lib/pegplan/parser'
import WeaveCanvas from './WeaveCanvas'

interface PegPlanEditorProps {
  shaftCount: number
  onChange: (text: string, matrix: number[][]) => void
  initialText?: string
}

export default function PegPlanEditor({ shaftCount, onChange, initialText = '' }: PegPlanEditorProps) {
  const [text, setText] = useState(initialText)
  const [matrix, setMatrix] = useState<number[][]>(() => textToMatrix(initialText, shaftCount))
  const isUpdatingFromText = useRef(false)
  const isUpdatingFromGrid = useRef(false)
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Sync initial text
  useEffect(() => {
    if (initialText !== text) {
      setText(initialText)
      setMatrix(textToMatrix(initialText, shaftCount))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialText])

  // TEXT → GRID (debounced 300ms)
  const handleTextChange = useCallback((newText: string) => {
    if (isUpdatingFromGrid.current) return
    setText(newText)

    if (debounceTimer.current) clearTimeout(debounceTimer.current)
    debounceTimer.current = setTimeout(() => {
      isUpdatingFromText.current = true
      const newMatrix = textToMatrix(newText, shaftCount)
      setMatrix(newMatrix)
      onChange(newText, newMatrix)
      isUpdatingFromText.current = false
    }, 300)
  }, [shaftCount, onChange])

  // GRID → TEXT
  const handleToggle = useCallback((row: number, col: number) => {
    if (isUpdatingFromText.current) return
    isUpdatingFromGrid.current = true

    const newMatrix = matrix.map((r, ri) =>
      ri === row ? r.map((c, ci) => ci === col ? (c === 1 ? 0 : 1) : c) : [...r]
    )

    // If toggling beyond existing rows, expand
    while (newMatrix.length <= row) {
      newMatrix.push(new Array(shaftCount).fill(0))
    }

    setMatrix(newMatrix)
    const newText = matrixToText(newMatrix)
    setText(newText)
    onChange(newText, newMatrix)

    isUpdatingFromGrid.current = false
  }, [matrix, shaftCount, onChange])

  const handleClear = () => {
    setText('')
    setMatrix([])
    onChange('', [])
  }

  const handleStraightDraft = () => {
    const newMatrix: number[][] = []
    for (let i = 0; i < shaftCount; i++) {
      const row = new Array(shaftCount).fill(0)
      row[i] = 1
      newMatrix.push(row)
    }
    setMatrix(newMatrix)
    const newText = matrixToText(newMatrix)
    setText(newText)
    onChange(newText, newMatrix)
  }

  const picks = matrix.length
  const shafts = shaftCount
  const repeatW = matrix[0]?.length || 0
  const repeatH = picks

  return (
    <div>
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 16,
      }}>
        {/* LEFT — Text Input */}
        <div>
          <label style={{ marginBottom: 8, display: 'block' }}>
            Peg Plan (text format)
          </label>
          <textarea
            value={text}
            onChange={(e) => handleTextChange(e.target.value)}
            placeholder={`1-->1,3,5,6\n---\n2-->2,4,6,8\n---\n3-->1,3,5,7`}
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 13,
              lineHeight: 1.6,
              background: 'var(--bg-darker)',
              minHeight: 240,
              resize: 'vertical',
            }}
          />
          <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 6 }}>
            Format: pick--&gt;shaft,shaft,shaft
          </div>
        </div>

        {/* RIGHT — Visual Grid */}
        <div>
          <label style={{ marginBottom: 8, display: 'block' }}>
            Peg Plan (visual grid)
          </label>
          <div style={{
            background: 'var(--bg)',
            borderRadius: 10,
            padding: 16,
            border: '1px solid var(--border-light)',
            minHeight: 240,
            display: 'flex',
            alignItems: 'flex-start',
          }}>
            {matrix.length > 0 ? (
              <WeaveCanvas
                matrix={matrix}
                shaftCount={shaftCount}
                onToggle={handleToggle}
                repeatW={repeatW}
                repeatH={repeatH}
              />
            ) : (
              <div style={{
                width: '100%',
                textAlign: 'center',
                color: 'var(--text-3)',
                fontSize: 13,
                paddingTop: 60,
              }}>
                Enter peg plan text or click to draw
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 14,
        paddingTop: 14,
        borderTop: '1px solid var(--border-light)',
      }}>
        <div style={{ fontSize: 12, color: 'var(--text-2)' }}>
          Picks: <strong>{picks}</strong> · Shafts: <strong>{shafts}</strong> · Repeat: <strong>{repeatW}×{repeatH}</strong>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={handleClear} className="btn-secondary" style={{ fontSize: 12, height: 32 }}>
            Clear all
          </button>
          <button onClick={handleStraightDraft} className="btn-secondary" style={{ fontSize: 12, height: 32 }}>
            Generate straight draft
          </button>
        </div>
      </div>
    </div>
  )
}
