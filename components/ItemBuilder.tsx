
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { ComponentType, DuctParams, OrderItem } from '../types';
import { generateDuctDrawing } from '../services/geminiService';
import { generateDescription } from '../services/descriptionService';
import { getDefaultParams } from '../services/componentRules';
import * as Inputs from './DuctInputs';
import { NumInput, TextInput } from './InputFields';
import { getFlangeParams } from '../services/flangeStandards';

export { getDefaultParams }; // Re-export for compatibility if needed elsewhere

interface ItemBuilderProps {
  onSave: (item: any) => void;
  editingItem: OrderItem | null;
  insertIndex: number | null;
  onCancel: () => void;
}

export const ItemBuilder: React.FC<ItemBuilderProps> = ({ onSave, editingItem, insertIndex, onCancel }) => {
  const [componentType, setComponentType] = useState<ComponentType>(ComponentType.ELBOW);
  const [isConfigOpen, setIsConfigOpen] = useState(true);
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);
  const [previewSvg, setPreviewSvg] = useState<string>("");
  const [activeField, setActiveField] = useState<string | null>(null);

  // Track modified fields to prevent auto-calc overrides
  const [dirtyFields, setDirtyFields] = useState<Set<string>>(new Set());

  // Persistence for "Last Used" configuration per component type
  const lastUsedParams = useRef<Record<string, DuctParams>>({});

  // Params
  const [params, setParams] = useState<DuctParams>(getDefaultParams(ComponentType.ELBOW));
  
  // Metadata
  const [meta, setMeta] = useState({
    material: "SS304 2B",
    thickness: "0.8",
    qty: 1,
    coating: "No",
    tagNo: "",
    notes: ""
  });

  // --- Keyboard Shortcuts ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        // Ctrl+Enter to Save
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            e.preventDefault();
            handleSave();
        }
        // Esc to Cancel Edit Mode
        if (e.key === 'Escape' && (editingItem || insertIndex !== null)) {
            e.preventDefault();
            onCancel();
        }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [params, meta, componentType, editingItem, insertIndex]);

  // --- Thumbnails Memoization ---
  const typeThumbnails = useMemo(() => {
    return Object.values(ComponentType).map(type => {
        const defs = getDefaultParams(type);
        const svg = generateDuctDrawing(type, defs, null);
        return { type, svg };
    });
  }, []);

  // --- Live Preview Effect ---
  useEffect(() => {
     // Whenever params, type, OR activeField changes, regenerate the preview
     const svg = generateDuctDrawing(componentType, params, activeField);
     setPreviewSvg(svg);
  }, [componentType, params, activeField]);

  // Load Edit Data
  useEffect(() => {
    if (editingItem) {
        setComponentType(editingItem.componentType);
        setParams(editingItem.params);
        setMeta({
            material: editingItem.material,
            thickness: editingItem.thickness,
            qty: editingItem.qty,
            coating: editingItem.coating,
            tagNo: editingItem.tagNo,
            notes: editingItem.notes
        });
        setIsConfigOpen(true);
        setIsSelectorOpen(false);
        // Assume all fields in an edited item are "dirty" (user intent preserved)
        setDirtyFields(new Set(Object.keys(editingItem.params)));
    }
  }, [editingItem]);

  // When switching types
  useEffect(() => {
    if (editingItem && editingItem.componentType === componentType) return;
    
    // Reset dirty fields
    setDirtyFields(new Set());

    // 1. Check if we have a saved config for this type
    if (lastUsedParams.current[componentType]) {
        setParams(lastUsedParams.current[componentType]);
    } else {
        // 2. Otherwise load default
        setParams(getDefaultParams(componentType));
    }

    // Default Meta handling for specific types (kept same as before)
    if (componentType === ComponentType.BLIND_PLATE) {
        setMeta(prev => ({ ...prev, thickness: "3.0" }));
    } else if (componentType === ComponentType.ANGLE_FLANGE) {
        setMeta(prev => ({ ...prev, coating: "No" }));
    } else if (componentType === ComponentType.OFFSET) {
        setMeta(prev => ({ ...prev, thickness: "0.9" }));
    } else if (componentType === ComponentType.SADDLE) {
        setMeta(prev => ({ ...prev, coating: "ETFE Coated", material: "SS304" }));
    } else {
        setMeta(prev => (prev.thickness === "3.0" ? { ...prev, thickness: "0.8" } : prev));
    }

  }, [componentType]);

  // Save params to "Last Used" whenever they change
  useEffect(() => {
      if (!editingItem) {
         lastUsedParams.current[componentType] = params;
      }
  }, [params, componentType, editingItem]);

  const handleParamChange = (key: string, val: any) => {
    // 1. Mark key as dirty
    setDirtyFields(prev => {
        const next = new Set(prev);
        next.add(key);
        return next;
    });

    let newParams = { ...params, [key]: val };
    
    // Helper: Only auto-calc if user hasn't touched the target field
    const shouldAutoCalc = (targetKey: string) => !dirtyFields.has(targetKey);

    // Auto-calc logic
    if (componentType === ComponentType.ELBOW && key === 'd1') {
        if (shouldAutoCalc('radius')) {
            const d = Number(val);
            newParams.radius = (d < 200) ? d * 1.0 : d * 0.5;
        }
    }
    if (componentType === ComponentType.VOLUME_DAMPER && key === 'd1') {
        if (shouldAutoCalc('length')) {
            const d = Number(val);
            newParams.length = (d <= 200) ? 150 : 224;
        }
    }
    // Multiblade Length is now freely editable, no auto-reset
    if ((componentType === ComponentType.TEE || componentType === ComponentType.CROSS_TEE) && key === 'tap_d') {
        if (shouldAutoCalc('length')) {
            newParams.length = Number(val) + 200;
        }
    }

    // Lateral Tee Auto-Calc Logic
    if (componentType === ComponentType.LATERAL_TEE) {
         const d3 = key === 'd2' ? Number(val) : Number(newParams.d2 || 0);
         const a = key === 'a_len' ? Number(val) : Number(newParams.a_len || 100);
         const b = key === 'b_len' ? Number(val) : Number(newParams.b_len || 100);
         const gap = d3 * 1.4142;

         if (key === 'd2') {
             // 1. Update B default if not dirty
             let currentB = b;
             if (shouldAutoCalc('b_len')) {
                 currentB = d3 >= 1000 ? 150 : 100;
                 newParams.b_len = currentB;
             }
             // 2. Update Length based on new Gap + A + B
             if (shouldAutoCalc('length')) {
                 newParams.length = Math.round(gap + a + currentB);
             }
             // 3. Update Branch Length default
             if (shouldAutoCalc('branch_len')) {
                 newParams.branch_len = Math.round(gap + 200);
             }
         }
         else if (key === 'a_len') {
             // Change a -> Update Length (L = gap + a + b)
             if (shouldAutoCalc('length')) {
                 newParams.length = Math.round(gap + Number(val) + b);
             }
         }
         else if (key === 'b_len') {
             // Change b -> Update Length (L = gap + a + b)
             if (shouldAutoCalc('length')) {
                 newParams.length = Math.round(gap + a + Number(val));
             }
         }
         else if (key === 'length') {
             // Change Length -> Update b (Standard practice: Outlet collar absorbs length change)
             // L = gap + a + b  =>  b = L - gap - a
             if (shouldAutoCalc('b_len')) {
                 const newB = Math.max(0, Math.round(Number(val) - gap - a));
                 newParams.b_len = newB;
             }
         }
    }

    // Boot Tee Logic
    if (componentType === ComponentType.BOOT_TEE) {
        const d2 = key === 'd2' ? Number(val) : Number(newParams.d2 || 300);
        const a = key === 'a_len' ? Number(val) : Number(newParams.a_len || 100);
        const b = key === 'b_len' ? Number(val) : Number(newParams.b_len || 100);
        const SLOPE_W = 100; // Fixed

        // Auto-calc Length: L = a + slope + d2 + b
        if (key === 'd2' || key === 'a_len' || key === 'b_len') {
            if (shouldAutoCalc('length')) {
                 newParams.length = a + SLOPE_W + d2 + b;
            }
        }
        else if (key === 'length') {
            // If user changes L, adjust b
            // b = L - a - slope - d2
            if (shouldAutoCalc('b_len')) {
                const newB = Math.max(0, Number(val) - a - SLOPE_W - d2);
                newParams.b_len = newB;
            }
        }

        // Auto-calc Thickness based on D1
        if (key === 'd1') {
            const d = Number(val);
            let t = "0.9";
            if (d < 800) t = "0.9";
            else if (d <= 900) t = "1.0";
            else if (d <= 1200) t = "1.2";
            else if (d <= 1500) t = "1.5";
            else if (d > 1500) t = "2.0";
            setMeta(prev => ({...prev, thickness: t}));
        }
    }

    // Flange Standard Auto-Calc for Blind Plate and Angle Flange
    if ((componentType === ComponentType.BLIND_PLATE || componentType === ComponentType.ANGLE_FLANGE) && key === 'd1') {
        const d = Number(val);
        const std = getFlangeParams(d);
        if (shouldAutoCalc('pcd')) newParams.pcd = std.bcd;
        if (shouldAutoCalc('holeCount')) newParams.holeCount = std.holeCount;
    }

    // Offset Logic
    if (componentType === ComponentType.OFFSET && key === 'd1') {
        const d = Number(val);
        // Sync D2 if not modified by user
        if (shouldAutoCalc('d2')) {
            newParams.d2 = d;
        }

        // Thickness Logic
        let thk = "0.9";
        if (d <= 500) thk = "0.9";
        else if (d <= 650) thk = "1.2";
        else if (d <= 1100) thk = "1.5";
        else thk = "2.0";
        setMeta(prev => ({...prev, thickness: thk}));
    }
    
    setParams(newParams);
  };

  // --- Tap/NPT Handlers ---
  const handleTapQtyChange = (newQty: number) => {
      if (newQty < 0) return;
      const currentTaps = params.taps || [];
      let newTaps = [...currentTaps];
      if (newQty > newTaps.length) {
          for (let i = newTaps.length; i < newQty; i++) newTaps.push({ dist: 100, diameter: 100, angle: 0, remark: "" });
      } else if (newQty < newTaps.length) {
          newTaps = newTaps.slice(0, newQty);
      }
      setParams({ ...params, tapQty: newQty, taps: newTaps });
  };
  const handleNptQtyChange = (newQty: number) => {
      if (newQty < 0) return;
      const currentPorts = params.nptPorts || [];
      let newPorts = [...currentPorts];
      if (newQty > newPorts.length) {
          for (let i = newPorts.length; i < newQty; i++) newPorts.push({ dist: 100, size: '1"', angle: 0, remark: "" });
      } else if (newQty < newPorts.length) {
          newPorts = newPorts.slice(0, newQty);
      }
      setParams({ ...params, nptQty: newQty, nptPorts: newPorts });
  };
  const handleTapUpdate = (index: number, field: string, value: any) => {
      const newTaps = [...(params.taps || [])];
      if (newTaps[index]) { newTaps[index] = { ...newTaps[index], [field]: value }; setParams({ ...params, taps: newTaps }); }
  };
  const handleNptUpdate = (index: number, field: string, value: any) => {
      const newPorts = [...(params.nptPorts || [])];
      if (newPorts[index]) { newPorts[index] = { ...newPorts[index], [field]: value }; setParams({ ...params, nptPorts: newPorts }); }
  };

  const handleSave = async () => {
    // Generate Description using shared service
    const description = generateDescription(componentType, params);
    
    onSave({ componentType, params, ...meta, description, sketchSvg: previewSvg });
    if (!editingItem) setMeta(prev => ({ ...prev, tagNo: "", qty: 1, notes: "" }));
  };

  const renderParamsInputs = () => {
    const inputProps = {
        params,
        onChange: handleParamChange,
        onFocus: (id: string) => setActiveField(id),
        onBlur: () => setActiveField(null)
    };

    switch (componentType) {
      case ComponentType.ELBOW: return <Inputs.ElbowInputs {...inputProps} />;
      case ComponentType.REDUCER: return <Inputs.ReducerInputs {...inputProps} />;
      case ComponentType.STRAIGHT: return <Inputs.StraightInputs {...inputProps} />;
      case ComponentType.TEE: return <Inputs.TeeInputs {...inputProps} />;
      case ComponentType.CROSS_TEE: return <Inputs.CrossTeeInputs {...inputProps} />;
      case ComponentType.LATERAL_TEE: return <Inputs.LateralTeeInputs {...inputProps} />;
      case ComponentType.BOOT_TEE: return <Inputs.BootTeeInputs {...inputProps} />;
      case ComponentType.TRANSFORMATION: return <Inputs.TransformationInputs {...inputProps} />;
      case ComponentType.VOLUME_DAMPER: return <Inputs.VolumeDamperInputs {...inputProps} />;
      case ComponentType.MULTIBLADE_DAMPER: return <Inputs.MultibladeDamperInputs {...inputProps} />;
      case ComponentType.STRAIGHT_WITH_TAPS: return <Inputs.StraightWithTapsInputs {...inputProps} onTapQtyChange={handleTapQtyChange} onNptQtyChange={handleNptQtyChange} onTapUpdate={handleTapUpdate} onNptUpdate={handleNptUpdate} />;
      case ComponentType.BLIND_PLATE: return <Inputs.BlindPlateInputs {...inputProps} />;
      case ComponentType.BLAST_GATE_DAMPER: return <Inputs.BlastGateDamperInputs {...inputProps} />;
      case ComponentType.ANGLE_FLANGE: return <Inputs.AngleFlangeInputs {...inputProps} />;
      case ComponentType.OFFSET: return <Inputs.OffsetInputs {...inputProps} />;
      case ComponentType.SADDLE: return <Inputs.SaddleInputs {...inputProps} />;
      case ComponentType.MANUAL: return <Inputs.ManualInputs {...inputProps} />;
    }
  };

  const getModeLabel = () => {
      if (editingItem) return `EDITING ITEM #${editingItem.itemNo}`;
      if (insertIndex !== null) return `INSERTING AT ITEM #${insertIndex + 1}`;
      return "ADD NEW ITEM";
  };

  // SVG Click Handler for Bi-Directional Focusing
  const handleSvgClick = (e: React.MouseEvent<HTMLDivElement>) => {
      let target = e.target as HTMLElement;
      // Traverse up to find data-param group if clicked on child (path/text/arrow)
      while (target && target !== e.currentTarget) {
          const param = target.getAttribute('data-param');
          if (param) {
              const input = document.getElementById(param);
              if (input) {
                  input.focus();
                  setActiveField(param);
              }
              break;
          }
          target = target.parentElement as HTMLElement;
      }
  };

  return (
    <div className={`no-print bg-white border-b border-cad-200 shadow-sm z-20 transition-all duration-300 flex flex-col ${editingItem ? 'border-l-4 border-l-orange-500' : insertIndex !== null ? 'border-l-4 border-l-green-500' : ''}`}>
        {/* ... Header Bar (Unchanged) ... */}
        <div className="flex items-center justify-between p-4 bg-gray-50 border-b border-cad-100">
            <div className="flex items-center gap-4">
                <div className="relative">
                    <button 
                        onClick={() => setIsSelectorOpen(!isSelectorOpen)}
                        className="flex items-center gap-2 bg-white border border-cad-300 px-3 py-2 rounded shadow-sm hover:border-blue-500 hover:ring-1 hover:ring-blue-500 transition-all text-left min-w-[200px]"
                    >
                        <div className="flex flex-col">
                            <span className="text-[10px] uppercase font-bold text-cad-400 leading-none mb-0.5">Component Type</span>
                            <span className="font-bold text-cad-800 text-sm">{componentType.split('(')[0]}</span>
                        </div>
                        <span className="ml-auto text-cad-400">▼</span>
                    </button>

                    {isSelectorOpen && (
                        <div className="absolute top-full left-0 mt-2 w-[500px] bg-white border border-cad-200 shadow-xl rounded-lg z-50 p-2 grid grid-cols-3 gap-2 max-h-[60vh] overflow-y-auto">
                            {typeThumbnails.map((item) => (
                                <button
                                    key={item.type}
                                    onClick={() => { setComponentType(item.type); setIsSelectorOpen(false); }}
                                    className={`flex flex-col items-center p-2 rounded border hover:bg-blue-50 hover:border-blue-300 transition-all ${componentType === item.type ? 'bg-blue-50 border-blue-500 ring-1 ring-blue-500' : 'border-cad-100'}`}
                                >
                                    <div className="w-full h-20 bg-white mb-2 overflow-hidden flex items-center justify-center p-1 border border-cad-100 rounded">
                                        {item.type === ComponentType.MANUAL ? (
                                            <div className="text-[10px] text-cad-400 italic text-center px-1">Blank / Custom</div>
                                        ) : (
                                            <div dangerouslySetInnerHTML={{__html: item.svg}} className="w-full h-full" />
                                        )}
                                    </div>
                                    <span className="text-[10px] font-bold text-center leading-tight text-cad-700">
                                        {item.type.split('(')[0]}
                                    </span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <div className="h-8 w-px bg-cad-200"></div>
                
                <h3 className={`text-sm font-bold uppercase flex items-center gap-2 ${editingItem ? 'text-orange-600' : insertIndex !== null ? 'text-green-600' : 'text-cad-500'}`}>
                    {getModeLabel()}
                </h3>
            </div>
            
            <button 
                onClick={() => setIsConfigOpen(!isConfigOpen)}
                className="text-cad-500 hover:text-cad-800 text-xs font-bold uppercase tracking-wider flex items-center gap-1 p-2 rounded hover:bg-cad-100"
            >
                {isConfigOpen ? "Hide Builder" : "Show Builder"}
            </button>
        </div>

        {/* Builder Content Area */}
        <div className={`overflow-hidden transition-all duration-300 ease-in-out bg-white ${isConfigOpen ? 'max-h-[1200px] opacity-100' : 'max-h-0 opacity-0'}`}>
            <div className="flex flex-col lg:flex-row h-full">
                
                {/* Left: Inputs Panel */}
                <div className="flex-1 p-6 space-y-6 lg:border-r border-cad-100">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {renderParamsInputs()}
                    </div>
                    
                    <div className="border-t border-cad-100 pt-4">
                        <label className="block text-xs font-bold text-cad-500 mb-2 uppercase tracking-wide">Metadata</label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <TextInput label="Material" value={meta.material} onChange={v => setMeta(m => ({...m, material: v}))} />
                            <TextInput label="Thk" value={meta.thickness} onChange={v => setMeta(m => ({...m, thickness: v}))} />
                            
                            <div>
                                <label className="block text-[10px] uppercase font-bold text-cad-400 mb-1 tracking-wider">Coating</label>
                                <select
                                    value={meta.coating}
                                    onChange={(e) => setMeta(m => ({...m, coating: e.target.value}))}
                                    className="w-full p-2 border border-cad-300 rounded text-sm bg-white focus:border-blue-500 outline-none"
                                >
                                    <option value="Yes">Yes</option>
                                    <option value="No">No</option>
                                    <option value="N/A">N/A</option>
                                    <option value="ETFE Coated">ETFE Coated</option>
                                </select>
                            </div>

                            <NumInput label="Qty" value={meta.qty} onChange={v => setMeta(m => ({...m, qty: v}))} step={1} />
                        </div>
                        <div className="grid grid-cols-4 gap-4 mt-4">
                            <div className="col-span-1">
                                <TextInput label="Tag No" value={meta.tagNo} onChange={v => setMeta(m => ({...m, tagNo: v}))} />
                            </div>
                            <div className="col-span-3">
                                <label className="block text-[10px] uppercase font-bold text-cad-400 mb-1 tracking-wider">Notes</label>
                                <input 
                                    type="text" 
                                    value={meta.notes}
                                    onChange={(e) => setMeta(m => ({...m, notes: e.target.value}))}
                                    className="w-full p-2 border border-cad-300 rounded text-sm focus:border-blue-500 outline-none"
                                    placeholder="Manufacturing notes..."
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end pt-4 gap-2">
                        {(editingItem || insertIndex !== null) && (
                            <button 
                                onClick={onCancel}
                                className="px-6 py-3 bg-gray-100 text-gray-600 rounded hover:bg-gray-200 font-bold text-sm"
                            >
                                Cancel (Esc)
                            </button>
                        )}
                        <button 
                            onClick={handleSave}
                            className={`px-8 py-3 rounded text-white font-bold text-sm shadow-sm flex items-center gap-2 transition-all active:scale-95 ${
                                editingItem ? 'bg-orange-600 hover:bg-orange-700' : 
                                insertIndex !== null ? 'bg-green-600 hover:bg-green-700' : 
                                'bg-blue-600 hover:bg-blue-700'
                            }`}
                        >
                            {editingItem ? '💾 Save Changes (Ctrl+Enter)' : insertIndex !== null ? '⇩ Insert Item (Ctrl+Enter)' : '+ Add Item (Ctrl+Enter)'}
                        </button>
                    </div>
                </div>

                {/* Right: Live Preview Panel */}
                <div className="w-full lg:w-[450px] bg-cad-50 p-6 flex flex-col border-t lg:border-t-0">
                    <div className="flex items-center justify-between mb-2">
                        <h4 className="text-xs font-bold text-cad-500 uppercase tracking-wide">Live Preview</h4>
                        <span className="text-[10px] text-cad-400 bg-cad-100 px-2 py-1 rounded">Interactive</span>
                    </div>
                    
                    <div className="flex-1 bg-white border border-cad-200 rounded-lg shadow-inner overflow-hidden flex items-center justify-center p-2 min-h-[300px]">
                        {componentType === ComponentType.MANUAL ? (
                            <div className="text-cad-300 text-sm italic text-center px-8">
                                <span className="text-2xl block mb-2">📝</span>
                                Manual Mode Active<br/>
                                No sketch will be generated
                            </div>
                        ) : previewSvg ? (
                            <div 
                                className="w-full h-full flex items-center justify-center"
                                dangerouslySetInnerHTML={{ __html: previewSvg }}
                                onClick={handleSvgClick}
                            />
                        ) : (
                            <div className="text-cad-300 text-sm italic">Generating Preview...</div>
                        )}
                    </div>
                    
                    <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded text-xs text-blue-800 flex items-start gap-2">
                        <span className="text-lg leading-none">💡</span>
                        <div>
                            <strong>Pro Tip:</strong> Click any dimension in the drawing to focus the input field, or click an input field to highlight the dimension!
                        </div>
                    </div>
                </div>

            </div>
        </div>
    </div>
  );
};
