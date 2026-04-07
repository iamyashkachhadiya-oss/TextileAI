'use client'

import React, { useState, useMemo, useRef } from 'react'
import { designLibrary } from '@/data/designLibrary'
import { useDesignStore } from '@/lib/store/designStore'

// ─── Types ────────────────────────────────────────────────────────────────────
type Design = (typeof designLibrary.designs)[number]
type ViewMode = 'visual' | 'shaft'

// ─── Design Code Generator ────────────────────────────────────────────────────
function generateDesignCode(design: Design): string {
  const typeMap: Record<string, string> = {
    'Twill': 'TW', 'Plain': 'PL', 'Satin': 'ST', 'Oxford': 'OX',
    'Dobby': 'DB', 'Herringbone': 'HB', 'Basket': 'BK',
    'Broken Twill': 'BT', 'Zigzag Twill': 'ZZ', 'Crosshatch': 'CH',
    'Double Weave': 'DW', 'Elongated Twill': 'ET', 'Matt Twill': 'MT',
    'Dobby Twill': 'DT', 'Steep Twill': 'STP', 'Reclining Twill': 'RT',
    'Mock Leno': 'ML', 'Modified Twill': 'MOD', 'End-on-End': 'EE',
    'Royal Oxford': 'RO', 'Combined': 'CB',
  }
  const type = typeMap[design.weave_type] || design.weave_type.slice(0, 2).toUpperCase()
  const ratio = (design.twill_ratio || '').replace('/', 'x').replace(/\s/g, '').slice(0, 6)
  const dir = (design.direction || 'N').replace(/\s.*/, '').slice(0, 2).toUpperCase()
  const num = design.id.replace(/[^0-9]/g, '').padStart(2, '0').slice(0, 4)
  return `D-${type}-${ratio}-${dir}-${num}`
}

// ─── Matrix → Shaft Thread Mapping ────────────────────────────────────────────
// For each column (shaft), collect the row indices (thread positions) where it activates.
function matrixToShaftMapping(matrix: number[][]): string {
  if (!matrix.length || !matrix[0].length) return ''
  const cols = matrix[0].length
  const lines: string[] = []
  for (let j = 0; j < cols; j++) {
    const threads = matrix
      .map((row, i) => (row[j] ? i + 1 : null))
      .filter((v): v is number => v !== null)
    lines.push(`Shaft ${j + 1}  →  ${threads.length > 0 ? threads.join(', ') : '(none)'}`)
  }
  return lines.join('\n')
}

// ─── Color Palette ────────────────────────────────────────────────────────────
const fabricPalette: Record<string, { bg: string; text: string; accent: string; stripe: string }> = {
  'Denim':               { bg: '#EFF6FF', text: '#1D4ED8', accent: '#2563EB', stripe: '#3B82F6' },
  'Shirting':            { bg: '#F0FDF4', text: '#15803D', accent: '#16A34A', stripe: '#22C55E' },
  'Suiting':             { bg: '#F5F3FF', text: '#6D28D9', accent: '#7C3AED', stripe: '#8B5CF6' },
  'Canvas/Duck':         { bg: '#FFFBEB', text: '#B45309', accent: '#D97706', stripe: '#F59E0B' },
  'Poplin/Lawn':         { bg: '#FFF1F2', text: '#BE185D', accent: '#DB2777', stripe: '#EC4899' },
  'Tweed':               { bg: '#F9FAFB', text: '#374151', accent: '#6B7280', stripe: '#9CA3AF' },
  'Corduroy':            { bg: '#FFF7ED', text: '#C2410C', accent: '#EA580C', stripe: '#F97316' },
  'Crepe':               { bg: '#F0F9FF', text: '#0369A1', accent: '#0284C7', stripe: '#0EA5E9' },
  'Dobby Fancy/Fashion': { bg: '#FDF4FF', text: '#7E22CE', accent: '#9333EA', stripe: '#A855F7' },
}
function getPalette(f: string) {
  return fabricPalette[f] || { bg: '#F3F4F6', text: '#374151', accent: '#6B7280', stripe: '#9CA3AF' }
}

