'use client'

import { useDesignStore } from '@/lib/store/designStore'

export async function downloadPDF() {
  const state = useDesignStore.getState()
  const { identity, warp, weftSystem, loom, calcOutputs } = state
  const draftSeq: number[] = state.draftSequence   // threading draft: end→shaft

  // ── Resolve thread colors first (before any SVG generation) ──────────
  const COLOR_MAP: Record<string, string> = {
    ivory:'#FFFFF0',cream:'#FFFDD0',white:'#F5F5F7',black:'#1D1D1F',navy:'#1B3A6B',
    red:'#C41E3A',maroon:'#800020',gold:'#E8A838',amber:'#E8A838',yellow:'#F4D03F',
    orange:'#E67E22',green:'#27AE60',blue:'#2980B9',pink:'#E8909C',grey:'#888888',
    gray:'#888888',silver:'#C0C0C0',brown:'#6D4C41',beige:'#F5F5DC',teal:'#008080',purple:'#7B1FA2',
  }
  const resolveHex = (c: string, fb: string) => !c ? fb :
    c.startsWith('#') ? c : (COLOR_MAP[c.toLowerCase().trim()] ?? fb)
  // Safe visible defaults — dark navy warp, amber weft (not near-black)
  const warpHex = resolveHex(warp?.colour_hex || warp?.colour_code || '', '#1B3A6B')
  const weftHex = resolveHex(weftSystem.yarns[0]?.colour_hex || weftSystem.yarns[0]?.colour_code || '', '#E8A838')

  // ── Build peg plan matrix SVG ──────────────────────────────────────────
  const pegMatrix = state.pegPlanMatrix
  const cellPx = 9
  const pegSVGRows = pegMatrix.length > 0
    ? pegMatrix.map((row, ri) => {
        return row.map((cell, ci) =>
          `<rect x="${ci * cellPx}" y="${ri * cellPx}" width="${cellPx - 1}" height="${cellPx - 1}" rx="1"
            fill="${cell ? warpHex : 'none'}" stroke="#D1D1D6" stroke-width="0.5"/>`
        ).join('')
      }).join('')
    : ''
  const pegCols = pegMatrix[0]?.length || 0
  const pegSVGW = pegCols * cellPx
  const pegSVGH = pegMatrix.length * cellPx

  // ── Build threading draft matrix SVG ────────────────────────────
  // Rows = shafts (top = shaft 1), Cols = warp ends
  // A cell is filled if draftSeq[end] === shaft
  const numShafts = state.shaftCount || 8
  const numEnds   = draftSeq.length || numShafts
  // Build rows: one row per shaft, columns = ends
  const draftSVGRows = Array.from({ length: numShafts }, (_, shaftIdx) => {
    const shaft = shaftIdx + 1
    return Array.from({ length: numEnds }, (_, endIdx) => {
      const filled = draftSeq[endIdx] === shaft
      return `<rect x="${endIdx * cellPx}" y="${shaftIdx * cellPx}" width="${cellPx - 1}" height="${cellPx - 1}" rx="1"
        fill="${filled ? '#007AFF' : 'none'}" stroke="#C8C8CC" stroke-width="0.5"/>`
    }).join('')
  }).join('')
  const draftSVGW = numEnds   * cellPx
  const draftSVGH = numShafts * cellPx
  // Draft numeric text: group ends by shaft  e.g. "Shaft 1: ends 1,3,5..."
  const draftTextLines = Array.from({ length: numShafts }, (_, si) => {
    const shaft = si + 1
    const ends = draftSeq
      .map((s, i) => ({ s, e: i + 1 }))
      .filter(x => x.s === shaft)
      .map(x => x.e)
    return ends.length
      ? `<tr><td style="font-family:monospace;font-size:9px;padding:2px 6px;border-bottom:1px solid #BFDBFF;color:#007AFF;"><strong>S${shaft}</strong> → ${ends.join(', ')}</td></tr>`
      : `<tr><td style="font-family:monospace;font-size:9px;padding:2px 6px;color:#C7C7CC;">S${shaft} → —</td></tr>`
  }).join('')

  // ── Peg plan text rows ───────────────────────────────────────────
  const pegTextLines = state.pegPlanText
    ? state.pegPlanText.split('\n').filter(Boolean).map(l =>
        `<tr><td style="font-family:monospace;font-size:9px;padding:2px 6px;color:#1D1D1F;border-bottom:1px solid #E5E5EA;">${l}</td></tr>`
      ).join('')
    : '<tr><td style="color:#8E8E93;font-size:10px;padding:4px;">No peg plan defined</td></tr>'

  // ── Fabric Simulation SVG (tiled weave visual, 200px to match website) ────
  const wMatrix = state.weaveMatrix.length > 0 ? state.weaveMatrix : state.pegPlanMatrix
  const fabricCols = wMatrix[0]?.length || 0
  const fabricRows = wMatrix.length
  const fp = 4
  const maxFabricPx = 200
  const tilesX = fabricCols > 0 ? Math.ceil(maxFabricPx / (fabricCols * fp)) + 1 : 0
  const tilesY = fabricRows > 0 ? Math.ceil(maxFabricPx / (fabricRows * fp)) + 1 : 0
  const fabricW = Math.min(tilesX * fabricCols * fp, maxFabricPx)
  const fabricH = Math.min(tilesY * fabricRows * fp, maxFabricPx)
  let fabricRects = ''
  if (fabricCols > 0 && fabricRows > 0) {
    for (let ty = 0; ty < tilesY; ty++) {
      for (let tx = 0; tx < tilesX; tx++) {
        for (let r = 0; r < fabricRows; r++) {
          for (let c = 0; c < fabricCols; c++) {
            const x = (tx * fabricCols + c) * fp
            const y = (ty * fabricRows + r) * fp
            if (x >= fabricW || y >= fabricH) continue
            fabricRects += `<rect x="${x}" y="${y}" width="${fp}" height="${fp}" fill="${wMatrix[r]?.[c] === 1 ? warpHex : weftHex}"/>`
          }
        }
      }
    }
  }

  // ── Weft yarn rows (compact) ─────────────────────────────────────
  const weftRows = weftSystem.yarns.map((y, i) =>
    `<tr style="${i % 2 === 0 ? 'background:#F9F9FB;' : ''}">
      <td>${y.label}</td>
      <td>${y.count_value}${y.count_system === 'denier' ? 'D' : 'Ne'}</td>
      <td>${y.material}</td>
      <td>${y.nozzle_config.sequence.join(',')}</td>
      <td>${y.nozzle_config.pressure_bar} bar</td>
      <td>${y.properties.shrinkage_min_pct}–${y.properties.shrinkage_max_pct}%</td>
    </tr>`
  ).join('')

  // ── Simulation data (matches website SimulationPanel exactly) ────
  const sim = calcOutputs?.simulation

  // Same 4 score cards as SimulationPanel.tsx
  const simScoreCards = sim ? [
    { label: 'Shrinkage', value: sim.shrinkage_pct.toFixed(1), unit: '%', max: 35, color: '#a32d2d', pct: Math.min(sim.shrinkage_pct / 35, 1), formula: sim.formulas?.shrinkage || '' },
    { label: 'Drape', value: String(sim.drape_index), unit: '/ 100', max: 100, color: '#185fa5', pct: sim.drape_index / 100, formula: sim.formulas?.drape || '' },
    { label: 'Stiffness', value: String(sim.stiffness_index), unit: '/ 100', max: 100, color: '#854f0b', pct: sim.stiffness_index / 100, formula: sim.formulas?.stiffness || '' },
    { label: 'Fabric Strength', value: sim.strength_n_per_cm.toFixed(1), unit: 'N/cm', max: 400, color: '#3b6d11', pct: Math.min(sim.strength_n_per_cm / 400, 1), formula: sim.formulas?.strength || '' },
  ] : []

  const simScoreHTML = simScoreCards.map(s => `
    <div style="background:#F9F9FB;border:1px solid #E5E5EA;border-radius:10px;padding:12px 14px;">
      <div style="font-size:9px;color:#8E8E93;font-weight:500;margin-bottom:4px;">${s.label}</div>
      <div style="display:flex;align-items:baseline;gap:4px;">
        <span style="font-size:22px;font-weight:700;color:${s.color};letter-spacing:-0.02em;">${s.value}</span>
        <span style="font-size:9px;color:#8E8E93;">${s.unit}</span>
      </div>
      <div style="height:5px;background:#E5E5EA;border-radius:3px;overflow:hidden;margin-top:7px;">
        <div style="height:100%;width:${Math.round(s.pct * 100)}%;background:${s.color};border-radius:3px;"></div>
      </div>
      ${s.formula ? `<div style="font-size:7.5px;font-family:monospace;color:#8E8E93;margin-top:5px;line-height:1.4;word-break:break-all;">${s.formula}</div>` : ''}
    </div>`
  ).join('')

  // Radar SVG matching website's RadarDisplay (5 axes: stability, drape, softness, strength, handle)
  const radarScores: Record<string, number> = sim ? {
    stability: sim.dimensional_stability,
    drape: sim.drape_index,
    softness: sim.softness,
    strength: Math.round(Math.min(sim.strength_n_per_cm / 4, 100)),
    handle: sim.handle_score,
  } : {}
  const radarEntries = Object.entries(radarScores)
  const radarN = radarEntries.length
  const radarSize = 160
  const radarCx = radarSize / 2
  const radarCy = radarSize / 2
  const radarMaxR = radarSize / 2 - 28
  const getRadarPoints = (r: number) => radarEntries.map((_, i) => {
    const angle = (2 * Math.PI * i) / radarN - Math.PI / 2
    return `${radarCx + r * Math.cos(angle)},${radarCy + r * Math.sin(angle)}`
  }).join(' ')
  const radarDataPoints = radarEntries.map(([, val], i) => {
    const r = (val / 100) * radarMaxR
    const angle = (2 * Math.PI * i) / radarN - Math.PI / 2
    return `${radarCx + r * Math.cos(angle)},${radarCy + r * Math.sin(angle)}`
  }).join(' ')
  const radarAxisLines = radarEntries.map(([, ], i) => {
    const angle = (2 * Math.PI * i) / radarN - Math.PI / 2
    return `<line x1="${radarCx}" y1="${radarCy}" x2="${radarCx + radarMaxR * Math.cos(angle)}" y2="${radarCy + radarMaxR * Math.sin(angle)}" stroke="#C8C8CC" stroke-width="0.5" opacity="0.5"/>`
  }).join('')
  const radarLabels = radarEntries.map(([key, val], i) => {
    const angle = (2 * Math.PI * i) / radarN - Math.PI / 2
    const lx = radarCx + (radarMaxR + 20) * Math.cos(angle)
    const ly = radarCy + (radarMaxR + 20) * Math.sin(angle)
    return `<text x="${lx}" y="${ly}" text-anchor="middle" dominant-baseline="middle" style="font-size:8px;fill:#8E8E93;font-weight:500;">${key.replace(/_/g,' ')} ${val}</text>`
  }).join('')
  const radarRings = [0.25, 0.5, 0.75, 1.0].map(pct =>
    `<polygon points="${getRadarPoints(radarMaxR * pct)}" fill="none" stroke="#D1D1D6" stroke-width="0.5" opacity="0.6"/>`
  ).join('')
  const radarSVG = radarN > 0 ? `
    <svg width="${radarSize}" height="${radarSize}" viewBox="0 0 ${radarSize} ${radarSize}" xmlns="http://www.w3.org/2000/svg">
      ${radarRings}${radarAxisLines}
      <polygon points="${radarDataPoints}" fill="rgba(55,138,221,0.12)" stroke="#378ADD" stroke-width="2"/>
      ${radarEntries.map(([, val], i) => {
        const r = (val / 100) * radarMaxR
        const angle = (2 * Math.PI * i) / radarN - Math.PI / 2
        return `<circle cx="${radarCx + r * Math.cos(angle)}" cy="${radarCy + r * Math.sin(angle)}" r="3" fill="#378ADD"/>`
      }).join('')}
      ${radarLabels}
    </svg>` : ''

  // Alerts matching website AlertCard style
  const alertBorderColors: Record<string, [string, string, string]> = {
    ok:     ['#eaf3de', '#3b6d11', '#3b6d11'],
    info:   ['#e6f1fb', '#185fa5', '#185fa5'],
    warn:   ['#faeeda', '#ba7517', '#854f0b'],
    danger: ['#fcebeb', '#a32d2d', '#a32d2d'],
  }
  const alertsHTML = sim?.alerts?.map((a: { severity: string; message: string; fix: string }) => {
    const [bg, bdr, txt] = alertBorderColors[a.severity] ?? ['#F2F2F7', '#8E8E93', '#8E8E93']
    return `<div style="font-size:10px;padding:8px 12px;border-radius:8px;background:${bg};border-left:3px solid ${bdr};margin-bottom:6px;">
      <div style="font-weight:600;color:${txt};">${a.message}</div>
      <div style="font-size:9px;color:${txt};opacity:0.75;margin-top:2px;font-style:italic;">Fix: ${a.fix}</div>
    </div>`
  }).join('') ?? ''

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${identity.design_number || 'Report'} — ${identity.design_name || 'FabricAI'}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
    *{margin:0;padding:0;box-sizing:border-box;}
    body{font-family:'Inter',sans-serif;color:#1D1D1F;background:#fff;font-size:10px;}
    /* ── PAGE SHELL ── */
    .page{width:210mm;min-height:297mm;padding:14mm 14mm 10mm;page-break-after:always;position:relative;}
    .page:last-child{page-break-after:avoid;}
    /* ── HEADER ── */
    .brand-header{display:flex;justify-content:space-between;align-items:center;padding-bottom:8px;border-bottom:1.5px solid #1D1D1F;margin-bottom:12px;}
    .brand-wordmark{font-size:18px;font-weight:800;letter-spacing:-0.04em;color:#1D1D1F;}
    .brand-wordmark span{color:#007AFF;}
    .brand-tagline{font-size:8px;color:#8E8E93;letter-spacing:.12em;text-transform:uppercase;margin-top:1px;}
    .doc-meta{text-align:right;font-size:9px;color:#8E8E93;line-height:1.6;}
    .doc-meta strong{color:#1D1D1F;font-size:11px;font-weight:700;}
    /* ── SECTION HEADERS ── */
    .sec-label{font-size:8px;font-weight:700;color:#007AFF;text-transform:uppercase;letter-spacing:.1em;margin:10px 0 4px;border-left:2px solid #007AFF;padding-left:5px;}
    /* ── TWO-COL SPEC GRID ── */
    .spec-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:6px;}
    .spec-card{background:#F9F9FB;border-radius:6px;padding:6px 10px;}
    .spec-key{font-size:8px;color:#8E8E93;font-weight:500;}
    .spec-val{font-size:12px;font-weight:700;color:#1D1D1F;margin-top:1px;}
    .spec-val.accent{color:#007AFF;}
    /* ── TABLES ── */
    table{width:100%;border-collapse:collapse;}
    th{font-size:8px;font-weight:600;color:#8E8E93;text-transform:uppercase;letter-spacing:.06em;padding:4px 6px;border-bottom:1px solid #E5E5EA;text-align:left;}
    td{padding:4px 6px;border-bottom:1px solid #F2F2F7;vertical-align:top;}
    /* ── MATRIX WRAPPER ── */
    .matrix-wrap{overflow:hidden;border:1px solid #E5E5EA;border-radius:6px;padding:6px;background:#FAFAFA;display:inline-block;}
    /* ── FOOTER ── */
    .page-footer{position:absolute;bottom:9mm;left:14mm;right:14mm;font-size:8px;color:#C7C7CC;display:flex;justify-content:space-between;border-top:1px solid #F2F2F7;padding-top:4px;}
    /* ── PILL BADGE ── */
    .badge{display:inline-block;padding:2px 8px;border-radius:99px;font-size:8px;font-weight:600;letter-spacing:.05em;text-transform:uppercase;}
    .badge-blue{background:#EAF3FF;color:#007AFF;}
    .badge-green{background:#E8F9EE;color:#34C759;}
    @media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact;}.page{page-break-after:always;}}
  </style>
</head>
<body>

<!-- ═══════════════════════════════════════════════════════
     PAGE 1 — Identity · Warp · Weft · Machine · Calc KPIs
═══════════════════════════════════════════════════════ -->
<div class="page">
  <!-- Header -->
  <div class="brand-header">
    <div>
      <div class="brand-wordmark">Fabric<span>AI</span> Studio</div>
      <div class="brand-tagline">Industrial Textile Engineering Report</div>
    </div>
    <div class="doc-meta">
      <strong>${identity.design_name || '—'}</strong><br>
      ${identity.design_number || '—'} &nbsp;·&nbsp; ${identity.quality_name || '—'}<br>
      Customer: ${identity.customer_ref || '—'}<br>
      ${new Date().toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' })}
      &nbsp;<span class="badge badge-blue">Draft</span>
    </div>
  </div>

  <!-- Warp & Machine side-by-side -->
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
    <!-- Warp -->
    <div>
      <div class="sec-label">Warp Specification</div>
      <div class="spec-grid">
        <div class="spec-card"><div class="spec-key">Count</div><div class="spec-val accent">${warp?.count_value || '—'}${warp?.count_system === 'denier' ? 'D' : 'Ne'}${warp?.filament_count ? `/${warp.filament_count}f` : ''}</div></div>
        <div class="spec-card"><div class="spec-key">Material</div><div class="spec-val">${warp?.material || '—'}</div></div>
        <div class="spec-card"><div class="spec-key">Luster</div><div class="spec-val">${warp?.luster || '—'}</div></div>
        <div class="spec-card"><div class="spec-key">Colour Code</div><div class="spec-val">${warp?.colour_code || '—'}</div></div>
        <div class="spec-card"><div class="spec-key">EPI</div><div class="spec-val accent">${calcOutputs?.epi || '—'}</div></div>
        <div class="spec-card"><div class="spec-key">Reed</div><div class="spec-val">${loom?.reed_count_stockport || '—'}s / ${loom?.ends_per_dent || '—'}EPD</div></div>
      </div>
    </div>
    <!-- Machine -->
    <div>
      <div class="sec-label">Machine Parameters</div>
      <div class="spec-grid">
        <div class="spec-card"><div class="spec-key">Type</div><div class="spec-val">${loom?.machine_type?.replace(/_/g,' ') || '—'}</div></div>
        <div class="spec-card"><div class="spec-key">Dobby</div><div class="spec-val">${loom?.dobby_type || '—'}</div></div>
        <div class="spec-card"><div class="spec-key">RPM</div><div class="spec-val accent">${loom?.machine_rpm || '—'}</div></div>
        <div class="spec-card"><div class="spec-key">Width</div><div class="spec-val">${loom?.cloth_width_inches || '—'}"</div></div>
        <div class="spec-card"><div class="spec-key">Efficiency</div><div class="spec-val">${loom?.loom_efficiency_pct || '—'}%</div></div>
        <div class="spec-card"><div class="spec-key">Nozzles</div><div class="spec-val">${weftSystem.total_nozzles_available}</div></div>
        ${loom?.sv1_psi ? `<div class="spec-card"><div class="spec-key">SV1–SV3</div><div class="spec-val" style="font-size:10px;">${loom.sv1_psi} / ${loom.sv2_psi} / ${loom.sv3_psi} PSI</div></div>
        <div class="spec-card"><div class="spec-key">SV4–SV5</div><div class="spec-val" style="font-size:10px;">${loom.sv4_psi} / ${loom.sv5_psi} PSI</div></div>` : ''}
      </div>
    </div>
  </div>

  <!-- Weft Yarns -->
  <div class="sec-label" style="margin-top:12px;">Weft System — ${weftSystem.yarns.length} Yarn${weftSystem.yarns.length !== 1 ? 's' : ''}</div>
  <table>
    <thead><tr>
      <th>Yarn</th><th>Count</th><th>Material</th><th>Nozzles</th><th>Pressure</th><th>Shrinkage</th>
    </tr></thead>
    <tbody>${weftRows}</tbody>
  </table>

  <!-- Calc KPIs strip -->
  ${calcOutputs ? `
  <div class="sec-label" style="margin-top:12px;">Key Output Metrics</div>
  <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:6px;">
    ${[
      ['GSM', calcOutputs.gsm.toFixed(1), '#FF9500'],
      ['Linear Wt', `${calcOutputs.linear_meter_weight_g.toFixed(1)} g/m`, '#007AFF'],
      ['Total Ends', calcOutputs.total_warp_ends.toLocaleString(), '#34C759'],
      ['Production', `${calcOutputs.production_m_per_hr.toFixed(2)} m/hr`, '#AF52DE'],
      ['Cost/m', `$${calcOutputs.cost_per_meter.toFixed(2)}`, '#FF9500'],
    ].map(([lbl, val, col]) =>
      `<div style="background:#F9F9FB;border-radius:6px;padding:7px 8px;border-top:2px solid ${col};text-align:center;">
        <div style="font-size:8px;font-weight:600;color:#8E8E93;text-transform:uppercase;">${lbl}</div>
        <div style="font-size:13px;font-weight:800;color:#1D1D1F;margin-top:2px;">${val}</div>
      </div>`
    ).join('')}
  </div>
  <div style="margin-top:6px;font-size:8px;color:#8E8E93;">
    Production = (${loom?.machine_rpm ?? '?'} RPM × 60) / (${loom?.target_ppi ?? '?'} PPI × 39.37) × ${loom?.loom_efficiency_pct ?? '?'}%
    &nbsp;|&nbsp; Warp ${calcOutputs.warp_cost_pct}% · Weft ${calcOutputs.weft_cost_pct}%
  </div>` : ''}

  <!-- Insertion pattern -->
  ${weftSystem.mode === 'advanced' && weftSystem.insertion_sequence.pattern.length > 0 ? `
  <div class="sec-label" style="margin-top:10px;">Master Insertion Pattern</div>
  <div style="font-size:10px;font-weight:600;padding:6px 10px;background:#F9F9FB;border-radius:6px;letter-spacing:.05em;">
    ${weftSystem.insertion_sequence.pattern.map((id: string) => weftSystem.yarns.find((y: { id: string; label: string }) => y.id === id)?.label ?? id).join(' → ')}
  </div>` : ''}

  <div class="page-footer">
    <span>FabricAI Studio — Solerix Technologies</span>
    <span>${identity.design_number || 'Draft'} · Page 1 of 3</span>
  </div>
</div>

<!-- ═══════════════════════════════════════════════════════
     PAGE 2 — Peg Plan + Draft Plan (Matrix + Text)
═══════════════════════════════════════════════════════ -->
<div class="page">
  <div class="brand-header">
    <div>
      <div class="brand-wordmark">Fabric<span>AI</span> Studio</div>
      <div class="brand-tagline">Pattern Engineering</div>
    </div>
    <div class="doc-meta">
      <strong>${identity.design_name || '—'}</strong><br>
      ${identity.design_number || '—'} &nbsp;·&nbsp; Shafts: ${state.shaftCount}
    </div>
  </div>

  <!-- Peg Plan + Draft Plan side by side -->
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;">

    <!-- LEFT: Peg Plan -->
    <div>
      <div class="sec-label">Peg Plan — Numeric</div>
      ${state.pegPlanText ? `
      <div style="background:#F9F9FB;border-radius:6px;padding:6px 8px;max-height:90mm;overflow:hidden;">
        <table style="width:auto;">
          <tbody>${pegTextLines}</tbody>
        </table>
      </div>` : '<div style="color:#8E8E93;font-size:10px;">No peg plan defined</div>'}

      <div class="sec-label" style="margin-top:8px;">Peg Plan — Matrix</div>
      ${pegMatrix.length > 0 ? `
      <div class="matrix-wrap">
        <svg width="${pegSVGW}" height="${pegSVGH}" xmlns="http://www.w3.org/2000/svg">
          ${pegSVGRows}
        </svg>
      </div>
      <div style="margin-top:3px;font-size:8px;color:#8E8E93;">
        ${pegMatrix.length} picks × ${pegCols} shaft${pegCols !== 1 ? 's' : ''}
        &nbsp;·&nbsp; ■ = Peg engaged
      </div>` : ''}
    </div>

    <!-- RIGHT: Draft Plan (Threading Draft) -->
    <div>
      <div class="sec-label">Draft Plan — Numeric (Shaft per End)</div>
      <div style="background:#EAF3FF;border-radius:6px;padding:6px 8px;max-height:90mm;overflow:hidden;">
        <table style="width:auto;">
          <tbody>${draftTextLines}</tbody>
        </table>
      </div>

      <div class="sec-label" style="margin-top:8px;">Draft Plan — Threading Matrix</div>
      <div class="matrix-wrap" style="border-color:#BFDBFF;">
        <svg width="${draftSVGW}" height="${draftSVGH}" xmlns="http://www.w3.org/2000/svg">
          ${draftSVGRows}
        </svg>
      </div>
      <div style="margin-top:3px;font-size:8px;color:#8E8E93;">
        ${numShafts} shafts × ${numEnds} ends
        &nbsp;·&nbsp; <span style="color:#007AFF;">■</span> = End threaded on shaft
      </div>
    </div>
  </div>

  <div class="page-footer">
    <span>FabricAI Studio — Solerix Technologies</span>
    <span>${identity.design_number || 'Draft'} · Page 2 of 3</span>
  </div>
</div>

<!-- ═══════════════════════════════════════════════════════
     PAGE 3 — Fabric Simulation (matches website SimulationPanel)
═══════════════════════════════════════════════════════ -->
<div class="page">
  <div class="brand-header">
    <div>
      <div class="brand-wordmark">Fabric<span>AI</span> Studio</div>
      <div class="brand-tagline">Fabric Simulation Report</div>
    </div>
    <div class="doc-meta">
      <strong>${identity.design_name || '—'}</strong><br>
      ${identity.design_number || '—'}
      ${sim ? `&nbsp;·&nbsp; <span style="color:#007AFF;font-weight:700;text-transform:capitalize;">${sim.archetype}</span>` : ''}
    </div>
  </div>

  ${sim ? `
  <!-- Archetype Header (matches website's prominent archetype card) -->
  <div style="background:linear-gradient(135deg,rgba(232,168,56,0.1) 0%,rgba(232,168,56,0.02) 100%);border:1.5px solid rgba(232,168,56,0.3);border-radius:12px;padding:16px 20px;text-align:center;margin-bottom:12px;">
    <div style="font-size:8px;font-weight:700;color:#E8A838;text-transform:uppercase;letter-spacing:.2em;margin-bottom:6px;">Identified Fabric Profile</div>
    <div style="font-size:20px;font-weight:800;color:#1D1D1F;letter-spacing:-0.02em;margin-bottom:5px;">${sim.archetype.split(' ').map((s: string) => s[0].toUpperCase() + s.slice(1)).join(' ')}</div>
    <div style="font-size:10px;color:#8E8E93;max-width:340px;margin:0 auto;line-height:1.55;">${sim.archetype_description}</div>
  </div>

  <!-- Material & Weave Info (matches website 2-col card) -->
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px;">
    <div style="background:#F9F9FB;border:1px solid #E5E5EA;border-radius:8px;padding:12px 14px;">
      <div style="font-size:8px;font-weight:700;color:#8E8E93;text-transform:uppercase;margin-bottom:6px;">Warp Material</div>
      <div style="font-size:13px;font-weight:600;color:#1D1D1F;">${warp?.material || '—'}</div>
    </div>
    <div style="background:#F9F9FB;border:1px solid #E5E5EA;border-radius:8px;padding:12px 14px;">
      <div style="font-size:8px;font-weight:700;color:#8E8E93;text-transform:uppercase;margin-bottom:6px;">Weave Structure</div>
      <div style="font-size:13px;font-weight:600;color:#1D1D1F;">${loom?.weave_type?.replace(/_/g,' ') || '—'}</div>
    </div>
  </div>

  <!-- Fabric Output Simulation Scores (SAME 4 as website: Shrinkage/Drape/Stiffness/Strength) -->
  <div class="sec-label">Fabric Output Simulation</div>
  <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin-bottom:12px;">
    ${simScoreHTML}
  </div>

  <!-- Weave Preview + Radar side-by-side (matches website layout) -->
  <div style="display:grid;grid-template-columns:auto 1fr;gap:16px;align-items:start;margin-bottom:12px;">
    <!-- Tiled weave visual (larger, matches website fabric preview) -->
    <div>
      <div class="sec-label" style="margin-bottom:6px;">Weave Preview</div>
      <div style="border:1px solid #E5E5EA;border-radius:8px;overflow:hidden;display:inline-block;">
        <svg width="${fabricW}" height="${fabricH}" xmlns="http://www.w3.org/2000/svg">
          <rect width="${fabricW}" height="${fabricH}" fill="${weftHex}"/>
          ${fabricRects}
        </svg>
      </div>
      <div style="display:flex;gap:12px;margin-top:5px;font-size:9px;color:#8E8E93;">
        <span><span style="display:inline-block;width:10px;height:10px;background:${warpHex};border-radius:2px;margin-right:3px;vertical-align:middle;"></span>Warp</span>
        <span><span style="display:inline-block;width:10px;height:10px;background:${weftHex};border-radius:2px;margin-right:3px;vertical-align:middle;"></span>Weft</span>
      </div>
      <div style="font-size:8px;color:#C8C8CC;margin-top:3px;">${fabricRows}×${fabricCols} repeat · ${warpHex} / ${weftHex}</div>
    </div>
    <!-- Output Profile Radar (matches website RadarDisplay) -->
    <div>
      <div class="sec-label" style="margin-bottom:6px;">Output Profile Radar</div>
      <div style="background:#F9F9FB;border:1px solid #E5E5EA;border-radius:10px;padding:10px;display:inline-block;">
        ${radarSVG}
      </div>
    </div>
  </div>

  <!-- Engineering Alerts (matches website AlertCard with Fix text) -->
  ${alertsHTML ? `
  <div class="sec-label">Engineering Alerts</div>
  <div style="margin-bottom:12px;">${alertsHTML}</div>` : ''}

  <!-- Simulation Formulas (matches website formula section) -->
  <div class="sec-label">Simulation Formulas</div>
  <div style="background:#F9F9FB;border-radius:10px;padding:12px 14px;">
    ${[
      { name: 'Shrinkage %', formula: 'S% = S_base × (1 + regain/100 × 1.8) × crimp_factor × (1 + density_norm × 0.25) × (1 + tension_norm × 0.6)' },
      { name: 'Drape Index', formula: 'D = D_base × weave_drape_mod × (1 − density_norm×0.55)^0.4 × ln(Ne/10)/ln(12) × (1 − tension_norm×0.22)' },
      { name: 'Stiffness', formula: 'ST = ST_base × weave_stiff_mod × density_norm^0.6 × (30/Ne) × (1 + tension_norm×0.35)' },
      { name: 'Strength', formula: 'FS [N/cm] = (T_fiber × density/10 × weave_str_mod × cover_factor × (1+elong/200)) / (Ne/30)^0.45' },
    ].map(f => `
      <div style="display:grid;grid-template-columns:90px 1fr;gap:8px;margin-bottom:7px;align-items:start;font-size:10px;">
        <span style="font-weight:600;color:#1D1D1F;">${f.name}</span>
        <span style="font-family:monospace;color:#8E8E93;font-size:8px;line-height:1.55;">${f.formula}</span>
      </div>`
    ).join('')}
  </div>` : `
  <div style="text-align:center;padding:40px 20px;color:#8E8E93;font-size:11px;">
    <div style="font-size:24px;margin-bottom:10px;opacity:0.4;">🔬</div>
    Fill in yarn + loom specs to see the fabric simulation engine.
  </div>`}

  <!-- Costing callout -->
  ${calcOutputs ? `
  <div style="margin-top:12px;background:#F9F9FB;border-radius:8px;padding:10px 14px;display:flex;justify-content:space-between;align-items:center;">
    <div>
      <div style="font-size:8px;font-weight:600;color:#8E8E93;text-transform:uppercase;">Estimated Cost / Linear Metre</div>
      <div style="font-size:22px;font-weight:800;color:#007AFF;letter-spacing:-0.03em;">$${calcOutputs.cost_per_meter.toFixed(2)}</div>
    </div>
    <div style="font-size:9px;color:#8E8E93;text-align:right;line-height:1.7;">
      Warp ${calcOutputs.warp_weight_per_100m_g.toFixed(0)} g/100m<br>
      Weft ${calcOutputs.weft_weight_per_100m_g.toFixed(0)} g/100m<br>
      GSM ${calcOutputs.gsm.toFixed(1)} · oz/yd² ${calcOutputs.oz_per_sq_yard.toFixed(2)}
    </div>
  </div>` : ''}

  <div class="page-footer">
    <span>FabricAI Studio — Solerix Technologies</span>
    <span>${identity.design_number || 'Draft'} · Page 3 of 3</span>
  </div>
</div>

<script>window.onload=function(){window.print();}</script>
</body>
</html>`

  const printWindow = window.open('', '_blank')
  if (!printWindow) { alert('Please allow popups to download the PDF'); return }
  printWindow.document.write(html)
  printWindow.document.close()
}

export default function PDFExportButton() {
  return (
    <button
      onClick={downloadPDF}
      className="btn-accent"
      style={{ fontSize: 12, height: 36, padding: '0 16px' }}
    >
      Download PDF
    </button>
  )
}
