import React, { useState, useEffect } from 'react';
import { ComponentType, DuctParams } from '../types';
import { generateDuctDrawing } from '../services/geminiService';
import * as Inputs from './DuctInputs';

interface ItemBuilderProps {
  onAddItem: (item: any) => void;
}

export const ItemBuilder: React.FC<ItemBuilderProps> = ({ onAddItem }) => {
  const [componentType, setComponentType] = useState<ComponentType>(ComponentType.ELBOW);
  const [isConfigOpen, setIsConfigOpen] = useState(true);
  
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
      case ComponentType.ELBOW: 
        // Initial defaults for Elbow
        // Default D=500. For D>=200, we use Throat R = 0.5D -> 250
        setParams({ d1: 500, angle: 90, radius: 250, extension1: 0, extension2: 0, flangeRemark1: "", flangeRemark2: "" }); 
        break;
      case ComponentType.REDUCER: 
        setParams({ d1: 500, d2: 300, length: 500, extension1: 50, extension2: 50, flangeRemark1: "", flangeRemark2: "" }); 
        break;
      case ComponentType.STRAIGHT: 
        setParams({ d1: 300, length: 1000, flangeRemark1: "", flangeRemark2: "" }); 
        break;
      case ComponentType.TEE: 
        setParams({ 
            main_d: 500, 
            tap_d: 300, 
            length: 500, 
            branch_l: 100, 
            flangeRemark1: "", // Left
            flangeRemark2: "", // Right
            flangeRemark3: ""  // Branch
        }); 
        break;
      case ComponentType.TRANSFORMATION: setParams({ d1: 500, width: 500, height: 500, length: 300, flangeRemark1: "", flangeRemark2: "" }); break;
      case ComponentType.VOLUME_DAMPER: setParams({ d1: 200, length: 150, actuation: "Handle" }); break;
      case ComponentType.MULTIBLADE_DAMPER: setParams({ d1: 700, length: 400, bladeType: "Parallel" }); break;
      case ComponentType.STRAIGHT_WITH_TAPS: 
        setParams({ 
            d1: 500, 
            length: 1200, 
            tapQty: 1,
            nptQty: 0,
            seamAngle: 0,
            flangeRemark1: "", 
            flangeRemark2: "",
            taps: [{ dist: 600, diameter: 150, angle: 0, remark: "" }],
            nptPorts: []
        }); 
        break;
      case ComponentType.BLIND_PLATE: setParams({ d1: 200 }); break;
      case ComponentType.BLAST_GATE_DAMPER: setParams({ d1: 200, length: 200 }); break;
      case ComponentType.ANGLE_FLANGE: setParams({ d1: 800 }); break;
      case ComponentType.OFFSET: setParams({ d1: 500, length: 800, offset: 200, flangeRemark1: "", flangeRemark2: "" }); break;
    }

    // Default Meta handling for specific types
    if (componentType === ComponentType.BLIND_PLATE) {
        setMeta(prev => ({ ...prev, thickness: "3.0" }));
    } else if (componentType === ComponentType.ANGLE_FLANGE) {
        // Default is bare (Coating: No)
        setMeta(prev => ({ ...prev, coating: "No" }));
    } else if (componentType === ComponentType.OFFSET) {
        // Initial check for Offset thickness default
        setMeta(prev => ({ ...prev, thickness: "0.9" }));
    } else {
        // Reset to standard duct thickness if it was the blind plate default
        setMeta(prev => (prev.thickness === "3.0" ? { ...prev, thickness: "0.8" } : prev));
    }

  }, [componentType]);

  const handleParamChange = (key: string, val: any) => {
    let newParams = { ...params, [key]: val };
    
    // Elbow Radius Auto-calc logic: 
    // If Diameter changes, update Radius.
    // "R" refers to Inner/Throat Radius.
    // D < 200: Centerline ~ 1.5D => Inner ~ 1.0D
    // D >= 200: Centerline ~ 1.0D => Inner ~ 0.5D
    if (componentType === ComponentType.ELBOW && key === 'd1') {
        const d = Number(val);
        newParams.radius = (d < 200) ? d * 1.0 : d * 0.5;
    }

    // Special logic for Volume Damper Length
    if (componentType === ComponentType.VOLUME_DAMPER && key === 'd1') {
        const d = Number(val);
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

    // Tee Length Auto-calc (L = Bd + 200)
    if (componentType === ComponentType.TEE && key === 'tap_d') {
        newParams.length = Number(val) + 200;
    }

    // Offset Thickness Logic (Based on Table)
    if (componentType === ComponentType.OFFSET && key === 'd1') {
        const d = Number(val);
        let thk = "0.9";
        if (d <= 500) thk = "0.9";
        else if (d <= 650) thk = "1.2";
        else if (d <= 1100) thk = "1.5";
        else thk = "2.0";
        setMeta(prev => ({...prev, thickness: thk}));
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
              newTaps.push({ dist: 100, diameter: 100, angle: 0, remark: "" });
          }
      } else if (newQty < newTaps.length) {
          // Remove from end
          newTaps = newTaps.slice(0, newQty);
      }
      
      setParams({ ...params, tapQty: newQty, taps: newTaps });
  };

  const handleNptQtyChange = (newQty: number) => {
      if (newQty < 0) return;
      const currentPorts = params.nptPorts || [];
      let newPorts = [...currentPorts];
      
      if (newQty > newPorts.length) {
          // Add new ports with defaults
          for (let i = newPorts.length; i < newQty; i++) {
              newPorts.push({ dist: 100, size: '1"', angle: 0, remark: "" });
          }
      } else if (newQty < newPorts.length) {
          // Remove from end
          newPorts = newPorts.slice(0, newQty);
      }
      
      setParams({ ...params, nptQty: newQty, nptPorts: newPorts });
  };

  const handleTapUpdate = (index: number, field: string, value: any) => {
      const newTaps = [...(params.taps || [])];
      if (newTaps[index]) {
          newTaps[index] = { ...newTaps[index], [field]: value };
          setParams({ ...params, taps: newTaps });
      }
  };

  const handleNptUpdate = (index: number, field: string, value: any) => {
      const newPorts = [...(params.nptPorts || [])];
      if (newPorts[index]) {
          newPorts[index] = { ...newPorts[index], [field]: value };
          setParams({ ...params, nptPorts: newPorts });
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
        let desc = "Straight";
        if (params.tapQty > 0) desc += ` w/ ${params.tapQty} Taps`;
        if (params.nptQty > 0) desc += ` & ${params.nptQty} NPT`;
        description = desc;
    } else if (componentType === ComponentType.BLIND_PLATE) {
        description = `Blind Plate Ø${params.d1}`;
    } else if (componentType === ComponentType.BLAST_GATE_DAMPER) {
        description = `Blast Gate Damper Ø${params.d1}`;
    } else if (componentType === ComponentType.ANGLE_FLANGE) {
        description = `Angle Flange Ø${params.d1}`;
    } else if (componentType === ComponentType.TEE) {
        description = `Tee Ø${params.main_d} / Ø${params.tap_d}`;
    } else if (componentType === ComponentType.OFFSET) {
        description = `Offset Ø${params.d1} / L=${params.length} / H=${params.offset}`;
    } else if (componentType === ComponentType.ELBOW) {
        description = `Elbow Ø${params.d1} / ${params.angle}° / R${params.radius}`;
        if (params.extension1 > 0 || params.extension2 > 0) {
            description += ` / Ext:${params.extension1 || 0}+${params.extension2 || 0}`;
        }
    } else if (componentType === ComponentType.REDUCER) {
        description = `Reducer Ø${params.d1} / Ø${params.d2} / L${params.length}`;
        if (params.extension1 !== 50 || params.extension2 !== 50) {
             description += ` / RC:${params.extension1}-${params.extension2}`;
        }
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
        return <Inputs.ElbowInputs params={params} onChange={handleParamChange} />;
      case ComponentType.REDUCER:
        return <Inputs.ReducerInputs params={params} onChange={handleParamChange} />;
      case ComponentType.STRAIGHT:
        return <Inputs.StraightInputs params={params} onChange={handleParamChange} />;
      case ComponentType.TEE:
        return <Inputs.TeeInputs params={params} onChange={handleParamChange} />;
      case ComponentType.TRANSFORMATION:
        return <Inputs.TransformationInputs params={params} onChange={handleParamChange} />;
      case ComponentType.VOLUME_DAMPER:
        return <Inputs.VolumeDamperInputs params={params} onChange={handleParamChange} />;
      case ComponentType.MULTIBLADE_DAMPER:
        return <Inputs.MultibladeDamperInputs params={params} onChange={handleParamChange} />;
      case ComponentType.STRAIGHT_WITH_TAPS:
        return (
            <Inputs.StraightWithTapsInputs 
                params={params} 
                onChange={handleParamChange} 
                onTapQtyChange={handleTapQtyChange}
                onNptQtyChange={handleNptQtyChange}
                onTapUpdate={handleTapUpdate}
                onNptUpdate={handleNptUpdate}
            />
        );
      case ComponentType.BLIND_PLATE:
        return <Inputs.BlindPlateInputs params={params} onChange={handleParamChange} />;
      case ComponentType.BLAST_GATE_DAMPER:
        return <Inputs.BlastGateDamperInputs params={params} onChange={handleParamChange} />;
      case ComponentType.ANGLE_FLANGE:
        return <Inputs.AngleFlangeInputs params={params} onChange={handleParamChange} />;
      case ComponentType.OFFSET:
        return <Inputs.OffsetInputs params={params} onChange={handleParamChange} />;
    }
  };

  return (
    <div className="no-print bg-white border-b border-cad-200 p-4 shadow-sm z-20 transition-all duration-300">
      <div className="flex flex-col gap-4">
        
        {/* Header / Component Selector Row */}
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
                <select 
                    value={componentType}
                    onChange={(e) => setComponentType(e.target.value as ComponentType)}
                    className="p-2 border border-cad-300 rounded font-semibold text-cad-800 focus:ring-2 focus:ring-blue-500 outline-none"
                >
                    {Object.values(ComponentType).map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <div className="h-6 w-px bg-cad-200"></div>
                <h3 className="text-sm font-bold text-cad-500 uppercase flex items-center gap-2">
                    Item Config
                </h3>
            </div>
            
            <button 
                onClick={() => setIsConfigOpen(!isConfigOpen)}
                className="text-cad-500 hover:text-cad-800 text-xs font-bold uppercase tracking-wider flex items-center gap-1 p-2 rounded hover:bg-cad-50"
            >
                {isConfigOpen ? (
                    <>
                        <span>Hide Config</span>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
                    </>
                ) : (
                    <>
                        <span>Show Config</span>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                    </>
                )}
            </button>
        </div>

        {/* Collapsible Content */}
        <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isConfigOpen ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0'}`}>
            <div className="flex flex-col gap-4 pt-2">
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
                
                <div className="flex justify-end pt-2 border-t border-cad-100 mt-2">
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