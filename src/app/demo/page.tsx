'use client'

import { useState, useCallback, useEffect } from 'react'
import { useDesignStore } from '@/lib/store/designStore'
import { textToMatrix } from '@/lib/pegplan/parser'
import IdentityForm from '@/components/design/IdentityForm'
import WarpSystemForm from '@/components/design/WarpSystemForm'
import WeftForm from '@/components/design/WeftForm'
import LoomForm from '@/components/design/LoomForm'
import CalcPanel from '@/components/design/CalcPanel'
import PegPlanEditor from '@/components/design/PegPlanEditor'
import SimulationExport from '@/components/outputs/SimulationExport'
import DesignLibrary from '@/components/design/DesignLibrary'
import BorderForm from '@/components/design/BorderForm'
import MachineExportPanel from '@/components/outputs/MachineExport'
import SimulationAssistantUI from '@/components/analysis/SimulationAssistant'
import DraftAnalysisTool from '@/components/analysis/DraftAnalysisTool'
import WeftSequencePlan from '@/components/design/WeftSequencePlan'

type DemoTab = 'Identity' | 'Warp' | 'Weft' | 'Loom' | 'Border'

const NAV_TABS: { id: DemoTab; label: string }[] = [
  { id: 'Identity', label: 'Identity' },
  { id: 'Warp',     label: 'Warp'     },
  { id: 'Weft',     label: 'Weft'     },
  { id: 'Loom',     label: 'Loom'     },
  { id: 'Border',   label: 'Border'   },
]

