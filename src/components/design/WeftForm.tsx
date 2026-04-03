'use client'

import { useState } from 'react'
import { useDesignStore } from '@/lib/store/designStore'
import type { WeftYarn, Material, CountSystem } from '@/lib/types'
import { MATERIAL_PHYSICS, CATEGORY_COLORS } from '@/lib/calc/materials'
import ColorPickerPopup from '../common/ColorPickerPopup'

const NOZZLE_COLOUR_MAP = ['#C8D5A1', '#8AB58D', '#5A94BD', '#A6B1C9', '#E8A838', '#D63031', '#6C5CE7', '#00B894', '#FF6B9D', '#00B4D8', '#FF8C42', '#2ED573', '#1E90FF', '#FF4757', '#3742FA', '#FFA502']
const QUICK_COLORS = ['#1B1F3B', '#FFFFFF', '#E8A838', '#D44B4B', '#4BA86D', '#7B61FF', '#FF6B9D', '#00B4D8', '#FF8C42', '#8B5CF6']

function WeftDiagram() {
  return (
    <div style={{
      background: '#F8F9FA', borderRadius: 12, padding: 16, marginBottom: 16,
      border: '1.5px solid var(--border-light)', overflow: 'hidden',
    }}>
      <svg width="100%" height="140" viewBox="0 0 340 140" fill="none" preserveAspectRatio="xMidYMid meet">
        {/* Loom frame */}
        <rect x="40" y="10" width="260" height="100" rx="4" fill="none" stroke="#C0B8A8" strokeWidth="1.5" />
        
        {/* Weft threads - horizontal */}
        {Array.from({ length: 8 }).map((_, i) => (
          <line key={`weft-${i}`}
            x1="40" y1={25 + i * 11}
            x2="300" y2={25 + i * 11}
            stroke="#E8A838" strokeWidth="1.2" opacity={0.5 + (i % 3) * 0.2}
          />
        ))}
        
        {/* Warp threads - vertical */}
        {Array.from({ length: 18 }).map((_, i) => (
          <line key={`warp-${i}`}
            x1={55 + i * 14} y1="10"
            x2={55 + i * 14} y2="110"
            stroke="#1B1F3B" strokeWidth="0.6" opacity={0.3}
          />
        ))}
        
        {/* Shuttle / nozzle indicator */}
        <rect x="20" y="50" width="25" height="20" rx="4" fill="#2D3436" />
        <circle cx="32" cy="60" r="3" fill="#E8A838" />
        <path d="M45 60 L55 60" stroke="#E8A838" strokeWidth="2" strokeDasharray="3 2" />
        
        {/* Nozzle indicators on right */}
        {[0, 1, 2].map((i) => (
          <g key={`noz-${i}`}>
            <rect x="305" y={35 + i * 22} width="20" height="16" rx="3" fill={NOZZLE_COLOUR_MAP[i]} opacity="0.8" />
            <text x="315" y={46 + i * 22} textAnchor="middle" fontSize="8" fontWeight="800" fill="white">{i + 1}</text>
          </g>
        ))}
        
        {/* Labels */}
        <text x="170" y="128" textAnchor="middle" fontSize="9" fontWeight="600" fill="#888">Weft Insertion System</text>
      </svg>
    </div>
  )
}

function NozzleIcon({ color, number, active }: { color: string; number: number; active: boolean }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, transition: 'all 0.2s' }}>
      <svg width="26" height="34" viewBox="0 0 26 34" style={{ transition: 'all 0.3s ease', filter: active ? 'none' : 'grayscale(1) opacity(0.25)' }}>
        <defs>
          <linearGradient id={`noz-grad-${number}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="1" />
            <stop offset="100%" stopColor={color} stopOpacity="0.7" />
          </linearGradient>
        </defs>
        <path d="M5 2 L21 2 L19 19 L13 30 L7 19 Z" fill={`url(#noz-grad-${number})`} stroke="rgba(0,0,0,0.08)" strokeWidth="1" />
        <ellipse cx="13" cy="10" rx="4" ry="3.5" fill="rgba(255,255,255,0.35)" />
        <circle cx="13" cy="9" r="1.5" fill="rgba(255,255,255,0.5)" />
      </svg>
      <span style={{
        fontSize: 10, fontWeight: 800, width: 20, height: 20, display: 'flex',
        alignItems: 'center', justifyContent: 'center', borderRadius: '50%',
        background: active ? color : 'transparent',
        color: active ? 'white' : 'var(--text-3)',
        border: active ? 'none' : '1.5px solid var(--border)',
        transition: 'all 0.2s',
      }}>{number}</span>
    </div>
  )
}

