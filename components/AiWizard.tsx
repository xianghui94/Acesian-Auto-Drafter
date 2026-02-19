import React, { useState } from 'react';
import { parseExcelWithGemini } from '../services/aiAgent';
import { OrderItem, ComponentType } from '../types';

interface AiWizardProps {
    onClose: () => void;
    onImport: (items: any[]) => void;
}

type Stage = 'UPLOAD' | 'THINKING' | 'VERIFY';

export const AiWizard: React.FC<AiWizardProps> = ({ onClose, onImport }) => {
    const [stage, setStage] = useState<Stage>('UPLOAD');
    const [file, setFile] = useState<File | null>(null);
    const [extractedItems, setExtractedItems] = useState<Partial<OrderItem>[]>([]);
    const [error, setError] = useState<string>("");

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setError("");
        }
    };

    const startProcessing = async () => {
        if (!file) return;

        setStage('THINKING');
        try {
            const items = await parseExcelWithGemini(file);
            // Add temp IDs
            const itemsWithIds = items.map((item, idx) => ({
                ...item,
                id: `ai-${Date.now()}-${idx}`,
                description: "AI Generated"
            }));
            setExtractedItems(itemsWithIds);
            setStage('VERIFY');
        } catch (err) {
            console.error(err);
            setError(err instanceof Error ? err.message : "Failed to process with AI");
            setStage('UPLOAD');
        }
    };

    const handleFinish = () => {
        onImport(extractedItems);
        onClose();
    };

    const removeItem = (index: number) => {
        const newItems = [...extractedItems];
        newItems.splice(index, 1);
        setExtractedItems(newItems);
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-[fadeIn_0.2s_ease-out]">
            <div className="bg-slate-900 border border-slate-700 w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                
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
                        <div className="flex flex-col items-center justify-center h-full space-y-6">
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
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
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
                                <div className="text-sm text-slate-400 bg-slate-800 px-3 py-1 rounded-full border border-slate-700">
                                    Please verify dimensions before importing
                                </div>
                            </div>
                            
                            <div className="bg-slate-800 rounded-lg overflow-hidden border border-slate-700">
                                <table className="w-full text-sm text-left text-slate-300">
                                    <thead className="text-xs text-slate-400 uppercase bg-slate-900/50">
                                        <tr>
                                            <th className="px-4 py-3">Type</th>
                                            <th className="px-4 py-3">Params</th>
                                            <th className="px-4 py-3 w-20">Qty</th>
                                            <th className="px-4 py-3 w-20">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-700">
                                        {extractedItems.map((item, idx) => (
                                            <tr key={idx} className="hover:bg-slate-700/50 transition-colors">
                                                <td className="px-4 py-3 font-medium text-white">
                                                    {item.componentType?.split('(')[0]}
                                                    <div className="text-xs text-slate-500 font-mono mt-0.5">{item.tagNo || '-'}</div>
                                                </td>
                                                <td className="px-4 py-3 font-mono text-xs text-blue-300">
                                                    {JSON.stringify(item.params).replace(/"/g, '').replace(/,/g, ', ')}
                                                </td>
                                                <td className="px-4 py-3">{item.qty}</td>
                                                <td className="px-4 py-3">
                                                    <button 
                                                        onClick={() => removeItem(idx)}
                                                        className="text-red-400 hover:text-red-300 hover:bg-red-900/30 p-1.5 rounded transition-colors"
                                                    >
                                                        ✕
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
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