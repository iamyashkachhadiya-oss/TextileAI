'use client'

import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react'
import { designLibrary as staticLib } from '@/data/designLibrary'
import { useDesignStore } from '@/lib/store/designStore'
import {
  loadAllPresets, generateRandom, generateSimilar, buildDesign,
  exportSVG, exportWIF, getColorSwatch,
  type GeneratedDesign,
} from '@/lib/weave/engine'
import { COLOR_SWATCHES } from '@/lib/weave/variations'
import type { FabricCategory } from '@/lib/weave/presets'
import {
  generateAllDesigns, estimateDesignCount, totalEstimatedDesigns,
  type GenerationProgress,
} from '@/lib/weave/massGenerate'

// ─── Types ────────────────────────────────────────────────────────────────────
type LibTab = 'generative' | 'static'
type GenCategory = 'all' | FabricCategory
type ViewMode = 'visual' | 'shaft' | 'text'

// ─── Static design adapter (normalise to a common shape) ─────────────────────
type SDesign = (typeof staticLib.designs)[number]

function staticToGen(d: SDesign, idx: number): GeneratedDesign {
  return {
    id: d.id,
    name_code: d.id,
    full_code: d.id,
    display_name: d.name,
    wif_name: d.id,
    params: {
      type: 'plain',
      fabric_type: d.fabric_type,
      weight: d.weight,
      tags: d.tags as string[],
      popularity: (d as any).popularity ?? 50,
      description: (d as any).description,
      applications: (d as any).applications,
    },
    matrix: typeof d.peg_matrix !== 'string' ? d.peg_matrix as number[][] : [[1,0],[0,1]],
    shaft_count: d.shaft_count,
    repeat_rows: d.repeat_size,
    repeat_cols: d.repeat_size,
    is_valid: true,
    warnings: [],
    source: 'preset',
    category: 'presets',
    fabric_type: d.fabric_type,
    weight: d.weight,
    popularity: (d as any).popularity ?? 50,
    description: (d as any).description,
    applications: (d as any).applications,
    tags: d.tags as string[],
  }
}

// ─── PegGrid ─────────────────────────────────────────────────────────────────
function PegGrid({ matrix, size, warpColor, weftColor }: {
  matrix: number[][]
  size: 'card' | 'modal'
  warpColor?: string
  weftColor?: string
}) {
  const rows = matrix.length
  const cols = matrix[0]?.length || 0
  if (!rows || !cols) return null

  const onClr = warpColor || '#3730A3'
  const offClr = weftColor || '#EEF2FF'
  const maxPx = size === 'card' ? 200 : 300
  const cellPx = Math.max(3, Math.min(Math.floor(maxPx / Math.max(rows, cols)), size === 'card' ? 18 : 22))
  const w = cols * cellPx
  const h = rows * cellPx

  return (
    <svg width={w} height={h} style={{ display: 'block', imageRendering: 'pixelated', overflow: 'visible' }}>
      {matrix.map((row, ri) =>
        row.map((c, ci) => (
          <rect
            key={`${ri}-${ci}`}
            x={ci * cellPx} y={ri * cellPx}
            width={cellPx - 1} height={cellPx - 1}
            rx={size === 'modal' && cellPx > 8 ? 2 : 0}
            fill={c ? onClr : offClr}
          />
        ))
      )}
    </svg>
  )
}

// ─── Copy button ─────────────────────────────────────────────────────────────
function CopyBtn({ text, label = '⎘ Copy' }: { text: string; label?: string }) {
  const [done, setDone] = useState(false)
  const copy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setDone(true); setTimeout(() => setDone(false), 1600)
    })
  }
  return (
    <button onClick={copy} style={{
      padding: '4px 10px', fontSize: 11, fontWeight: 700, borderRadius: 6,
      border: `1px solid ${done ? '#BBF7D0' : 'rgba(0,0,0,0.09)'}`,
      background: done ? '#DCFCE7' : '#F5F5F7',
      color: done ? '#15803D' : '#64748B',
      cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap', transition: 'all 0.15s',
    }}>
      {done ? '✓ Copied' : label}
    </button>
  )
}

