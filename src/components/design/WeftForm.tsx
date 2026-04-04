'use client'

import { useState } from 'react'
import { useDesignStore } from '@/lib/store/designStore'
import type { WeftYarn, CountSystem, Luster } from '@/lib/types'
import ColorPickerPopup from '../common/ColorPickerPopup'

const NOZZLE_COLOUR_MAP = ['#1B1F3B', '#D4AF37', '#00B894', '#D63031', '#8E44AD', '#0984E3', '#E67E22', '#27AE60']

const ChevronDownIcon = ({ expanded }: { expanded: boolean }) => (
  <svg 
    width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
    className={`transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
  >
    <polyline points="6 9 12 15 18 9"></polyline>
  </svg>
)

const TrashIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line>
  </svg>
)

function NozzleSelector({ number, color, active }: { number: number; color: string; active: boolean }) {
  return (
    <div className="flex flex-col items-center gap-1.5 min-w-[40px]">
      <div 
        className={`w-9 h-9 rounded-full transition-all duration-200 border-2 ${active ? 'border-transparent shadow-md' : 'border-gray-200'}`}
        style={{ background: color, opacity: active ? 1 : 0.3 }}
      />
      <span className="text-[10px] font-bold text-gray-400">{number}</span>
    </div>
  )
}

function DarkInput({ label, value, onChange, type = "text", disabled = false, placeholder = "" }: any) {
  return (
    <div className="flex flex-col gap-1.5 flex-1 w-full">
      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">{label}</label>
      <input 
        type={type} 
        value={value} 
        onChange={(e) => onChange && onChange(e.target.value)}
        disabled={disabled}
        placeholder={placeholder}
        className={`h-10 bg-white border border-gray-200 rounded-xl px-3 text-sm font-medium text-gray-800 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 transition-all ${disabled ? 'bg-gray-50 text-gray-400 cursor-not-allowed' : ''}`}
      />
    </div>
  )
}

function StepperInput({ label, value, onChange }: any) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">{label}</label>
      <div className="flex h-10 border border-gray-200 rounded-xl overflow-hidden bg-white focus-within:border-amber-400 focus-within:ring-2 focus-within:ring-amber-400/20 transition-all">
        <button className="w-10 flex items-center justify-center bg-gray-50 hover:bg-gray-100 text-gray-500 font-bold border-r border-gray-200 transition-colors" onClick={() => onChange(value - 1)}>−</button>
        <div className="flex-1 flex items-center justify-center font-semibold text-gray-800 text-sm">
          {value}
        </div>
        <button className="w-10 flex items-center justify-center bg-gray-50 hover:bg-gray-100 text-gray-500 font-bold border-l border-gray-200 transition-colors" onClick={() => onChange(value + 1)}>+</button>
      </div>
    </div>
  )
}

function SelectInput({ label, value, onChange, options }: any) {
  return (
    <div className="flex flex-col gap-1.5 flex-1 w-full">
      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">{label}</label>
      <div className="relative">
        <select 
          value={value} 
          onChange={(e) => onChange(e.target.value)}
          className="w-full h-10 bg-white border border-gray-200 rounded-xl px-3 text-sm font-medium text-gray-800 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 transition-all appearance-none cursor-pointer"
        >
          {options.map((opt: any) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-gray-400">
          <ChevronDownIcon expanded={false} />
        </div>
      </div>
    </div>
  )
}

function LightYarnCard({ yarn, active, expanded, onClick, onToggleAdvanced, onRemove }: any) {
  const { updateWeftYarn, recalculate } = useDesignStore()
  const [showPicker, setShowPicker] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const handleUpdate = (updates: Partial<WeftYarn>) => {
    updateWeftYarn(yarn.id, updates)
    recalculate()
  }

  return (
    <div className="mt-3 bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm transition-all duration-200">
      {/* Target Tab / Card Header */}
      <div 
        onClick={onClick} 
        className={`px-4 py-3.5 flex items-center justify-between cursor-pointer ${expanded ? 'bg-gray-50 border-b border-gray-200' : 'hover:bg-gray-50'}`}
      >
        <div className="flex gap-3 items-center">
          <div 
            onClick={(e) => { e.stopPropagation(); setShowPicker(true) }}
            className="w-10 h-10 rounded-xl border-2 border-white shadow-sm cursor-pointer"
            style={{ background: yarn.colour_hex }}
          />
          <div className="flex flex-col">
            <div className="text-sm font-bold text-gray-900">{yarn.label}</div>
            <div className="text-[11px] font-medium text-gray-500 mt-0.5 flex gap-2 items-center">
              <span>{yarn.material} • {yarn.count_value}{yarn.count_system === 'ne' ? 's' : 'D'}</span>
              {(yarn.label.includes('Ground') || yarn.label === 'Yarn A') && (
                <span className="bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase">Ground</span>
              )}
            </div>
          </div>
        </div>
        <div className={`text-gray-400 ${expanded ? 'text-amber-500' : ''}`}>
          <ChevronDownIcon expanded={expanded} />
        </div>
      </div>

      {/* Expanded Content Form */}
      {expanded && (
        <div className="p-5 flex flex-col gap-6">
          
          <div className="flex gap-4 w-full">
            <div className="flex flex-col gap-1.5 flex-1">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Color Indicator</label>
              <div 
                className="h-10 w-full border border-gray-200 rounded-xl flex items-center pl-1.5 pr-3 gap-2 cursor-pointer hover:border-gray-300 transition-colors"
                onClick={() => setShowPicker(true)}
              >
                <div className="w-7 h-7 rounded-lg shadow-sm" style={{ background: yarn.colour_hex }} />
                <span className="text-sm font-mono font-medium text-gray-600">{yarn.colour_hex}</span>
              </div>
            </div>
            <DarkInput label="Group Name" value={yarn.label} onChange={(v: string) => handleUpdate({ label: v })} />
          </div>
          
          <div className="flex flex-col gap-4">
             <div className="flex gap-3">
               <SelectInput 
                 label="Fiber Material" 
                 value={yarn.material} 
                 onChange={(v: any) => handleUpdate({ material: v })} 
                 options={[{value:'cotton',label:'Cotton'},{value:'polyester',label:'Polyester'},{value:'viscose',label:'Viscose'},{value:'zari',label:'Zari'}]} 
               />
               <SelectInput 
                 label="Luster" 
                 value={yarn.luster} 
                 onChange={(v: any) => handleUpdate({ luster: v })} 
                 options={[{value:'bright',label:'Bright'},{value:'semi_dull',label:'Semi-Dull'},{value:'dull',label:'Matte'}]} 
               />
             </div>
             <div className="flex gap-3">
               <SelectInput 
                 label="Count Type" 
                 value={yarn.count_system} 
                 onChange={(v: any) => handleUpdate({ count_system: v })} 
                 options={[{value:'ne',label:'Ne (English)'},{value:'denier',label:'Denier'}]} 
               />
               <DarkInput label="Yarn Count" type="number" value={yarn.count_value} onChange={(v: string) => handleUpdate({ count_value: parseFloat(v) || 0 })} />
             </div>
          </div>
          
          <div className="flex flex-col gap-3 pt-2 border-t border-gray-100">
             <StepperInput label="Picks Per Inch (PPI)" value={yarn.ppi || 80} onChange={(v: number) => handleUpdate({ ppi: v })} />
          </div>

          <div className="pt-2">
            <button 
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-xs font-semibold text-gray-500 hover:text-amber-500 flex items-center gap-1 transition-colors"
            >
              <ChevronDownIcon expanded={showAdvanced} /> {showAdvanced ? "Hide Advanced Settings" : "Show Advanced Settings"}
            </button>
            
            {showAdvanced && (
              <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-100 flex flex-col gap-4">
                <DarkInput label="Fancy Yarn Setup" value="None" disabled />
                <div className="flex gap-3">
                  <DarkInput label="Height (mm)" value="0.3" disabled />
                  <DarkInput label="Width (mm)" value="0.4" disabled />
                </div>
              </div>
            )}
          </div>

          {/* Danger Zone */}
          <div className="pt-4 mt-2 border-t border-gray-100">
             {!confirmDelete ? (
               <button 
                 onClick={() => setConfirmDelete(true)}
                 className="flex items-center gap-2 text-xs font-bold text-gray-400 hover:text-red-500 transition-colors"
               >
                 <TrashIcon /> Remove this yarn
               </button>
             ) : (
               <div className="flex items-center justify-between bg-red-50 p-3 rounded-xl border border-red-100">
                 <span className="text-xs font-bold text-red-600">Are you sure?</span>
                 <div className="flex gap-2">
                   <button onClick={() => setConfirmDelete(false)} className="text-xs font-semibold px-3 py-1.5 text-gray-600 hover:bg-gray-200 rounded-lg">Cancel</button>
                   <button onClick={onRemove} className="text-xs font-bold px-3 py-1.5 bg-red-500 text-white hover:bg-red-600 rounded-lg transition-colors shadow-sm">Delete</button>
                 </div>
               </div>
             )}
          </div>

        </div>
      )}

      {showPicker && <ColorPickerPopup isOpen={true} initialColor={yarn.colour_hex} title={`Color Preview`}
        onClose={() => setShowPicker(false)} onSave={(c) => { handleUpdate({ colour_hex: c }); setShowPicker(false) }} />}
    </div>
  )
}

export default function WeftForm() {
  const { weftSystem, addWeftYarn, removeWeftYarn, setTotalNozzles, updateInsertionSequence, recalculate } = useDesignStore()
  const activeNozzleSet = new Set(weftSystem.yarns.flatMap(y => y.nozzle_config.sequence))

  const [expandedCard, setExpandedCard] = useState<string | null>(weftSystem.yarns[0]?.id || null)
  const [activeTab, setActiveTab] = useState('config') // config, sequence, advanced

  const handleAddNewYarn = () => {
    addWeftYarn()
    // Find the latest yarn and expand it (handled by effect in a real app, but here we just expand the last one logically)
    setTimeout(() => {
       const newYarn = useDesignStore.getState().weftSystem.yarns.slice(-1)[0];
       if(newYarn) setExpandedCard(newYarn.id);
    }, 100);
  }

  return (
    <div className="flex flex-col h-full bg-slate-50 overflow-y-auto">
      
      {/* Header Section */}
      <div className="px-6 py-6 pb-4 bg-white border-b border-gray-100 sticky top-0 z-10 flex-shrink-0">
        <h2 className="text-2xl font-black text-gray-900 tracking-tight">Weft Manager</h2>
        <p className="text-xs font-semibold text-gray-400 mt-1 uppercase tracking-wider">Pattu Dobby Saree • SD-2025-001</p>

        {/* Tab Navigation */}
        <div className="flex gap-6 mt-6 border-b border-gray-100">
          {[
            { id: 'config', label: 'Yarn Setup' },
            { id: 'sequence', label: 'Insertion Sequence' }
          ].map(tab => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-3 text-sm font-bold relative transition-colors ${activeTab === tab.id ? 'text-amber-500' : 'text-gray-400 hover:text-gray-800'}`}
            >
              {tab.label}
              {activeTab === tab.id && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500 rounded-t-full" />}
            </button>
          ))}
        </div>
      </div>

      <div className="p-6 flex-1 flex flex-col gap-8 max-w-full lg:max-w-xl">
        
        {activeTab === 'config' && (
          <>
            {/* Machine Resources */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Available Nozzles</span>
                <select 
                  value={weftSystem.total_nozzles_available}
                  onChange={(e) => { setTotalNozzles(parseInt(e.target.value)); recalculate() }}
                  className="bg-white border border-gray-200 text-sm font-bold text-gray-700 h-8 rounded-lg px-2 outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/20"
                >
                  <option value="4">4-Color</option>
                  <option value="6">6-Color</option>
                  <option value="8">8-Color</option>
                </select>
              </div>
              <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-thin">
                {Array.from({ length: weftSystem.total_nozzles_available }).map((_, i) => (
                  <NozzleSelector 
                     key={i} 
                     number={i + 1} 
                     color={NOZZLE_COLOUR_MAP[i % NOZZLE_COLOUR_MAP.length]} 
                     active={activeNozzleSet.has(i + 1)} 
                  />
                ))}
              </div>
            </div>

            {/* Yarn Definitions */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Weft Yarns List</span>
              </div>
              
              <div className="flex flex-col gap-1">
                {weftSystem.yarns.map((yarn) => (
                  <LightYarnCard 
                    key={yarn.id} 
                    yarn={yarn} 
                    active={expandedCard === yarn.id}
                    expanded={expandedCard === yarn.id}
                    onClick={() => setExpandedCard(expandedCard === yarn.id ? null : yarn.id)}
                    onRemove={() => { removeWeftYarn(yarn.id); setExpandedCard(null); recalculate() }} 
                  />
                ))}
              </div>

              {/* Primary Add Action */}
              <button 
                onClick={handleAddNewYarn}
                className="mt-4 w-full h-[52px] bg-gray-900 hover:bg-gray-800 text-white rounded-xl shadow-md hover:shadow-lg font-bold text-sm flex items-center justify-center gap-2 transition-all"
              >
                <div className="bg-white/20 p-1 rounded-md"><PlusIcon /></div>
                Add Additional Yarn
              </button>
            </div>
          </>
        )}

        {activeTab === 'sequence' && (
           <div className="flex flex-col gap-6">
             <div className="flex flex-col gap-3">
               <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Pick Sequence</span>
               <div className="flex flex-wrap gap-2">
                 {weftSystem.insertion_sequence.pattern.map((id, i) => {
                   const yarn = weftSystem.yarns.find(y => y.id === id)
                   return (
                     <div key={i} className="flex flex-col items-center gap-1 group">
                       <div className="h-10 px-3 bg-white border border-gray-200 rounded-xl flex items-center gap-2 shadow-sm font-bold text-sm text-gray-800">
                         <div className="w-3 h-3 rounded-full" style={{ background: yarn?.colour_hex || '#CCC' }} />
                         {yarn?.label.split(' ')[1] || 'A'}
                       </div>
                       <div className="text-[9px] font-bold text-gray-300">#{i + 1}</div>
                     </div>
                   )
                 })}
               </div>
             </div>

             <div className="mt-4">
               <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3 block">Append to Pattern</span>
               <div className="flex flex-wrap gap-2">
                 {weftSystem.yarns.map(y => (
                   <button 
                     key={y.id} 
                     onClick={() => { updateInsertionSequence([...weftSystem.insertion_sequence.pattern, y.id]); recalculate() }}
                     className="h-9 px-3 bg-white border rounded-lg font-bold text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-2 shadow-sm transition-colors"
                     style={{ borderColor: y.colour_hex }}
                   >
                     <div className="w-2.5 h-2.5 rounded-full" style={{ background: y.colour_hex }} /> Add {y.label}
                   </button>
                 ))}
                 
                 {weftSystem.insertion_sequence.pattern.length > 0 && (
                   <button 
                     onClick={() => { updateInsertionSequence(weftSystem.insertion_sequence.pattern.slice(0, -1)); recalculate() }}
                     className="h-9 px-3 border border-gray-200 rounded-lg font-bold text-xs text-red-500 hover:bg-red-50 hover:border-red-100 flex items-center gap-1 transition-colors ml-auto"
                   >
                     <TrashIcon /> Undo Last
                   </button>
                 )}
               </div>
               
               <button 
                 onClick={() => { updateInsertionSequence([]); recalculate() }}
                 className="mt-8 text-[11px] font-bold text-gray-400 hover:text-red-500 transition-colors uppercase tracking-widest"
               >
                 Clear Entire Sequence
               </button>
             </div>
           </div>
        )}
      </div>

    </div>
  )
}

const PlusIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line>
  </svg>
)
