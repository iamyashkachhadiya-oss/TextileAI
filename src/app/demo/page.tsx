'use client'

import { useState, useCallback, useMemo, useEffect } from 'react'
import { useDesignStore } from '@/lib/store/designStore'
import { textToMatrix } from '@/lib/pegplan/parser'
import IdentityForm from '@/components/design/IdentityForm'
import WarpSystemForm from '@/components/design/WarpSystemForm'
import WeftForm from '@/components/design/WeftForm'
import LoomForm from '@/components/design/LoomForm'
import CalcPanel from '@/components/design/CalcPanel'
import PegPlanEditor from '@/components/design/PegPlanEditor'
import WeaveCanvas from '@/components/design/WeaveCanvas'
import SimulationPreview from '@/components/outputs/SimulationExport'
import BorderForm from '@/components/design/BorderForm'
import MachineExportPanel from '@/components/outputs/MachineExport'

import SimulationAssistantUI from '@/components/analysis/SimulationAssistant'

type DemoTab = 'Identity' | 'Warp' | 'Weft' | 'Loom' | 'Border' | 'AI Analysis' | 'Export'

export default function DemoPage() {
  const [activeTab, setActiveTab] = useState<DemoTab>('Weft')
  const [initialized, setInitialized] = useState(false)
  const store = useDesignStore()

  useEffect(() => {
    if (initialized) return
    const { updateIdentity, setPegPlan, recalculate } = useDesignStore.getState()
    updateIdentity({ design_name: 'Pattu Dobby Saree', design_number: 'SD-2025-001' })
    
    // Set a default peg plan so simulation + grid are visible immediately
    const defaultPegText = `1-->1,3,5,7,9,11,13,15\n2-->2,4,6,8,10,12,14,16\n3-->1,3,5,7,9,11,13,15\n4-->2,4,6,8,10,12,14,16\n5-->1,2,5,6,9,10,13,14\n6-->3,4,7,8,11,12,15,16\n7-->1,2,5,6,9,10,13,14\n8-->3,4,7,8,11,12,15,16`
    const defaultMatrix = textToMatrix(defaultPegText, 16)
    setPegPlan(defaultPegText, defaultMatrix)
    
    recalculate()
    setInitialized(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const [draftText, setDraftText] = useState('1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16')
  const draftSequence = useMemo(() => draftText.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n) && n > 0), [draftText])
  
  const weaveMatrix = useMemo(() => {
    if (!store.pegPlanMatrix.length) return []
    return store.pegPlanMatrix.map(pick => 
      draftSequence.map((shaft: number) => pick[shaft - 1] || 0)
    )
  }, [store.pegPlanMatrix, draftSequence])

  const handlePegPlanChange = useCallback((text: string, matrix: number[][]) => {
    store.setPegPlan(text, matrix); store.recalculate()
  }, [store])
  
  const handleWeaveToggle = useCallback((row: number, col: number) => {
    const shaft = draftSequence[col]
    if (!shaft) return
    const shaftIdx = shaft - 1
    
    const newPegPlan = store.pegPlanMatrix.map((r, ri) =>
      ri === row ? r.map((c, ci) => ci === shaftIdx ? (c === 1 ? 0 : 1) : c) : [...r]
    )
    const newText = newPegPlan.map((r, ri) => `${ri + 1}-->${r.map((c, ci) => c === 1 ? ci + 1 : 0).filter(v => v !== 0).join(',')}`).join('\n')
    store.setPegPlan(newText, newPegPlan)
    store.recalculate()
  }, [store, draftSequence])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--bg)' }}>
      {/* ═══ HEADER ═══ */}
      <header style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 24px', height: 56, borderBottom: '1px solid var(--border)',
        background: 'var(--surface)', flexShrink: 0, zIndex: 100,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 9,
            background: 'linear-gradient(145deg, #1B1F3B, #2A2F52)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ color: '#E8A838', fontSize: 18, fontWeight: 700 }}>ƒ</span>
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--primary)', letterSpacing: '-0.02em' }}>FabricAI</span>
              <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-3)' }}>STUDIO</span>
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: -2 }}>
              {store.identity.design_name || 'Untitled'} · {store.identity.design_number || 'No ID'}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <span style={{
            padding: '5px 14px', fontSize: 11, fontWeight: 700,
            border: '1.5px solid var(--accent)', color: 'var(--accent)',
            borderRadius: 6, cursor: 'pointer',
          }}>DEMO MODE</span>
          <button onClick={() => import('@/components/outputs/PDFExport').then(m => m.downloadPDF())}
            className="btn-accent" style={{ fontSize: 12, height: 38, padding: '0 18px', borderRadius: 8 }}>
            ↓ Export PDF
          </button>
        </div>
      </header>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* ═══ LEFT SIDEBAR ═══ */}
        <div style={{
          width: 280, flexShrink: 0, borderRight: '1px solid var(--border)',
          display: 'flex', flexDirection: 'column', background: 'var(--surface)',
        }}>
          {/* Sidebar Tab Bar */}
          <div style={{
            display: 'flex', gap: 0, padding: '0 4px',
            borderBottom: '2px solid var(--border-light)',
            overflowX: 'auto', flexShrink: 0,
          }}>
            {['Identity', 'Warp', 'Weft', 'Loom', 'Border'].map((label, i) => {
              const tabMap: DemoTab[] = ['Identity', 'Warp', 'Weft', 'Loom', 'Border']
              const tab = tabMap[i]
              return (
                <button key={tab} className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab)}
                  style={{ padding: '10px 8px', fontSize: 11, whiteSpace: 'nowrap', lineHeight: 1.2 }}>
                  {label}
                </button>
              )
            })}
          </div>

          {/* Sidebar Content */}
          <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
            {activeTab === 'Identity' && <IdentityForm />}
            {activeTab === 'Warp' && <WarpSystemForm />}
            {activeTab === 'Weft' && <WeftForm />}
            {activeTab === 'Loom' && <LoomForm />}
            {activeTab === 'Border' && <BorderForm />}
            {activeTab === 'AI Analysis' && <SimulationAssistantUI />}
            {activeTab === 'Export' && <MachineExportPanel />}
          </div>
        </div>

        {/* ═══ CENTER WORKSPACE — ALWAYS SHOWS FULL LAYOUT ═══ */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* ── 1. PEG PLAN — BIDIRECTIONAL EDITOR (always visible) ── */}
          <div className="card" style={{ padding: 24 }}>
            <div style={{ marginBottom: 4 }}>
              <h3 style={{
                fontSize: 14, fontWeight: 800, color: 'var(--text-1)',
                textTransform: 'uppercase', letterSpacing: '0.08em',
              }}>PEG PLAN — BIDIRECTIONAL EDITOR</h3>
              <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 4 }}>
                Click cells to toggle · Text syncs automatically
              </div>
            </div>
            <PegPlanEditor shaftCount={16} onChange={handlePegPlanChange} initialText={store.pegPlanText} />
          </div>

          {/* ── 2. WEAVE GRID & DRAFT PLAN (always visible) ── */}
          {store.pegPlanMatrix.length > 0 && (
            <div className="card" style={{ padding: 24 }}>
              <div style={{ display: 'flex', gap: 0, alignItems: 'flex-start' }}>
                <div style={{ flex: 1, overflowX: 'auto', paddingRight: 24, borderRight: '1px solid var(--border)' }}>
                  <div style={{
                    fontSize: 12, fontWeight: 800, color: 'var(--text-1)',
                    textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 16,
                  }}>GENERATED WEAVE DESIGN (CLICK TO EDIT PEG)</div>
                  <WeaveCanvas matrix={weaveMatrix} shaftCount={draftSequence.length} onToggle={handleWeaveToggle}
                    repeatW={draftSequence.length} repeatH={weaveMatrix.length} />
                </div>
                
                <div style={{ width: 300, flexShrink: 0, paddingLeft: 24 }}>
                  <div style={{
                    fontSize: 12, fontWeight: 800, color: 'var(--text-1)',
                    textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 16,
                  }}>DRAFT PLAN EDITOR</div>
                  <textarea 
                    value={draftText} 
                    onChange={e => setDraftText(e.target.value)}
                    style={{ 
                      width: '100%', height: 80, background: '#F8F9FA', border: '1px solid var(--border-light)', 
                      borderRadius: 8, padding: 12, fontSize: 13, fontFamily: 'monospace', resize: 'none', marginBottom: 12,
                      color: 'var(--text-1)' 
                    }}
                    placeholder="Enter draft sequence (e.g. 1, 2, 3, 4)"
                  />
                  <div style={{ display: 'flex', flexDirection: 'row', gap: 2, flexWrap: 'wrap' }}>
                    {draftSequence.map((shaft: number, i: number) => (
                      <div key={i} title={`Warp End ${i+1} -> Shaft ${shaft}`} style={{ 
                        width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 10, fontFamily: 'var(--font-mono)', fontWeight: 800, color: 'var(--text-1)',
                        background: '#FFF', border: '1px solid #E4E7EB', borderRadius: 4,
                        boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                      }}>
                        {shaft}
                      </div>
                    ))}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--text-3)', fontStyle: 'italic', marginTop: 12, lineHeight: 1.4 }}>
                    Edit the sequence above. The Weave Design mathematically outputs: Weave[warp, weft] = PegPlan[weft][Draft[warp]]
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── 3. FABRIC SIMULATION (always visible) ── */}
          <div className="card" style={{ padding: 28 }}>
            <div style={{ marginBottom: 20 }}>
              <h3 style={{
                fontSize: 14, fontWeight: 800, color: 'var(--text-1)',
                textTransform: 'uppercase', letterSpacing: '0.08em',
              }}>FABRIC SIMULATION</h3>
            </div>

            <SimulationPreview
              matrix={weaveMatrix.length > 0 ? weaveMatrix : store.pegPlanMatrix}
              warpColor={store.warp?.colour_hex || '#1B1F3B'}
              weftColor={store.weftSystem.yarns[0]?.colour_hex || '#E8A838'}
              designName={store.identity.design_name || 'Design'}
            />
          </div>

          {/* ── 4. STATUS FOOTER (always visible) ── */}
          <div style={{
            marginTop: 'auto', background: '#F8F9FA', border: '1.5px solid #EEE', borderRadius: 12,
            padding: '14px 24px', display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, flexShrink: 0,
          }}>
            <div>
              <div style={{ fontSize: 9, fontWeight: 800, color: '#AAA', textTransform: 'uppercase' }}>WARP</div>
              <div style={{ fontSize: 12, fontWeight: 700 }}>
                {store.warp?.count_value || 75}{store.warp?.count_system === 'denier' ? 'D' : 'Ne'}{' '}
                {store.warp?.material === 'polyester' ? 'Polyester' :
                 store.warp?.material === 'cotton' ? 'Cotton' :
                 store.warp?.material || 'Polyester'}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 9, fontWeight: 800, color: '#AAA', textTransform: 'uppercase' }}>MAIN WEFT</div>
              <div style={{ fontSize: 12, fontWeight: 700 }}>
                {store.weftSystem.yarns[0]?.count_value || '--'}{store.weftSystem.yarns[0]?.count_system === 'ne' ? 'Ne' : 'D'}{' '}
                {store.weftSystem.yarns[0]?.material === 'cotton' ? 'Cotton' :
                 store.weftSystem.yarns[0]?.material === 'polyester' ? 'Polyester' :
                 store.weftSystem.yarns[0]?.material || '--'}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 9, fontWeight: 800, color: '#AAA', textTransform: 'uppercase' }}>EXTRA YARNS</div>
              <div style={{ fontSize: 12, fontWeight: 700 }}>{Math.max(store.weftSystem.yarns.length - 1, 0)} Yarns</div>
            </div>
            <div>
              <div style={{ fontSize: 9, fontWeight: 800, color: '#AAA', textTransform: 'uppercase' }}>MACHINE</div>
              <div style={{ fontSize: 12, fontWeight: 700 }}>
                {store.loom?.machine_type === 'rapier' ? 'Rapier' :
                 store.loom?.machine_type === 'air_jet' ? 'Air Jet' :
                 store.loom?.machine_type === 'water_jet' ? 'Water Jet' : 'Rapier'} - {store.loom?.machine_rpm || 500} RPM
              </div>
            </div>
            <div>
              <div style={{ fontSize: 9, fontWeight: 800, color: '#AAA', textTransform: 'uppercase' }}>SYSTEM MODE</div>
              <div style={{ fontSize: 12, fontWeight: 700 }}>Advanced</div>
            </div>
          </div>
        </div>

        {/* ═══ RIGHT SIDEBAR — LIVE CALCULATIONS ═══ */}
        <div style={{ borderLeft: '1px solid var(--border)', background: 'var(--surface)', flexShrink: 0 }}>
          <CalcPanel />
        </div>
      </div>
    </div>
  )
}