// ─── Design Card ─────────────────────────────────────────────────────────────
function DesignCard({ design, bookmarked, onOpen, onBookmark, index }: {
  design: GeneratedDesign; bookmarked: boolean
  onOpen: () => void; onBookmark: () => void; index: number
}) {
  const sw = COLOR_SWATCHES[design.params?.colors?.[0] || 'indigo'] || COLOR_SWATCHES.indigo
  const bgSw = COLOR_SWATCHES[design.params?.colors?.[1] || 'white'] || COLOR_SWATCHES.white
  const [hovered, setHovered] = useState(false)

  const categoryColor: Record<string, string> = {
    base_weaves: '#4F46E5', presets: '#0891B2', dobby: '#7C3AED',
    specialty: '#DC2626', modifiers: '#D97706',
  }
  const catColor = categoryColor[design.category || 'presets'] || '#4F46E5'

  return (
    <div
      onClick={onOpen}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: '#fff',
        border: `1px solid ${hovered ? catColor + '40' : 'rgba(0,0,0,0.07)'}`,
        borderRadius: 16, cursor: 'pointer', overflow: 'hidden',
        display: 'flex', flexDirection: 'column',
        boxShadow: hovered ? `0 8px 28px ${catColor}18, 0 2px 8px rgba(0,0,0,0.06)` : '0 1px 4px rgba(0,0,0,0.05)',
        transform: hovered ? 'translateY(-3px)' : 'none',
        transition: 'all 0.2s cubic-bezier(0.4,0,0.2,1)',
      }}
    >
      <div style={{ height: 3, background: catColor }} />
      <div style={{
        background: sw.weft + '55',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20, minHeight: 160, position: 'relative',
      }}>
        <PegGrid matrix={design.matrix} size="card" warpColor={sw.warp} weftColor={bgSw.warp + '88'} />
        <button
          onClick={e => { e.stopPropagation(); onBookmark() }}
          style={{
            position: 'absolute', top: 8, right: 8,
            width: 28, height: 28, borderRadius: 8,
            background: bookmarked ? '#FEF9C3' : 'rgba(255,255,255,0.9)',
            border: 'none', cursor: 'pointer', fontSize: 14,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 1px 4px rgba(0,0,0,0.10)',
          }}
        >
          {bookmarked ? '★' : '☆'}
        </button>
        <div style={{
          position: 'absolute', bottom: 6, right: 8,
          fontSize: 9, fontFamily: 'var(--font-mono)', fontWeight: 700,
          color: 'rgba(0,0,0,0.4)', background: 'rgba(255,255,255,0.75)',
          padding: '1px 5px', borderRadius: 4,
        }}>
          {design.repeat_rows}×{design.repeat_cols}
        </div>
      </div>
      <div style={{ padding: '10px 12px 12px', flex: 1 }}>
        <div style={{ fontSize: 12.5, fontWeight: 700, color: '#111', marginBottom: 5, lineHeight: 1.3 }}>
          {design.display_name}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, marginBottom: 6 }}>
          <span style={{ fontSize: 9.5, fontWeight: 700, padding: '2px 7px', borderRadius: 99, background: catColor + '15', color: catColor }}>
            {design.category?.replace('_', ' ')}
          </span>
          <span style={{ fontSize: 9.5, padding: '2px 7px', borderRadius: 99, background: '#F1F5F9', color: '#475569' }}>
            {design.shaft_count}sh
          </span>
          {design.weight && (
            <span style={{ fontSize: 9.5, padding: '2px 7px', borderRadius: 99, background: '#F8FAFC', color: '#64748B' }}>
              {design.weight}
            </span>
          )}
        </div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9.5, color: '#94A3B8', letterSpacing: 0.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {design.name_code}
        </div>
      </div>
    </div>
  )
}