function PropertiesDetails({ yarn, onClose }: { yarn: WeftYarn; onClose: () => void }) {
  const { updateWeftYarn, recalculate } = useDesignStore()
  const handleUpdate = (updates: Partial<WeftYarn['properties']>) => {
    updateWeftYarn(yarn.id, { properties: { ...yarn.properties, ...updates } })
    recalculate()
  }

  return (
    <div style={{
      position: 'absolute', left: 'calc(100% + 12px)', top: 0, width: 260, zIndex: 100,
      background: 'white', padding: 16, border: '1.5px solid var(--border)',
      boxShadow: '0 12px 48px rgba(0,0,0,0.15)', borderRadius: 12,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ fontSize: 10, fontWeight: 900, color: '#AAA', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Properties Details</div>
        <button onClick={onClose} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: 18, color: '#666', lineHeight: 1 }}>&times;</button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div>
            <label style={{ fontSize: 11, fontWeight: 600 }}>Shrinkage Min%</label>
            <input type="number" step="0.1" value={yarn.properties.shrinkage_min_pct}
              onChange={(e) => handleUpdate({ shrinkage_min_pct: parseFloat(e.target.value) || 0 })}
              style={{ height: 34, borderRadius: 8, fontSize: 13, fontWeight: 600 }} />
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 600 }}>Shrinkage Max%</label>
            <input type="number" step="0.1" value={yarn.properties.shrinkage_max_pct}
              onChange={(e) => handleUpdate({ shrinkage_max_pct: parseFloat(e.target.value) || 0 })}
              style={{ height: 34, borderRadius: 8, fontSize: 13, fontWeight: 600 }} />
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div>
            <label style={{ fontSize: 11, fontWeight: 600 }}>Tensile Strength</label>
            <input type="number" value={yarn.properties.tensile_strength_cn}
              onChange={(e) => handleUpdate({ tensile_strength_cn: parseInt(e.target.value) || 0 })}
              style={{ height: 34, borderRadius: 8, fontSize: 13, fontWeight: 600 }} />
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 600 }}>Elasticity%</label>
            <input type="number" value={yarn.properties.elasticity_pct}
              onChange={(e) => handleUpdate({ elasticity_pct: parseInt(e.target.value) || 0 })}
              style={{ height: 34, borderRadius: 8, fontSize: 13, fontWeight: 600 }} />
          </div>
        </div>
        <div>
          <label style={{ fontSize: 11, fontWeight: 600 }}>Dye Affinity</label>
          <div style={{
            padding: '8px 12px', background: '#F8F9FA', borderRadius: 8,
            fontSize: 13, fontWeight: 600, color: 'var(--text-1)', border: '1.5px solid var(--border-light)',
          }}>
            {yarn.properties.dye_affinity === 'excellent' ? 'Excellent' :
             yarn.properties.dye_affinity === 'good' ? 'Good' :
             yarn.properties.dye_affinity === 'moderate' ? 'Moderate' : 'Poor'}
          </div>
        </div>
      </div>
    </div>
  )
}

