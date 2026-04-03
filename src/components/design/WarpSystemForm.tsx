'use client'

import { useState } from 'react'
import { useDesignStore } from '@/lib/store/designStore'
import type { WarpYarn, CountSystem, Luster } from '@/lib/types'
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

function StepperParams({ label, value, onMinus, onPlus, onChange }: any) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontSize: 11, fontWeight: 700, color: '#A0A0A5', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {label}
      </label>
      <div style={{ 
        display: 'flex', height: 40, border: '1px solid #4A4A4D', borderRadius: 8, overflow: 'hidden', background: '#2E2E32'
      }}>
        <button 
          onClick={onMinus}
          style={{ width: 40, background: 'transparent', border: 'none', borderRight: '1px solid #4A4A4D', color: '#FFF', fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >−</button>
        <input 
          type="number"
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value) || 0)}
          style={{ flex: 1, background: 'transparent', border: 'none', color: '#FFF', fontSize: 14, fontWeight: 600, textAlign: 'center', outline: 'none', width: '100%' }}
        />
        <button 
          onClick={onPlus}
          style={{ width: 40, background: 'transparent', border: 'none', borderLeft: '1px solid #4A4A4D', color: '#FFF', fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >+</button>
      </div>
    </div>
  )
}

function DarkWarpYarnCard({ yarn, index }: { yarn: WarpYarn; index: number }) {
  const { updateWarpYarn, recalculate } = useDesignStore()
  const [showPicker, setShowPicker] = useState(false)
  const [expanded, setExpanded] = useState(true)

  const handleUpdate = (updates: Partial<WarpYarn>) => {
    updateWarpYarn(yarn.id, updates)
    recalculate()
  }

  const seqPositions = [1, 3, 5, 7, 2, 4, 6, 8].map(n => n + yarn.sort_order * 2)

  return (
    <div style={{
      border: '1px solid #4A4A4D', borderRadius: 12, marginBottom: 16, overflow: 'hidden', background: '#252528'
    }}>
      {/* Header (Accordion Toggle) */}
      <div 
        onClick={() => setExpanded(!expanded)}
        style={{ 
          padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer',
          borderBottom: expanded ? '1px solid #4A4A4D' : 'none'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div 
            onClick={(e) => { e.stopPropagation(); setShowPicker(true) }}
            style={{ 
              width: 32, height: 32, borderRadius: 8, background: yarn.colour_hex || '#1a1a2e', 
              border: '2px solid #333'
            }} 
          />
          <div style={{ fontSize: 16, fontWeight: 700, color: '#FFF' }}>
            Warp {index + 1}
          </div>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ padding: '4px 10px', background: '#323236', borderRadius: 12, fontSize: 11, fontWeight: 700, color: '#E0E0E5' }}>
            {yarn.epi_share} EPI
          </div>
          {/* Mock secondary box from screenshot */}
          <div style={{ width: 36, height: 24, border: '1px solid #4A4A4D', borderRadius: 6, background: '#2E2E32' }} />
          
          <svg style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s', color: '#A0A0A5' }} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </div>

      {/* Body */}
      {expanded && (
        <div style={{ padding: 20 }}>
          
          {/* Color Row */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#A0A0A5', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Color
            </label>
            <div style={{ display: 'flex', height: 44, border: '1px solid #4A4A4D', borderRadius: 8, overflow: 'hidden', background: '#2E2E32', alignItems: 'center', paddingLeft: 8 }}>
              <div 
                onClick={() => setShowPicker(true)}
                style={{ width: 28, height: 28, borderRadius: 6, background: yarn.colour_hex, cursor: 'pointer', flexShrink: 0, border: '1px solid #111' }} 
              />
              <input 
                type="text"
                value={yarn.colour_hex}
                onChange={(e) => handleUpdate({ colour_hex: e.target.value })}
                style={{ flex: 1, background: 'transparent', border: 'none', color: '#FFF', fontSize: 16, padding: '0 12px', outline: 'none', fontFamily: 'monospace' }}
              />
            </div>
          </div>

          {/* Material & Yarn Count */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#A0A0A5', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Fiber Material
              </label>
              <select 
                value={yarn.material}
                onChange={(e) => handleUpdate({ material: e.target.value as any })}
                style={{ width: '100%', height: 44, background: '#2E2E32', border: '1px solid #4A4A4D', borderRadius: 8, color: '#FFF', fontSize: 15, padding: '0 12px', outline: 'none', appearance: 'none' }}
              >
                <option value="cotton">Cotton</option>
                <option value="polyester">Polyester</option>
                <option value="viscose">Viscose</option>
                <option value="silk">Silk</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#A0A0A5', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Yarn Count
              </label>
              <input 
                type="text"
                value={yarn.count_value + (yarn.count_system === 'ne' ? 's' : 'D')}
                onChange={(e) => {
                  const val = parseFloat(e.target.value) || 0;
                  handleUpdate({ count_value: val });
                }}
                style={{ width: '100%', height: 44, background: '#2E2E32', border: '1px solid #4A4A4D', borderRadius: 8, color: '#FFF', fontSize: 15, padding: '0 12px', outline: 'none' }}
              />
            </div>
          </div>

          {/* Steppers: EPI & Filament Count */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <StepperParams 
              label="Warp Count (EPI)" 
              value={yarn.epi_share} 
              onMinus={() => handleUpdate({ epi_share: Math.max(0, yarn.epi_share - 1) })}
              onPlus={() => handleUpdate({ epi_share: yarn.epi_share + 1 })}
              onChange={(val: number) => handleUpdate({ epi_share: val })}
            />
            <StepperParams 
              label="Filament Count" 
              value={yarn.filament_count || 1} 
              onMinus={() => handleUpdate({ filament_count: Math.max(1, (yarn.filament_count || 1) - 1) })}
              onPlus={() => handleUpdate({ filament_count: (yarn.filament_count || 1) + 1 })}
              onChange={(val: number) => handleUpdate({ filament_count: val })}
            />
          </div>

          {/* Drawing-In Sequence */}
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#A0A0A5', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Drawing-In Sequence
            </label>
            <input 
              type="text"
              defaultValue={seqPositions.join(', ')}
              style={{ width: '100%', height: 44, background: '#2E2E32', border: '1px solid #4A4A4D', borderRadius: 8, color: '#FFF', fontSize: 15, padding: '0 12px', outline: 'none' }}
            />
          </div>

        </div>
      )}

      {showPicker && <ColorPickerPopup isOpen={true} initialColor={yarn.colour_hex} title={`Color — ${yarn.label}`}
        onClose={() => setShowPicker(false)} onSave={(c) => { handleUpdate({ colour_hex: c }); setShowPicker(false) }} />}
    </div>
  )
}

export default function WarpSystemForm() {
  const { warpSystem, addWarpYarn } = useDesignStore()

  return (
    <div>
      <WarpDiagram />

      {/* Dark Theme Container */}
      <div style={{ 
        background: '#1F1F22', borderRadius: 16, padding: 24, fontFamily: 'system-ui, -apple-system, sans-serif'
      }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#A0A0A5', letterSpacing: '0.05em', marginBottom: 16 }}>
          WARP CONFIGURATION
        </div>

        <button 
          onClick={addWarpYarn}
          style={{ 
            width: '100%', height: 48, background: 'transparent', border: '1px solid #4A4A4D', borderRadius: 12,
            color: '#FFF', fontSize: 15, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            marginBottom: 24, cursor: 'pointer'
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="16"></line>
            <line x1="8" y1="12" x2="16" y2="12"></line>
          </svg>
          Add warp type
        </button>

        {warpSystem.yarns.map((yarn, i) => (
          <DarkWarpYarnCard key={yarn.id} yarn={yarn} index={i} />
        ))}
      </div>
    </div>
  )
}