// ─── Peg Plan Visual Grid ─────────────────────────────────────────────────────
function PegGrid({
  matrix,
  size,
  accentColor,
}: {
  matrix: number[][] | string
  size: 'card' | 'modal'
  accentColor?: string
}) {
  if (typeof matrix === 'string') {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '100%', color: 'var(--text-4)', fontSize: 11,
        fontStyle: 'italic', fontFamily: 'var(--font-mono)',
      }}>
        Complex matrix
      </div>
    )
  }

  const rows = matrix.length
  const cols = matrix[0]?.length || 0
  if (rows === 0 || cols === 0) return null

  const onColor = accentColor || '#1E3A5F'
  const offColor = '#EEF0F3'

  if (size === 'card') {
    // Fill the card preview area: max 240px wide, cells as big as possible
    const maxPx = 240
    const cellPx = Math.max(3, Math.min(Math.floor(maxPx / Math.max(cols, rows)), 22))
    const w = cols * cellPx
    const h = rows * cellPx
    return (
      <svg
        width={w} height={h}
        style={{ display: 'block', imageRendering: 'pixelated', maxWidth: '100%' }}
      >
        {matrix.map((row, ri) =>
          row.map((c, ci) => (
            <rect
              key={`${ri}-${ci}`}
              x={ci * cellPx} y={ri * cellPx}
              width={cellPx - (cellPx > 4 ? 1 : 0)}
              height={cellPx - (cellPx > 4 ? 1 : 0)}
              rx={cellPx > 6 ? 2 : 0}
              fill={c ? onColor : offColor}
            />
          ))
        )}
      </svg>
    )
  }

  // Modal: larger cells, max ~320px wide
  const cellPx = Math.max(4, Math.min(Math.floor(320 / Math.max(cols, 1)), 26))
  const w = cols * cellPx
  const h = rows * cellPx
  return (
    <svg width={w} height={h} style={{ display: 'block', maxWidth: '100%' }}>
      {matrix.map((row, ri) =>
        row.map((c, ci) => (
          <g key={`${ri}-${ci}`}>
            <rect
              x={ci * cellPx} y={ri * cellPx}
              width={cellPx - 1} height={cellPx - 1}
              rx={2}
              fill={c ? onColor : offColor}
            />
            {c && cellPx >= 14 && (
              <rect
                x={ci * cellPx + 3} y={ri * cellPx + 3}
                width={cellPx - 7} height={cellPx - 7}
                rx={1}
                fill="rgba(255,255,255,0.18)"
              />
            )}
          </g>
        ))
      )}
    </svg>
  )
}

// ─── Copy Button ──────────────────────────────────────────────────────────────
function CopyBtn({ code }: { code: string }) {
  const [done, setDone] = useState(false)
  const copy = (e: React.MouseEvent) => {
    e.stopPropagation()
    navigator.clipboard.writeText(code).then(() => {
      setDone(true)
      setTimeout(() => setDone(false), 1600)
    })
  }
  return (
    <button
      onClick={copy}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 4,
        padding: '2px 8px', borderRadius: 5,
        border: `1px solid ${done ? '#BBF7D0' : 'rgba(0,0,0,0.09)'}`,
        background: done ? '#DCFCE7' : '#F5F5F7',
        color: done ? '#15803D' : 'var(--text-2)',
        fontSize: 11, fontFamily: 'var(--font-mono)', fontWeight: 600,
        cursor: 'pointer', transition: 'all 0.15s', whiteSpace: 'nowrap',
      }}
    >
      {done ? '✓ Copied' : '⎘ Copy'}
    </button>
  )
}

// ─── Design Card ──────────────────────────────────────────────────────────────
function DesignCard({
  design, code, bookmarked,
  onOpen, onBookmark,
}: {
  design: Design; code: string; bookmarked: boolean
  onOpen: () => void; onBookmark: () => void
}) {
  const pal = getPalette(design.fabric_type)
  const matrix = design.peg_matrix
  const rows = typeof matrix !== 'string' ? matrix.length : 0
  const cols = typeof matrix !== 'string' ? (matrix[0]?.length || 0) : 0

  return (
    <div
      onClick={onOpen}
      style={{
        background: '#fff',
        border: '1px solid rgba(0,0,0,0.07)',
        borderRadius: 16,
        cursor: 'pointer',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
        transition: 'all 0.18s cubic-bezier(0.4,0,0.2,1)',
        position: 'relative',
      }}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLDivElement
        el.style.borderColor = pal.accent + '66'
        el.style.boxShadow = `0 6px 24px ${pal.accent}18, 0 2px 8px rgba(0,0,0,0.06)`
        el.style.transform = 'translateY(-3px)'
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLDivElement
        el.style.borderColor = 'rgba(0,0,0,0.07)'
        el.style.boxShadow = '0 1px 4px rgba(0,0,0,0.05)'
        el.style.transform = 'translateY(0)'
      }}
    >
      {/* Top accent stripe */}
      <div style={{ height: 3, background: `linear-gradient(90deg, ${pal.accent}, ${pal.stripe})` }} />

      {/* Peg plan preview — dominant visual */}
      <div style={{
        background: '#F8F9FA',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '24px 20px',
        minHeight: 220,
        position: 'relative',
      }}>
        <PegGrid matrix={matrix} size="card" accentColor={pal.accent} />

        {/* Bookmark btn */}
        <button
          onClick={e => { e.stopPropagation(); onBookmark() }}
          style={{
            position: 'absolute', top: 8, right: 8,
            width: 28, height: 28, borderRadius: 8,
            background: bookmarked ? '#FEF9C3' : 'rgba(255,255,255,0.85)',
            border: 'none', cursor: 'pointer', fontSize: 13,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            backdropFilter: 'blur(4px)',
            transition: 'all 0.15s',
            boxShadow: '0 1px 4px rgba(0,0,0,0.10)',
          }}
        >
          {bookmarked ? '★' : '☆'}
        </button>

        {/* Grid size badge */}
        {rows > 0 && (
          <div style={{
            position: 'absolute', bottom: 8, right: 8,
            fontSize: 9, fontFamily: 'var(--font-mono)', fontWeight: 600,
            color: 'var(--text-4)',
            background: 'rgba(255,255,255,0.80)',
            padding: '1px 6px', borderRadius: 4,
            backdropFilter: 'blur(4px)',
          }}>
            {rows}×{cols}
          </div>
        )}
      </div>

      {/* Card footer — minimal info */}
      <div style={{ padding: '12px 14px 14px', display: 'flex', flexDirection: 'column', gap: 7 }}>
        {/* Name */}
        <div style={{
          fontSize: 13.5, fontWeight: 700,
          color: 'var(--text-1)', lineHeight: 1.3,
          letterSpacing: '-0.015em',
        }}>
          {design.name}
        </div>

        {/* Tags row — only fabric + weave + ratio */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          <span style={{
            fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 99,
            background: pal.bg, color: pal.text, whiteSpace: 'nowrap',
          }}>
            {design.fabric_type}
          </span>
          <span style={{
            fontSize: 10, fontWeight: 500, padding: '2px 8px', borderRadius: 99,
            background: '#F0F0F5', color: 'var(--text-2)', whiteSpace: 'nowrap',
          }}>
            {design.weave_type}
          </span>
          {design.twill_ratio && design.twill_ratio !== 'N/A' && (
            <span style={{
              fontSize: 10, fontWeight: 500, padding: '2px 8px', borderRadius: 99,
              background: '#EAEFFB', color: '#3B5FBD', whiteSpace: 'nowrap',
            }}>
              {design.twill_ratio}
            </span>
          )}
        </div>

        {/* Code row */}
        <div
          style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 1 }}
          onClick={e => e.stopPropagation()}
        >
          <span style={{
            fontFamily: 'var(--font-mono)', fontSize: 9.5, fontWeight: 700,
            color: pal.text, background: pal.bg,
            padding: '2px 7px', borderRadius: 4,
            flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            letterSpacing: 0.2,
          }}>
            {code}
          </span>
          <CopyBtn code={code} />
        </div>
      </div>
    </div>
  )
}