// ─── Detail Modal ─────────────────────────────────────────────────────────────
function DesignModal({ design, onClose, onLoad, onSimilar, bookmarked, onBookmark }: {
  design: GeneratedDesign; onClose: () => void; onLoad: () => void
  onSimilar: () => void; bookmarked: boolean; onBookmark: () => void
}) {
  const [view, setView] = useState<ViewMode>('visual')
  const sw = COLOR_SWATCHES[design.params?.colors?.[0] || 'indigo'] || COLOR_SWATCHES.indigo
  const sw2 = COLOR_SWATCHES[design.params?.colors?.[1] || 'white'] || COLOR_SWATCHES.white

  const pickText = design.matrix.map((row, i) => {
    const raised = row.map((c, j) => c ? j + 1 : null).filter(Boolean) as number[]
    return `${i + 1}-->${raised.join(',')}`
  }).join('\n')

  const shaftText = (() => {
    const m = design.matrix
    const cols = m[0]?.length || 0
    return Array.from({ length: cols }, (_, j) => {
      const picks = m.map((r, i) => r[j] ? i + 1 : null).filter(Boolean)
      return `Shaft ${j + 1}  →  ${picks.join(', ') || '(none)'}`
    }).join('\n')
  })()

  const downloadSVG = () => {
    const svg = exportSVG(design, 8, 8, 8)
    const blob = new Blob([svg], { type: 'image/svg+xml' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob)
    a.download = `${design.wif_name}.svg`; a.click()
  }

  const downloadWIF = () => {
    const wif = exportWIF(design)
    const blob = new Blob([wif], { type: 'text/plain' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob)
    a.download = `${design.wif_name}.wif`; a.click()
  }

  const catColor: Record<string, string> = {
    base_weaves: '#4F46E5', presets: '#0891B2', dobby: '#7C3AED',
    specialty: '#DC2626', modifiers: '#D97706',
  }
  const accent = catColor[design.category || 'presets'] || '#4F46E5'

  const specs = [
    { label: 'Weave Type', value: design.params?.type?.replace('_', ' ') },
    { label: 'Shafts', value: String(design.shaft_count) },
    { label: 'Repeat', value: `${design.repeat_rows}×${design.repeat_cols}` },
    { label: 'Direction', value: design.params?.direction || 'N/A' },
    design.params?.up !== undefined && { label: 'Float Up', value: String(design.params.up) },
    design.params?.down !== undefined && { label: 'Float Down', value: String(design.params.down) },
    { label: 'Category', value: design.category?.replace('_', ' ') },
    { label: 'Weight', value: design.weight },
    { label: 'Fabric', value: design.fabric_type },
    design.source && { label: 'Source', value: design.source },
  ].filter(Boolean) as { label: string; value: string | undefined }[]

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(10,10,20,0.55)', backdropFilter: 'blur(10px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: '#fff', borderRadius: 24, width: '100%', maxWidth: 780,
        maxHeight: '90vh', overflowY: 'auto',
        boxShadow: '0 40px 80px rgba(0,0,0,0.28)',
        display: 'flex', flexDirection: 'column',
      }}>
        {/* Top accent */}
        <div style={{ height: 4, background: `linear-gradient(90deg, ${accent}, ${accent}99)`, borderRadius: '24px 24px 0 0' }} />

        {/* Header */}
        <div style={{
          padding: '22px 28px 18px', borderBottom: '1px solid rgba(0,0,0,0.06)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
          position: 'sticky', top: 0, background: '#fff', zIndex: 10,
        }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 10px', borderRadius: 99, background: accent + '15', color: accent }}>
                {design.category?.replace('_', ' ')}
              </span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, fontWeight: 700, background: '#F1F5F9', color: '#475569', padding: '2px 8px', borderRadius: 6 }}>
                {design.name_code}
              </span>
              <CopyBtn text={design.full_code} label="⎘ Code" />
            </div>
            <h3 style={{ fontSize: 20, fontWeight: 800, color: '#111', margin: 0, letterSpacing: '-0.025em' }}>
              {design.display_name}
            </h3>
            <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 4 }}>
              {design.shaft_count} Shafts · {design.repeat_rows}×{design.repeat_cols} repeat
              {design.is_valid ? (
                <span style={{ color: '#16A34A', fontWeight: 600, marginLeft: 8 }}>✓ Valid</span>
              ) : (
                <span style={{ color: '#DC2626', fontWeight: 600, marginLeft: 8 }}>⚠ {design.warnings[0]}</span>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
            <button onClick={onBookmark} style={{
              width: 36, height: 36, borderRadius: 10,
              background: bookmarked ? '#FEF9C3' : 'rgba(0,0,0,0.05)',
              border: 'none', cursor: 'pointer', fontSize: 16,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>{bookmarked ? '★' : '☆'}</button>
            <button onClick={onClose} style={{
              width: 36, height: 36, borderRadius: 10, background: 'rgba(0,0,0,0.05)',
              border: 'none', cursor: 'pointer', fontSize: 20, color: '#64748B',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>×</button>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: '24px 28px', display: 'flex', gap: 32 }}>
          {/* Left: Matrix Viewer */}
          <div style={{ width: 260, flexShrink: 0 }}>
            {/* View toggle */}
            <div style={{ display: 'flex', background: 'rgba(0,0,0,0.05)', padding: 3, borderRadius: 10, marginBottom: 14 }}>
              {(['visual', 'shaft', 'text'] as ViewMode[]).map(v => (
                <button key={v} onClick={() => setView(v)} style={{
                  flex: 1, fontSize: 10.5, fontWeight: view === v ? 700 : 500,
                  padding: '5px 6px', border: 'none', borderRadius: 8, cursor: 'pointer',
                  background: view === v ? '#fff' : 'transparent',
                  color: view === v ? '#111' : '#64748B',
                  boxShadow: view === v ? '0 1px 4px rgba(0,0,0,0.10)' : 'none',
                  transition: 'all 0.15s', fontFamily: 'inherit',
                }}>
                  {v === 'visual' ? '⬛ Visual' : v === 'shaft' ? '≡ Shaft' : '📋 Text'}
                </button>
              ))}
            </div>

            <div style={{
              background: sw.weft + '66', borderRadius: 14, padding: 16,
              border: '1px solid rgba(0,0,0,0.06)', minHeight: 200,
              display: 'flex', alignItems: 'center', justifyContent: 'center', overflowX: 'auto',
            }}>
              {view === 'visual' && <PegGrid matrix={design.matrix} size="modal" warpColor={sw.warp} weftColor={sw2.warp + '66'} />}
              {view === 'shaft' && (
                <pre style={{ margin: 0, fontSize: 10.5, fontFamily: 'var(--font-mono)', color: '#1E293B', lineHeight: 1.9, whiteSpace: 'pre' }}>
                  {shaftText}
                </pre>
              )}
              {view === 'text' && (
                <div style={{ width: '100%' }}>
                  <textarea readOnly value={pickText} rows={Math.min(design.matrix.length + 1, 12)}
                    style={{ width: '100%', fontFamily: 'var(--font-mono)', fontSize: 11.5, lineHeight: 1.7,
                      background: '#fff', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 8,
                      padding: '8px 10px', color: '#1E293B', resize: 'none', outline: 'none', cursor: 'text' }}
                  />
                  <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                    <CopyBtn text={pickText} label="⎘ Copy Pick Text" />
                  </div>
                </div>
              )}
            </div>

            {/* Color swatches */}
            {design.params?.colors && design.params.colors.length > 0 && (
              <div style={{ marginTop: 14, display: 'flex', gap: 8, alignItems: 'center' }}>
                <span style={{ fontSize: 10, color: '#94A3B8', fontWeight: 600 }}>COLORS</span>
                {design.params.colors.map(c => (
                  <div key={c} title={c} style={{
                    width: 22, height: 22, borderRadius: 6, border: '2px solid rgba(0,0,0,0.08)',
                    background: (COLOR_SWATCHES[c] || COLOR_SWATCHES.indigo).warp,
                  }} />
                ))}
              </div>
            )}

            {/* Export buttons */}
            <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
              <button onClick={downloadSVG} style={{
                flex: 1, height: 34, fontSize: 11.5, fontWeight: 700, borderRadius: 9,
                background: '#F1F5F9', color: '#475569', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
              }}>⬇ SVG</button>
              <button onClick={downloadWIF} style={{
                flex: 1, height: 34, fontSize: 11.5, fontWeight: 700, borderRadius: 9,
                background: '#F1F5F9', color: '#475569', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
              }}>⬇ WIF</button>
            </div>
          </div>

          {/* Right: Info */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {design.description && (
              <p style={{ margin: '0 0 20px', fontSize: 13.5, color: '#475569', lineHeight: 1.65 }}>
                {design.description}
              </p>
            )}

            {/* Specs grid */}
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px 16px',
              background: '#F8FAFC', borderRadius: 14, padding: 16, border: '1px solid rgba(0,0,0,0.06)', marginBottom: 20,
            }}>
              {specs.map(({ label, value }) => (
                <div key={label}>
                  <div style={{ fontSize: 9.5, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 2 }}>
                    {label}
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#1E293B', textTransform: 'capitalize' }}>
                    {value || '—'}
                  </div>
                </div>
              ))}
            </div>

            {/* Applications */}
            {design.applications && design.applications.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>
                  Applications
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {design.applications.map(a => (
                    <span key={a} style={{ fontSize: 11.5, padding: '4px 10px', borderRadius: 6, background: '#EFF6FF', color: '#2563EB', fontWeight: 600 }}>
                      {a}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Tags */}
            {(design.tags || []).length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                {(design.tags || []).map(t => (
                  <span key={t} style={{ fontSize: 11, padding: '3px 9px', borderRadius: 6, background: '#F3F4F6', color: '#64748B', border: '1px solid rgba(0,0,0,0.06)' }}>
                    #{t}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '14px 28px', borderTop: '1px solid rgba(0,0,0,0.06)',
          background: '#FAFAFA', borderRadius: '0 0 24px 24px',
          display: 'flex', gap: 10, alignItems: 'center', position: 'sticky', bottom: 0,
        }}>
          <button onClick={onSimilar} style={{
            height: 38, padding: '0 18px', fontSize: 13, fontWeight: 700,
            background: 'rgba(0,0,0,0.05)', border: 'none', borderRadius: 10,
            cursor: 'pointer', fontFamily: 'inherit', color: '#1E293B',
          }}>✦ Similar</button>
          <div style={{ flex: 1 }} />
          <button onClick={onClose} style={{
            height: 38, padding: '0 16px', fontSize: 13, fontWeight: 500,
            background: '#fff', border: '1px solid rgba(0,0,0,0.10)',
            borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit', color: '#64748B',
          }}>Close</button>
          <button onClick={onLoad} style={{
            height: 38, padding: '0 22px', fontSize: 13, fontWeight: 800,
            background: accent, color: '#fff', border: 'none', borderRadius: 10,
            cursor: 'pointer', fontFamily: 'inherit',
            boxShadow: `0 4px 14px ${accent}44`,
          }}>Load into Studio →</button>
        </div>
      </div>
    </div>
  )
}

// ─── Generation Progress Banner ──────────────────────────────────────────────
function GenerationBanner({
  progress, onStart, onCancel, generated, total, isRunning, isDone
}: {
  progress: GenerationProgress | null
  onStart: () => void
  onCancel: () => void
  generated: number
  total: number
  isRunning: boolean
  isDone: boolean
}) {
  const estimate = totalEstimatedDesigns()

  if (isDone) {
    return (
      <div style={{
        background: 'linear-gradient(135deg, #ECFDF5, #F0FDF4)',
        border: '1px solid #BBF7D0', borderRadius: 12,
        padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 10,
        marginBottom: 12, flexShrink: 0,
      }}>
        <span style={{ fontSize: 18 }}>✅</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12.5, fontWeight: 800, color: '#065F46' }}>
            {generated.toLocaleString()} designs generated!
          </div>
          <div style={{ fontSize: 11, color: '#047857', marginTop: 1 }}>All designs loaded into library. Use filters to explore.</div>
        </div>
        <button onClick={onStart} style={{
          height: 30, padding: '0 14px', fontSize: 11.5, fontWeight: 700,
          border: '1px solid #4ADE80', borderRadius: 8, background: '#fff',
          color: '#065F46', cursor: 'pointer', fontFamily: 'inherit',
        }}>↺ Regenerate</button>
      </div>
    )
  }

  if (isRunning && progress) {
    return (
      <div style={{
        background: 'linear-gradient(135deg, #EFF6FF, #F0F9FF)',
        border: '1px solid #BAE6FD', borderRadius: 12,
        padding: '10px 16px', flexShrink: 0, marginBottom: 12,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <div style={{
            width: 20, height: 20, borderRadius: '50%',
            border: '2.5px solid #0EA5E9', borderTopColor: 'transparent',
            animation: 'spin 0.7s linear infinite', flexShrink: 0,
          }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: '#0369A1' }}>
              Generating: {progress.phase}
            </div>
            <div style={{ fontSize: 11, color: '#0284C7', marginTop: 1 }}>
              {progress.count.toLocaleString()} / {total.toLocaleString()} designs  ·  {progress.pct}%
            </div>
          </div>
          <button onClick={onCancel} style={{
            height: 26, padding: '0 12px', fontSize: 11, fontWeight: 700,
            border: '1px solid #BAE6FD', borderRadius: 7, background: '#fff',
            color: '#0369A1', cursor: 'pointer', fontFamily: 'inherit',
          }}>✕ Stop</button>
        </div>
        {/* Progress bar */}
        <div style={{ height: 6, background: '#E0F2FE', borderRadius: 99, overflow: 'hidden' }}>
          <div style={{
            height: '100%', borderRadius: 99,
            background: 'linear-gradient(90deg, #0EA5E9, #38BDF8)',
            width: `${progress.pct}%`,
            transition: 'width 0.3s ease',
          }} />
        </div>
      </div>
    )
  }

  // Idle state — prompt to generate
  return (
    <div style={{
      background: 'linear-gradient(135deg, #F8FAFF, #F0F4FF)',
      border: '1px solid #C7D2FE', borderRadius: 12,
      padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 12,
      marginBottom: 12, flexShrink: 0,
    }}>
      <div style={{ fontSize: 22 }}>🧬</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 12.5, fontWeight: 800, color: '#3730A3' }}>
          10,000+ Design Algorithm Ready
        </div>
        <div style={{ fontSize: 11, color: '#4F46E5', marginTop: 1 }}>
          ~{estimate.toLocaleString()} unique designs via combinatorial weave logic (Research-derived)
        </div>
      </div>
      <button onClick={onStart} style={{
        height: 34, padding: '0 18px', fontSize: 12.5, fontWeight: 800,
        border: 'none', borderRadius: 9,
        background: 'linear-gradient(135deg, #4F46E5, #7C3AED)',
        color: '#fff', cursor: 'pointer', fontFamily: 'inherit',
        boxShadow: '0 4px 14px rgba(79,70,229,0.35)',
        whiteSpace: 'nowrap',
      }}>⚡ Generate 10k+</button>
    </div>
  )
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function DesignLibrary({ onLoadDesign }: { onLoadDesign?: () => void } = {}) {
  const { setPegPlan, updateIdentity, setShaftCount } = useDesignStore()

  // ── Source / tab ──
  const [libTab, setLibTab] = useState<LibTab>('generative')

  // ── Generative presets ──
  const [genPresets, setGenPresets] = useState<GeneratedDesign[]>([])
  const [custom, setCustom] = useState<GeneratedDesign[]>([])

  // ── Mass generation state ──
  const [massDesigns, setMassDesigns] = useState<GeneratedDesign[]>([])
  const [genProgress, setGenProgress] = useState<GenerationProgress | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [genDone, setGenDone] = useState(false)
  const cancelRef = useRef(false)
  const MASS_TARGET = 10500

  useEffect(() => { setGenPresets(loadAllPresets()) }, [])

  // ── Filters ──
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<GenCategory>('all')
  const [fabricFilter, setFabricFilter] = useState('')
  const [shaftRange, setShaftRange] = useState('')
  const [weightFilter, setWeightFilter] = useState('')
  const [sortBy, setSortBy] = useState('popularity')
  const [showBookmarked, setShowBookmarked] = useState(false)
  const [showSimilarTo, setShowSimilarTo] = useState<string | null>(null)

  // ── UI ──
  const [selected, setSelected] = useState<GeneratedDesign | null>(null)
  const [bookmarks, setBookmarks] = useState<Set<string>>(new Set())
  const [page, setPage] = useState(1)
  const PAGE = 24

  // ── Mass generation handler ──
  const handleMassGenerate = useCallback(async () => {
    if (isGenerating) return
    setIsGenerating(true)
    setGenDone(false)
    setGenProgress(null)
    cancelRef.current = false
    setMassDesigns([])  // clear previous mass designs

    try {
      const results = await generateAllDesigns(
        (p) => {
          if (cancelRef.current) return
          setGenProgress(p)
          // Stream into state every 500 designs to show live updates
          if (p.count % 500 === 0 || p.pct === 100) {
            // We update after full generation completes via the results array
          }
        },
        MASS_TARGET
      )

      if (!cancelRef.current) {
        setMassDesigns(results)
        setGenDone(true)
      }
    } catch (err) {
      console.error('Mass generation error:', err)
    } finally {
      setIsGenerating(false)
    }
  }, [isGenerating])

  const handleCancelGeneration = useCallback(() => {
    cancelRef.current = true
    setIsGenerating(false)
    setGenProgress(null)
  }, [])

  // ── All designs (source) ──
  const allDesigns = useMemo<GeneratedDesign[]>(() => {
    if (libTab === 'static') {
      return staticLib.designs.map((d, i) => staticToGen(d as SDesign, i))
    }
    // Merge: mass > custom > presets (mass first for freshest on top)
    const massSet = new Set(massDesigns.map(d => d.full_code))
    const customFiltered = custom.filter(d => !massSet.has(d.full_code))
    return [...massDesigns, ...customFiltered, ...genPresets]
  }, [libTab, genPresets, custom, massDesigns])

  // ── Fabric types for sidebar ──
  const fabricTypes = useMemo(() => {
    const seen = new Set<string>()
    allDesigns.forEach(d => { if (d.fabric_type) seen.add(d.fabric_type) })
    return [...seen].sort()
  }, [allDesigns])

  // ── Filtered ──
  const filtered = useMemo(() => {
    let data = [...allDesigns]

    if (showBookmarked) data = data.filter(d => bookmarks.has(d.full_code))
    if (showSimilarTo) {
      const ref = data.find(d => d.full_code === showSimilarTo)
      if (ref) data = data.filter(d =>
        d.full_code !== showSimilarTo &&
        (d.params?.type === ref.params?.type || d.category === ref.category || d.fabric_type === ref.fabric_type)
      ).slice(0, 24)
    }
    if (category !== 'all') data = data.filter(d => d.category === category)
    if (fabricFilter) data = data.filter(d => d.fabric_type === fabricFilter)
    if (weightFilter) data = data.filter(d => d.weight === weightFilter)
    if (shaftRange) {
      const [a, b] = shaftRange.split('-').map(Number)
      data = data.filter(d => d.shaft_count >= a && d.shaft_count <= b)
    }
    if (search) {
      const q = search.toLowerCase()
      data = data.filter(d =>
        d.display_name.toLowerCase().includes(q) ||
        d.name_code.toLowerCase().includes(q) ||
        (d.params?.type || '').toLowerCase().includes(q) ||
        (d.tags || []).some(t => t.toLowerCase().includes(q)) ||
        (d.description || '').toLowerCase().includes(q)
      )
    }
    if (sortBy === 'popularity') data.sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
    else if (sortBy === 'name') data.sort((a, b) => a.display_name.localeCompare(b.display_name))
    else if (sortBy === 'shafts_asc') data.sort((a, b) => a.shaft_count - b.shaft_count)
    else if (sortBy === 'shafts_desc') data.sort((a, b) => b.shaft_count - a.shaft_count)

    return data
  }, [allDesigns, search, category, fabricFilter, weightFilter, shaftRange, sortBy, showBookmarked, bookmarks, showSimilarTo])

  const paged = useMemo(() => filtered.slice(0, page * PAGE), [filtered, page])
  const hasMore = filtered.length > paged.length
  const anyFilter = !!(search || fabricFilter || shaftRange || weightFilter || showBookmarked || showSimilarTo || category !== 'all')

  const clearAll = () => {
    setSearch(''); setCategory('all'); setFabricFilter(''); setShaftRange('')
    setWeightFilter(''); setSortBy('popularity'); setShowBookmarked(false)
    setShowSimilarTo(null); setPage(1)
  }

  const handleRandom = () => {
    const d = generateRandom()
    setCustom(prev => [d, ...prev])
    setSelected(d)
  }

  const handleSimilar = (design: GeneratedDesign) => {
    const similar = generateSimilar(design.params, 8)
    setCustom(prev => {
      const ids = new Set(prev.map(d => d.full_code))
      const newOnes = similar.filter(d => !ids.has(d.full_code))
      return [...newOnes, ...prev]
    })
    setSelected(null)
    setShowSimilarTo(design.full_code)
    setPage(1)
  }

  const handleLoad = (design: GeneratedDesign) => {
    const text = design.matrix.map((row, i) => {
      const raised = row.map((c, j) => c ? j + 1 : null).filter(Boolean) as number[]
      return `${i + 1}-->${raised.join(',')}`
    }).join('\n')
    setShaftCount(design.shaft_count)
    setPegPlan(text, design.matrix)
    updateIdentity({ design_name: design.display_name, design_number: design.name_code })
    setSelected(null)
    if (onLoadDesign) onLoadDesign()
  }

  const toggleBookmark = (id: string) =>
    setBookmarks(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s })

  const CATEGORIES: { key: GenCategory; label: string; color: string }[] = [
    { key: 'all', label: 'All', color: '#1E293B' },
    { key: 'base_weaves', label: 'Base Weaves', color: '#4F46E5' },
    { key: 'presets', label: 'Industry Presets', color: '#0891B2' },
    { key: 'dobby', label: 'Dobby', color: '#7C3AED' },
    { key: 'modifiers', label: 'Modifiers', color: '#D97706' },
    { key: 'specialty', label: 'Specialty', color: '#DC2626' },
  ]

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100%',
      background: '#fff', borderRadius: 18, border: '1px solid rgba(0,0,0,0.07)',
      boxShadow: '0 2px 12px rgba(0,0,0,0.06)', overflow: 'hidden',
    }}>
      {/* ── CSS for spinner ── */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* ── Header ── */}
      <div style={{
        padding: '14px 18px 10px', borderBottom: '1px solid rgba(0,0,0,0.06)',
        flexShrink: 0, background: '#fff',
      }}>
        {/* Row 1 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#111', letterSpacing: '-0.02em' }}>
              Design Library
            </div>
            <div style={{ fontSize: 11, color: '#64748B', marginTop: 1 }}>
              {filtered.length.toLocaleString()} / {allDesigns.length.toLocaleString()} designs
              {massDesigns.length > 0 && (
                <span style={{ marginLeft: 6, color: '#4F46E5', fontWeight: 700 }}>
                  · {massDesigns.length.toLocaleString()} generated
                </span>
              )}
              {showSimilarTo && <span style={{ color: '#7C3AED', fontWeight: 700 }}> · Similar</span>}
            </div>
          </div>
          <div style={{ flex: 1 }} />

          {/* Source toggle */}
          <div style={{ display: 'flex', background: '#F1F5F9', padding: 2, borderRadius: 9 }}>
            {(['generative', 'static'] as LibTab[]).map(t => (
              <button key={t} onClick={() => { setLibTab(t); clearAll() }} style={{
                padding: '5px 12px', fontSize: 11.5, fontWeight: 700, border: 'none', borderRadius: 7,
                cursor: 'pointer', background: libTab === t ? '#fff' : 'transparent',
                color: libTab === t ? '#111' : '#64748B',
                boxShadow: libTab === t ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
                transition: 'all 0.18s', textTransform: 'capitalize', fontFamily: 'inherit',
              }}>
                {t === 'generative' ? '⚙ Generative' : '📚 Static'}
              </button>
            ))}
          </div>

          {/* Sort */}
          <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{
            height: 30, fontSize: 11.5, borderRadius: 8, padding: '0 8px', cursor: 'pointer',
          }}>
            <option value="popularity">Popular</option>
            <option value="name">A–Z</option>
            <option value="shafts_asc">Shafts ↑</option>
            <option value="shafts_desc">Shafts ↓</option>
          </select>

          {/* Bookmarks */}
          <button onClick={() => { setShowBookmarked(!showBookmarked); setPage(1) }} style={{
            height: 30, padding: '0 10px', fontSize: 12, fontWeight: 700, borderRadius: 8, border: 'none',
            background: showBookmarked ? '#FEF9C3' : 'rgba(0,0,0,0.05)',
            color: showBookmarked ? '#B45309' : '#64748B', cursor: 'pointer', fontFamily: 'inherit',
            display: 'flex', alignItems: 'center', gap: 4,
          }}>
            {showBookmarked ? '★' : '☆'}
            {bookmarks.size > 0 && (
              <span style={{ background: '#D97706', color: '#fff', fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 99 }}>
                {bookmarks.size}
              </span>
            )}
          </button>

          {/* Random */}
          <button onClick={handleRandom} style={{
            height: 30, padding: '0 12px', fontSize: 12, fontWeight: 700, border: 'none', borderRadius: 8,
            background: 'linear-gradient(135deg, #4F46E5, #0891B2)',
            color: '#fff', cursor: 'pointer', fontFamily: 'inherit',
          }}>✨ Random</button>

          {anyFilter && (
            <button onClick={clearAll} style={{
              height: 30, padding: '0 10px', fontSize: 12, fontWeight: 700, borderRadius: 8, border: 'none',
              background: '#FEF2F2', color: '#DC2626', cursor: 'pointer', fontFamily: 'inherit',
            }}>✕ Clear</button>
          )}
        </div>

        {/* Row 2: Search */}
        <div style={{ position: 'relative' }}>
          <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 13, pointerEvents: 'none' }}>🔍</span>
          <input
            type="text" value={search} placeholder="Search name, weave type, tag, or code…"
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            style={{ paddingLeft: 32, height: 32, fontSize: 12.5, borderRadius: 9, width: '100%', border: '1px solid rgba(0,0,0,0.09)', outline: 'none' }}
          />
        </div>

        {/* Row 3: Mass Generation Banner (generative only) */}
        {libTab === 'generative' && (
          <>
            <GenerationBanner
              progress={genProgress}
              onStart={handleMassGenerate}
              onCancel={handleCancelGeneration}
              generated={massDesigns.length}
              total={MASS_TARGET}
              isRunning={isGenerating}
              isDone={genDone}
            />
            {/* Category pills */}
            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
              {CATEGORIES.map(cat => (
                <button key={cat.key} onClick={() => { setCategory(cat.key); setPage(1) }} style={{
                  padding: '4px 12px', fontSize: 11, fontWeight: 700, border: 'none', borderRadius: 99,
                  background: category === cat.key ? cat.color : '#F1F5F9',
                  color: category === cat.key ? '#fff' : '#64748B',
                  cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
                }}>{cat.label}</button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* ── Body ── */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', minHeight: 0 }}>

        {/* Sidebar */}
        <div style={{
          width: 160, flexShrink: 0,
          borderRight: '1px solid rgba(0,0,0,0.06)',
          background: '#FAFAFA', overflowY: 'auto',
          padding: '12px', display: 'flex', flexDirection: 'column', gap: 14,
        }}>
          {/* Fabric */}
          <div>
            <div style={{ fontSize: 9, fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 7 }}>
              Fabric
            </div>
            {fabricTypes.map(f => {
              const cnt = allDesigns.filter(d => d.fabric_type === f).length
              const on = fabricFilter === f
              return (
                <label key={f} style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  fontSize: 11, padding: '3px 5px', borderRadius: 6, cursor: 'pointer',
                  background: on ? 'rgba(79,70,229,0.08)' : 'transparent',
                }}>
                  <input type="radio" name="fabric" checked={on}
                    onChange={() => { setFabricFilter(on ? '' : f); setPage(1) }}
                    style={{ width: 11, height: 11, accentColor: '#4F46E5', cursor: 'pointer', flexShrink: 0 }}
                  />
                  <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#1E293B' }}>{f}</span>
                  <span style={{ fontSize: 9.5, color: '#94A3B8' }}>{cnt}</span>
                </label>
              )
            })}
          </div>

          {/* Shafts */}
          <div>
            <div style={{ fontSize: 9, fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 7 }}>
              Shafts
            </div>
            <select value={shaftRange} onChange={e => { setShaftRange(e.target.value); setPage(1) }}
              style={{ width: '100%', height: 28, fontSize: 11, borderRadius: 7 }}>
              <option value="">All</option>
              <option value="2-4">2–4</option>
              <option value="5-8">5–8</option>
              <option value="9-16">9–16</option>
              <option value="17-24">17–24</option>
            </select>
          </div>

          {/* Weight */}
          <div>
            <div style={{ fontSize: 9, fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 7 }}>
              Weight
            </div>
            <select value={weightFilter} onChange={e => { setWeightFilter(e.target.value); setPage(1) }}
              style={{ width: '100%', height: 28, fontSize: 11, borderRadius: 7 }}>
              <option value="">All</option>
              <option value="Ultra Light">Ultra Light</option>
              <option value="Light">Light</option>
              <option value="Medium">Medium</option>
              <option value="Heavy">Heavy</option>
              <option value="Extra Heavy">Extra Heavy</option>
            </select>
          </div>
        </div>

        {/* Grid */}
        <div style={{
          flex: 1, overflowY: 'auto', background: '#F5F5F7',
          padding: 14, display: 'flex', flexDirection: 'column', gap: 14,
        }}>
          {showSimilarTo && (
            <div style={{
              background: '#F5F3FF', border: '1px solid #DDD6FE', borderRadius: 10,
              padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 8,
              fontSize: 12, color: '#5B21B6', fontWeight: 700,
            }}>
              ✦ Showing similar designs
              <button onClick={() => { setShowSimilarTo(null); setPage(1) }} style={{
                marginLeft: 'auto', background: 'rgba(91,33,182,0.08)', border: 'none',
                borderRadius: 6, cursor: 'pointer', color: '#5B21B6', fontSize: 12,
                fontWeight: 700, padding: '2px 10px', fontFamily: 'inherit',
              }}>✕ Show All</button>
            </div>
          )}

          {paged.length > 0 ? (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14 }}>
                {paged.map((d, i) => (
                  <DesignCard
                    key={`${d.full_code}-${i}`}
                    design={d}
                    bookmarked={bookmarks.has(d.full_code)}
                    onOpen={() => setSelected(d)}
                    onBookmark={() => toggleBookmark(d.full_code)}
                    index={i}
                  />
                ))}
              </div>
              {hasMore && (
                <div style={{ display: 'flex', justifyContent: 'center', paddingBottom: 4 }}>
                  <button onClick={() => setPage(p => p + 1)} style={{
                    padding: '9px 28px', fontSize: 13, fontWeight: 700, borderRadius: 10,
                    background: '#fff', color: '#1E293B', border: '1px solid rgba(0,0,0,0.10)',
                    cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                  }}>
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
              <div style={{ fontSize: 14, fontWeight: 800, color: '#111', marginBottom: 6 }}>No designs found</div>
              <div style={{ fontSize: 12, color: '#64748B', marginBottom: 16 }}>Try adjusting filters or generate a random design.</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={clearAll} style={{
                  padding: '8px 20px', fontSize: 13, fontWeight: 700, borderRadius: 9,
                  background: '#4F46E5', color: '#fff', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                }}>Clear Filters</button>
                <button onClick={handleRandom} style={{
                  padding: '8px 20px', fontSize: 13, fontWeight: 700, borderRadius: 9,
                  background: '#F1F5F9', color: '#1E293B', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                }}>✨ Random</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Modal ── */}
      {selected && (
        <DesignModal
          design={selected}
          onClose={() => setSelected(null)}
          onLoad={() => handleLoad(selected)}
          onSimilar={() => handleSimilar(selected)}
          bookmarked={bookmarks.has(selected.full_code)}
          onBookmark={() => toggleBookmark(selected.full_code)}
        />
      )}
    </div>
  )
}
