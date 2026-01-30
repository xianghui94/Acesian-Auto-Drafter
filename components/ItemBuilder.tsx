import React, { useState, useEffect } from 'react';
import { ComponentType, DuctParams } from '../types';
import { generateDuctDrawing } from '../services/geminiService';

interface ItemBuilderProps {
  onAddItem: (item: any) => void;
}

export const ItemBuilder: React.FC<ItemBuilderProps> = ({ onAddItem }) => {
  const [componentType, setComponentType] = useState<ComponentType>(ComponentType.ELBOW);
  
  // Params
  const [params, setParams] = useState<DuctParams>({ d1: 500, angle: 90 });
  
  // Metadata
  const [meta, setMeta] = useState({
    material: "SS304 2B",
    thickness: "0.8",
    qty: 1,
    coating: "No", // Default to No as requested
    tagNo: "",
    notes: ""
  });

  // Update defaults based on component type
  useEffect(() => {
    switch (componentType) {
      case ComponentType.ELBOW: setParams({ d1: 500, angle: 90 }); break;
      case ComponentType.REDUCER: setParams({ d1: 500, d2: 300, length: 500 }); break;
      case ComponentType.STRAIGHT: setParams({ d1: 300, length: 1000 }); break;
      case ComponentType.TEE: setParams({ main_d: 500, tap_d: 300 }); break;
      case ComponentType.TRANSFORMATION: setParams({ d1: 500, width: 500, height: 500, length: 300 }); break;
      case ComponentType.VOLUME_DAMPER: setParams({ d1: 200, length: 150, actuation: "Handle" }); break;
      case ComponentType.MULTIBLADE_DAMPER: setParams({ d1: 700, length: 400, bladeType: "Parallel" }); break;
      case ComponentType.STRAIGHT_WITH_TAPS: 
        setParams({ 
            d1: 500, 
            length: 1200, 
            tapQty: 1,
            seamAngle: 0,
            taps: [{ dist: 600, diameter: 150, angle: 0 }] 
        }); 
        break;
    }
  }, [componentType]);

  const handleParamChange = (key: string, val: any) => {
    let newParams = { ...params, [key]: val };
    
    // Special logic for Volume Damper Length
    if (componentType === ComponentType.VOLUME_DAMPER && key === 'd1') {
        const d = Number(val);
        // "relationship between diameter and length is fixed as shown in the table"
        // D <= 200 -> L = 150
        // D > 200  -> L = 224
        if (d <= 200) {
            newParams.length = 150;
        } else {
            newParams.length = 224;
        }
    }
    // Multiblade Damper fixed length
    if (componentType === ComponentType.MULTIBLADE_DAMPER && key === 'd1') {
        newParams.length = 400;
    }

    setParams(newParams);
  };

  const handleTapQtyChange = (newQty: number) => {
      if (newQty < 0) return;
      const currentTaps = params.taps || [];
      let newTaps = [...currentTaps];
      
      if (newQty > newTaps.length) {
          // Add new taps with defaults
          for (let i = newTaps.length; i < newQty; i++) {
              newTaps.push({ dist: 100, diameter: 100, angle: 0 });
          }
      } else if (newQty < newTaps.length) {
          // Remove from end
          newTaps = newTaps.slice(0, newQty);
      }
      
      setParams({ ...params, tapQty: newQty, taps: newTaps });
  };

  const handleTapUpdate = (index: number, field: string, value: number) => {
      const newTaps = [...(params.taps || [])];
      if (newTaps[index]) {
          newTaps[index] = { ...newTaps[index], [field]: value };
          setParams({ ...params, taps: newTaps });
      }
  };

  const handleAdd = async () => {
    // Auto-generate sketch (Instant now)
    let svg = await generateDuctDrawing(componentType, params);

    // Simplified description
    let description = componentType.split(' ')[0]; // Default fallback
    
    if (componentType === ComponentType.STRAIGHT) {
        description = "Straight Duct";
    } else if (componentType === ComponentType.TRANSFORMATION) {
        description = "Transformation Sq-Rd";
    } else if (componentType === ComponentType.VOLUME_DAMPER) {
        description = `VCD (${params.actuation})`;
    } else if (componentType === ComponentType.MULTIBLADE_DAMPER) {
        description = `${params.bladeType} Multiblade Damper`;
    } else if (componentType === ComponentType.STRAIGHT_WITH_TAPS) {
        description = `Straight w/ ${params.tapQty} Taps`;
    }
    
    onAddItem({
      componentType,
      params,
      ...meta,
      description,
      sketchSvg: svg
    });

    // Reset meta for next item (keep params)
    setMeta(prev => ({ ...prev, tagNo: "", qty: 1, notes: "" }));
  };

  const renderParamsInputs = () => {
    switch (componentType) {
      case ComponentType.ELBOW:
        return (
          <>
            <NumInput label="D1 (mm)" value={params.d1} onChange={v => handleParamChange('d1', v)} />
            <div>
                <label className="block text-[10px] uppercase font-bold text-cad-400 mb-1">Angle (°)</label>
                <select 
                    value={params.angle}
                    onChange={(e) => handleParamChange('angle', Number(e.target.value))}
                    className="w-full p-1.5 border border-cad-300 rounded text-sm bg-white font-mono"
                >
                    {[30, 45, 60, 90].map(deg => <option key={deg} value={deg}>{deg}</option>)}
                </select>
            </div>
          </>
        );
      case ComponentType.REDUCER:
        return (
          <>
            <NumInput label="D1 (mm)" value={params.d1} onChange={v => handleParamChange('d1', v)} />
            <NumInput label="D2 (mm)" value={params.d2} onChange={v => handleParamChange('d2', v)} />
            <NumInput label="Total L (mm)" value={params.length} onChange={v => handleParamChange('length', v)} />
          </>
        );
      case ComponentType.STRAIGHT:
        return (
            <>
              <NumInput label="D1 (mm)" value={params.d1} onChange={v => handleParamChange('d1', v)} />
              <NumInput label="Len (mm)" value={params.length} onChange={v => handleParamChange('length', v)} />
            </>
        );
      case ComponentType.TEE:
        return (
            <>
              <NumInput label="Main D (mm)" value={params.main_d} onChange={v => handleParamChange('main_d', v)} />
              <NumInput label="Tap D (mm)" value={params.tap_d} onChange={v => handleParamChange('tap_d', v)} />
            </>
        );
      case ComponentType.TRANSFORMATION:
        return (
            <>
              <NumInput label="Diameter Ø (mm)" value={params.d1} onChange={v => handleParamChange('d1', v)} />
              <NumInput label="Rect L (mm)" value={params.width} onChange={v => handleParamChange('width', v)} />
              <NumInput label="Rect W (mm)" value={params.height} onChange={v => handleParamChange('height', v)} />
              <NumInput label="Length L (mm)" value={params.length} onChange={v => handleParamChange('length', v)} />
            </>
        );
      case ComponentType.VOLUME_DAMPER:
        return (
            <>
              <NumInput label="Diameter Ø (mm)" value={params.d1} onChange={v => handleParamChange('d1', v)} />
              <div>
                  <label className="block text-[10px] uppercase font-bold text-cad-400 mb-1">Length L (Fixed)</label>
                  <input 
                      type="number" 
                      value={params.length} 
                      disabled
                      className="w-full p-1.5 border border-cad-200 bg-cad-50 rounded text-sm font-mono text-cad-500 cursor-not-allowed"
                  />
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold text-cad-400 mb-1">Actuation</label>
                <select 
                    value={params.actuation}
                    onChange={(e) => handleParamChange('actuation', e.target.value)}
                    className="w-full p-1.5 border border-cad-300 rounded text-sm bg-white"
                >
                    <option value="Handle">Handle</option>
                    <option value="Worm Gear">Worm Gear</option>
                </select>
            </div>
            </>
        );
      case ComponentType.MULTIBLADE_DAMPER:
        return (
            <>
              <NumInput label="Diameter Ø (mm)" value={params.d1} onChange={v => handleParamChange('d1', v)} />
              <div>
                  <label className="block text-[10px] uppercase font-bold text-cad-400 mb-1">Length L (Fixed)</label>
                  <input 
                      type="number" 
                      value={params.length} 
                      disabled
                      className="w-full p-1.5 border border-cad-200 bg-cad-50 rounded text-sm font-mono text-cad-500 cursor-not-allowed"
                  />
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold text-cad-400 mb-1">Blade Type</label>
                <select 
                    value={params.bladeType}
                    onChange={(e) => handleParamChange('bladeType', e.target.value)}
                    className="w-full p-1.5 border border-cad-300 rounded text-sm bg-white"
                >
                    <option value="Parallel">Parallel</option>
                    <option value="Opposed">Opposed</option>
                </select>
            </div>
            </>
        );
      case ComponentType.STRAIGHT_WITH_TAPS:
        return (
            <>
              <NumInput label="Main D (mm)" value={params.d1} onChange={v => handleParamChange('d1', v)} />
              <NumInput label="Total L (mm)" value={params.length} onChange={v => handleParamChange('length', v)} />
              <NumInput label="Qty of Taps" value={params.tapQty || 0} onChange={handleTapQtyChange} />
              
              <div>
                <label className="block text-[10px] uppercase font-bold text-cad-400 mb-1">Seam Pos (°)</label>
                <select 
                    value={params.seamAngle !== undefined ? params.seamAngle : 0}
                    onChange={(e) => handleParamChange('seamAngle', Number(e.target.value))}
                    className="w-full p-1.5 border border-cad-300 rounded text-sm bg-white font-mono"
                >
                    {[0, 45, 90, 135, 180, 225, 270, 315].map(deg => <option key={deg} value={deg}>{deg}</option>)}
                </select>
              </div>

              <div className="col-span-2 md:col-span-4 lg:col-span-6 mt-2">
                 <div className="bg-cad-50 border border-cad-200 rounded p-2">
                    <label className="block text-xs font-bold text-cad-500 mb-2 uppercase tracking-wide">Tap Configuration</label>
                    <div className="grid grid-cols-4 gap-2 mb-1 text-[10px] font-bold text-cad-400 px-1">
                        <div>#</div>
                        <div>Dist from End (mm)</div>
                        <div>Diameter (mm)</div>
                        <div>Angle (deg)</div>
                    </div>
                    {params.taps && params.taps.map((tap: any, idx: number) => (
                        <div key={idx} className="grid grid-cols-4 gap-2 mb-2 items-center">
                            <div className="text-xs font-mono font-bold text-center bg-cad-200 rounded py-1">{idx + 1}</div>
                            <input 
                                type="number" 
                                value={tap.dist} 
                                onChange={(e) => handleTapUpdate(idx, 'dist', Number(e.target.value))}
                                className="w-full p-1 border border-cad-300 rounded text-xs font-mono"
                                placeholder="Distance"
                            />
                            <input 
                                type="number" 
                                value={tap.diameter} 
                                onChange={(e) => handleTapUpdate(idx, 'diameter', Number(e.target.value))}
                                className="w-full p-1 border border-cad-300 rounded text-xs font-mono"
                                placeholder="Diameter"
                            />
                             <input 
                                type="number" 
                                value={tap.angle} 
                                onChange={(e) => handleTapUpdate(idx, 'angle', Number(e.target.value))}
                                className="w-full p-1 border border-cad-300 rounded text-xs font-mono"
                                placeholder="0 = Top"
                            />
                        </div>
                    ))}
                    {(!params.taps || params.taps.length === 0) && (
                        <div className="text-xs text-cad-400 italic p-2 text-center">No taps configured. Increase qty above.</div>
                    )}
                 </div>
              </div>
            </>
        );
    }
  };

  return (
    <div className="no-print bg-white border-b border-cad-200 p-4 shadow-sm z-20">
      <div className="flex flex-col xl:flex-row gap-6">
        
        {/* Left: Configuration */}
        <div className="flex-1 space-y-4">
            <div className="flex items-center gap-4">
                <select 
                    value={componentType}
                    onChange={(e) => setComponentType(e.target.value as ComponentType)}
                    className="p-2 border border-cad-300 rounded font-semibold text-cad-800"
                >
                    {Object.values(ComponentType).map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <div className="h-6 w-px bg-cad-200"></div>
                <h3 className="text-sm font-bold text-cad-500 uppercase">Item Config</h3>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {renderParamsInputs()}
                <TextInput label="Material" value={meta.material} onChange={v => setMeta(m => ({...m, material: v}))} />
                <TextInput label="Thk (mm)" value={meta.thickness} onChange={v => setMeta(m => ({...m, thickness: v}))} />
                
                {/* Coating Dropdown */}
                <div>
                    <label className="block text-[10px] uppercase font-bold text-cad-400 mb-1">Coating</label>
                    <select
                        value={meta.coating}
                        onChange={(e) => setMeta(m => ({...m, coating: e.target.value}))}
                        className="w-full p-1.5 border border-cad-300 rounded text-sm bg-white"
                    >
                        <option value="Yes">Yes</option>
                        <option value="No">No</option>
                        <option value="N/A">N/A</option>
                    </select>
                </div>

                <TextInput label="Tag No" value={meta.tagNo} onChange={v => setMeta(m => ({...m, tagNo: v}))} />
                <NumInput label="Qty" value={meta.qty} onChange={v => setMeta(m => ({...m, qty: v}))} />
            </div>

            {/* Notes Input */}
            <div>
               <label className="block text-[10px] uppercase font-bold text-cad-400 mb-1">Notes</label>
               <input 
                  type="text" 
                  value={meta.notes}
                  onChange={(e) => setMeta(m => ({...m, notes: e.target.value}))}
                  className="w-full p-1.5 border border-cad-300 rounded text-sm"
                  placeholder="Additional manufacturing notes..."
               />
            </div>
            
            <div className="flex justify-end pt-2">
                <button 
                    onClick={handleAdd}
                    className="px-8 py-3 bg-blue-600 text-white rounded hover:bg-blue-700 font-bold text-sm shadow-sm flex items-center gap-2 transition-all active:scale-95"
                >
                    + Add Item to Order Sheet
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

const NumInput = ({ label, value, onChange }: { label: string, value: number, onChange: (v: number) => void }) => (
    <div>
        <label className="block text-[10px] uppercase font-bold text-cad-400 mb-1">{label}</label>
        <input 
            type="number" 
            value={value} 
            onChange={(e) => onChange(Number(e.target.value))}
            className="w-full p-1.5 border border-cad-300 rounded text-sm font-mono"
        />
    </div>
);

const TextInput = ({ label, value, onChange }: { label: string, value: string, onChange: (v: string) => void }) => (
    <div>
        <label className="block text-[10px] uppercase font-bold text-cad-400 mb-1">{label}</label>
        <input 
            type="text" 
            value={value} 
            onChange={(e) => onChange(e.target.value)}
            className="w-full p-1.5 border border-cad-300 rounded text-sm"
        />
    </div>
);