// ─── Detail Modal ─────────────────────────────────────────────────────────────
function DesignModal({
  design, code,
  onClose, onLoad, onSimilar,
  bookmarked, onBookmark,
}: {
  design: Design; code: string
  onClose: () => void; onLoad: () => void; onSimilar: () => void
  bookmarked: boolean; onBookmark: () => void
}) {
  const [view, setView] = useState<ViewMode>('visual')
  const pal = getPalette(design.fabric_type)
  const matrix = design.peg_matrix
  const shaftText = typeof matrix !== 'string' ? matrixToShaftMapping(matrix) : null

  const params = [
    { label: 'Weave Type',    value: design.weave_type },
    { label: 'Ratio',         value: design.twill_ratio },
    { label: 'Shaft Count',   value: design.shaft_count },
    { label: 'Repeat Size',   value: `${design.repeat_size}×${design.repeat_size}` },
    { label: 'Direction',     value: design.direction },
    { label: 'Float Length',  value: design.float_length },
    { label: 'Threading',     value: design.threading },
    { label: 'Weight',        value: design.weight + ((design as any).weight_range ? ` (${(design as any).weight_range})` : '') },
    ...((design as any).angle ? [{ label: 'Angle', value: `${(design as any).angle}°` }] : []),
    ...((design as any).production_ease ? [{ label: 'Production', value: (design as any).production_ease }] : []),
    ...((design as any).performance_rating ? [{ label: 'Performance', value: `${(design as any).performance_rating}/100` }] : []),
    ...((design as any).market_share ? [{ label: 'Market Share', value: (design as any).market_share }] : []),
  ]

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(15,15,20,0.50)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#fff',
          borderRadius: 22,
          width: '100%', maxWidth: 660,
          maxHeight: '88vh',
          overflowY: 'auto',
          display: 'flex', flexDirection: 'column',
          boxShadow: '0 40px 100px rgba(0,0,0,0.24), 0 8px 24px rgba(0,0,0,0.12)',
          animation: 'modal-in 0.22s cubic-bezier(0.34,1.4,0.64,1)',
        }}
      >
        {/* Top accent */}
        <div style={{ height: 4, background: `linear-gradient(90deg, ${pal.accent}, ${pal.stripe})`, borderRadius: '22px 22px 0 0' }} />

        {/* Header */}
        <div style={{
          padding: '18px 22px 14px',
          borderBottom: '1px solid rgba(0,0,0,0.06)',
          position: 'sticky', top: 0, background: '#fff', zIndex: 10,
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12,
        }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8, flexWrap: 'wrap' }}>
              <span style={{
                fontSize: 10, fontWeight: 700, padding: '2px 9px',
                borderRadius: 99, background: pal.bg, color: pal.text,
              }}>
                {design.fabric_type}
              </span>
              <span style={{
                fontFamily: 'var(--font-mono)', fontSize: 10.5, fontWeight: 700,
                background: '#F0F0F5', color: 'var(--text-2)',
                padding: '2px 8px', borderRadius: 6, letterSpacing: 0.4,
              }}>
                {code}
              </span>
              <CopyBtn code={code} />
            </div>
            <h3 style={{
              fontSize: 17, fontWeight: 700, color: 'var(--text-1)',
              letterSpacing: '-0.025em', lineHeight: 1.2, margin: 0,
            }}>
              {design.name}
            </h3>
            <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 3 }}>
              ID: {design.id} · {design.shaft_count} Shafts · {design.weight}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
            <button
              onClick={onBookmark}
              style={{
                width: 34, height: 34, borderRadius: 10,
                background: bookmarked ? '#FEF9C3' : 'rgba(0,0,0,0.05)',
                border: 'none', cursor: 'pointer', fontSize: 16,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.15s',
              }}
            >
              {bookmarked ? '★' : '☆'}
            </button>
            <button
              onClick={onClose}
              style={{
                width: 34, height: 34, borderRadius: 10,
                background: 'rgba(0,0,0,0.05)',
                border: 'none', cursor: 'pointer', color: 'var(--text-2)',
                fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.15s',
              }}
            >
              ×
            </button>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Description */}
          {(design as any).description && (
            <p style={{ margin: 0, fontSize: 13, color: 'var(--text-2)', lineHeight: 1.65 }}>
              {(design as any).description}
            </p>
          )}

          {/* Parameters grid */}
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '10px 16px',
            background: '#FAFAFA', borderRadius: 14,
            border: '1px solid rgba(0,0,0,0.06)',
            padding: '14px 16px',
          }}>
            {params.map(({ label, value }) => (
              <div key={label}>
                <div style={{ fontSize: 9.5, fontWeight: 700, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 2 }}>
                  {label}
                </div>
                <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-1)' }}>
                  {value ?? '—'}
                </div>
              </div>
            ))}
          </div>

          {/* Peg Plan — toggle visual / shaft mapping */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-1)', letterSpacing: '-0.01em' }}>
                Peg Plan
              </div>
              <div style={{
                display: 'flex', gap: 2, background: 'rgba(0,0,0,0.06)',
                padding: 3, borderRadius: 9,
              }}>
                {(['visual', 'shaft'] as ViewMode[]).map(v => (
                  <button
                    key={v}
                    onClick={() => setView(v)}
                    style={{
                      fontSize: 11, fontWeight: view === v ? 700 : 500,
                      fontFamily: 'var(--font-body)',
                      padding: '4px 12px', border: 'none', borderRadius: 6,
                      cursor: 'pointer',
                      background: view === v ? '#fff' : 'transparent',
                      color: view === v ? 'var(--text-1)' : 'var(--text-3)',
                      boxShadow: view === v ? '0 1px 4px rgba(0,0,0,0.10)' : 'none',
                      transition: 'all 0.15s',
                    }}
                  >
                    {v === 'visual' ? '⬛ Visual Grid' : '≡ Shaft Mapping'}
                  </button>
                ))}
              </div>
            </div>

            {view === 'visual' ? (
              <div style={{
                background: '#F8F9FA', borderRadius: 14,
                border: '1px solid rgba(0,0,0,0.06)',
                padding: '20px', display: 'flex',
                justifyContent: 'center', overflowX: 'auto',
              }}>
                <PegGrid matrix={matrix} size="modal" accentColor={pal.accent} />
              </div>
            ) : shaftText ? (
              <div style={{
                background: '#F8F9FA', borderRadius: 14,
                border: '1px solid rgba(0,0,0,0.06)',
                padding: '16px 20px', overflowX: 'auto',
              }}>
                <pre style={{
                  margin: 0,
                  fontFamily: 'var(--font-mono)',
                  fontSize: 12.5,
                  lineHeight: 2,
                  color: 'var(--text-1)',
                  whiteSpace: 'pre',
                }}>
                  {(() => {
                    const m = matrix as number[][]
                    const cols = m[0]?.length || 0
                    return Array.from({ length: cols }, (_, j) => {
                      const threads = m
                        .map((row, i) => (row[j] ? i + 1 : null))
                        .filter((v): v is number => v !== null)
                      return (
                        <div key={j} style={{ display: 'flex', alignItems: 'baseline', gap: 0 }}>
                          <span style={{
                            display: 'inline-block', minWidth: 60,
                            fontWeight: 700,
                            color: pal.accent,
                          }}>
                            Shaft {j + 1}
                          </span>
                          <span style={{ color: 'var(--text-3)', margin: '0 10px', fontSize: 14 }}>→</span>
                          <span style={{ color: 'var(--text-1)', fontWeight: 500, letterSpacing: '0.02em' }}>
                            {threads.length > 0 ? threads.join(', ') : '(none)'}
                          </span>
                        </div>
                      )
                    })
                  })()}
                </pre>
              </div>
            ) : (
              <div style={{
                background: '#F8F9FA', borderRadius: 14, padding: '16px 20px',
                fontSize: 12, color: 'var(--text-3)', fontStyle: 'italic',
              }}>
                Shaft mapping not available for complex matrix designs.
              </div>
            )}

            {typeof matrix !== 'string' && (
              <div style={{ fontSize: 10, color: 'var(--text-4)', marginTop: 6, textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
                {matrix[0]?.length || 0} shafts × {matrix.length} picks
              </div>
            )}
          </div>

          {/* Tags */}
          {(design.tags as string[]).length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
              {(design.tags as string[]).map(t => (
                <span key={t} style={{
                  fontSize: 11, padding: '3px 9px', borderRadius: 6,
                  background: '#F3F4F6', color: 'var(--text-3)',
                  border: '1px solid rgba(0,0,0,0.06)',
                }}>
                  #{t}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '12px 22px',
          borderTop: '1px solid rgba(0,0,0,0.06)',
          background: '#FAFAFA',
          borderRadius: '0 0 22px 22px',
          display: 'flex', gap: 8, alignItems: 'center',
          position: 'sticky', bottom: 0,
        }}>
          <button
            onClick={onSimilar}
            style={{
              height: 36, padding: '0 16px', fontSize: 12.5, fontWeight: 600,
              background: 'rgba(0,0,0,0.05)', border: 'none', borderRadius: 9,
              cursor: 'pointer', color: 'var(--text-1)',
              fontFamily: 'var(--font-body)', transition: 'all 0.15s',
              display: 'flex', alignItems: 'center', gap: 5,
            }}
          >
            ✦ Similar
          </button>
          <div style={{ flex: 1 }} />
          <button
            onClick={onClose}
            style={{
              height: 36, padding: '0 16px', fontSize: 12.5, fontWeight: 500,
              background: '#fff', border: '1px solid rgba(0,0,0,0.10)',
              borderRadius: 9, cursor: 'pointer', color: 'var(--text-2)',
              fontFamily: 'var(--font-body)', transition: 'all 0.15s',
            }}
          >
            Close
          </button>
          <button
            onClick={onLoad}
            style={{
              height: 36, padding: '0 20px', fontSize: 12.5, fontWeight: 700,
              background: 'var(--accent)', color: '#fff',
              border: 'none', borderRadius: 9, cursor: 'pointer',
              fontFamily: 'var(--font-body)',
              boxShadow: '0 4px 14px rgba(0,122,255,0.28)',
              transition: 'all 0.15s',
              display: 'flex', alignItems: 'center', gap: 5,
            }}
          >
            Load into Studio →
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function DesignLibrary() {
  const { setPegPlan, updateIdentity, setShaftCount } = useDesignStore()

  // ── Filter state ──
  const [search, setSearch] = useState('')
  const [codeInput, setCodeInput] = useState('')
  const [codeError, setCodeError] = useState('')
  const [activeFabrics, setActiveFabrics] = useState<Set<string>>(new Set())
  const [activeWeaves, setActiveWeaves] = useState<Set<string>>(new Set())
  const [shaftRange, setShaftRange] = useState('')
  const [weightFilter, setWeightFilter] = useState('')
  const [sortBy, setSortBy] = useState('popularity')
  const [showBookmarked, setShowBookmarked] = useState(false)
  const [bookmarks, setBookmarks] = useState<Set<string>>(new Set())
  const [similarFilter, setSimilarFilter] = useState<string | null>(null)

  // ── UI state ──
  const [selected, setSelected] = useState<Design | null>(null)
  const [page, setPage] = useState(1)
  const PAGE = 20

  // ── Derived ──
  const fabricTypes = useMemo(() => [...new Set(designLibrary.designs.map(d => d.fabric_type))], [])
  const weaveTypes = useMemo(() => {
    const c = designLibrary.designs.reduce((acc, d) => {
      acc[d.weave_type] = (acc[d.weave_type] || 0) + 1; return acc
    }, {} as Record<string, number>)
    return Object.keys(c).sort((a, b) => c[b] - c[a]).slice(0, 10)
  }, [])

  const designCodes = useMemo(() => {
    const m: Record<string, string> = {}
    for (const d of designLibrary.designs) m[d.id] = generateDesignCode(d)
    return m
  }, [])

  const codeToDesign = useMemo(() => {
    const m: Record<string, Design> = {}
    for (const d of designLibrary.designs) m[designCodes[d.id]] = d as Design
    return m
  }, [designCodes])

  const filtered = useMemo(() => {
    let data = [...designLibrary.designs] as Design[]
    if (showBookmarked) data = data.filter(d => bookmarks.has(d.id))
    if (similarFilter) {
      const ref = data.find(d => d.id === similarFilter)
      if (ref) {
        data = data.filter(d =>
          d.id !== similarFilter &&
          (d.weave_type === ref.weave_type || d.fabric_type === ref.fabric_type || d.shaft_count === ref.shaft_count)
        ).slice(0, 16)
      }
    }
    if (activeFabrics.size > 0) data = data.filter(d => activeFabrics.has(d.fabric_type))
    if (activeWeaves.size > 0) data = data.filter(d => activeWeaves.has(d.weave_type))
    if (shaftRange) {
      const [a, b] = shaftRange.split('-').map(Number)
      data = data.filter(d => d.shaft_count >= a && d.shaft_count <= b)
    }
    if (weightFilter) data = data.filter(d => d.weight === weightFilter)
    if (search) {
      const q = search.toLowerCase()
      data = data.filter(d =>
        d.name.toLowerCase().includes(q) ||
        d.fabric_type.toLowerCase().includes(q) ||
        d.weave_type.toLowerCase().includes(q) ||
        String(d.twill_ratio).toLowerCase().includes(q) ||
        (d.tags as string[]).some(t => t.toLowerCase().includes(q)) ||
        d.id.toLowerCase().includes(q) ||
        (designCodes[d.id] || '').toLowerCase().includes(q)
      )
    }
    if (sortBy === 'popularity') data.sort((a, b) => ((b as any).popularity || 0) - ((a as any).popularity || 0))
    else if (sortBy === 'name') data.sort((a, b) => a.name.localeCompare(b.name))
    else if (sortBy === 'shaft_asc') data.sort((a, b) => a.shaft_count - b.shaft_count)
    else if (sortBy === 'shaft_desc') data.sort((a, b) => b.shaft_count - a.shaft_count)
    return data
  }, [search, activeFabrics, activeWeaves, shaftRange, weightFilter, sortBy, showBookmarked, bookmarks, similarFilter, designCodes])

  const paged = useMemo(() => filtered.slice(0, page * PAGE), [filtered, page])
  const hasMore = filtered.length > paged.length

  const toggleFabric = (f: string) => {
    setActiveFabrics(prev => { const s = new Set(prev); s.has(f) ? s.delete(f) : s.add(f); return s }); setPage(1)
  }
  const toggleWeave = (w: string) => {
    setActiveWeaves(prev => { const s = new Set(prev); s.has(w) ? s.delete(w) : s.add(w); return s }); setPage(1)
  }
  const clearAll = () => {
    setActiveFabrics(new Set()); setActiveWeaves(new Set())
    setShaftRange(''); setWeightFilter(''); setSearch(''); setSortBy('popularity')
    setShowBookmarked(false); setSimilarFilter(null); setPage(1); setCodeInput(''); setCodeError('')
  }
  const toggleBookmark = (id: string) =>
    setBookmarks(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s })

  const handleCodeInput = (val: string) => {
    setCodeInput(val); setCodeError('')
    const t = val.trim().toUpperCase()
    if (!t) return
    const found = codeToDesign[t]
    if (found) { setSelected(found); setCodeError('') }
    else if (t.length >= 5) setCodeError('No design found for this code.')
  }

  const handleLoad = (design: Design) => {
    if (typeof design.peg_matrix === 'string') {
      alert(`Complex matrix for "${design.name}" is not yet supported.`); return
    }
    setShaftCount(design.shaft_count || 16)
    setPegPlan(`Loaded ${design.name}`, design.peg_matrix as number[][])
    updateIdentity({ design_name: design.name, design_number: design.id })
    setSelected(null)
  }

  const activeFilterCount = activeFabrics.size + activeWeaves.size + (shaftRange ? 1 : 0) + (weightFilter ? 1 : 0)
  const anyFilter = activeFilterCount > 0 || !!search || showBookmarked || !!similarFilter

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100%',
      background: '#fff', borderRadius: 18,
      border: '1px solid rgba(0,0,0,0.07)',
      boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
      overflow: 'hidden', minWidth: 0, width: '100%',
      position: 'relative',
    }}>

      {/* ── Header ── */}
      <div style={{
        padding: '14px 18px 10px',
        borderBottom: '1px solid rgba(0,0,0,0.06)',
        background: '#fff',
        display: 'flex', flexDirection: 'column', gap: 10, flexShrink: 0,
      }}>
        {/* Row 1: title + sort + clear */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-1)', letterSpacing: '-0.02em' }}>
              Design Library
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 1 }}>
              {filtered.length} / {designLibrary.meta.total_designs} designs
              {similarFilter && <span style={{ color: '#7C3AED', fontWeight: 600 }}> · Similar</span>}
            </div>
          </div>
          <div style={{ flex: 1 }} />
          <select
            value={sortBy} onChange={e => setSortBy(e.target.value)}
            style={{ height: 30, fontSize: 12, borderRadius: 8, padding: '0 10px', width: 'auto', cursor: 'pointer' }}
          >
            <option value="popularity">Popular</option>
            <option value="name">A–Z</option>
            <option value="shaft_asc">Shafts ↑</option>
            <option value="shaft_desc">Shafts ↓</option>
          </select>
          <button
            onClick={() => { setShowBookmarked(!showBookmarked); setPage(1) }}
            style={{
              height: 30, padding: '0 10px', fontSize: 12, fontWeight: 600,
              fontFamily: 'var(--font-body)',
              background: showBookmarked ? '#FEF9C3' : 'rgba(0,0,0,0.05)',
              color: showBookmarked ? '#B45309' : 'var(--text-2)',
              border: 'none', borderRadius: 8, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 4, transition: 'all 0.15s',
            }}
          >
            {showBookmarked ? '★' : '☆'}
            {bookmarks.size > 0 && (
              <span style={{ background: '#D97706', color: '#fff', fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 99 }}>
                {bookmarks.size}
              </span>
            )}
          </button>
          {anyFilter && (
            <button
              onClick={clearAll}
              style={{
                height: 30, padding: '0 10px', fontSize: 12, fontWeight: 600,
                background: '#FEF2F2', color: '#DC2626',
                border: 'none', borderRadius: 8, cursor: 'pointer',
                fontFamily: 'var(--font-body)',
              }}
            >
              ✕ Clear
            </button>
          )}
        </div>

        {/* Row 2: search + code input */}
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-4)', fontSize: 13, pointerEvents: 'none' }}>
              🔍
            </span>
            <input
              type="text" value={search} placeholder="Search name, type, tag, ratio…"
              onChange={e => { setSearch(e.target.value); setPage(1) }}
              style={{ paddingLeft: 32, height: 32, fontSize: 12.5, borderRadius: 9, width: '100%' }}
            />
          </div>
          <div style={{ position: 'relative' }}>
            <div style={{ display: 'flex' }}>
              <input
                type="text" value={codeInput} placeholder="Design code…"
                onChange={e => handleCodeInput(e.target.value)}
                style={{
                  width: 160, height: 32, fontSize: 12, fontFamily: 'var(--font-mono)',
                  borderRadius: '9px 0 0 9px',
                  borderTop: `1px solid ${codeError ? '#FCA5A5' : 'rgba(0,0,0,0.10)'}`,
                  borderBottom: `1px solid ${codeError ? '#FCA5A5' : 'rgba(0,0,0,0.10)'}`,
                  borderLeft: `1px solid ${codeError ? '#FCA5A5' : 'rgba(0,0,0,0.10)'}`,
                  borderRight: 'none',
                  background: codeError ? '#FFF5F5' : '#FAFAFA',
                  paddingLeft: 10,
                }}
              />
              <button
                onClick={() => handleCodeInput(codeInput)}
                style={{
                  height: 32, padding: '0 12px', fontSize: 12, fontWeight: 700,
                  background: 'var(--accent)', color: '#fff',
                  border: 'none', borderRadius: '0 9px 9px 0',
                  cursor: 'pointer', fontFamily: 'var(--font-body)',
                }}
              >
                Load
              </button>
            </div>
            {codeError && (
              <div style={{
                position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 10,
                fontSize: 10, color: '#DC2626', padding: '3px 8px',
                background: '#FFF5F5', border: '1px solid #FCA5A5',
                borderRadius: '0 0 6px 6px',
              }}>
                {codeError}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Body: sidebar + grid ── */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', minHeight: 0 }}>

        {/* Sidebar */}
        <div style={{
          width: 172, flexShrink: 0,
          borderRight: '1px solid rgba(0,0,0,0.06)',
          background: '#FAFAFA',
          overflowY: 'auto', padding: '12px 12px',
          display: 'flex', flexDirection: 'column', gap: 14,
        }}>
          {/* Fabric */}
          <div>
            <div style={{ fontSize: 9.5, fontWeight: 700, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: 7 }}>
              Fabric
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {fabricTypes.map(f => {
                const pal = getPalette(f)
                const cnt = designLibrary.designs.filter(d => d.fabric_type === f).length
                const on = activeFabrics.has(f)
                return (
                  <label key={f} style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    fontSize: 11.5, padding: '4px 6px', borderRadius: 7, cursor: 'pointer',
                    background: on ? pal.bg : 'transparent', transition: 'all 0.12s',
                    color: on ? pal.text : 'var(--text-1)',
                  }}>
                    <input type="checkbox" checked={on} onChange={() => toggleFabric(f)}
                      style={{ width: 12, height: 12, accentColor: pal.accent, cursor: 'pointer', flexShrink: 0 }} />
                    <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f}</span>
                    <span style={{ fontSize: 10, color: 'var(--text-4)' }}>{cnt}</span>
                  </label>
                )
              })}
            </div>
          </div>

          {/* Weave */}
          <div>
            <div style={{ fontSize: 9.5, fontWeight: 700, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: 7 }}>
              Weave
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {weaveTypes.map(w => {
                const cnt = designLibrary.designs.filter(d => d.weave_type === w).length
                const on = activeWeaves.has(w)
                return (
                  <label key={w} style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    fontSize: 11.5, padding: '4px 6px', borderRadius: 7, cursor: 'pointer',
                    background: on ? 'rgba(37,99,235,0.08)' : 'transparent', transition: 'all 0.12s',
                  }}>
                    <input type="checkbox" checked={on} onChange={() => toggleWeave(w)}
                      style={{ width: 12, height: 12, accentColor: '#2563EB', cursor: 'pointer', flexShrink: 0 }} />
                    <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-1)' }}>{w}</span>
                    <span style={{ fontSize: 10, color: 'var(--text-4)' }}>{cnt}</span>
                  </label>
                )
              })}
            </div>
          </div>

          {/* Shafts */}
          <div>
            <div style={{ fontSize: 9.5, fontWeight: 700, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: 7 }}>
              Shafts
            </div>
            <select value={shaftRange} onChange={e => { setShaftRange(e.target.value); setPage(1) }}
              style={{ width: '100%', height: 28, fontSize: 11.5, borderRadius: 7 }}>
              <option value="">All</option>
              <option value="2-4">2–4</option>
              <option value="5-8">5–8</option>
              <option value="9-16">9–16</option>
              <option value="17-24">17–24</option>
            </select>
          </div>

          {/* Weight */}
          <div>
            <div style={{ fontSize: 9.5, fontWeight: 700, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: 7 }}>
              Weight
            </div>
            <select value={weightFilter} onChange={e => { setWeightFilter(e.target.value); setPage(1) }}
              style={{ width: '100%', height: 28, fontSize: 11.5, borderRadius: 7 }}>
              <option value="">All</option>
              <option value="Ultra Light">Ultra Light</option>
              <option value="Light">Light</option>
              <option value="Medium">Medium</option>
              <option value="Heavy">Heavy</option>
              <option value="Extra Heavy">Extra Heavy</option>
            </select>
          </div>
        </div>

        {/* Design grid */}
        <div style={{
          flex: 1, overflowY: 'auto', background: '#F5F5F7',
          padding: '14px', display: 'flex', flexDirection: 'column', gap: 14,
        }}>
          {/* Similar banner */}
          {similarFilter && (
            <div style={{
              background: '#F5F3FF', border: '1px solid #DDD6FE',
              borderRadius: 10, padding: '8px 14px',
              display: 'flex', alignItems: 'center', gap: 8,
              fontSize: 12, color: '#5B21B6', fontWeight: 600,
            }}>
              <span>✦ Showing similar designs</span>
              <button
                onClick={() => { setSimilarFilter(null); setPage(1) }}
                style={{
                  marginLeft: 'auto', background: 'rgba(91,33,182,0.08)', border: 'none',
                  borderRadius: 6, cursor: 'pointer', color: '#5B21B6', fontSize: 12,
                  fontWeight: 700, padding: '2px 10px', fontFamily: 'var(--font-body)',
                }}
              >
                ✕ Show All
              </button>
            </div>
          )}

          {paged.length > 0 ? (
            <>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                gap: 16,
              }}>
                {paged.map(d => (
                  <DesignCard
                    key={d.id}
                    design={d as Design}
                    code={designCodes[d.id]}
                    bookmarked={bookmarks.has(d.id)}
                    onOpen={() => setSelected(d as Design)}
                    onBookmark={() => toggleBookmark(d.id)}
                  />
                ))}
              </div>

              {hasMore && (
                <div style={{ display: 'flex', justifyContent: 'center', paddingBottom: 4 }}>
                  <button
                    onClick={() => setPage(p => p + 1)}
                    style={{
                      padding: '9px 28px', fontSize: 13, fontWeight: 600,
                      background: '#fff', color: 'var(--text-1)',
                      border: '1px solid rgba(0,0,0,0.10)',
                      borderRadius: 10, cursor: 'pointer', fontFamily: 'var(--font-body)',
                      boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                    }}
                  >
                    Load More ({filtered.length - paged.length} remaining)
                  </button>
                </div>
              )}
            </>
          ) : (
            <div style={{
              flex: 1, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              padding: '60px 24px', textAlign: 'center',
              background: '#fff', borderRadius: 14,
              border: '1px dashed rgba(0,0,0,0.12)',
            }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>🔍</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-1)', marginBottom: 5 }}>No designs found</div>
              <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 16 }}>Try adjusting your filters.</div>
              <button
                onClick={clearAll}
                style={{
                  padding: '8px 20px', fontSize: 13, fontWeight: 600,
                  background: 'var(--accent)', color: '#fff',
                  border: 'none', borderRadius: 9, cursor: 'pointer',
                  fontFamily: 'var(--font-body)',
                }}
              >
                Clear Filters
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Detail Modal ── */}
      {selected && (
        <DesignModal
          design={selected}
          code={designCodes[selected.id]}
          onClose={() => setSelected(null)}
          onLoad={() => handleLoad(selected)}
          onSimilar={() => { setSelected(null); setSimilarFilter(selected.id); setPage(1) }}
          bookmarked={bookmarks.has(selected.id)}
          onBookmark={() => toggleBookmark(selected.id)}
        />
      )}
    </div>
  )
}