function YarnCard({ yarn, onRemove }: { yarn: WeftYarn; onRemove: () => void }) {
  const { updateWeftYarn, recalculate } = useDesignStore()
  const [showPicker, setShowPicker] = useState(false)
  const [showProps, setShowProps] = useState(false)

  const mat = MATERIAL_PHYSICS[yarn.material]
  const catColor = mat ? CATEGORY_COLORS[mat.category] : null
  const handleUpdate = (updates: Partial<WeftYarn>) => {
    updateWeftYarn(yarn.id, updates)
    recalculate()
  }

  // sequence positions
  const seqPositions = [1, 3, 5].map(n => n + yarn.sort_order * 2)

  return (
    <div style={{ position: 'relative' }}>
      <div style={{
        padding: 14, marginBottom: 12, background: 'linear-gradient(135deg, #FAFAF7, #FFFFFF)',
        border: `2px solid ${showProps ? 'var(--accent)' : 'var(--border-light)'}`, borderRadius: 12,
        transition: 'border-color 0.2s, box-shadow 0.2s',
        boxShadow: showProps ? '0 4px 16px rgba(232,168,56,0.15)' : '0 2px 8px rgba(0,0,0,0.03)',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <div
              onClick={() => setShowPicker(true)}
              style={{
                width: 40, height: 40, borderRadius: 8, background: yarn.colour_hex,
                border: '2px solid white', boxShadow: '0 2px 8px rgba(0,0,0,0.12)', cursor: 'pointer',
              }}
            />
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-1)' }}>
                {yarn.label}: {yarn.count_value}{yarn.count_system === 'denier' ? 'D' : 'Ne'} {mat?.name || yarn.material}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 1 }}>
                ({yarn.colour_code || 'White'})
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={() => setShowProps(!showProps)} style={{
              width: 30, height: 30, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: showProps ? 'var(--accent)' : '#F0F0F0', color: showProps ? 'white' : '#666',
              border: 'none', borderRadius: 8, cursor: 'pointer', transition: 'all 0.15s',
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 15a3 3 0 100-6 3 3 0 000 6z" /><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
              </svg>
            </button>
            <button onClick={onRemove} style={{
              width: 30, height: 30, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: '#FEE', color: '#D44B4B', border: 'none', borderRadius: 8, cursor: 'pointer',
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 6h18m-2 0v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6m3 0V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /></svg>
            </button>
          </div>
        </div>

        {/* Quick Color Swatches */}
        <div style={{ display: 'flex', gap: 5, marginTop: 10 }}>
          <div
            onClick={() => setShowPicker(true)}
            style={{
              width: 18, height: 18, borderRadius: 4, background: 'conic-gradient(red, yellow, lime, aqua, blue, magenta, red)',
              cursor: 'pointer', border: '1px solid #DDD',
            }}
          />
          {QUICK_COLORS.map(c => (
            <div
              key={c}
              onClick={() => handleUpdate({ colour_hex: c })}
              style={{
                width: 18, height: 18, borderRadius: 4, background: c, cursor: 'pointer',
                border: yarn.colour_hex === c ? '2px solid #2D3436' : '1px solid #E0E0E0',
                transition: 'transform 0.1s',
              }}
            />
          ))}
        </div>

        {/* Sequence Position */}
        <div style={{ marginTop: 10, fontSize: 12, color: 'var(--text-2)', fontWeight: 500 }}>
          Sequence Position: <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{seqPositions.join(' , ')}</span>
        </div>

        {/* Material Badge */}
        {catColor && (
          <div style={{
            marginTop: 10, padding: '8px 12px', background: catColor.bg + '30', borderRadius: 8,
            border: `1.5px solid ${catColor.bg}50`, display: 'flex', gap: 8, alignItems: 'center',
          }}>
            <span style={{
              fontSize: 8, padding: '2px 8px', borderRadius: 4,
              background: catColor.bg, color: catColor.text, fontWeight: 800,
              textTransform: 'uppercase', letterSpacing: '0.05em',
            }}>
              {mat?.category}
            </span>
            <span style={{ fontSize: 10, color: catColor.text, fontWeight: 500 }}>
              Shrink: {mat.shrink_base}% · {mat.note?.split('·')[0] || ''}
            </span>
          </div>
        )}

        {showPicker && <ColorPickerPopup isOpen={true} initialColor={yarn.colour_hex} title={`Color — ${yarn.label}`}
          onClose={() => setShowPicker(false)} onSave={(c) => { handleUpdate({ colour_hex: c }); setShowPicker(false) }} />}
      </div>

      {showProps && <PropertiesDetails yarn={yarn} onClose={() => setShowProps(false)} />}
    </div>
  )
}

export default function WeftYarnSystem() {
  const { weftSystem, addWeftYarn, removeWeftYarn, setTotalNozzles, updateInsertionSequence, recalculate } = useDesignStore()
  const activeNozzleSet = new Set(weftSystem.yarns.flatMap(y => y.nozzle_config.sequence))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <h2 style={{ fontSize: 20, fontWeight: 900, color: 'var(--primary)', letterSpacing: '-0.02em', marginBottom: 0 }}>
        Weft Yarn Configuration
      </h2>

      {/* Weft Diagram */}
      <WeftDiagram />

      {/* Nozzle Visualization */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 16px', background: '#F8F9FA', borderRadius: 12,
        border: '1.5px solid var(--border-light)',
      }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-1)', marginBottom: 2 }}>
            Total Machine Nozzles Available: <strong>{weftSystem.total_nozzles_available}</strong>
          </div>
        </div>
        <select style={{ width: 64, height: 34, borderRadius: 8, fontWeight: 700, border: '1.5px solid var(--border)', textAlign: 'center' }}
          value={weftSystem.total_nozzles_available}
          onChange={(e) => { setTotalNozzles(parseInt(e.target.value)); recalculate() }}>
          {[2, 4, 6, 8, 12, 16].map(n => <option key={n} value={n}>{n}</option>)}
        </select>
      </div>

      {/* Nozzle Icons Row */}
      <div style={{ display: 'flex', gap: 8, justifyContent: 'center', padding: '8px 0' }}>
        {Array.from({ length: weftSystem.total_nozzles_available }).map((_, i) => (
          <NozzleIcon key={i} color={NOZZLE_COLOUR_MAP[i % NOZZLE_COLOUR_MAP.length]} number={i + 1} active={activeNozzleSet.has(i + 1)} />
        ))}
      </div>

      {/* Yarn Cards */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ fontSize: 10, fontWeight: 900, color: '#AAA', textTransform: 'uppercase', letterSpacing: '0.1em' }}>WEFT YARN DETAILS</div>
          <button className="btn-accent" style={{ height: 34, padding: '0 16px', fontSize: 12, fontWeight: 700, borderRadius: 8 }}
            onClick={addWeftYarn}>+ Add New Yarn</button>
        </div>
        {weftSystem.yarns.map((yarn) => (
          <YarnCard key={yarn.id} yarn={yarn} onRemove={() => { removeWeftYarn(yarn.id); recalculate() }} />
        ))}
      </div>

      {/* Master Insertion Pattern */}
      <div style={{
        marginTop: 4, background: 'var(--bg-darker)', border: '1.5px dashed var(--border)',
        borderRadius: 12, padding: 16,
      }}>
        <div style={{ fontSize: 10, fontWeight: 900, color: '#AAA', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>
          MASTER INSERTION PATTERN
        </div>
        <div style={{
          display: 'flex', gap: 8, flexWrap: 'wrap', minHeight: 44,
          background: 'white', padding: 10, borderRadius: 10,
          border: '1.5px solid var(--border)', marginBottom: 12,
        }}>
          {weftSystem.insertion_sequence.pattern.length === 0 && (
            <span style={{ fontSize: 12, color: 'var(--text-3)', fontStyle: 'italic', padding: '8px 0' }}>
              Click yarn buttons below to build the insertion sequence...
            </span>
          )}
          {weftSystem.insertion_sequence.pattern.map((id, i) => {
            const yarn = weftSystem.yarns.find(y => y.id === id)
            return (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px',
                background: yarn?.colour_hex || '#CCC', color: 'white', borderRadius: 6,
                fontSize: 11, fontWeight: 800, boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
              }}>
                <span>{yarn?.label || 'Yarn'}</span>
                <button style={{
                  background: 'rgba(255,255,255,0.3)', border: 'none', color: 'white',
                  cursor: 'pointer', marginLeft: 4, width: 16, height: 16, borderRadius: 4,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12,
                }}
                  onClick={() => { updateInsertionSequence(weftSystem.insertion_sequence.pattern.filter((_, idx) => idx !== i)); recalculate() }}>
                  ×
                </button>
              </div>
            )
          })}
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {weftSystem.yarns.map(y => (
            <button key={y.id} className="btn-secondary" style={{
              fontSize: 11, height: 32, borderRadius: 8, fontWeight: 600,
              borderColor: y.colour_hex, color: 'var(--text-1)',
            }}
              onClick={() => { updateInsertionSequence([...weftSystem.insertion_sequence.pattern, y.id]); recalculate() }}>
              Add {y.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
