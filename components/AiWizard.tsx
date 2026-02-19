
import React, { useState, useEffect, useRef } from 'react';
import { parseExcelWithGemini } from '../services/aiAgent';
import { generateDuctDrawing } from '../services/geminiService';
import { generateDescription } from '../services/descriptionService';
import { hydrateItemParams, getDefaultParams } from '../services/componentRules';
import { OrderItem, ComponentType, DuctParams } from '../types';

interface AiWizardProps {
    onClose: () => void;
    onImport: (items: any[]) => void;
}

interface EditableItem extends Partial<OrderItem> {
    params: DuctParams;
    originalDescription?: string;
    confidence?: number;
    reasoning?: string;
    validationStatus: 'ok' | 'warning' | 'error';
}

type Stage = 'UPLOAD' | 'THINKING' | 'VERIFY';

// --- Helper UI Components ---

const MiniInput = ({ label, value, onChange }: { label: string, value: any, onChange: (v: any) => void }) => (
    <div className="flex flex-col flex-1 min-w-[60px]">
        <label className="text-[10px] text-slate-400 uppercase font-bold mb-1">{label}</label>
        <input 
            type="number" 
            value={value || ''} 
            onChange={(e) => onChange(Number(e.target.value))}
            className="w-full bg-slate-900 border border-slate-600 rounded px-2 py-1.5 text-white text-sm focus:border-blue-500 outline-none transition-colors"
        />
    </div>
);

const ParamEditor = ({ type, params, onChange }: { type: ComponentType, params: DuctParams, onChange: (key: string, val: any) => void }) => {
    switch (type) {
        case ComponentType.ELBOW:
            return (
                <div className="flex gap-4 w-full">
                    <MiniInput label="Diameter Ø" value={params.d1} onChange={v => onChange('d1', v)} />
                    <MiniInput label="Angle °" value={params.angle} onChange={v => onChange('angle', v)} />
                    <MiniInput label="Radius R" value={params.radius} onChange={v => onChange('radius', v)} />
                </div>
            );
        case ComponentType.REDUCER:
            return (
                <div className="flex gap-4 w-full">
                    <MiniInput label="Diameter Ø1" value={params.d1} onChange={v => onChange('d1', v)} />
                    <MiniInput label="Diameter Ø2" value={params.d2} onChange={v => onChange('d2', v)} />
                    <MiniInput label="Length L" value={params.length} onChange={v => onChange('length', v)} />
                </div>
            );
        case ComponentType.STRAIGHT:
            return (
                <div className="flex gap-4 w-full">
                    <MiniInput label="Diameter Ø" value={params.d1} onChange={v => onChange('d1', v)} />
                    <MiniInput label="Length L" value={params.length} onChange={v => onChange('length', v)} />
                </div>
            );
        case ComponentType.TEE:
        case ComponentType.CROSS_TEE:
            return (
                <div className="flex gap-4 w-full">
                    <MiniInput label="Main Ø" value={params.main_d} onChange={v => onChange('main_d', v)} />
                    <MiniInput label="Tap Ø" value={params.tap_d} onChange={v => onChange('tap_d', v)} />
                    <MiniInput label="Body L" value={params.length} onChange={v => onChange('length', v)} />
                    <MiniInput label="Branch L" value={params.branch_l} onChange={v => onChange('branch_l', v)} />
                </div>
            );
        case ComponentType.LATERAL_TEE:
        case ComponentType.BOOT_TEE:
            return (
                <div className="flex gap-4 w-full">
                    <MiniInput label="Main Ø (D1)" value={params.d1} onChange={v => onChange('d1', v)} />
                    <MiniInput label="Branch Ø (D2)" value={params.d2} onChange={v => onChange('d2', v)} />
                    <MiniInput label="Length L" value={params.length} onChange={v => onChange('length', v)} />
                </div>
            );
        case ComponentType.OFFSET:
             return (
                <div className="flex gap-4 w-full">
                    <MiniInput label="Diameter Ø" value={params.d1} onChange={v => onChange('d1', v)} />
                    <MiniInput label="Length L" value={params.length} onChange={v => onChange('length', v)} />
                    <MiniInput label="Offset H" value={params.offset} onChange={v => onChange('offset', v)} />
                </div>
            );
        default:
            return (
                <div className="flex gap-4 w-full">
                    <MiniInput label="Diameter Ø" value={params.d1} onChange={v => onChange('d1', v)} />
                    {params.length !== undefined && <MiniInput label="Length L" value={params.length} onChange={v => onChange('length', v)} />}
                </div>
            );
    }
};

