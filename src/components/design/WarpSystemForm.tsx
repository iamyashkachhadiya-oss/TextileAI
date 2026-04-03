'use client'

import { useState } from 'react'
import { useDesignStore } from '@/lib/store/designStore'
import type { WarpYarn, Material, CountSystem, Luster } from '@/lib/types'
import { MATERIAL_PHYSICS, CATEGORY_COLORS } from '@/lib/calc/materials'
import MaterialSelect from './MaterialSelect'
import ColorPickerPopup from '../common/ColorPickerPopup'

const QUICK_COLORS = ['#1B1F3B', '#FFFFFF', '#E8A838', '#D44B4B', '#4BA86D', '#7B61FF', '#FF6B9D', '#00B4D8', '#FF8C42', '#8B5CF6']

function WarpDiagram() {
  return (
    <div style={{
      background: '#F8F9FA', borderRadius: 12, padding: 20, marginBottom: 20,
      border: '1.5px solid var(--border-light)', position: 'relative', overflow: 'hidden',
    }}>
      <svg width="100%" height="180" viewBox="0 0 360 180" fill="none" preserveAspectRatio="xMidYMid meet">
        {/* Warp Beam Left */}
        <ellipse cx="40" cy="130" rx="28" ry="35" fill="#D4CFC4" stroke="#888" strokeWidth="1.5" />
        <ellipse cx="40" cy="130" rx="12" ry="14" fill="#B8B0A2" stroke="#888" strokeWidth="1" />
        <circle cx="40" cy="130" r="4" fill="#888" />

        {/* Warp Beam Right */}
        <ellipse cx="320" cy="130" rx="28" ry="35" fill="#D4CFC4" stroke="#888" strokeWidth="1.5" />
        <ellipse cx="320" cy="130" rx="12" ry="14" fill="#B8B0A2" stroke="#888" strokeWidth="1" />
        <circle cx="320" cy="130" r="4" fill="#888" />

        {/* Warp Sheet - threads from left beam */}
        {Array.from({ length: 12 }).map((_, i) => (
          <line key={`thread-${i}`}
            x1="68" y1={110 + i * 3}
            x2="292" y2={110 + i * 3}
            stroke="#C49A3C" strokeWidth="0.8" opacity={0.6 + (i % 3) * 0.15}
          />
        ))}

        {/* Section Guide Frame */}
        <rect x="100" y="40" width="8" height="80" rx="2" fill="#8B7355" stroke="#6B5840" strokeWidth="1" />
        <rect x="100" y="35" width="8" height="10" rx="1" fill="#A0896E" />

        {/* Heddle Frame Posts */}
        <rect x="160" y="30" width="4" height="105" rx="1" fill="#7B6B55" />
        <rect x="200" y="30" width="4" height="105" rx="1" fill="#7B6B55" />
        {/* Heddle top bar */}
        <rect x="155" y="28" width="54" height="6" rx="2" fill="#8B7B65" stroke="#6B5B45" strokeWidth="0.5" />
        {/* Heddle eyes */}
        {Array.from({ length: 8 }).map((_, i) => (
          <circle key={`eye-${i}`} cx={162 + i * 5.5} cy={60 + (i % 2) * 8} r="1.5" fill="none" stroke="#999" strokeWidth="0.5" />
        ))}

        {/* Lease Rods */}
        <line x1="245" y1="100" x2="245" y2="150" stroke="#666" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="260" y1="95" x2="260" y2="150" stroke="#666" strokeWidth="2.5" strokeLinecap="round" />

        {/* Labels */}
        <text x="40" y="175" textAnchor="middle" fontSize="9" fontWeight="700" fill="#666">Warp Beam</text>
        <text x="104" y="25" textAnchor="middle" fontSize="8" fontWeight="600" fill="#888">Section Guide</text>
        <text x="182" y="20" textAnchor="middle" fontSize="8" fontWeight="600" fill="#888">Heddle Frame</text>
        <text x="252" y="170" textAnchor="middle" fontSize="8" fontWeight="600" fill="#888">Lease Rods</text>
        <text x="320" y="175" textAnchor="middle" fontSize="9" fontWeight="700" fill="#666">Warp Beam</text>
        <text x="180" y="150" textAnchor="middle" fontSize="8" fontWeight="600" fill="#AAA">Warp Sheet</text>
      </svg>
    </div>
  )
}

