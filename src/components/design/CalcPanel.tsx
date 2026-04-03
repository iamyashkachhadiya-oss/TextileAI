'use client'

import { useDesignStore } from '@/lib/store/designStore'

export default function CalcPanel() {
  const calcOutputs = useDesignStore((s) => s.calcOutputs)
  const weftSystem = useDesignStore((s) => s.weftSystem)

  if (!calcOutputs) {
    return (
      <div style={{
        width: 280,
        flexShrink: 0,
        padding: 24,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        color: 'var(--text-3)',
        fontSize: 13,
        lineHeight: 1.5,
      }}>
        Fill in yarn + loom specs to see calculations
      </div>
    )
  }

  return (
    <div style={{
      width: 280,
      flexShrink: 0,
      padding: '20px 16px',
      overflowY: 'auto',
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
    }}>
      <div style={{
        fontSize: 11, fontWeight: 700, letterSpacing: '0.12em',
        textTransform: 'uppercase', color: '#888', marginBottom: 4,
      }}>
        LIVE CALCULATIONS
      </div>

      {/* GSM - Hero Metric */}
      <MetricCard
        label="GSM"
        value={calcOutputs.gsm.toFixed(1)}
        accent
      />

      {/* Ends Per Inch */}
      <MetricCard label="ENDS PER INCH" value={String(calcOutputs.epi)} />

      {/* Production */}
      <MetricCard label="PRODUCTION" value={calcOutputs.production_m_per_hr.toFixed(2)} unit="m/hr" />

      {/* Grid: Reed Space + Total Ends */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <MetricSmall label="REED SPACE" value={calcOutputs.reed_space_inches.toFixed(1)} unit="in" />
        <MetricSmall label="TOTAL ENDS" value={calcOutputs.total_warp_ends.toLocaleString()} />
      </div>

      {/* Grid: Linear Wt + Oz/Yd² */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <MetricSmall label="LINEAR WT" value={calcOutputs.linear_meter_weight_g.toFixed(1)} unit="g/m" />
        <MetricSmall label="OZ/YD²" value={calcOutputs.oz_per_sq_yard.toFixed(2)} />
      </div>

      {/* Grid: Warp Wt + Weft Wt */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <MetricSmall label="WARP WT" value={calcOutputs.warp_weight_per_100m_g.toFixed(0)} unit="g/100m" />
        <MetricSmall label="WEFT WT" value={calcOutputs.weft_weight_per_100m_g.toFixed(0)} unit="g/100m" />
      </div>

      {/* Weft Weight Breakdown */}
      {calcOutputs.per_yarn_weft_weights && Object.keys(calcOutputs.per_yarn_weft_weights).length >= 1 && (
        <div style={{
          padding: 14, background: '#FAFAF7', border: '1.5px solid var(--border-light)',
          borderRadius: 10,
        }}>
          <div style={{
            fontSize: 10, fontWeight: 700, color: '#888',
            textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10,
          }}>
            WEFT WEIGHT BREAKDOWN
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {Object.entries(calcOutputs.per_yarn_weft_weights).map(([id, weight], idx) => (
              <YarnWeightRow key={id} id={id} weight={weight} index={idx} />
            ))}
          </div>
        </div>
      )}

      {/* Warp Consumed */}
      <div style={{
        padding: 14, background: '#FAFAF7', border: '1.5px solid var(--border-light)',
        borderRadius: 10,
      }}>
        <div style={{
          fontSize: 10, fontWeight: 700, color: '#888',
          textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6,
        }}>
          WARP CONSUMED
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
          <span style={{ fontSize: 22, fontWeight: 700, color: 'var(--primary)' }}>
            {calcOutputs.warp_consumed_m_per_hr.toFixed(2)}
          </span>
          <span style={{ fontSize: 11, color: '#888', fontWeight: 500 }}>m/hr</span>
        </div>
      </div>

      {/* Live Indicator */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6,
        fontSize: 11, color: 'var(--text-3)',
        justifyContent: 'center',
        paddingTop: 4,
      }}>
        <span className="pulse-indicator" style={{
          width: 6, height: 6, borderRadius: '50%',
          background: '#4ADE80', display: 'inline-block',
        }} />
        Recalculated live
      </div>
    </div>
  )
}

function MetricCard({ label, value, unit, accent }: { label: string; value: string; unit?: string; accent?: boolean }) {
  return (
    <div style={{
      background: accent
        ? 'linear-gradient(135deg, rgba(232,168,56,0.08) 0%, rgba(232,168,56,0.02) 100%)'
        : '#FAFAF7',
      borderRadius: 10,
      padding: '14px 16px',
      border: accent ? '1.5px solid rgba(232,168,56,0.2)' : '1.5px solid var(--border-light)',
    }}>
      <div style={{
        fontSize: 10, fontWeight: 700, color: '#888',
        textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4,
      }}>
        {label}
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
        <span style={{
          fontSize: accent ? 36 : 28, fontWeight: 700,
          color: accent ? 'var(--accent)' : 'var(--primary)',
          letterSpacing: '-0.02em',
        }}>
          {value}
        </span>
        {unit && <span style={{ fontSize: 12, color: '#888', fontWeight: 500 }}>{unit}</span>}
      </div>
    </div>
  )
}

function MetricSmall({ label, value, unit }: { label: string; value: string; unit?: string }) {
  return (
    <div style={{
      background: '#FAFAF7',
      borderRadius: 8,
      padding: '10px 12px',
      border: '1.5px solid var(--border-light)',
    }}>
      <div style={{
        fontSize: 9, fontWeight: 700, color: '#888',
        textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4,
      }}>
        {label}
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 3 }}>
        <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--primary)' }}>{value}</span>
        {unit && <span style={{ fontSize: 10, color: '#888', fontWeight: 500 }}>{unit}</span>}
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
        }} />
        <span style={{ color: 'var(--text-2)', fontWeight: 500 }}>
          {letter} — {yarn.label}
        </span>
      </div>
      <span style={{
        color: 'var(--text-1)', fontWeight: 700, fontFamily: 'var(--font-mono)', fontSize: 13,
      }}>
        {weight.toFixed(0)}<small style={{ fontWeight: 400, opacity: 0.6, fontSize: 10 }}>g</small>
      </span>
    </div>
  )
}