const ConfidenceBadge = ({ score }: { score: number }) => {
    let color = "bg-green-500";
    let label = "High";
    if (score < 0.6) {
        color = "bg-red-500";
        label = "Low";
    } else if (score < 0.9) {
        color = "bg-yellow-500";
        label = "Med";
    }

    return (
        <div className="flex items-center gap-1.5" title={`AI Confidence Score: ${(score * 100).toFixed(0)}%`}>
            <div className={`w-2 h-2 rounded-full ${color} shadow-[0_0_8px_rgba(0,0,0,0.5)]`}></div>
            <span className={`text-[10px] font-bold ${score < 0.6 ? 'text-red-400' : score < 0.9 ? 'text-yellow-400' : 'text-green-400'}`}>
                {label}
            </span>
        </div>
    );
};

export const AiWizard: React.FC<AiWizardProps> = ({ onClose, onImport }) => {
    const [stage, setStage] = useState<Stage>('UPLOAD');
    const [file, setFile] = useState<File | null>(null);
    const [extractedItems, setExtractedItems] = useState<EditableItem[]>([]);
    const [selectedIndex, setSelectedIndex] = useState<number>(0);
    const [error, setError] = useState<string>("");
    const [logs, setLogs] = useState<string[]>([]);
    
    // API Key State
    const [apiKey, setApiKey] = useState(() => localStorage.getItem('acesian_gemini_key') || "");
    const [showKeyInput, setShowKeyInput] = useState(() => !localStorage.getItem('acesian_gemini_key'));

    // --- Effects ---

    // Log simulation
    useEffect(() => {
        if (stage === 'THINKING') {
            setLogs([]);
            const messages = [
                "Initializing Gemini 2.5 Flash...",
                "Reading Excel file...",
                "Identifying HVAC components...",
                "Extracting geometry & dimensions...",
                "Calculating confidence scores...",
                "Validating engineering standards...",
                "Preparing drafting preview..."
            ];
            let i = 0;
            const interval = setInterval(() => {
                if (i < messages.length) {
                    setLogs(prev => [...prev, `> ${messages[i]}`]);
                    i++;
                }
            }, 800);
            return () => clearInterval(interval);
        }
    }, [stage]);

    // Validation Logic
    const validateItem = (item: EditableItem): 'ok' | 'warning' | 'error' => {
        // Critical Logic errors
        if (!item.componentType || item.componentType === ComponentType.MANUAL) return 'warning';
        if (!item.params.d1 && !item.params.main_d && !item.params.width) return 'error';
        
        // AI Confidence Check
        // If the AI itself flagged it as low confidence, treat as warning
        if (item.confidence !== undefined && item.confidence < 0.6) return 'warning';

        return 'ok';
    };

    // --- Handlers ---

    const handleApiKeyChange = (val: string) => {
        setApiKey(val);
        localStorage.setItem('acesian_gemini_key', val);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setError("");
        }
    };

    const downloadTemplate = () => {
        const headers = "Description,Qty,Tag No,Material,Thickness\n";
        const rows = "Elbow 500Dia 90Deg,2,EF-01,SS304,0.8\nReducer 500x300 L300,1,EF-02,SS304,0.8\nStraight Duct 500Dia L1200,5,EF-03,SS304,0.8";
        const blob = new Blob([headers + rows], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = "acesian_bom_template.csv";
        a.click();
    };

    const startProcessing = async () => {
        if (!file) return;
        if (!apiKey.trim()) {
            setError("Please enter a valid Gemini API Key.");
            setShowKeyInput(true);
            return;
        }

        setStage('THINKING');
        try {
            const rawItems = await parseExcelWithGemini(file, apiKey);
            
            const processedItems: EditableItem[] = rawItems.map((item, idx) => {
                const type = item.componentType || ComponentType.ELBOW;
                
                // CRITICAL: Hydrate with auto-calculation rules
                const safeParams = hydrateItemParams(type, item.params || {});
                
                const editableItem: EditableItem = {
                    ...item,
                    id: `ai-${Date.now()}-${idx}`,
                    componentType: type,
                    params: safeParams,
                    description: generateDescription(type, safeParams),
                    originalDescription: (item as any).originalDescription || "—",
                    confidence: (item as any).confidence || 0.5, // Default to low if missing
                    reasoning: (item as any).reasoning || "",
                    validationStatus: 'ok' // Will be recalculated
                };
                editableItem.validationStatus = validateItem(editableItem);
                return editableItem;
            });
            
            // Sort items so Errors/Warnings (Low Confidence) appear first
            processedItems.sort((a, b) => {
                const scoreA = (a.validationStatus === 'error' ? 0 : a.validationStatus === 'warning' ? 1 : 2);
                const scoreB = (b.validationStatus === 'error' ? 0 : b.validationStatus === 'warning' ? 1 : 2);
                return scoreA - scoreB;
            });
            
            setExtractedItems(processedItems);
            setSelectedIndex(0);
            setStage('VERIFY');
        } catch (err) {
            console.error(err);
            setError(err instanceof Error ? err.message : "Failed to process with AI");
            setStage('UPLOAD');
        }
    };

    const handleUpdateItem = (field: keyof EditableItem | 'params', val: any, paramKey?: string) => {
        setExtractedItems(prev => {
            const newItems = [...prev];
            const item = { ...newItems[selectedIndex] };

            if (field === 'params' && paramKey) {
                const newParams = { ...item.params, [paramKey]: val };
                item.params = newParams;
                if (item.componentType) {
                    item.description = generateDescription(item.componentType, newParams);
                }
                // If user manually edits, we can assume confidence goes up to 1.0 (Manual Override)
                item.confidence = 1.0; 
                item.reasoning = "Manually Verified";
            } else {
                (item as any)[field] = val;
                if (field === 'componentType') {
                    const newType = val as ComponentType;
                    item.params = getDefaultParams(newType);
                    item.description = generateDescription(newType, item.params);
                    item.confidence = 1.0; // Reset confidence on type change
                }
            }
            
            item.validationStatus = validateItem(item);
            newItems[selectedIndex] = item;
            return newItems;
        });
    };

    const handleFinish = () => {
        onImport(extractedItems);
        onClose();
    };

    // --- Renders ---

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-[fadeIn_0.2s_ease-out]">
            <div className="bg-slate-900 border border-slate-700 w-full max-w-[95vw] h-[90vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col">
                
                {/* Header */}
                <div className="bg-slate-800 p-4 border-b border-slate-700 flex justify-between items-center shrink-0">
                    <div>
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <span className="text-blue-400">✨</span> AI Auto-Drafter
                        </h2>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-hidden relative">
                    
                    {stage === 'UPLOAD' && (
                        <div className="flex flex-col items-center justify-center h-full max-w-2xl mx-auto space-y-8 p-6">
                             
                             {/* API Key Status */}
                             <div className="w-full bg-slate-800 rounded-lg p-4 border border-slate-700">
                                <div className="flex justify-between items-center mb-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Gemini API Key</label>
                                    {!showKeyInput && (
                                        <button onClick={() => setShowKeyInput(true)} className="text-xs text-blue-400 hover:underline">Change Key</button>
                                    )}
                                </div>
                                
                                {showKeyInput ? (
                                    <div className="flex gap-2">
                                        <input 
                                            type="password" 
                                            value={apiKey}
                                            onChange={(e) => handleApiKeyChange(e.target.value)}
                                            placeholder="Enter your API Key..."
                                            className="flex-1 bg-slate-900 border border-slate-600 rounded px-4 py-2 text-white focus:border-blue-500 outline-none"
                                        />
                                        <button onClick={() => setShowKeyInput(false)} className="px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded text-white text-xs">Done</button>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2 text-green-400 bg-green-900/20 px-3 py-2 rounded border border-green-900/50">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                        <span className="text-sm font-bold">Connected</span>
                                    </div>
                                )}
                                <p className="text-[10px] text-slate-500 mt-2">
                                    Don't have a key? <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">Get free key</a>
                                </p>
                            </div>

                            <div className="w-full border-2 border-dashed border-slate-600 rounded-xl p-12 flex flex-col items-center justify-center bg-slate-800/50 hover:bg-slate-800 transition-colors group cursor-pointer relative">
                                <input 
                                    type="file" 
                                    accept=".xlsx,.xls" 
                                    onChange={handleFileChange}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                />
                                <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                    <svg className="w-10 h-10 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                                </div>
                                <p className="text-lg font-medium text-slate-200">
                                    {file ? file.name : "Drop Excel BOM Here"}
                                </p>
                                <p className="text-sm text-slate-500 mt-2">or click to browse</p>
                            </div>

                            <button onClick={downloadTemplate} className="text-slate-400 text-sm flex items-center gap-2 hover:text-white transition-colors">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                Download Sample Template
                            </button>
                            
                            {error && (
                                <div className="text-red-400 bg-red-900/20 px-4 py-2 rounded text-sm border border-red-900/50 flex items-center gap-2">
                                    <span>⚠️</span> {error}
                                </div>
                            )}

                            <button 
                                onClick={startProcessing}
                                disabled={!file}
                                className={`w-full max-w-sm px-8 py-3 rounded-lg font-bold text-white shadow-lg flex items-center justify-center gap-2 transition-all ${
                                    file 
                                    ? 'bg-blue-600 hover:bg-blue-500 hover:shadow-blue-500/25 transform hover:-translate-y-0.5' 
                                    : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                                }`}
                            >
                                <span>Analyze with Gemini</span>
                            </button>
                        </div>
                    )}

                    {stage === 'THINKING' && (
                        <div className="flex flex-col items-center justify-center h-full space-y-8 p-6">
                             <div className="relative w-20 h-20">
                                <div className="absolute inset-0 border-4 border-slate-700 rounded-full"></div>
                                <div className="absolute inset-0 border-4 border-blue-500 rounded-full border-t-transparent animate-spin"></div>
                             </div>
                             
                             <div className="w-full max-w-md bg-slate-950 rounded-lg border border-slate-800 p-4 font-mono text-xs text-green-400 h-48 overflow-y-auto shadow-inner">
                                {logs.map((log, i) => (
                                    <div key={i} className="mb-1 opacity-80">{log}</div>
                                ))}
                                <div className="animate-pulse">_</div>
                             </div>
                        </div>
                    )}

                    {stage === 'VERIFY' && extractedItems.length > 0 && (
                        <div className="flex h-full">
                            {/* LEFT: Item List */}
                            <div className="w-1/3 border-r border-slate-700 bg-slate-800/30 flex flex-col">
                                <div className="p-3 border-b border-slate-700 bg-slate-800/50 flex justify-between items-center">
                                    <span className="text-xs font-bold text-slate-400 uppercase">Items ({extractedItems.length})</span>
                                    <div className="flex gap-2">
                                        <span className="text-[10px] bg-red-900/30 text-red-400 px-1.5 py-0.5 rounded border border-red-900/50">
                                            {extractedItems.filter(i => i.validationStatus !== 'ok').length} Alerts
                                        </span>
                                    </div>
                                </div>
                                <div className="flex-1 overflow-y-auto">
                                    {extractedItems.map((item, idx) => (
                                        <div 
                                            key={idx}
                                            onClick={() => setSelectedIndex(idx)}
                                            className={`p-3 border-b border-slate-700 cursor-pointer transition-colors flex gap-3 items-center ${
                                                selectedIndex === idx ? 'bg-blue-600/20 border-l-4 border-l-blue-500' : 'hover:bg-slate-700/30 border-l-4 border-l-transparent'
                                            }`}
                                        >
                                            {/* Status Dot */}
                                            <div className={`w-2 h-2 rounded-full shrink-0 ${
                                                item.validationStatus === 'ok' ? 'bg-green-500' : 
                                                item.validationStatus === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                                            }`} />
                                            
                                            {/* Small Thumb */}
                                            <div className="w-10 h-10 bg-white rounded flex items-center justify-center overflow-hidden shrink-0">
                                                <div dangerouslySetInnerHTML={{__html: generateDuctDrawing(item.componentType || ComponentType.ELBOW, item.params)}} className="w-full h-full scale-150" />
                                            </div>
                                            
                                            <div className="overflow-hidden flex-1">
                                                <div className="flex justify-between items-center">
                                                    <div className="text-sm font-medium text-slate-200 truncate pr-2">{item.description}</div>
                                                    <ConfidenceBadge score={item.confidence || 0} />
                                                </div>
                                                <div className="text-xs text-slate-500 truncate">{item.originalDescription}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* RIGHT: Detail Inspector */}
                            <div className="w-2/3 flex flex-col bg-slate-900">
                                {(() => {
                                    const item = extractedItems[selectedIndex];
                                    const svgPreview = generateDuctDrawing(item.componentType || ComponentType.ELBOW, item.params);
                                    
                                    return (
                                        <>
                                            {/* Top: Large Preview */}
                                            <div className="h-[45%] bg-slate-800/50 flex items-center justify-center border-b border-slate-700 relative p-4">
                                                <div className="w-full h-full bg-white rounded-lg overflow-hidden shadow-xl flex items-center justify-center p-4">
                                                    <div dangerouslySetInnerHTML={{__html: svgPreview}} className="w-full h-full" />
                                                </div>
                                                
                                                {/* Confidence Banner */}
                                                <div className="absolute top-4 left-4 bg-slate-900/90 backdrop-blur p-3 rounded border border-slate-600 max-w-md shadow-lg flex flex-col gap-2">
                                                    <div>
                                                        <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1">AI Reasoning</label>
                                                        <div className="flex items-center gap-2">
                                                            <ConfidenceBadge score={item.confidence || 0} />
                                                            <p className="text-xs text-slate-300 italic">{item.reasoning || "No explanation provided."}</p>
                                                        </div>
                                                    </div>
                                                    <div className="pt-2 border-t border-slate-700 mt-1">
                                                        <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Source</label>
                                                        <p className="text-xs text-white font-mono">{item.originalDescription}</p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Bottom: Edit Form */}
                                            <div className="flex-1 overflow-y-auto p-6">
                                                <div className="grid grid-cols-2 gap-8 mb-6">
                                                    <div>
                                                        <label className="text-xs text-slate-400 uppercase font-bold block mb-2">Component Type</label>
                                                        <select 
                                                            value={item.componentType} 
                                                            onChange={(e) => handleUpdateItem('componentType', e.target.value)}
                                                            className="w-full bg-slate-800 border border-slate-600 rounded px-3 py-2 text-white text-sm focus:border-blue-500 outline-none"
                                                        >
                                                            {Object.values(ComponentType).map(t => (
                                                                <option key={t} value={t}>{t.split('(')[0]}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                    <div>
                                                         <label className="text-xs text-slate-400 uppercase font-bold block mb-2">Metadata</label>
                                                         <div className="flex gap-2">
                                                            <div className="flex-1">
                                                                <input 
                                                                    placeholder="Tag No"
                                                                    value={item.tagNo || ''}
                                                                    onChange={(e) => handleUpdateItem('tagNo', e.target.value)}
                                                                    className="w-full bg-slate-800 border border-slate-600 rounded px-3 py-2 text-white text-sm outline-none"
                                                                />
                                                            </div>
                                                            <div className="w-20">
                                                                <input 
                                                                    type="number"
                                                                    placeholder="Qty"
                                                                    value={item.qty}
                                                                    onChange={(e) => handleUpdateItem('qty', parseInt(e.target.value))}
                                                                    className="w-full bg-slate-800 border border-slate-600 rounded px-3 py-2 text-white text-sm outline-none"
                                                                />
                                                            </div>
                                                         </div>
                                                    </div>
                                                </div>

                                                <div className="bg-slate-800/50 rounded-lg border border-slate-700 p-4">
                                                    <label className="text-xs text-slate-400 uppercase font-bold block mb-4 flex items-center gap-2">
                                                        <span>Dimensions</span>
                                                        <span className="h-px bg-slate-700 flex-1"></span>
                                                    </label>
                                                    
                                                    {item.componentType && item.params && (
                                                        <ParamEditor 
                                                            type={item.componentType} 
                                                            params={item.params} 
                                                            onChange={(k, v) => handleUpdateItem('params', v, k)} 
                                                        />
                                                    )}
                                                </div>
                                                
                                                <div className="mt-4 flex justify-between items-center text-xs text-slate-500">
                                                    <p>Auto-generated description: <span className="text-slate-300">{item.description}</span></p>
                                                    <button 
                                                        onClick={() => {
                                                            const newItems = [...extractedItems];
                                                            newItems.splice(selectedIndex, 1);
                                                            setExtractedItems(newItems);
                                                            setSelectedIndex(Math.max(0, selectedIndex - 1));
                                                        }}
                                                        className="text-red-400 hover:text-red-300 hover:underline"
                                                    >
                                                        Delete Item
                                                    </button>
                                                </div>
                                            </div>
                                        </>
                                    );
                                })()}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                {stage === 'VERIFY' && (
                    <div className="bg-slate-800 p-4 border-t border-slate-700 flex justify-between items-center shrink-0">
                        <div className="text-sm text-slate-400">
                             Reviewing item <span className="font-bold text-white">{selectedIndex + 1}</span> of {extractedItems.length}
                        </div>
                        <div className="flex gap-3">
                            <button 
                                onClick={() => setStage('UPLOAD')}
                                className="px-4 py-2 text-slate-300 hover:text-white font-bold text-sm"
                            >
                                Start Over
                            </button>
                            <button 
                                onClick={handleFinish}
                                className="px-6 py-2 bg-green-600 hover:bg-green-500 text-white font-bold rounded shadow-lg flex items-center gap-2 transform hover:-translate-y-0.5 transition-all"
                            >
                                <span>Import All Items</span>
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
