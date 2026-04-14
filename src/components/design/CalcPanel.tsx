'use client'

import { useDesignStore } from '@/lib/store/designStore'

export default function CalcPanel() {
  const calcOutputs      = useDesignStore((s) => s.calcOutputs)
  const weftSystem       = useDesignStore((s) => s.weftSystem)
  const borderShaftsUsed = useDesignStore((s) => s.borderShaftsUsed)
  const borderEnds       = useDesignStore((s) => s.borderEnds)
  const shaftCount       = useDesignStore((s) => s.shaftCount)

  if (!calcOutputs) {
    return (
      <div style={{
        padding: 24,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        color: 'var(--text-3)',
        fontSize: 13,
        lineHeight: 1.6,
        gap: 8,
        minHeight: 200,
      }}>
        <div style={{ fontSize: 28, marginBottom: 4 }}>📐</div>
        <div style={{ fontWeight: 500, color: 'var(--text-2)' }}>No data yet</div>
        <div style={{ fontSize: 12 }}>Fill in yarn + loom specs to see calculations</div>
      </div>
    )
  }

  return (
    <div style={{
      padding: '18px 14px',
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 7,
        marginBottom: 4,
      }}>
        <div style={{
          fontSize: 11, fontWeight: 600,
          letterSpacing: '0.07em',
          textTransform: 'uppercase',
          color: 'var(--text-3)',
        }}>
          Live Calculations
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span className="pulse-indicator" style={{
            width: 5, height: 5, borderRadius: '50%',
            background: 'var(--green)', display: 'inline-block',
          }} />
          <span style={{ fontSize: 10, color: 'var(--green)', fontWeight: 600 }}>Live</span>
        </div>
      </div>

      {/* GSM — Hero Metric */}
      <div style={{
        background: 'linear-gradient(135deg, #E0115F14 0%, #E0115F06 100%)',
        border: '1px solid rgba(224,17,95,0.14)',
        borderRadius: 14,
        padding: '16px 16px',
      }}>
        <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
          GSM
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
          <span style={{ fontSize: 40, fontWeight: 700, color: 'var(--accent)', letterSpacing: '-0.03em', lineHeight: 1 }}>
            {calcOutputs.gsm.toFixed(1)}
          </span>
          <span style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 500, opacity: 0.7 }}>g/m²</span>
        </div>
      </div>

      {/* Key metrics row */}
      {/* Border Impact card — only shown when border has been compiled */}
      {borderShaftsUsed > 0 && (
        <div style={{
          background: 'linear-gradient(135deg, #FF660014 0%, #EA580C08 100%)',
          border: '1px solid rgba(234,88,12,0.18)',
          borderRadius: 14, padding: '14px 16px',
        }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#C2410C',
            textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
            🧵 Border Impact
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
            {/* Shaft budget split */}
            <div style={{ background: '#FFF7ED', border: '1px solid #FED7AA',
              borderRadius: 10, padding: '9px 11px' }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: '#EA580C',
                textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
                Border Shafts
              </div>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#C2410C',
                letterSpacing: '-0.02em', lineHeight: 1 }}>
                {borderShaftsUsed}
                <span style={{ fontSize: 10, fontWeight: 500, color: '#EA580C' }}>
                  /{shaftCount}
                </span>
              </div>
            </div>
            <div style={{
              background: borderShaftsUsed > shaftCount
                ? '#FEF2F2' : 'rgba(224,17,95,0.06)',
              border: `1px solid ${borderShaftsUsed > shaftCount ? '#FCA5A5' : 'var(--accent-ring)'}`,
              borderRadius: 10, padding: '9px 11px',
            }}>
              <div style={{ fontSize: 9, fontWeight: 700,
                color: borderShaftsUsed > shaftCount ? 'var(--red)' : 'var(--accent)',
                textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
                Body Budget
              </div>
              <div style={{ fontSize: 20, fontWeight: 800,
                color: borderShaftsUsed > shaftCount ? 'var(--red)' : 'var(--accent)',
                letterSpacing: '-0.02em', lineHeight: 1 }}>
                {Math.max(0, shaftCount - borderShaftsUsed)}
                <span style={{ fontSize: 10, fontWeight: 500, opacity: 0.65 }}> shafts</span>
              </div>
            </div>
          </div>
          {/* Ends split */}
          {calcOutputs && borderEnds > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <div style={{ background: '#FFF7ED', border: '1px solid #FED7AA',
                borderRadius: 10, padding: '9px 11px' }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: '#EA580C',
                  textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
                  Border Ends
                </div>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#C2410C',
                  letterSpacing: '-0.02em' }}>
                  {borderEnds.toLocaleString()}
                </div>
              </div>
              <div style={{ background: 'rgba(224,17,95,0.06)', border: '1px solid var(--accent-ring)',
                borderRadius: 10, padding: '9px 11px' }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--accent)',
                  textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
                  Body Ends
                </div>
                <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--accent)',
                  letterSpacing: '-0.02em' }}>
                  {Math.max(0, calcOutputs.total_warp_ends - borderEnds).toLocaleString()}
                </div>
              </div>
            </div>
          )}
          {borderShaftsUsed > shaftCount && (
            <div style={{ marginTop: 10, fontSize: 11, color: 'var(--red)', fontWeight: 600,
              padding: '7px 10px', background: '#FEF2F2', borderRadius: 8, border: '1px solid #FCA5A5' }}>
              ⚠ Border exceeds loom shaft capacity! Increase shaft count in Peg Plan or simplify border weaves.
            </div>
          )}
          {borderShaftsUsed <= shaftCount && borderShaftsUsed > shaftCount * 0.6 && (
            <div style={{ marginTop: 10, fontSize: 11, color: '#92400E',
              padding: '7px 10px', background: '#FFFBEB', borderRadius: 8, border: '1px solid #FDE68A' }}>
              ⚠ Border is using {Math.round((borderShaftsUsed / shaftCount) * 100)}% of available shafts — body design is heavily constrained.
            </div>
          )}
        </div>
      )}

      {/* EPI */}
      <MetricCard label="ENDS PER INCH" value={String(calcOutputs.epi)} />
      <MetricCard label="PRODUCTION" value={calcOutputs.production_m_per_hr.toFixed(2)} unit="m/hr" />

      {/* 2-col grids */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <MetricSmall label="REED SPACE" value={calcOutputs.reed_space_inches.toFixed(1)} unit="in" />
        <MetricSmall label="TOTAL ENDS" value={calcOutputs.total_warp_ends.toLocaleString()} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <MetricSmall label="LINEAR WT" value={calcOutputs.linear_meter_weight_g.toFixed(1)} unit="g/m" />
        <MetricSmall label="OZ/YD²" value={calcOutputs.oz_per_sq_yard.toFixed(2)} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <MetricSmall label="WARP WT" value={calcOutputs.warp_weight_per_100m_g.toFixed(0)} unit="g/100m" />
        <MetricSmall label="WEFT WT" value={calcOutputs.weft_weight_per_100m_g.toFixed(0)} unit="g/100m" />
      </div>

      {/* Weft breakdown */}
      {calcOutputs.per_yarn_weft_weights && Object.keys(calcOutputs.per_yarn_weft_weights).length >= 1 && (
        <div style={{
          background: 'var(--bg)',
          border: '1px solid var(--border-light)',
          borderRadius: 12,
          padding: '13px 14px',
        }}>
          <div style={{
            fontSize: 10, fontWeight: 600, color: 'var(--text-3)',
            textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10,
          }}>
            Weft Breakdown
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            {Object.entries(calcOutputs.per_yarn_weft_weights).map(([id, weight], idx) => (
              <YarnWeightRow key={id} id={id} weight={weight} index={idx} />
            ))}
          </div>
        </div>
      )}

      {/* Warp consumed */}
      <div style={{
        background: 'var(--bg)',
        border: '1px solid var(--border-light)',
        borderRadius: 12,
        padding: '13px 14px',
      }}>
        <div style={{
          fontSize: 10, fontWeight: 600, color: 'var(--text-3)',
          textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 5,
        }}>
          Warp Consumed
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
          <span style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-1)', letterSpacing: '-0.02em' }}>
            {calcOutputs.warp_consumed_m_per_hr.toFixed(2)}
          </span>
          <span style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 500 }}>m/hr</span>
        </div>
      </div>
    </div>
  )
}

