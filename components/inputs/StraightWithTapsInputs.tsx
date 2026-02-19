
import React from 'react';
import { DuctParams } from '../../types';
import { NumInput, TextAreaInput, SelectInput } from '../InputFields';

interface InputProps {
    params: DuctParams;
    onChange: (key: string, val: any) => void;
    onTapQtyChange?: (qty: number) => void;
    onNptQtyChange?: (qty: number) => void;
    onTapUpdate?: (index: number, field: string, value: any) => void;
    onNptUpdate?: (index: number, field: string, value: any) => void;
    onFocus?: (id: string) => void;
    onBlur?: () => void;
}

// --- Sub-component: Config Table ---
// Reusable grid for Taps and NPTs to keep the main component clean
const ConfigTable = ({ 
    title, 
    qty, 
    items, 
    idPrefix, 
    onUpdate, 
    onFocus, 
    onBlur 
}: { 
    title: string, 
    qty: number, 
    items: any[], 
    idPrefix: string, 
    onUpdate: (idx: number, field: string, val: any) => void,
    onFocus?: (id: string) => void,
    onBlur?: () => void
}) => (
    <div className="bg-white border border-cad-300 rounded overflow-hidden mt-4 shadow-sm">
        <div className="bg-cad-50 px-3 py-2 border-b border-cad-200 flex justify-between items-center">
            <label className="text-xs font-bold text-cad-700 uppercase tracking-wide">{title}</label>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${qty > 0 ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-400'}`}>
                Qty: {qty}
            </span>
        </div>
        
        {qty > 0 ? (
            <div className="p-2">
                <div className="grid grid-cols-12 gap-2 mb-1 text-[9px] font-bold text-cad-500 uppercase px-1">
                    <div className="col-span-1 text-center">#</div>
                    <div className="col-span-2">Dist (mm)</div>
                    <div className="col-span-2">{idPrefix === 'npt' ? 'Size' : 'Dia (mm)'}</div>
                    <div className="col-span-2">Angle (°)</div>
                    <div className="col-span-5">Remark</div>
                </div>
                {items && items.map((item: any, idx: number) => (
                    <div key={idx} className="grid grid-cols-12 gap-2 mb-1.5 items-center group">
                        <div className="col-span-1 text-xs font-mono font-bold text-center text-cad-400 group-hover:text-blue-500 transition-colors">
                            {idx + 1}
                        </div>
                        
                        {/* Distance Input */}
                        <div className="col-span-2">
                            <input 
                                id={`${idPrefix}-dist-${idx}`}
                                type="number" 
                                value={item.dist} 
                                onChange={(e) => onUpdate(idx, 'dist', Number(e.target.value))}
                                onFocus={() => onFocus && onFocus(`${idPrefix}-dist-${idx}`)}
                                onBlur={onBlur}
                                className="w-full h-7 px-2 border border-cad-200 rounded text-xs font-mono focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all hover:border-cad-400"
                            />
                        </div>

                        {/* Size/Diameter Input */}
                        <div className="col-span-2">
                            {idPrefix === 'npt' ? (
                                <input 
                                    id={`${idPrefix}-size-${idx}`}
                                    type="text" 
                                    value={item.size} 
                                    onChange={(e) => onUpdate(idx, 'size', e.target.value)}
                                    onFocus={() => onFocus && onFocus(`${idPrefix}-size-${idx}`)}
                                    onBlur={onBlur}
                                    className="w-full h-7 px-2 border border-cad-200 rounded text-xs font-mono focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all hover:border-cad-400"
                                />
                            ) : (
                                <input 
                                    id={`${idPrefix}-diameter-${idx}`}
                                    type="number" 
                                    value={item.diameter} 
                                    onChange={(e) => onUpdate(idx, 'diameter', Number(e.target.value))}
                                    onFocus={() => onFocus && onFocus(`${idPrefix}-diameter-${idx}`)}
                                    onBlur={onBlur}
                                    className="w-full h-7 px-2 border border-cad-200 rounded text-xs font-mono focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all hover:border-cad-400"
                                />
                            )}
                        </div>

                        {/* Angle Input */}
                        <div className="col-span-2">
                            <input 
                                id={`${idPrefix}-angle-${idx}`}
                                type="number" 
                                value={item.angle} 
                                onChange={(e) => onUpdate(idx, 'angle', Number(e.target.value))}
                                onFocus={() => onFocus && onFocus(`${idPrefix}-angle-${idx}`)}
                                onBlur={onBlur}
                                className="w-full h-7 px-2 border border-cad-200 rounded text-xs font-mono focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all hover:border-cad-400"
                            />
                        </div>

                        {/* Remark Input */}
                        <div className="col-span-5">
                            <input
                                type="text"
                                value={item.remark || ""} 
                                onChange={(e) => onUpdate(idx, 'remark', e.target.value)}
                                className="w-full h-7 px-2 border border-cad-200 rounded text-xs font-sans focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all hover:border-cad-400"
                                placeholder="Optional..."
                            />
                        </div>
                    </div>
                ))}
            </div>
        ) : (
            <div className="text-xs text-cad-400 italic p-6 text-center bg-cad-50/50">
                No items configured. Increase <strong>Qty</strong> to add rows.
            </div>
        )}
    </div>
);

export const StraightWithTapsInputs: React.FC<InputProps> = ({ 
    params, 
    onChange, 
    onTapQtyChange, 
    onNptQtyChange, 
    onTapUpdate, 
    onNptUpdate, 
    onFocus,
    onBlur
}) => {
    return (
        <>
            {/* Top Grid: General Dims */}
            <div className="col-span-2 md:col-span-4 lg:col-span-6 p-4 bg-blue-50/50 rounded border border-blue-100 mb-2">
                <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                    <div className="md:col-span-1">
                        <NumInput label="Main D" fieldId="d1" value={params.d1} onChange={v => onChange('d1', v)} onFocus={onFocus} onBlur={onBlur} />
                    </div>
                    <div className="md:col-span-1">
                        <NumInput label="Total L" fieldId="length" value={params.length} onChange={v => onChange('length', v)} onFocus={onFocus} onBlur={onBlur} />
                    </div>
                    <div className="md:col-span-1">
                        <NumInput label="Qty Taps" value={params.tapQty || 0} onChange={onTapQtyChange!} step={1} />
                    </div>
                    <div className="md:col-span-1">
                        <NumInput label="Qty NPT" value={params.nptQty || 0} onChange={onNptQtyChange!} step={1} />
                    </div>
                    <div className="md:col-span-1">
                        <SelectInput 
                            label="Seam Pos" 
                            value={params.seamAngle !== undefined ? params.seamAngle : 0} 
                            options={[0, 45, 90, 135, 180, 225, 270, 315]} 
                            onChange={v => onChange('seamAngle', Number(v))} 
                        />
                    </div>
                </div>
            </div>
            
            {/* Flange Remarks Row */}
            <div className="col-span-2 md:col-span-4 lg:col-span-6 grid grid-cols-2 gap-4 pt-2">
                <TextAreaInput label="Flange 1 Remark (Left)" value={params.flangeRemark1 || ""} onChange={v => onChange('flangeRemark1', v)} onFocus={onFocus} onBlur={onBlur} />
                <TextAreaInput label="Flange 2 Remark (Right)" value={params.flangeRemark2 || ""} onChange={v => onChange('flangeRemark2', v)} onFocus={onFocus} onBlur={onBlur} />
            </div>

            {/* Config Tables */}
            <div className="col-span-2 md:col-span-4 lg:col-span-6">
                <ConfigTable 
                    title="Tap Configuration" 
                    qty={params.tapQty} 
                    items={params.taps} 
                    idPrefix="taps" 
                    onUpdate={onTapUpdate!} 
                    onFocus={onFocus} 
                    onBlur={onBlur} 
                />
                
                <ConfigTable 
                    title="NPT Configuration" 
                    qty={params.nptQty} 
                    items={params.nptPorts} 
                    idPrefix="npt" 
                    onUpdate={onNptUpdate!} 
                    onFocus={onFocus} 
                    onBlur={onBlur} 
                />
            </div>
        </>
    );
};
