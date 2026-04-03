'use client'

import { useState } from 'react'
import { useDesignStore } from '@/lib/store/designStore'
import type { WarpYarn, CountSystem, Luster } from '@/lib/types'
import MaterialSelect from './MaterialSelect'
import ColorPickerPopup from '../common/ColorPickerPopup'

function WarpDiagram() {
  return (
    <div style={{ marginBottom: 20 }}>
      <img 
        src="/warp_machine.png" 
        alt="Warp Configuration Machine" 
        style={{ width: '100%', height: 'auto', display: 'block', borderRadius: 8 }} 
      />
    </div>
  )
}

function WarpYarnCard({ yarn, onRemove }: { yarn: WarpYarn; onRemove: () => void }) {
  const { updateWarpYarn, recalculate } = useDesignStore()
  const [showPicker, setShowPicker] = useState(false)

  const handleUpdate = (updates: Partial<WarpYarn>) => {
    updateWarpYarn(yarn.id, updates)
    recalculate()
  }

  // Determine sequence positions based on sort_order
  const seqPositions = [1, 3, 5].map(n => n + yarn.sort_order * 2)

  return (
    <div style={{
      padding: 20, marginBottom: 16, background: '#FFFFFF',
      border: '1.5px solid var(--border)', borderRadius: 12,
      boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div
            onClick={() => setShowPicker(true)}
            style={{
              width: 32, height: 32, borderRadius: 8, background: yarn.colour_hex,
              border: '1px solid var(--border)', cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
            }}
          />
          <div style={{ fontWeight: 800, fontSize: 16, color: 'var(--text-1)' }}>
            {yarn.label}
          </div>
        </div>
        <button onClick={onRemove} style={{
          width: 32, height: 32, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: '#FFF0F0', color: '#D44B4B', border: '1px solid #FCD2D2', borderRadius: 8, cursor: 'pointer',
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 6h18m-2 0v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6m3 0V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /></svg>
        </button>
      </div>

      {/* Simple Form Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16 }}>
        
        {/* Material */}
        <div style={{ gridColumn: 'span 2' }}>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: 'var(--text-2)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Fiber Material</label>
          <MaterialSelect 
            value={yarn.material} 
            onChange={(v) => handleUpdate({ material: v })} 
            showBadge={false} 
          />
        </div>

        {/* Warp Count */}
        <div style={{ gridColumn: 'span 2' }}>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: 'var(--text-2)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Warp Count Parameter</label>
          <div style={{ display: 'flex' }}>
            <input 
              type="number" 
              value={yarn.count_value} 
              onChange={(e) => handleUpdate({ count_value: parseFloat(e.target.value) || 0 })}
              style={{ width: '60%', borderRight: 'none', borderTopRightRadius: 0, borderBottomRightRadius: 0 }} 
            />
            <select 
              value={yarn.count_system} 
              onChange={(e) => handleUpdate({ count_system: e.target.value as CountSystem })}
              style={{ width: '40%', borderTopLeftRadius: 0, borderBottomLeftRadius: 0, backgroundColor: '#F8F9FA' }}
            >
              <option value="denier">Denier (D)</option>
              <option value="ne">English (Ne)</option>
              <option value="tex">Tex</option>
            </select>
          </div>
        </div>

        {/* EPI */}
        <div>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: 'var(--text-2)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Ends Per Inch (EPI)</label>
          <input 
            type="number" 
            value={yarn.epi_share} 
            onChange={(e) => handleUpdate({ epi_share: parseInt(e.target.value) || 0 })}
          />
        </div>

        {/* Color Code/Name */}
        <div style={{ gridColumn: 'span 2' }}>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: 'var(--text-2)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Color Identifier</label>
          <input 
            type="text" 
            value={yarn.colour_code} 
            placeholder="e.g. Navy Blue, Pantone 296C"
            onChange={(e) => handleUpdate({ colour_code: e.target.value })}
          />
        </div>

        {/* Luster */}
        <div>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: 'var(--text-2)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Luster</label>
          <select 
            value={yarn.luster} 
            onChange={(e) => handleUpdate({ luster: e.target.value as Luster })}
          >
            <option value="bright">Bright</option>
            <option value="semi_dull">Semi-Dull</option>
            <option value="dull">Dull</option>
          </select>
        </div>

        {/* Filament Count */}
        <div>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: 'var(--text-2)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Filament Count</label>
          <input 
            type="number" 
            value={yarn.filament_count || ''} 
            placeholder="e.g. (36)"
            onChange={(e) => handleUpdate({ filament_count: parseInt(e.target.value) || null })}
            disabled={yarn.count_system !== 'denier'}
            style={{ opacity: yarn.count_system !== 'denier' ? 0.5 : 1 }}
          />
        </div>

        {/* Sequence */}
        <div style={{ display: 'flex', alignItems: 'flex-start' }}>
          <div style={{ marginTop: 28, fontSize: 11, color: '#888', fontWeight: 600 }}>
            Drawing-in: <span style={{ fontFamily: 'var(--font-mono)' }}>{seqPositions.join(', ')}...</span>
          </div>
        </div>

      </div>

      {showPicker && <ColorPickerPopup isOpen={true} initialColor={yarn.colour_hex} title={`Color — ${yarn.label}`}
        onClose={() => setShowPicker(false)} onSave={(c) => { handleUpdate({ colour_hex: c }); setShowPicker(false) }} />}
    </div>
  )
}

export default function WarpSystemForm() {
  const { warpSystem, setWarpMode, addWarpYarn, updateWarpYarn, removeWarpYarn } = useDesignStore()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Title */}
      <h2 style={{ fontSize: 20, fontWeight: 900, color: 'var(--primary)', letterSpacing: '-0.02em', marginBottom: 0 }}>
        Warp Configuration
      </h2>

      {/* Technical Diagram */}
      <WarpDiagram />

      {/* Yarn List Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 10, fontWeight: 900, color: '#AAA', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          WARP SYSTEM DETAILS
        </div>
        <button className="btn-accent" style={{ height: 34, padding: '0 16px', fontSize: 12, fontWeight: 700, borderRadius: 8 }}
          onClick={addWarpYarn}>
          + Add Warp Type
        </button>
      </div>

      {/* Yarn Cards */}
      {warpSystem.yarns.map((yarn) => (
        <WarpYarnCard
          key={yarn.id}
          yarn={yarn}
          onRemove={() => removeWarpYarn(yarn.id)}
        />
      ))}

    </div>
  )
}
