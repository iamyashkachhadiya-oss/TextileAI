'use client'

import { useState, useMemo, useCallback } from 'react'
import WeaveCanvas from '@/components/design/WeaveCanvas'

// Helper to generate all combinations (powerset)
function getCombinations(n: number) {
  const result: number[][] = []
  const total = Math.pow(2, n)
  for (let i = 1; i < total; i++) { // skip 0
    const current = []
    for (let j = 0; j < n; j++) {
      if ((i & (1 << j))) {
        current.push(j + 1)
      }
    }
    result.push(current)
  }
  // Sort by length, then by values
  return result.sort((a, b) => {
    if (a.length !== b.length) return a.length - b.length
    for (let k = 0; k < a.length; k++) {
      if (a[k] !== b[k]) return a[k] - b[k]
    }
    return 0
  })
}

export default function DraftAnalysisTool() {
  const [picks, setPicks] = useState(8)
  const [shafts, setShafts] = useState(8)
  const ends = shafts // usually square repeat

  // Array of size `ends`, where draft[i] is the shaft number for end `i` (1-indexed).
  // Default is straight draft: [1, 2, 3, 4, 5, 6, 7, 8]
  const [draftSeq, setDraftSeq] = useState<number[]>(
    Array.from({ length: 8 }, (_, i) => i + 1)
  )

  const [activeTab, setActiveTab] = useState<'All' | number>('All')

  // Peg plan builder: array of picks, each containing selected shafts
  const [builtPegPlan, setBuiltPegPlan] = useState<number[][]>(
    Array.from({ length: 8 }, () => [])
  )

  // Combinations
  const allCombos = useMemo(() => getCombinations(shafts), [shafts])
  
  const filteredCombos = useMemo(() => {
    if (activeTab === 'All') return allCombos
    return allCombos.filter(c => c.length === activeTab)
  }, [allCombos, activeTab])

  // Computed Weave Matrix (Picks x Ends)
  // Weave[pick][end] = 1 if the shaft for that end is lifted in that pick
  const weaveMatrix = useMemo(() => {
    const matrix: number[][] = []
    for (let p = 0; p < picks; p++) {
      const pickRow = []
      const liftedShafts = builtPegPlan[p] || []
      for (let e = 0; e < ends; e++) {
        const shaftAssigned = draftSeq[e]
        pickRow.push(liftedShafts.includes(shaftAssigned) ? 1 : 0)
      }
      matrix.push(pickRow)
    }
    return matrix
  }, [picks, ends, draftSeq, builtPegPlan])

  // Handlers
  const setDraftCell = (endIndex: number, shaftIndex: number) => {
    const newDraft = [...draftSeq]
    newDraft[endIndex] = shaftIndex
    setDraftSeq(newDraft)
  }

  const handleRandomDraft = () => {
    setDraftSeq(Array.from({ length: ends }, () => Math.floor(Math.random() * shafts) + 1))
  }

  const addToPegPlan = (combo: number[]) => {
    // Find first empty pick
    const emptyIndex = builtPegPlan.findIndex(p => p.length === 0)
    if (emptyIndex !== -1) {
      const newPlan = [...builtPegPlan]
      newPlan[emptyIndex] = combo
      setBuiltPegPlan(newPlan)
    } else {
      // Loop around
      const newPlan = [...builtPegPlan]
      newPlan.shift()
      newPlan.push(combo)
      setBuiltPegPlan(newPlan)
    }
  }

  const clearPegPlan = () => {
    setBuiltPegPlan(Array.from({ length: picks }, () => []))
  }

  const activePicksCount = builtPegPlan.filter(p => p.length > 0).length

  return (
    <div style={{ background: '#2E2D2B', color: '#E5E5E5', borderRadius: 12, padding: 24, fontFamily: 'system-ui, sans-serif' }}>
      
      {/* Top Controls */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 2fr', gap: 16, marginBottom: 24 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={{ fontSize: 11, fontWeight: 600, color: '#A0A0A5' }}>Picks</label>
          <select value={picks} onChange={e => setPicks(parseInt(e.target.value))} style={{ background: '#3A3937', color: 'white', border: '1px solid #555', borderRadius: 6, padding: '8px 12px', outline: 'none' }}>
            {[4, 8, 12, 16].map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={{ fontSize: 11, fontWeight: 600, color: '#A0A0A5' }}>Shafts</label>
          <select value={shafts} onChange={e => setShafts(parseInt(e.target.value))} style={{ background: '#3A3937', color: 'white', border: '1px solid #555', borderRadius: 6, padding: '8px 12px', outline: 'none' }}>
            {[4, 8, 12, 16].map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={{ fontSize: 11, fontWeight: 600, color: '#A0A0A5' }}>Draft Preset</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <select style={{ flex: 1, background: '#3A3937', color: 'white', border: '1px solid #555', borderRadius: 6, padding: '8px 12px', outline: 'none' }}>
              <option>Custom</option>
              <option>Straight</option>
              <option>Pointed</option>
            </select>
            <button onClick={handleRandomDraft} style={{ background: 'transparent', border: '1px solid #555', color: '#FFF', borderRadius: 6, padding: '0 16px', cursor: 'pointer' }}>Random draft</button>
            <button onClick={clearPegPlan} style={{ background: 'transparent', border: '1px solid #555', color: '#FFF', borderRadius: 6, padding: '0 16px', cursor: 'pointer' }}>Clear peg</button>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) minmax(300px, 1fr)', gap: 24, marginBottom: 24 }}>
        
        {/* Threading Draft Grid */}
        <div style={{ border: '1px solid #444', borderRadius: 8, padding: 16 }}>
          <div style={{ fontSize: 10, fontWeight: 800, color: '#AAA', letterSpacing: '0.05em', marginBottom: 16, textTransform: 'uppercase' }}>
            Threading Draft — Click to toggle
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: `30px repeat(${ends}, 24px)`, gap: 1 }}>
            {/* Header row */}
            <div style={{ background: '#3A3937' }} />
            {Array.from({ length: ends }).map((_, c) => (
              <div key={c} style={{ background: '#3A3937', color: '#CCC', fontSize: 11, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', height: 24 }}>
                {c + 1}
              </div>
            ))}
            
            {/* Grid rows */}
            {Array.from({ length: shafts }).map((_, r) => {
              const shaftNum = r + 1
              return (
                <div key={r} style={{ display: 'contents' }}>
                  <div style={{ background: '#3A3937', color: '#CCC', fontSize: 11, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', height: 24 }}>
                    {shaftNum}
                  </div>
                  {Array.from({ length: ends }).map((_, c) => {
                    const isSelected = draftSeq[c] === shaftNum
                    return (
                      <div 
                        key={c}
                        onClick={() => setDraftCell(c, shaftNum)}
                        style={{ 
                          background: isSelected ? '#1B1F3B' : '#FFF', 
                          border: '1px solid #EEE', height: 24, cursor: 'pointer' 
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
        <div style={{ border: '1px solid #444', borderRadius: 8, padding: 16 }}>
          <div style={{ fontSize: 10, fontWeight: 800, color: '#AAA', letterSpacing: '0.05em', marginBottom: 16, textTransform: 'uppercase' }}>
            Draft Plan Text
          </div>
          <div style={{ background: '#252525', border: '1px solid #333', borderRadius: 8, padding: 16, fontFamily: 'monospace', fontSize: 13, color: '#E0E0E0', height: 180, overflowY: 'auto', lineHeight: 1.6 }}>
            {draftSeq.map((sh, end) => (
              <div key={end}>{end + 1}--&gt;{sh}</div>
            ))}
          </div>
          <div style={{ fontSize: 11, color: '#888', marginTop: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#3B82F6' }} />
            Each row = end &rarr; shaft assigned
          </div>
        </div>

      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) minmax(300px, 1fr)', gap: 24, marginBottom: 24 }}>
        
        {/* All Possible Peg Plans */}
        <div style={{ border: '1px solid #444', borderRadius: 8, padding: 16, display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: 10, fontWeight: 800, color: '#E8A838', letterSpacing: '0.05em', marginBottom: 16, textTransform: 'uppercase' }}>
            All Possible Peg Plans ({allCombos.length} of {Math.pow(2, shafts) - 1})
          </div>

          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', marginBottom: 12, paddingBottom: 4 }}>
            <button onClick={() => setActiveTab('All')} style={{ background: activeTab === 'All' ? '#444' : 'transparent', color: '#FFF', border: '1px solid #555', borderRadius: 16, padding: '4px 12px', fontSize: 11, cursor: 'pointer' }}>All</button>
            {Array.from({ length: 5 }).map((_, i) => (
               <button key={i} onClick={() => setActiveTab(i + 1)} style={{ background: activeTab === i + 1 ? '#444' : 'transparent', color: '#FFF', border: '1px solid #555', borderRadius: 16, padding: '4px 12px', fontSize: 11, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                 {i + 1} shafts
               </button>
            ))}
          </div>

          <div style={{ flex: 1, minHeight: 400, maxHeight: 400, overflowY: 'auto', paddingRight: 4, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {filteredCombos.map((combo, idx) => (
              <div 
                key={idx} 
                onClick={() => addToPegPlan(combo)}
                style={{ 
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', 
                  background: '#353535', borderRadius: 6, border: '1px solid #444', cursor: 'pointer' 
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, width: 24 }}>{idx + 1}</span>
                  <div style={{ display: 'flex', gap: 2 }}>
                    {Array.from({ length: shafts }).map((_, s) => (
                      <div key={s} style={{ width: 8, height: 12, background: combo.includes(s + 1) ? '#1B1F3B' : '#FFF', border: '1px solid #111' }} />
                    ))}
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700 }}>{combo.join(',')}</span>
                </div>
                <div style={{ background: '#FFF', color: '#A6B1C9', padding: '2px 8px', borderRadius: 12, fontSize: 10, fontWeight: 800 }}>
                  {combo.length} shaft{combo.length > 1 ? 's' : ''}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Selected Peg Plan & Weave Preview */}
        <div style={{ border: '1px solid #444', borderRadius: 8, padding: 16 }}>
          <div style={{ fontSize: 10, fontWeight: 800, color: '#AAA', letterSpacing: '0.05em', marginBottom: 16, textTransform: 'uppercase' }}>
            Selected Peg Plan — Weave Preview
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24, padding: 24, background: '#FFF', borderRadius: 8 }}>
            <WeaveCanvas 
              matrix={weaveMatrix} 
              shaftCount={ends} 
              repeatW={ends} 
              repeatH={picks} 
            />
          </div>

          <div style={{ background: '#252525', border: '1px solid #333', borderRadius: 8, padding: 16, fontFamily: 'monospace', fontSize: 13, color: '#E0E0E0', height: 200, overflowY: 'auto', lineHeight: 1.6 }}>
            <div style={{ color: '#E8A838', marginBottom: 8, fontWeight: 700 }}>Peg plan sequences:</div>
            {builtPegPlan.map((combo, i) => (
              <div key={i}>{i + 1}--&gt;{combo.join(',')}</div>
            ))}
            <div style={{ marginTop: 12, color: '#888' }}>Activated picks: {activePicksCount}</div>
          </div>
        </div>

      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
        
        {/* Statistics */}
        <div style={{ border: '1px solid #444', borderRadius: 8, padding: 16 }}>
          <div style={{ fontSize: 10, fontWeight: 800, color: '#AAA', letterSpacing: '0.05em', marginBottom: 16, textTransform: 'uppercase' }}>Statistics</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={{ background: '#353535', padding: 12, borderRadius: 6 }}>
              <div style={{ fontSize: 11, color: '#A0A0A5', marginBottom: 4 }}>Total picks</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#E8A838' }}>{picks}</div>
            </div>
            <div style={{ background: '#353535', padding: 12, borderRadius: 6 }}>
              <div style={{ fontSize: 11, color: '#A0A0A5', marginBottom: 4 }}>Shafts used</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#E8A838' }}>{new Set(draftSeq).size}</div>
            </div>
            <div style={{ background: '#353535', padding: 12, borderRadius: 6 }}>
              <div style={{ fontSize: 11, color: '#A0A0A5', marginBottom: 4 }}>Peg plans</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#FFF' }}>{allCombos.length}</div>
            </div>
            <div style={{ background: '#353535', padding: 12, borderRadius: 6 }}>
              <div style={{ fontSize: 11, color: '#A0A0A5', marginBottom: 4 }}>Repeat</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#FFF' }}>{ends}×{picks}</div>
            </div>
          </div>
        </div>

        {/* Structure Info */}
        <div style={{ border: '1px solid #444', borderRadius: 8, padding: 16 }}>
          <div style={{ fontSize: 10, fontWeight: 800, color: '#AAA', letterSpacing: '0.05em', marginBottom: 16, textTransform: 'uppercase' }}>Weave Structure Info</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 12, color: '#CCC' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ color: '#E8A838' }}>●</span> Max shafts per pick: {Math.max(...builtPegPlan.map(c => c.length), 0)}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ color: '#E8A838' }}>●</span> Min shafts per pick: {Math.min(...builtPegPlan.filter(c => c.length > 0).map(c => c.length), 0)}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ color: '#3B82F6' }}>●</span> Unique combinations: {new Set(builtPegPlan.map(c => c.join(','))).size}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ color: '#3B82F6' }}>●</span> Max possible: {allCombos.length}</div>
          </div>
        </div>

        {/* Reverse Lookup */}
        <div style={{ border: '1px solid #444', borderRadius: 8, padding: 16 }}>
          <div style={{ fontSize: 10, fontWeight: 800, color: '#AAA', letterSpacing: '0.05em', marginBottom: 16, textTransform: 'uppercase' }}>Reverse Lookup</div>
          <label style={{ fontSize: 11, color: '#CCC', marginBottom: 8, display: 'block' }}>Enter peg plan row:</label>
          <input type="text" placeholder="e.g. 1,3,5,7" style={{ width: '100%', background: '#252525', color: '#FFF', border: '1px solid #555', borderRadius: 6, padding: '10px 12px', outline: 'none', marginBottom: 12, fontFamily: 'monospace' }} />
          <div style={{ background: '#252525', height: 60, borderRadius: 6, border: '1px solid #444' }} />
        </div>

      </div>

    </div>
  )
}
