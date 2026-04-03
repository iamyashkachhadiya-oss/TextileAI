'use client'

import { useState } from 'react'
import { useDesignStore } from '@/lib/store/designStore'
import type { MachineType, DobbyType, ExportFormat, WeaveType } from '@/lib/types'
import { WEAVE_MODIFIERS } from '@/lib/calc/materials'

function ParamGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{
        fontSize: 10, fontWeight: 800, color: '#AAA', textTransform: 'uppercase',
        letterSpacing: '0.1em', marginBottom: 12,
      }}>{title}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {children}
      </div>
    </div>
  )
}

export default function LoomForm() {
  const loom = useDesignStore((s) => s.loom)
  const updateLoom = useDesignStore((s) => s.updateLoom)
  const recalculate = useDesignStore((s) => s.recalculate)
  const [pneumaticOpen, setPneumaticOpen] = useState(false)

  if (!loom) return null

  const handleChange = (field: string, value: string | number) => {
    updateLoom({ [field]: value })
    recalculate()
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <h2 style={{ fontSize: 18, fontWeight: 800, color: '#1B1F3B', marginBottom: 4 }}>Machine System</h2>
      <p style={{ fontSize: 11, color: '#888', marginBottom: 20 }}>Calibrate loom physics & output formats</p>

      <ParamGroup title="Hardware Specs">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <div>
            <label>Machine Type</label>
            <select value={loom.machine_type} onChange={(e) => handleChange('machine_type', e.target.value as MachineType)}>
              <option value="air_jet">Air Jet</option>
              <option value="rapier">Rapier</option>
              <option value="water_jet">Water Jet</option>
              <option value="power_loom">Power Loom</option>
              <option value="projectile">Projectile</option>
            </select>
          </div>
          <div>
            <label>Dobby Type</label>
            <select value={loom.dobby_type} onChange={(e) => handleChange('dobby_type', e.target.value as DobbyType)}>
              <option value="mechanical">Mechanical</option>
              <option value="staubli">Stäubli</option>
              <option value="grosse">Grosse</option>
              <option value="picanol">Picanol</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>

        {loom.dobby_type !== 'mechanical' && (
          <div>
            <label>Output Format</label>
            <select value={loom.export_format} onChange={(e) => handleChange('export_format', e.target.value as ExportFormat)}>
              <option value=".EP">.EP (Stäubli)</option>
              <option value=".JC5">.JC5 (Electronic)</option>
              <option value=".DES">.DES (Picanol)</option>
              <option value=".WEA">.WEA (Grosse)</option>
              <option value="text">Debug Text</option>
            </select>
          </div>
        )}

        {/* Weave Type Selection */}
        <div>
          <label>Weave Type</label>
          <select value={loom.weave_type} onChange={(e) => handleChange('weave_type', e.target.value as WeaveType)}>
            {Object.entries(WEAVE_MODIFIERS).map(([key, mod]) => (
              <option key={key} value={key}>{mod.name}</option>
            ))}
          </select>
          {WEAVE_MODIFIERS[loom.weave_type] && (
            <div style={{
              marginTop: 6, padding: '8px 10px', background: '#F8F9FA',
              borderRadius: 6, fontSize: 10, color: 'var(--text-3)', lineHeight: 1.5,
            }}>
              {WEAVE_MODIFIERS[loom.weave_type].hint}
            </div>
          )}
        </div>
      </ParamGroup>

      <ParamGroup title="Geometric Limits">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <div>
            <label>Reed (Stockport)</label>
            <select value={loom.reed_count_stockport} onChange={(e) => handleChange('reed_count_stockport', parseInt(e.target.value))}>
              {[44, 48, 52, 56, 60, 64, 68, 72, 76, 80, 84, 88, 92, 96, 100].map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>
          <div>
            <label>Ends/Dent</label>
            <select value={loom.ends_per_dent} onChange={(e) => handleChange('ends_per_dent', parseInt(e.target.value))}>
              {[1, 2, 3, 4].map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label>Cloth Width (inches)</label>
          <input type="number" value={loom.cloth_width_inches || ''} onChange={(e) => handleChange('cloth_width_inches', parseFloat(e.target.value) || 0)} />
        </div>
      </ParamGroup>

      <ParamGroup title="Operation & Tension">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <div>
            <label>Machine RPM</label>
            <input type="number" value={loom.machine_rpm || ''} onChange={(e) => handleChange('machine_rpm', parseInt(e.target.value) || 0)} />
          </div>
          <div>
            <label>Target PPI</label>
            <input type="number" value={loom.target_ppi || ''} onChange={(e) => handleChange('target_ppi', parseInt(e.target.value) || 0)} />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <div>
            <label>Warp Crimp %</label>
            <input type="number" step="0.5" value={loom.warp_crimp_pct || ''} onChange={(e) => handleChange('warp_crimp_pct', parseFloat(e.target.value) || 0)} />
          </div>
          <div>
            <label>Weft Crimp %</label>
            <input type="number" step="0.5" value={loom.weft_crimp_pct || ''} onChange={(e) => handleChange('weft_crimp_pct', parseFloat(e.target.value) || 0)} />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <div>
            <label>Wastage %</label>
            <input type="number" step="0.5" value={loom.wastage_pct || ''} onChange={(e) => handleChange('wastage_pct', parseFloat(e.target.value) || 0)} />
          </div>
          <div>
            <label>Efficiency %</label>
            <input type="number" value={loom.loom_efficiency_pct || ''} onChange={(e) => handleChange('loom_efficiency_pct', parseInt(e.target.value) || 0)} />
          </div>
        </div>

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <label style={{ margin: 0 }}>Loom Tension (cN)</label>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--primary)' }}>{loom.loom_tension_cN || 180}</span>
          </div>
          <input type="range" min={40} max={400} step={5} value={loom.loom_tension_cN || 180}
            onChange={(e) => handleChange('loom_tension_cN', parseInt(e.target.value))}
            style={{ width: '100%', accentColor: 'var(--accent)', height: 6, margin: '8px 0' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#AAA' }}>
            <span>40 cN</span>
            <span>400 cN</span>
          </div>
        </div>
      </ParamGroup>

      <div style={{
        padding: 14, background: '#f8f9fa', borderRadius: 10, border: '1px solid #eee',
        display: 'flex', flexDirection: 'column', gap: 12,
      }}>
        <button
          onClick={() => setPneumaticOpen(!pneumaticOpen)}
          style={{
            width: '100%', background: 'none', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}
        >
          <span style={{ fontSize: 11, fontWeight: 700, color: '#555' }}>Advanced Air Settings (SV1-SV5)</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
            style={{ transform: pneumaticOpen ? 'rotate(180deg)' : 'none', transition: '0.2s' }}>
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>

        {pneumaticOpen && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, animation: 'slideDown 0.2s' }}>
            {[
              { key: 'sv1_psi', label: 'SV1: Cloth Storage' },
              { key: 'sv2_psi', label: 'SV2: Beater' },
              { key: 'sv3_psi', label: 'SV3: Dobby' },
              { key: 'sv4_psi', label: 'SV4: Air Brake' },
              { key: 'sv5_psi', label: 'SV5: Accumulator' },
            ].map(({ key, label }) => (
              <div key={key}>
                <label style={{ fontSize: 10 }}>{label}</label>
                <input type="number" value={(loom as unknown as Record<string, number>)[key] || ''}
                  onChange={(e) => handleChange(key, parseInt(e.target.value) || 0)}
                  style={{ height: 32, fontSize: 12 }} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