function MetricCard({ label, value, unit }: { label: string; value: string; unit?: string }) {
  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border-light)',
      borderRadius: 12,
      padding: '13px 14px',
    }}>
      <div style={{
        fontSize: 10, fontWeight: 600, color: 'var(--text-3)',
        textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 5,
      }}>
        {label}
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
        <span style={{
          fontSize: 28, fontWeight: 700,
          color: 'var(--text-1)',
          letterSpacing: '-0.03em', lineHeight: 1,
        }}>
          {value}
        </span>
        {unit && <span style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 500 }}>{unit}</span>}
      </div>
    </div>
  )
}

function MetricSmall({ label, value, unit }: { label: string; value: string; unit?: string }) {
  return (
    <div style={{
      background: 'var(--bg)',
      border: '1px solid var(--border-light)',
      borderRadius: 10,
      padding: '10px 11px',
    }}>
      <div style={{
        fontSize: 9, fontWeight: 600, color: 'var(--text-3)',
        textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4,
      }}>
        {label}
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 3 }}>
        <span style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-1)', letterSpacing: '-0.02em' }}>{value}</span>
        {unit && <span style={{ fontSize: 9, color: 'var(--text-3)', fontWeight: 500 }}>{unit}</span>}
      </div>
    </div>
  )
}

function YarnWeightRow({ id, weight, index }: { id: string; weight: number; index: number }) {
  const yarn = useDesignStore((s) => s.weftSystem.yarns.find((y) => y.id === id))
  if (!yarn) return null

  const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']
  const letter = letters[index] || String(index + 1)

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{
          width: 8, height: 8, borderRadius: '50%', background: yarn.colour_hex,
          boxShadow: `0 0 0 2px ${yarn.colour_hex}33`,
          flexShrink: 0,
        }} />
        <span style={{ color: 'var(--text-2)', fontWeight: 500, letterSpacing: '-0.01em' }}>
          {letter} — {yarn.label}
        </span>
      </div>
      <span style={{
        color: 'var(--text-1)', fontWeight: 700,
        fontFamily: 'var(--font-mono)', fontSize: 12,
      }}>
        {weight.toFixed(0)}<small style={{ fontWeight: 400, opacity: 0.5, fontSize: 10 }}>g</small>
      </span>
    </div>
  )
}
