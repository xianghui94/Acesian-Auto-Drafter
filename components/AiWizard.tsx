
import React, { useState, useEffect, useMemo } from 'react';
import { parseExcelWithGemini } from '../services/aiAgent';
import { generateDuctDrawing } from '../services/geminiService';
import { generateDescription } from '../services/descriptionService';
import { OrderItem, ComponentType, DuctParams } from '../types';
import { getDefaultParams } from './ItemBuilder';

interface AiWizardProps {
    onClose: () => void;
    onImport: (items: any[]) => void;
}

// Extracted item now holds real params object, not JSON string
interface EditableItem extends Partial<OrderItem> {
    params: DuctParams;
}

type Stage = 'UPLOAD' | 'THINKING' | 'VERIFY';

// --- Small Input Components for Cell Rendering ---
const MiniInput = ({ label, value, onChange }: { label: string, value: any, onChange: (v: any) => void }) => (
    <div className="flex flex-col w-[60px]">
        <label className="text-[9px] text-slate-400 uppercase font-bold">{label}</label>
        <input 
            type="number" 
            value={value || ''} 
            onChange={(e) => onChange(Number(e.target.value))}
            className="w-full bg-slate-900 border border-slate-600 rounded px-1.5 py-0.5 text-white text-xs focus:border-blue-500 outline-none h-6"
        />
    </div>
);

const ParamEditor = ({ type, params, onChange }: { type: ComponentType, params: DuctParams, onChange: (key: string, val: any) => void }) => {
    switch (type) {
        case ComponentType.ELBOW:
            return (
                <div className="flex gap-2">
                    <MiniInput label="Ø" value={params.d1} onChange={v => onChange('d1', v)} />
                    <MiniInput label="Angle" value={params.angle} onChange={v => onChange('angle', v)} />
                    <MiniInput label="Rad" value={params.radius} onChange={v => onChange('radius', v)} />
                </div>
            );
        case ComponentType.REDUCER:
            return (
                <div className="flex gap-2">
                    <MiniInput label="Ø1" value={params.d1} onChange={v => onChange('d1', v)} />
                    <MiniInput label="Ø2" value={params.d2} onChange={v => onChange('d2', v)} />
                    <MiniInput label="L" value={params.length} onChange={v => onChange('length', v)} />
                </div>
            );
        case ComponentType.STRAIGHT:
            return (
                <div className="flex gap-2">
                    <MiniInput label="Ø" value={params.d1} onChange={v => onChange('d1', v)} />
                    <MiniInput label="L" value={params.length} onChange={v => onChange('length', v)} />
                </div>
            );
        case ComponentType.TEE:
        case ComponentType.CROSS_TEE:
            return (
                <div className="flex gap-2">
                    <MiniInput label="Main Ø" value={params.main_d} onChange={v => onChange('main_d', v)} />
                    <MiniInput label="Tap Ø" value={params.tap_d} onChange={v => onChange('tap_d', v)} />
                    <MiniInput label="Body L" value={params.length} onChange={v => onChange('length', v)} />
                    <MiniInput label="Brnch L" value={params.branch_l} onChange={v => onChange('branch_l', v)} />
                </div>
            );
        case ComponentType.LATERAL_TEE:
        case ComponentType.BOOT_TEE:
            return (
                <div className="flex gap-2">
                    <MiniInput label="D1" value={params.d1} onChange={v => onChange('d1', v)} />
                    <MiniInput label="D2" value={params.d2} onChange={v => onChange('d2', v)} />
                    <MiniInput label="L" value={params.length} onChange={v => onChange('length', v)} />
                </div>
            );
        case ComponentType.OFFSET:
             return (
                <div className="flex gap-2">
                    <MiniInput label="D1" value={params.d1} onChange={v => onChange('d1', v)} />
                    <MiniInput label="D2" value={params.d2} onChange={v => onChange('d2', v)} />
                    <MiniInput label="L" value={params.length} onChange={v => onChange('length', v)} />
                    <MiniInput label="H" value={params.offset} onChange={v => onChange('offset', v)} />
                </div>
            );
        case ComponentType.TRANSFORMATION:
             return (
                <div className="flex gap-2">
                    <MiniInput label="Ø" value={params.d1} onChange={v => onChange('d1', v)} />
                    <MiniInput label="W" value={params.width} onChange={v => onChange('width', v)} />
                    <MiniInput label="H" value={params.height} onChange={v => onChange('height', v)} />
                    <MiniInput label="L" value={params.length} onChange={v => onChange('length', v)} />
                </div>
            );
        default:
            // Fallback for types with just D1/Length or special params
            return (
                <div className="flex gap-2">
                    <MiniInput label="Ø/D1" value={params.d1} onChange={v => onChange('d1', v)} />
                    {params.length !== undefined && <MiniInput label="L" value={params.length} onChange={v => onChange('length', v)} />}
                </div>
            );
    }
};

