'use client'

import { useDesignStore } from '@/lib/store/designStore'

export default function DraftAnalysisTool() {
  const store = useDesignStore()
  const { draftSequence, setDraftSequence } = store

  // Typically draft is equal to Weft picks, but for this simple grid we assume 16 ends.
  const ends = draftSequence.length || 16
  const shafts = 16

  const setDraftCell = (endIndex: number, shaftIndex: number) => {
    const newDraft = [...draftSequence]
    newDraft[endIndex] = shaftIndex
    setDraftSequence(newDraft)
  }

  const handleRandomDraft = () => {
    setDraftSequence(Array.from({ length: ends }, () => Math.floor(Math.random() * shafts) + 1))
  }

  const handleStraightDraft = () => {
    setDraftSequence(Array.from({ length: ends }, (_, i) => (i % shafts) + 1))
  }

  const handlePointedDraft = () => {
    const seq = []
    let dir = 1
    let curr = 1
    for (let i = 0; i < ends; i++) {
      seq.push(curr)
      if (curr === shafts) dir = -1
      if (curr === 1 && i > 0) dir = 1
      curr += dir
    }
    setDraftSequence(seq)
  }

  return (
    <div style={{ background: 'var(--surface)', color: 'var(--text-1)', borderRadius: 12, padding: 0, fontFamily: 'system-ui, sans-serif' }}>
      
      {/* Top Controls */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-1)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
          Interactive Draft Matrix
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={handleStraightDraft} className="btn-secondary" style={{ padding: '6px 12px', fontSize: 11 }}>Straight</button>
          <button onClick={handlePointedDraft} className="btn-secondary" style={{ padding: '6px 12px', fontSize: 11 }}>Pointed</button>
          <button onClick={handleRandomDraft} className="btn-secondary" style={{ padding: '6px 12px', fontSize: 11 }}>Random</button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 24 }}>
        
        {/* Threading Draft Grid */}
        <div style={{ flex: 1, border: '1px solid var(--border)', borderRadius: 8, padding: 16, overflowX: 'auto', background: 'var(--bg)' }}>
          <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-3)', letterSpacing: '0.05em', marginBottom: 16, textTransform: 'uppercase' }}>
            Threading Draft — Click to assign shaft
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: `30px repeat(${ends}, 24px)`, gap: 1 }}>
            {/* Header row */}
            <div style={{ background: 'var(--border-light)' }} />
            {Array.from({ length: ends }).map((_, c) => (
              <div key={c} style={{ background: 'var(--surface)', color: 'var(--text-2)', fontSize: 11, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', height: 24, border: '1px solid var(--border-light)' }}>
                {c + 1}
              </div>
            ))}
            
            {/* Grid rows */}
            {Array.from({ length: shafts }).map((_, r) => {
              const shaftNum = r + 1
              return (
                <div key={r} style={{ display: 'contents' }}>
                  <div style={{ background: 'var(--surface)', color: 'var(--text-2)', fontSize: 11, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', height: 24, border: '1px solid var(--border-light)' }}>
                    {shaftNum}
                  </div>
                  {Array.from({ length: ends }).map((_, c) => {
                    const isSelected = draftSequence[c] === shaftNum
                    return (
                      <div 
                        key={c}
                        onClick={() => setDraftCell(c, shaftNum)}
                        style={{ 
                          background: isSelected ? 'var(--primary)' : 'var(--surface)', 
                          border: '1px solid var(--border)', height: 24, cursor: 'pointer' 
                        }} 
                      />
                    )
                  })}
                </div>
              )
            })}
          </div>
        </div>

        {/* Draft Plan Text */}
        <div style={{ width: 280, border: '1px solid var(--border)', borderRadius: 8, padding: 16, flexShrink: 0, background: 'var(--bg)' }}>
          <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-3)', letterSpacing: '0.05em', marginBottom: 16, textTransform: 'uppercase' }}>
            Draft Sequence Array
          </div>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: 16, fontFamily: 'monospace', fontSize: 13, color: 'var(--text-1)', height: '100%', minHeight: 200, overflowY: 'auto', lineHeight: 1.6 }}>
            {draftSequence.map((sh, end) => (
              <div key={end}>Warp {end + 1} &rarr; Shaft {sh}</div>
            ))}
          </div>
        </div>

      </div>

    </div>
  )
}