function WarpPropertiesPopover({ yarn, onClose }: { yarn: WarpYarn; onClose: () => void }) {
  const { updateWarpYarn, recalculate } = useDesignStore()
  const mat = MATERIAL_PHYSICS[yarn.material]

  const handleUpdate = (updates: Partial<WarpYarn>) => {
    updateWarpYarn(yarn.id, updates)
    recalculate()
  }

  const handlePropUpdate = (updates: Partial<WarpYarn['properties']>) => {
    updateWarpYarn(yarn.id, { properties: { ...yarn.properties, ...updates } })
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
            <label style={{ fontSize: 11, fontWeight: 600, marginBottom: 2 }}>Ends/Inch (EPI)</label>
            <input type="number" value={yarn.count_value} onChange={(e) => handleUpdate({ count_value: parseFloat(e.target.value) || 0 })}
              style={{ height: 34, borderRadius: 8, fontSize: 13, fontWeight: 600 }} />
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, marginBottom: 2 }}>Warp Count (Tex)</label>
            <input type="number" value={yarn.epi_share} onChange={(e) => handleUpdate({ epi_share: parseInt(e.target.value) || 0 })}
              style={{ height: 34, borderRadius: 8, fontSize: 13, fontWeight: 600 }} />
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, marginBottom: 2 }}>Color</label>
            <select value={yarn.colour_code || 'White'} onChange={(e) => handleUpdate({ colour_code: e.target.value })}
              style={{ height: 34, borderRadius: 8, fontSize: 12, width: '100%' }}>
              <option value="White">White</option>
              <option value="Natural">Natural</option>
              <option value="Black">Black</option>
              <option value="Red">Red</option>
              <option value="Blue">Blue</option>
              <option value="Custom">Custom</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, marginBottom: 2 }}>Shrinkage %</label>
            <input type="number" step="0.1" value={yarn.properties.shrinkage_min_pct}
              onChange={(e) => handlePropUpdate({ shrinkage_min_pct: parseFloat(e.target.value) || 0 })}
              style={{ height: 34, borderRadius: 8, fontSize: 13, fontWeight: 600 }} />
          </div>
        </div>
        <div>
          <label style={{ fontSize: 11, fontWeight: 600, marginBottom: 2 }}>Warp Length (m)</label>
          <input type="number" value={yarn.price_per_kg > 0 ? yarn.price_per_kg * 250 : 50000} readOnly
            style={{ height: 34, borderRadius: 8, fontSize: 13, fontWeight: 600, opacity: 0.7 }} />
        </div>
        <div>
          <label style={{ fontSize: 11, fontWeight: 600, marginBottom: 2 }}>Dye Affinity</label>
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

