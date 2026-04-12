'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { textToMatrix, matrixToText } from '@/lib/pegplan/parser'
import WeaveCanvas from './WeaveCanvas'
import { useDesignStore } from '@/lib/store/designStore'

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

  // Re-parse matrix when shaftCount changes
  useEffect(() => {
    setMatrix(textToMatrix(text, shaftCount))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shaftCount])

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

  // Read border shaft reservation from global store
  const borderShaftsUsed = useDesignStore(s => s.borderShaftsUsed)
  const bodyBudget = Math.max(0, shaftCount - borderShaftsUsed)
  const bodyShaftsOver = borderShaftsUsed > 0 &&
    matrix.some(row => row.some((_, ci) => ci >= bodyBudget && row[ci] === 1))

  return (
    <div style={{ width: '100%' }}>

      {/* ── Shaft reservation banner ── */}
      {borderShaftsUsed > 0 && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '10px 14px', borderRadius: 10, marginBottom: 14,
          background: bodyShaftsOver ? '#FEF2F2' : '#F0FDF4',
          border: `1px solid ${bodyShaftsOver ? '#FCA5A5' : '#BBF7D0'}`,
        }}>
          <div style={{ fontSize: 18 }}>{bodyShaftsOver ? '❌' : '✓'}</div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700,
              color: bodyShaftsOver ? '#DC2626' : '#166534' }}>
              {bodyShaftsOver
                ? `Body peg plan exceeds shaft budget!`
                : `Body shaft budget: ${bodyBudget} of ${shaftCount} shafts`}
            </div>
            <div style={{ fontSize: 11, color: bodyShaftsOver ? '#DC2626' : '#15803D', marginTop: 2 }}>
              Border Design has claimed {borderShaftsUsed} shaft{borderShaftsUsed !== 1 ? 's' : ''}.
              {' '}Body peg plan must only use shafts 1–{bodyBudget}.
            </div>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
            <div style={{ fontSize: 11, padding: '3px 10px', borderRadius: 99,
              background: '#FFF7ED', color: '#EA580C', fontWeight: 700, whiteSpace: 'nowrap' }}>
              🧵 Border: {borderShaftsUsed}
            </div>
            <div style={{ fontSize: 11, padding: '3px 10px', borderRadius: 99,
              background: bodyShaftsOver ? '#FEE2E2' : 'rgba(0,122,255,0.1)',
              color: bodyShaftsOver ? '#DC2626' : '#007AFF',
              fontWeight: 700, whiteSpace: 'nowrap' }}>
              ⬛ Body: {bodyBudget}
            </div>
          </div>
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* LEFT — Text Input */}
        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ flex: '0 0 340px', minWidth: 240 }}>
            <label style={{ marginBottom: 6, display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text-2)' }}>
              Peg Plan — Text Format
            </label>
            <textarea
              value={text}
              onChange={(e) => handleTextChange(e.target.value)}
              placeholder={`1-->1,3,5,6\n---\n2-->2,4,6,8\n---\n3-->1,3,5,7`}
              rows={Math.max(16, text.split('\n').length)}
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 12.5,
                lineHeight: 1.65,
                background: 'var(--bg)',
                borderRadius: 10,
                width: '100%',
              }}
            />
            <div style={{ fontSize: 11, color: 'var(--text-4)', marginTop: 5, letterSpacing: '-0.005em' }}>
              Format: pick--&gt;shaft,shaft,shaft
            </div>
          </div>

          {/* RIGHT — Visual Grid */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <label style={{ marginBottom: 6, display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text-2)' }}>
              Peg Plan — Visual Grid
            </label>
            <div style={{
              background: 'var(--bg)',
              borderRadius: 12,
              padding: 16,
              border: '1px solid var(--border-light)',
              minHeight: 200,
              overflow: 'auto',
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
                  textAlign: 'center',
                  color: 'var(--text-4)',
                  fontSize: 13,
                  paddingTop: 60,
                }}>
                  Enter peg plan text or click to draw
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mt-5 pt-4 gap-3 sm:gap-0" style={{ borderTop: '1px solid var(--border-light)' }}>
        <div style={{ display: 'flex', gap: 8 }}>
          {[`Picks: ${picks}`, `Shafts: ${shafts}`, `Repeat: ${repeatW}×${repeatH}`].map(s => (
            <span key={s} style={{
              fontSize: 11, fontWeight: 600,
              color: 'var(--text-2)',
              background: 'rgba(0,0,0,0.05)',
              padding: '3px 9px', borderRadius: 99,
              letterSpacing: '-0.01em',
            }}>{s}</span>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={handleClear} className="btn-secondary">
            Clear
          </button>
          <button onClick={handleStraightDraft} className="btn-secondary">
            Straight Draft
          </button>
        </div>
      </div>
    </div>
  )
}
