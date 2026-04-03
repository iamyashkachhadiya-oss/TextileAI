'use client'

import { use, useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useDesignStore } from '@/lib/store/designStore'
import IdentityForm from '@/components/design/IdentityForm'
import WarpForm from '@/components/design/WarpForm'
import WarpSystemForm from '@/components/design/WarpSystemForm'
import WeftForm from '@/components/design/WeftForm'
import LoomForm from '@/components/design/LoomForm'
import CalcPanel from '@/components/design/CalcPanel'

import SimulationPanel from '@/components/design/SimulationPanel'
import PegPlanEditor from '@/components/design/PegPlanEditor'
import BorderForm from '@/components/design/BorderForm'
import VariantsPanel from '@/components/design/VariantsPanel'
import SimulationPreview from '@/components/outputs/SimulationExport'

type DesignTab = 'Identity' | 'Warp' | 'WarpSystem' | 'Weft' | 'Loom' | 'Border' | 'AI'

export default function DesignPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<DesignTab>('Identity')
  const store = useDesignStore()
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Load design on mount
  useEffect(() => {
    store.loadFromSupabase(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  // Auto-save with 2s debounce when isDirty
  useEffect(() => {
    if (!store.isDirty) return
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      store.saveToSupabase()
    }, 2000)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store.isDirty, store.identity, store.warp, store.weftSystem, store.loom, store.pegPlanText])

  const handlePegPlanChange = useCallback((text: string, matrix: number[][]) => {
    store.setPegPlan(text, matrix)
  }, [store])

  const handleSwitchDesign = useCallback((designId: string) => {
    router.push(`/design/${designId}`)
  }, [router])

  const tabs: DesignTab[] = ['Identity', 'Warp', 'WarpSystem', 'Weft', 'Loom', 'Border', 'AI']

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--bg)' }}>
      {/* Header */}
      <header style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 24px', height: 52, borderBottom: '1px solid var(--border)',
        background: 'var(--surface)', flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={() => router.push('/dashboard')}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--text-2)', fontSize: 14, display: 'flex', alignItems: 'center', gap: 4,
              fontFamily: 'var(--font-body)',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M10 4L6 8l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            Back
          </button>
          <div style={{ width: 1, height: 20, background: 'var(--border)' }} />
          <div style={{
            width: 28, height: 28, borderRadius: 7,
            background: 'linear-gradient(145deg, #1B1F3B, #2A2F52)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ color: 'white', fontSize: 14, fontWeight: 700, fontFamily: 'serif' }}>ƒ</span>
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-1)' }}>
              {store.identity.design_name || 'Untitled Design'}
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-3)' }}>
              {store.identity.design_number}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {store.isDirty && (
            <span style={{ fontSize: 11, color: 'var(--text-3)' }}>
              {store.isSaving ? 'Saving…' : 'Unsaved changes'}
            </span>
          )}
          <button
            onClick={() => store.saveToSupabase()}
            className="btn-secondary"
            style={{ fontSize: 12 }}
          >
            Save
          </button>
          <PDFButton />
        </div>
      </header>

      {/* Main Content */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Left Panel — Forms */}
        <div style={{
          width: 420, flexShrink: 0, borderRight: '1px solid var(--border)',
          display: 'flex', flexDirection: 'column', background: 'var(--surface)',
        }}>
          {/* Tabs */}
          <div className="tab-bar" style={{ padding: '0 16px', flexShrink: 0 }}>
            {tabs.map((tab) => (
              <button
                key={tab}
                className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab === 'WarpSystem' ? 'Warp+' : tab}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
            {activeTab === 'Identity' && <IdentityForm />}
            {activeTab === 'Warp' && <WarpForm />}
            {activeTab === 'WarpSystem' && <WarpSystemForm />}
            {activeTab === 'Weft' && <WeftForm />}
            {activeTab === 'Loom' && <LoomForm />}
            {activeTab === 'Border' && <BorderForm />}
            {activeTab === 'AI' && <SimulationPanel />}
          </div>
        </div>

        {/* Center — Canvas + Variants */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Variants Panel */}
          {store.draftId && (
            <div className="card">
              <VariantsPanel
                draftId={store.draftId}
                currentDesignId={id}
                shaftCount={16}
                onSwitchDesign={handleSwitchDesign}
              />
            </div>
          )}

          {/* Peg Plan Visual (large view) - Conditional Visibility */}
          {(activeTab === 'Identity' || activeTab === 'Weft') && (
            <div className="card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <div className="section-header" style={{ marginBottom: 0 }}>Peg Plan — Sequence Editor</div>
              </div>
              <PegPlanEditor
                shaftCount={16}
                onChange={handlePegPlanChange}
                initialText={store.pegPlanText}
              />
            </div>
          )}

          {/* Border Preview Section */}
          {activeTab === 'Border' && (
            <div className="card">
              <div className="section-header">Border Configuration Preview</div>
              <div style={{ 
                height: 320, background: 'var(--bg-darker)', borderRadius: 8, 
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '1px dashed var(--border)'
              }}>
                <div style={{ textAlign: 'center', color: 'var(--text-3)' }}>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>🧵</div>
                  <div style={{ fontWeight: 600 }}>Border & Selvedge Layout</div>
                  <div style={{ fontSize: 12 }}>Visualizing shaft assignments for border weaves</div>
                </div>
              </div>
            </div>
          )}

          {/* Simulation Preview */}
          <div className="card">
            <div className="section-header">Fabric Simulation</div>
            <SimulationPreview
              matrix={store.pegPlanMatrix}
              warpColor={store.warp?.colour_code || '#1B1F3B'}
              weftColor={store.weftSystem.yarns[0]?.colour_hex || '#E8A838'}
              designName={store.identity.design_name || 'design'}
            />
          </div>



          {/* Fabric Output Simulation Engine */}
          <div className="card">
            <div className="section-header">Fabric Output Simulation Engine</div>
            <SimulationPanel />
          </div>
        </div>

        {/* Right — CalcPanel */}
        <div style={{
          borderLeft: '1px solid var(--border)',
          background: 'var(--surface)',
          flexShrink: 0,
        }}>
          <CalcPanel />
        </div>
      </div>
    </div>
  )
}

function PDFButton() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  if (!mounted) return null

  return (
    <button
      onClick={() => {
        // Dynamic import for PDF to avoid SSR issues
        import('@/components/outputs/PDFExport').then((mod) => {
          mod.downloadPDF()
        })
      }}
      className="btn-accent"
      style={{ fontSize: 12, height: 36, padding: '0 16px' }}
    >
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <path d="M7 1v8M4 6l3 3 3-3M2 11h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
      Download PDF
    </button>
  )
}