function WarpYarnCard({
  yarn,
  onRemove,
}: {
  yarn: WarpYarn
  onRemove: () => void
}) {
  const { updateWarpYarn, recalculate } = useDesignStore()
  const [showPicker, setShowPicker] = useState(false)
  const [showProps, setShowProps] = useState(false)

  const mat = MATERIAL_PHYSICS[yarn.material]
  const catColor = mat ? CATEGORY_COLORS[mat.category] : null

  const handleUpdate = (updates: Partial<WarpYarn>) => {
    updateWarpYarn(yarn.id, updates)
    recalculate()
  }

  // Determine sequence positions based on sort_order
  const seqPositions = [1, 3, 5].map(n => n + yarn.sort_order * 2)

  return (
    <div style={{ position: 'relative' }}>
      <div style={{
        padding: 14, marginBottom: 12, background: 'linear-gradient(135deg, #FAFAF7, #FFFFFF)',
        border: `2px solid ${showProps ? 'var(--accent)' : 'var(--border-light)'}`, borderRadius: 12,
        transition: 'border-color 0.2s, box-shadow 0.2s',
        boxShadow: showProps ? '0 4px 16px rgba(232,168,56,0.15)' : '0 2px 8px rgba(0,0,0,0.03)',
      }}>
        {/* Header Row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <div
              onClick={() => setShowPicker(true)}
              style={{
                width: 40, height: 40, borderRadius: 8, background: yarn.colour_hex,
                border: '2px solid white', boxShadow: '0 2px 8px rgba(0,0,0,0.12)', cursor: 'pointer',
                transition: 'transform 0.15s',
              }}
            />
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-1)' }}>
                {yarn.label}: {yarn.count_value}D {mat?.name || yarn.material}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 1 }}>
                ({yarn.colour_code || yarn.luster === 'bright' ? 'White' : yarn.colour_code || 'Natural'})
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

        {/* Color Picker */}
        {showPicker && <ColorPickerPopup isOpen={true} initialColor={yarn.colour_hex} title={`Color — ${yarn.label}`}
          onClose={() => setShowPicker(false)} onSave={(c) => { handleUpdate({ colour_hex: c }); setShowPicker(false) }} />}
      </div>

      {/* Properties Popover */}
      {showProps && <WarpPropertiesPopover yarn={yarn} onClose={() => setShowProps(false)} />}
    </div>
  )
}

export default function WarpSystemForm() {
  const { warpSystem, setWarpMode, addWarpYarn, updateWarpYarn, removeWarpYarn } = useDesignStore()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Title */}
      <h2 style={{ fontSize: 20, fontWeight: 900, color: 'var(--primary)', letterSpacing: '-0.02em', marginBottom: 0 }}>
        Warp Yarn Configuration
      </h2>

      {/* Technical Diagram */}
      <WarpDiagram />

      {/* Yarn List Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 10, fontWeight: 900, color: '#AAA', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          WARP YARN DETAILS
        </div>
        <button className="btn-accent" style={{ height: 34, padding: '0 16px', fontSize: 12, fontWeight: 700, borderRadius: 8 }}
          onClick={addWarpYarn}>
          + Add New Warp Yarn
        </button>
      </div>

      {/* Mode Toggle */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div className="pill-group">
          <button className={`pill-btn ${warpSystem.mode === 'simple' ? 'active' : ''}`}
            onClick={() => setWarpMode('simple')}>Simple</button>
          <button className={`pill-btn ${warpSystem.mode === 'advanced' ? 'active' : ''}`}
            onClick={() => setWarpMode('advanced')}>Advanced</button>
        </div>
      </div>

      {/* Yarn Cards */}
      {warpSystem.yarns.map((yarn) => (
        <WarpYarnCard
          key={yarn.id}
          yarn={yarn}
          onRemove={() => removeWarpYarn(yarn.id)}
        />
      ))}

      {/* Engineering Note */}
      <div style={{
        background: 'linear-gradient(135deg, #F0F7FF, #E8F0FE)', border: '1px solid #CDE2FF',
        borderRadius: 12, padding: 16,
      }}>
        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ color: '#0066CC', paddingTop: 2 }}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <div style={{ fontWeight: 600, color: '#004C99', fontSize: 13 }}>Multi-Warp Engineering</div>
            <div style={{ fontSize: 12, color: '#005BB7', lineHeight: 1.5, marginTop: 4 }}>
              In <strong>Advanced</strong> mode, different warp yarns blend their material physics
              (shrinkage, drape, stiffness, tenacity). Each yarn&apos;s <strong>EPI Share</strong> defines
              its contribution to the total ends per inch.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