export default function DemoPage() {
  const [activeTab, setActiveTab] = useState<DemoTab>('Weft')
  const [centerMode, setCenterMode] = useState<'predefined' | 'design-library' | 'draft-to-peg' | 'peg-to-draft'>('predefined')
  const [initialized, setInitialized] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const store = useDesignStore()

  useEffect(() => {
    if (initialized) return
    const { updateIdentity, setPegPlan, recalculate } = useDesignStore.getState()
    updateIdentity({ design_name: 'Pattu Dobby Saree', design_number: 'SD-2025-001' })
    const defaultPegText = `1-->1,3,5,7,9,11,13,15\n2-->2,4,6,8,10,12,14,16\n3-->1,3,5,7,9,11,13,15\n4-->2,4,6,8,10,12,14,16\n5-->1,2,5,6,9,10,13,14\n6-->3,4,7,8,11,12,15,16\n7-->1,2,5,6,9,10,13,14\n8-->3,4,7,8,11,12,15,16`
    const defaultMatrix = textToMatrix(defaultPegText, 16)
    setPegPlan(defaultPegText, defaultMatrix)
    recalculate()
    setInitialized(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handlePegPlanChange = useCallback((text: string, matrix: number[][]) => {
    store.setPegPlan(text, matrix); store.recalculate()
  }, [store])

  const shaftCount = store.shaftCount

  const SHAFT_OPTIONS = [4, 8, 12, 16, 24]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--bg)', overflow: 'hidden' }}>

      {/* ═══ HEADER — Apple-style glass bar ═══ */}
      <header style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 20px',
        height: 52,
        background: 'rgba(255,255,255,0.88)',
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        borderBottom: '1px solid rgba(0,0,0,0.07)',
        flexShrink: 0,
        zIndex: 100,
      }}>
        {/* Left — Logo + Project */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Mobile hamburger */}
          <button
            className="lg:hidden"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            style={{
              width: 32, height: 32, borderRadius: 8,
              background: 'rgba(0,0,0,0.05)',
              border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--text-2)', fontSize: 16,
            }}
          >
            ☰
          </button>

          {/* Logo mark */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <img
              src="/fabricai-logo.png"
              alt="FabricAI"
              style={{ width: 34, height: 34, display: 'block', objectFit: 'contain' }}
            />
            <div>
              <div style={{
                fontSize: 19, fontWeight: 800,
                letterSpacing: '-0.04em', lineHeight: 1.1,
              }}>
                <span style={{ color: '#1D1D1F' }}>Fabric</span>
                <span style={{ color: '#E0115F' }}>AI</span>
                <span style={{ color: '#1D1D1F' }}> Studio</span>
              </div>
              <div style={{
                fontSize: 8, fontWeight: 600,
                color: '#8E8E93',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                marginTop: 2,
              }}>
                Industrial Textile Engineering
              </div>
            </div>
          </div>
        </div>

        {/* Right — Actions */}
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <span className="hidden sm:inline-block" style={{
            padding: '3px 9px',
            fontSize: 10, fontWeight: 700,
            color: '#fff',
            background: 'linear-gradient(135deg, #E0115F, #C00E52)',
            borderRadius: 99,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
          }}>
            Demo
          </span>
          <button
            onClick={() => import('@/components/outputs/PDFExport').then(m => m.downloadPDF())}
            style={{
              height: 32, padding: '0 12px',
              background: '#E0115F',
              color: '#fff', border: 'none',
              borderRadius: 8, cursor: 'pointer',
              fontSize: 12, fontWeight: 600,
              display: 'flex', alignItems: 'center', gap: 5,
              letterSpacing: '-0.01em',
              transition: 'all 0.18s ease',
              boxShadow: '0 2px 10px rgba(224,17,95,0.30)',
              whiteSpace: 'nowrap' as const,
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            <span className="hidden sm:inline">Export PDF</span>
            <span className="sm:hidden">PDF</span>
          </button>
        </div>
      </header>

      {/* ═══ BODY ═══ */}
      <div className="flex flex-col lg:flex-row" style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>

        {/* Mobile overlay */}
        {isMobileMenuOpen && (
          <div
            className="lg:hidden fixed inset-0 z-40"
            style={{ background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(2px)' }}
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}

        {/* ═══ LEFT SIDEBAR ═══ */}
        <div className={`
          absolute lg:relative z-50 h-full
          w-[288px] lg:w-[272px]
          transition-transform duration-300 ease-in-out
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          flex flex-col
        `} style={{
          background: 'var(--surface)',
          borderRight: '1px solid var(--border-light)',
          flexShrink: 0,
        }}>

          {/* Sidebar Tab Bar */}
          <div style={{
            display: 'flex',
            padding: '8px 10px',
            gap: 4,
            borderBottom: '1px solid var(--border-light)',
            background: 'var(--surface)',
            flexShrink: 0,
            overflowX: 'auto',
          }}>
            {NAV_TABS.map(({ id, label }) => (
              <button
                key={id}
                onClick={() => { setActiveTab(id); setIsMobileMenuOpen(false) }}
                style={{
                  flex: 1,
                  padding: '6px 6px',
                  fontSize: 12,
                  fontWeight: activeTab === id ? 700 : 500,
                  color: activeTab === id ? 'var(--accent)' : 'var(--text-3)',
                  background: activeTab === id ? 'var(--accent-light)' : 'transparent',
                  border: activeTab === id ? '1px solid rgba(224,17,95,0.2)' : '1px solid transparent',
                  borderRadius: 8,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  whiteSpace: 'nowrap',
                  letterSpacing: '-0.01em',
                  minWidth: 0,
                }}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Sidebar Content */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px 14px' }}>
            {activeTab === 'Identity'  && <IdentityForm />}
            {activeTab === 'Warp'      && <WarpSystemForm />}
            {activeTab === 'Weft'      && <WeftForm />}
            {activeTab === 'Loom'      && <LoomForm />}
            {activeTab === 'Border'    && <BorderForm />}
          </div>
        </div>

        {/* ═══ CENTER WORKSPACE ═══ */}
        <div className="flex-1 min-w-0" style={{ overflowY: 'auto', overflowX: 'hidden', padding: '12px 12px' }}>
          <div className="flex flex-col gap-4 w-full min-h-full">

            {/* ── Segmented Control — horizontally scrollable on mobile ── */}
            <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 4, paddingBottom: 4 }}>
              <div style={{
                overflowX: 'auto',
                WebkitOverflowScrolling: 'touch' as any,
                scrollbarWidth: 'none' as any,
                msOverflowStyle: 'none' as any,
                maxWidth: '100%',
              }}>
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 2,
                  padding: '3px',
                  background: 'rgba(118,118,128,0.12)',
                  backdropFilter: 'blur(20px) saturate(180%)',
                  WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                  borderRadius: 11,
                  border: '0.5px solid rgba(0,0,0,0.07)',
                }}>
                {([
                  {
                    id: 'predefined' as const,
                    label: 'Predefined',
                    svg: (
                      // Weave grid — 3×3 alternating filled squares
                      <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect x="1" y="1" width="4" height="4" rx="0.8" fill="currentColor"/>
                        <rect x="1" y="10" width="4" height="4" rx="0.8" fill="currentColor"/>
                        <rect x="10" y="1" width="4" height="4" rx="0.8" fill="currentColor"/>
                        <rect x="10" y="10" width="4" height="4" rx="0.8" fill="currentColor"/>
                        <rect x="5.5" y="5.5" width="4" height="4" rx="0.8" fill="currentColor" opacity="0.4"/>
                        <rect x="1" y="5.5" width="4" height="4" rx="0.8" fill="currentColor" opacity="0.2"/>
                        <rect x="10" y="5.5" width="4" height="4" rx="0.8" fill="currentColor" opacity="0.2"/>
                        <rect x="5.5" y="1" width="4" height="4" rx="0.8" fill="currentColor" opacity="0.2"/>
                        <rect x="5.5" y="10" width="4" height="4" rx="0.8" fill="currentColor" opacity="0.2"/>
                      </svg>
                    ),
                  },
                  {
                    id: 'design-library' as const,
                    label: 'Design Library',
                    svg: (
                      // Stacked layers / library shelves
                      <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect x="1" y="2" width="13" height="2.8" rx="1.2" fill="currentColor"/>
                        <rect x="1" y="6.1" width="13" height="2.8" rx="1.2" fill="currentColor" opacity="0.6"/>
                        <rect x="1" y="10.2" width="13" height="2.8" rx="1.2" fill="currentColor" opacity="0.3"/>
                      </svg>
                    ),
                  },
                  {
                    id: 'draft-to-peg' as const,
                    label: 'Draft → Peg',
                    svg: (
                      // Two rows collapsing into one — Draft → Peg compression
                      <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect x="1" y="1.5" width="5.5" height="2" rx="1" fill="currentColor" opacity="0.5"/>
                        <rect x="8.5" y="1.5" width="5.5" height="2" rx="1" fill="currentColor" opacity="0.5"/>
                        <path d="M4 3.5 L7.5 7.5 L11 3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                        <rect x="3" y="11.5" width="9" height="2" rx="1" fill="currentColor"/>
                      </svg>
                    ),
                  },
                  {
                    id: 'peg-to-draft' as const,
                    label: 'Peg → Draft',
                    svg: (
                      // One row expanding into two — Peg → Draft expansion
                      <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect x="3" y="1.5" width="9" height="2" rx="1" fill="currentColor"/>
                        <path d="M4 7.5 L7.5 3.5 L11 7.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                        <rect x="1" y="11.5" width="5.5" height="2" rx="1" fill="currentColor" opacity="0.5"/>
                        <rect x="8.5" y="11.5" width="5.5" height="2" rx="1" fill="currentColor" opacity="0.5"/>
                      </svg>
                    ),
                  },
                ] as const).map(({ id, label, svg }) => {
                  const active = centerMode === id
                  return (
                    <button
                      key={id}
                      onClick={() => setCenterMode(id)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 5,
                        padding: '6px 10px',
                        fontSize: 12,
                        fontWeight: active ? 600 : 400,
                        letterSpacing: '-0.015em',
                        color: active ? 'var(--text-1)' : 'var(--text-3)',
                        background: active ? '#ffffff' : 'transparent',
                        border: 'none',
                        borderRadius: 8,
                        cursor: 'pointer',
                        whiteSpace: 'nowrap' as const,
                        transition: 'color 0.18s ease, background 0.18s ease, box-shadow 0.18s ease',
                        boxShadow: active
                          ? '0 1px 5px rgba(0,0,0,0.14), 0 0.5px 1.5px rgba(0,0,0,0.10)'
                          : 'none',
                        userSelect: 'none' as const,
                      }}
                    >
                      <span style={{
                        lineHeight: 0,
                        display: 'inline-flex',
                        alignItems: 'center',
                        opacity: active ? 1 : 0.5,
                        color: active ? 'var(--accent)' : 'var(--text-3)',
                      }}>
                        {svg}
                      </span>
                      {label}
                    </button>
                  )
                })}
              </div>
              </div>
            </div>

            {/* ── PLACEHOLDER PANELS ── */}
            {centerMode === 'draft-to-peg' && (
              <div style={{
                flex: 1, display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                gap: 16, padding: '60px 24px',
                background: 'var(--surface)',
                border: '1px solid var(--border-light)',
                borderRadius: 16, boxShadow: 'var(--shadow-xs)',
              }}>
                <div style={{
                  width: 56, height: 56, borderRadius: 16,
                  background: 'linear-gradient(145deg, #E0115F22, #E0115F44)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 26,
                }}>
                  ↓
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-1)', letterSpacing: '-0.02em' }}>Draft → Peg</div>
                  <div style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 6, maxWidth: 320, lineHeight: 1.5 }}>
                    Convert a threading draft into a peg plan automatically. Coming soon.
                  </div>
                </div>
              </div>
            )}

            {centerMode === 'peg-to-draft' && (
              <div style={{
                flex: 1, display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                gap: 16, padding: '60px 24px',
                background: 'var(--surface)',
                border: '1px solid var(--border-light)',
                borderRadius: 16, boxShadow: 'var(--shadow-xs)',
              }}>
                <div style={{
                  width: 56, height: 56, borderRadius: 16,
                  background: 'linear-gradient(145deg, #34C75922, #34C75944)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 26,
                }}>
                  ↑
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-1)', letterSpacing: '-0.02em' }}>Peg → Draft</div>
                  <div style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 6, maxWidth: 320, lineHeight: 1.5 }}>
                    Reverse-engineer a threading draft from an existing peg plan. Coming soon.
                  </div>
                </div>
              </div>
            )}

            {centerMode === 'predefined' && <>
            {/* ── 1. PEG PLAN EDITOR ── */}
            <div className="card">
              <div style={{ marginBottom: 14 }}>
                {/* Title row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-1)', letterSpacing: '-0.01em' }}>
                    Peg Plan — Bidirectional Editor
                  </h3>
                  <span style={{
                    fontSize: 10, fontWeight: 600,
                    color: 'var(--green)',
                    background: 'rgba(52,199,89,0.10)',
                    padding: '2px 7px', borderRadius: 99,
                    letterSpacing: '0.02em',
                  }}>LIVE</span>
                </div>

                {/* Shaft selector row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-3)', letterSpacing: '-0.01em' }}>
                    Shafts
                  </span>
                  {/* Preset buttons */}
                  <div style={{
                    display: 'flex',
                    background: 'rgba(0,0,0,0.05)',
                    borderRadius: 9, padding: 3, gap: 2,
                  }}>
                    {SHAFT_OPTIONS.map(n => {
                      const active = shaftCount === n
                      return (
                        <button
                          key={n}
                          onClick={() => store.setShaftCount(n)}
                          style={{
                            minWidth: 34, height: 26,
                            padding: '0 8px',
                            fontSize: 12, fontWeight: active ? 700 : 500,
                            color: active ? '#fff' : 'var(--text-3)',
                            background: active ? 'var(--accent)' : 'transparent',
                            border: 'none', borderRadius: 7,
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                            boxShadow: active ? '0 1px 6px rgba(224,17,95,0.30)' : 'none',
                            letterSpacing: '-0.02em',
                          }}
                        >
                          {n}
                        </button>
                      )
                    })}
                  </div>
                  {/* Custom input */}
                  <input
                    type="number"
                    min={2} max={32} step={2}
                    value={shaftCount}
                    onChange={e => {
                      const v = parseInt(e.target.value)
                      if (!isNaN(v) && v >= 2 && v <= 32) store.setShaftCount(v)
                    }}
                    style={{
                      width: 52, height: 26,
                      fontSize: 12, fontWeight: 600,
                      textAlign: 'center',
                      padding: '0 4px', borderRadius: 8,
                      border: '1px solid var(--border)',
                      background: 'var(--bg)',
                      color: 'var(--text-1)',
                    }}
                  />
                  <span style={{ fontSize: 12, color: 'var(--text-4)', letterSpacing: '-0.005em' }}>
                    Click cells to toggle · Text syncs automatically
                  </span>
                </div>
              </div>
              <PegPlanEditor shaftCount={shaftCount} onChange={handlePegPlanChange} initialText={store.pegPlanText} />
            </div>

            {/* ── 2. DRAFT ANALYSIS ── */}
            <div className="card">
              <DraftAnalysisTool />
            </div>

            {/* ── 3. WEFT SEQUENCE PLAN ── */}
            <div className="card">
              <WeftSequencePlan />
            </div>

            {/* ── 4. FABRIC SIMULATION ── */}
            <div className="card">
              <div style={{ marginBottom: 18 }}>
                <h3 style={{
                  fontSize: 13, fontWeight: 700,
                  color: 'var(--text-1)', letterSpacing: '-0.01em',
                }}>Fabric Simulation</h3>
                <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 3 }}>
                  Real-time weave structure preview
                </div>
              </div>
              <SimulationExport
                matrix={store.weaveMatrix.length > 0 ? store.weaveMatrix : store.pegPlanMatrix}
                warpColor={
                  store.warpSystem.yarns[0]?.colour_hex ||
                  store.warp?.colour_hex ||
                  store.warp?.colour_code ||
                  '#1B3A6B'
                }
                weftColor={
                  store.weftSystem.yarns[0]?.colour_hex ||
                  store.weftSystem.yarns[0]?.colour_code ||
                  '#E8A838'
                }
                designName={store.identity.design_name || 'Design'}
              />
            </div>

            {/* ── 4. STATUS FOOTER ── */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: 8,
              flexShrink: 0,
            }} className="sm:grid-cols-3 lg:grid-cols-5">
              {[
                {
                  label: 'Warp',
                  value: `${store.warp?.count_value || 75}${store.warp?.count_system === 'denier' ? 'D' : 'Ne'}`,
                  sub: store.warp?.material === 'polyester' ? 'Polyester'
                    : store.warp?.material === 'cotton' ? 'Cotton'
                    : store.warp?.material || 'Polyester',
                },
                {
                  label: 'Main Weft',
                  value: `${store.weftSystem.yarns[0]?.count_value || '--'}${store.weftSystem.yarns[0]?.count_system === 'ne' ? 'Ne' : 'D'}`,
                  sub: store.weftSystem.yarns[0]?.material || '--',
                },
                {
                  label: 'Extra Yarns',
                  value: `${Math.max(store.weftSystem.yarns.length - 1, 0)}`,
                  sub: 'yarns',
                },
                {
                  label: 'Machine',
                  value: store.loom?.machine_type === 'rapier' ? 'Rapier'
                    : store.loom?.machine_type === 'air_jet' ? 'Air Jet'
                    : store.loom?.machine_type === 'water_jet' ? 'Water Jet' : 'Rapier',
                  sub: `${store.loom?.machine_rpm || 500} RPM`,
                },
                { label: 'Mode', value: 'Advanced', sub: 'system' },
              ].map(({ label, value, sub }) => (
                <div key={label} style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border-light)',
                  borderRadius: 12,
                  padding: '11px 14px',
                  boxShadow: 'var(--shadow-xs)',
                }}>
                  <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 3 }}>
                    {label}
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-1)', letterSpacing: '-0.02em' }}>
                    {value}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 1, textTransform: 'capitalize' }}>
                    {sub}
                  </div>
                </div>
              ))}
            </div>

            {/* Mobile CalcPanel */}
            <div className="lg:hidden w-full rounded-2xl overflow-hidden mt-1" style={{
              border: '1px solid var(--border-light)',
              background: 'var(--surface)',
              boxShadow: 'var(--shadow-sm)',
              flexShrink: 0,
            }}>
              <CalcPanel />
            </div>
            </> /* end predefined */}

            {centerMode === 'design-library' && (
              <DesignLibrary onLoadDesign={() => setCenterMode('predefined')} />
            )}

            {centerMode === 'draft-to-peg' && (
              <div className="card text-center" style={{ padding: '60px 20px', color: 'var(--text-3)' }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>↓</div>
                <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-1)', marginBottom: 8 }}>Draft to Peg Conversion</h3>
                <p style={{ fontSize: 13 }}>Mathematical conversion engine in development.</p>
              </div>
            )}

            {centerMode === 'peg-to-draft' && (
              <div className="card text-center" style={{ padding: '60px 20px', color: 'var(--text-3)' }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>↑</div>
                <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-1)', marginBottom: 8 }}>Peg to Draft Conversion</h3>
                <p style={{ fontSize: 13 }}>Mathematical conversion engine in development.</p>
              </div>
            )}
          </div>
        </div>

        {/* ═══ RIGHT SIDEBAR — Live Calculations ═══ */}
        <div className="hidden lg:block lg:shrink-0" style={{
          width: 260,
          borderLeft: '1px solid var(--border-light)',
          background: 'var(--surface)',
          overflowY: 'auto',
        }}>
          <CalcPanel />
        </div>
      </div>
    </div>
  )
}