export const AiWizard: React.FC<AiWizardProps> = ({ onClose, onImport }) => {
    const [stage, setStage] = useState<Stage>('UPLOAD');
    const [file, setFile] = useState<File | null>(null);
    const [extractedItems, setExtractedItems] = useState<EditableItem[]>([]);
    const [error, setError] = useState<string>("");
    
    // API Key State
    const [apiKey, setApiKey] = useState(() => localStorage.getItem('acesian_gemini_key') || "");

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

    const startProcessing = async () => {
        if (!file) return;
        if (!apiKey.trim()) {
            setError("Please enter a valid Gemini API Key.");
            return;
        }

        setStage('THINKING');
        try {
            const rawItems = await parseExcelWithGemini(file, apiKey);
            
            // Post-process items: Add Defaults, IDs, Descriptions
            const processedItems: EditableItem[] = rawItems.map((item, idx) => {
                const type = item.componentType || ComponentType.ELBOW;
                // Merge extracted params with defaults to ensure all required fields exist
                const safeParams = { 
                    ...getDefaultParams(type), 
                    ...(item.params || {}) 
                };
                
                return {
                    ...item,
                    id: `ai-${Date.now()}-${idx}`,
                    componentType: type,
                    params: safeParams,
                    description: generateDescription(type, safeParams)
                };
            });
            
            setExtractedItems(processedItems);
            setStage('VERIFY');
        } catch (err) {
            console.error(err);
            setError(err instanceof Error ? err.message : "Failed to process with AI");
            setStage('UPLOAD');
        }
    };

    // --- Editing Handlers ---

    const handleParamChange = (index: number, key: string, val: any) => {
        setExtractedItems(prev => {
            const newItems = [...prev];
            const item = { ...newItems[index] };
            const newParams = { ...item.params, [key]: val };
            
            // Auto-update Description
            if (item.componentType) {
                item.description = generateDescription(item.componentType, newParams);
            }
            
            item.params = newParams;
            newItems[index] = item;
            return newItems;
        });
    };

    const handleTypeChange = (index: number, newType: ComponentType) => {
        setExtractedItems(prev => {
            const newItems = [...prev];
            const item = { ...newItems[index] };
            
            // Load defaults for new type
            item.componentType = newType;
            item.params = getDefaultParams(newType);
            item.description = generateDescription(newType, item.params);
            
            newItems[index] = item;
            return newItems;
        });
    };

    const handleMetaChange = (index: number, field: keyof EditableItem, val: any) => {
        setExtractedItems(prev => {
            const newItems = [...prev];
            newItems[index] = { ...newItems[index], [field]: val };
            return newItems;
        });
    };

    const removeItem = (index: number) => {
        const newItems = [...extractedItems];
        newItems.splice(index, 1);
        setExtractedItems(newItems);
    };

    const handleFinish = () => {
        onImport(extractedItems);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-[fadeIn_0.2s_ease-out]">
            <div className="bg-slate-900 border border-slate-700 w-full max-w-[95vw] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                
                {/* Header */}
                <div className="bg-slate-800 p-6 border-b border-slate-700 flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                            <span className="text-blue-400">✨</span> AI Auto-Drafter
                        </h2>
                        <p className="text-slate-400 text-sm mt-1">Convert Excel BOMs into vector drawings instantly.</p>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-8 relative">
                    
                    {stage === 'UPLOAD' && (
                        <div className="flex flex-col items-center justify-center h-full space-y-8">
                             {/* API Key Section */}
                             <div className="w-full max-w-lg space-y-2">
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Gemini API Key</label>
                                <div className="flex gap-2">
                                    <input 
                                        type="password" 
                                        value={apiKey}
                                        onChange={(e) => handleApiKeyChange(e.target.value)}
                                        placeholder="Enter your API Key..."
                                        className="flex-1 bg-slate-800 border border-slate-600 rounded px-4 py-3 text-white focus:border-blue-500 outline-none transition-colors"
                                    />
                                </div>
                                <p className="text-xs text-slate-500">
                                    Don't have a key? <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 underline">Get a free API key here</a>.
                                </p>
                            </div>

                            <div className="w-full max-w-lg border-2 border-dashed border-slate-600 rounded-xl p-12 flex flex-col items-center justify-center bg-slate-800/50 hover:bg-slate-800 transition-colors group cursor-pointer relative">
                                <input 
                                    type="file" 
                                    accept=".xlsx,.xls" 
                                    onChange={handleFileChange}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                />
                                <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                    <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                </div>
                                <p className="text-lg font-medium text-slate-200">
                                    {file ? file.name : "Drop Excel BOM Here"}
                                </p>
                                <p className="text-sm text-slate-500 mt-2">or click to browse</p>
                            </div>
                            
                            {error && (
                                <div className="text-red-400 bg-red-900/20 px-4 py-2 rounded text-sm border border-red-900/50">
                                    ⚠️ {error}
                                </div>
                            )}

                            <button 
                                onClick={startProcessing}
                                disabled={!file}
                                className={`px-8 py-3 rounded-lg font-bold text-white shadow-lg flex items-center gap-2 transition-all ${
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
                        <div className="flex flex-col items-center justify-center h-full space-y-6 animate-pulse">
                             <div className="relative w-24 h-24">
                                <div className="absolute inset-0 border-4 border-slate-700 rounded-full"></div>
                                <div className="absolute inset-0 border-4 border-blue-500 rounded-full border-t-transparent animate-spin"></div>
                                <div className="absolute inset-0 flex items-center justify-center text-3xl">🤖</div>
                             </div>
                             <div className="text-center space-y-2">
                                 <h3 className="text-xl font-bold text-white">Gemini is drafting...</h3>
                                 <p className="text-slate-400">Reading Excel rows • Identifying Components • Extracting Dimensions</p>
                             </div>
                        </div>
                    )}

                    {stage === 'VERIFY' && (
                        <div className="space-y-4">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-bold text-white">Extracted {extractedItems.length} Items</h3>
                                <div className="text-sm text-slate-400 bg-slate-800 px-3 py-1 rounded-full border border-slate-700 flex items-center gap-2">
                                    <span>✎ Verify thumbnails and dimensions. Descriptions auto-update.</span>
                                </div>
                            </div>
                            
                            <div className="bg-slate-800 rounded-lg overflow-hidden border border-slate-700">
                                <table className="w-full text-sm text-left text-slate-300">
                                    <thead className="text-xs text-slate-400 uppercase bg-slate-900/50">
                                        <tr>
                                            <th className="px-4 py-3 w-16 text-center">Preview</th>
                                            <th className="px-4 py-3 w-40">Type</th>
                                            <th className="px-4 py-3 w-auto">Dimensions (mm/deg)</th>
                                            <th className="px-4 py-3 w-48">Description (Auto)</th>
                                            <th className="px-4 py-3 w-24">Tag</th>
                                            <th className="px-4 py-3 w-16 text-center">Qty</th>
                                            <th className="px-4 py-3 w-12"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-700">
                                        {extractedItems.map((item, idx) => {
                                            // Generate thumbnail on the fly
                                            const thumbnailSvg = item.componentType ? generateDuctDrawing(item.componentType, item.params, null) : "";
                                            
                                            return (
                                            <tr key={idx} className="hover:bg-slate-700/50 transition-colors group">
                                                {/* Thumbnail */}
                                                <td className="px-2 py-2">
                                                    <div className="w-12 h-12 bg-white rounded border border-slate-500 overflow-hidden flex items-center justify-center p-0.5">
                                                        <div dangerouslySetInnerHTML={{__html: thumbnailSvg}} className="w-full h-full" />
                                                    </div>
                                                </td>
                                                
                                                {/* Type Selector */}
                                                <td className="px-4 py-2 align-top">
                                                    <select 
                                                        value={item.componentType} 
                                                        onChange={(e) => handleTypeChange(idx, e.target.value as ComponentType)}
                                                        className="w-full bg-slate-900 border border-slate-600 rounded px-2 py-1 text-white text-xs focus:border-blue-500 outline-none"
                                                    >
                                                        {Object.values(ComponentType).map(t => (
                                                            <option key={t} value={t}>{t.split('(')[0]}</option>
                                                        ))}
                                                    </select>
                                                </td>

                                                {/* Dimension Inputs */}
                                                <td className="px-4 py-2 align-top">
                                                    {item.componentType && item.params && (
                                                        <ParamEditor 
                                                            type={item.componentType} 
                                                            params={item.params} 
                                                            onChange={(k, v) => handleParamChange(idx, k, v)} 
                                                        />
                                                    )}
                                                </td>

                                                {/* Computed Description */}
                                                <td className="px-4 py-2 align-top">
                                                    <div className="text-xs text-slate-400 italic bg-slate-900/50 p-1.5 rounded border border-slate-700/50 h-full">
                                                        {item.description}
                                                    </div>
                                                </td>

                                                {/* Tag */}
                                                <td className="px-4 py-2 align-top">
                                                    <input 
                                                        type="text" 
                                                        value={item.tagNo || ''}
                                                        onChange={(e) => handleMetaChange(idx, 'tagNo', e.target.value)}
                                                        className="w-full bg-slate-900 border border-slate-600 rounded px-2 py-1 text-white text-xs focus:border-blue-500 outline-none"
                                                        placeholder="Tag..."
                                                    />
                                                </td>

                                                {/* Qty */}
                                                <td className="px-4 py-2 align-top">
                                                    <input 
                                                        type="number" 
                                                        value={item.qty}
                                                        onChange={(e) => handleMetaChange(idx, 'qty', parseInt(e.target.value) || 1)}
                                                        className="w-full bg-slate-900 border border-slate-600 rounded px-2 py-1 text-white text-xs focus:border-blue-500 outline-none text-center"
                                                    />
                                                </td>

                                                {/* Delete */}
                                                <td className="px-4 py-2 align-middle text-center">
                                                    <button 
                                                        onClick={() => removeItem(idx)}
                                                        className="text-slate-500 hover:text-red-400 transition-colors"
                                                    >
                                                        ✕
                                                    </button>
                                                </td>
                                            </tr>
                                        )})}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                {stage === 'VERIFY' && (
                    <div className="bg-slate-800 p-6 border-t border-slate-700 flex justify-end gap-3">
                        <button 
                            onClick={() => setStage('UPLOAD')}
                            className="px-4 py-2 text-slate-300 hover:text-white font-bold"
                        >
                            Start Over
                        </button>
                        <button 
                            onClick={handleFinish}
                            className="px-6 py-2 bg-green-600 hover:bg-green-500 text-white font-bold rounded shadow-lg shadow-green-900/20 transform hover:-translate-y-0.5 transition-all flex items-center gap-2"
                        >
                            <span>Import to Board</span>
                            <span className="bg-green-700 px-1.5 py-0.5 rounded text-xs">{extractedItems.length}</span>
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
