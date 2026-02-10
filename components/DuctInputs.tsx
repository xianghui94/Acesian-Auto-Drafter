import React from 'react';
import { DuctParams } from '../types';

interface InputProps {
    params: DuctParams;
    onChange: (key: string, val: any) => void;
    // Specific handlers for array updates
    onTapQtyChange?: (qty: number) => void;
    onNptQtyChange?: (qty: number) => void;
    onTapUpdate?: (index: number, field: string, value: any) => void;
    onNptUpdate?: (index: number, field: string, value: any) => void;
}

// Helpers
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

export const ElbowInputs: React.FC<InputProps> = ({ params, onChange }) => (
    <>
        <NumInput label="D1 (mm)" value={params.d1} onChange={v => onChange('d1', v)} />
        <div>
            <label className="block text-[10px] uppercase font-bold text-cad-400 mb-1">Angle (°)</label>
            <select 
                value={params.angle}
                onChange={(e) => onChange('angle', Number(e.target.value))}
                className="w-full p-1.5 border border-cad-300 rounded text-sm bg-white font-mono"
            >
                {[30, 45, 60, 90].map(deg => <option key={deg} value={deg}>{deg}</option>)}
            </select>
        </div>
    </>
);

export const ReducerInputs: React.FC<InputProps> = ({ params, onChange }) => (
    <>
        <NumInput label="D1 (mm)" value={params.d1} onChange={v => onChange('d1', v)} />
        <NumInput label="D2 (mm)" value={params.d2} onChange={v => onChange('d2', v)} />
        <NumInput label="Total L (mm)" value={params.length} onChange={v => onChange('length', v)} />
    </>
);

export const StraightInputs: React.FC<InputProps> = ({ params, onChange }) => (
    <>
        <NumInput label="D1 (mm)" value={params.d1} onChange={v => onChange('d1', v)} />
        <NumInput label="Len (mm)" value={params.length} onChange={v => onChange('length', v)} />
    </>
);

export const TeeInputs: React.FC<InputProps> = ({ params, onChange }) => (
    <>
        <NumInput label="Main D (mm)" value={params.main_d} onChange={v => onChange('main_d', v)} />
        <NumInput label="Tap D (mm)" value={params.tap_d} onChange={v => onChange('tap_d', v)} />
        <NumInput label="Body L (mm)" value={params.length} onChange={v => onChange('length', v)} />
        <NumInput label="Branch L (mm)" value={params.branch_l} onChange={v => onChange('branch_l', v)} />
    </>
);

export const TransformationInputs: React.FC<InputProps> = ({ params, onChange }) => (
    <>
        <NumInput label="Diameter Ø (mm)" value={params.d1} onChange={v => onChange('d1', v)} />
        <NumInput label="Rect L (mm)" value={params.width} onChange={v => onChange('width', v)} />
        <NumInput label="Rect W (mm)" value={params.height} onChange={v => onChange('height', v)} />
        <NumInput label="Length L (mm)" value={params.length} onChange={v => onChange('length', v)} />
    </>
);

export const VolumeDamperInputs: React.FC<InputProps> = ({ params, onChange }) => (
    <>
        <NumInput label="Diameter Ø (mm)" value={params.d1} onChange={v => onChange('d1', v)} />
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
            onChange={(e) => onChange('actuation', e.target.value)}
            className="w-full p-1.5 border border-cad-300 rounded text-sm bg-white"
        >
            <option value="Handle">Handle</option>
            <option value="Worm Gear">Worm Gear</option>
        </select>
    </div>
    </>
);

export const MultibladeDamperInputs: React.FC<InputProps> = ({ params, onChange }) => (
    <>
        <NumInput label="Diameter Ø (mm)" value={params.d1} onChange={v => onChange('d1', v)} />
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
            onChange={(e) => onChange('bladeType', e.target.value)}
            className="w-full p-1.5 border border-cad-300 rounded text-sm bg-white"
        >
            <option value="Parallel">Parallel</option>
            <option value="Opposed">Opposed</option>
        </select>
    </div>
    </>
);

export const StraightWithTapsInputs: React.FC<InputProps> = ({ 
    params, 
    onChange, 
    onTapQtyChange, 
    onNptQtyChange,
    onTapUpdate, 
    onNptUpdate 
}) => (
    <>
        <NumInput label="Main D (mm)" value={params.d1} onChange={v => onChange('d1', v)} />
        <NumInput label="Total L (mm)" value={params.length} onChange={v => onChange('length', v)} />
        
        <div className="flex gap-2">
        <NumInput label="Qty Taps" value={params.tapQty || 0} onChange={onTapQtyChange!} />
        <NumInput label="Qty NPT" value={params.nptQty || 0} onChange={onNptQtyChange!} />
        </div>
        
        <div>
        <label className="block text-[10px] uppercase font-bold text-cad-400 mb-1">Seam Pos (°)</label>
        <select 
            value={params.seamAngle !== undefined ? params.seamAngle : 0}
            onChange={(e) => onChange('seamAngle', Number(e.target.value))}
            className="w-full p-1.5 border border-cad-300 rounded text-sm bg-white font-mono"
        >
            {[0, 45, 90, 135, 180, 225, 270, 315].map(deg => <option key={deg} value={deg}>{deg}</option>)}
        </select>
        </div>

        {/* Taps Config */}
        <div className="col-span-2 md:col-span-4 lg:col-span-6 mt-2">
            <div className="bg-cad-50 border border-cad-200 rounded p-2">
            <label className="block text-xs font-bold text-cad-500 mb-2 uppercase tracking-wide">Tap Configuration</label>
            {params.tapQty > 0 ? (
                <>
                    <div className="grid grid-cols-12 gap-2 mb-1 text-[10px] font-bold text-cad-400 px-1">
                        <div className="col-span-1 text-center">#</div>
                        <div className="col-span-2">Dist</div>
                        <div className="col-span-2">Diam</div>
                        <div className="col-span-2">Angle</div>
                        <div className="col-span-5">Remark</div>
                    </div>
                    {params.taps && params.taps.map((tap: any, idx: number) => (
                        <div key={idx} className="grid grid-cols-12 gap-2 mb-2 items-center">
                            <div className="col-span-1 text-xs font-mono font-bold text-center bg-cad-200 rounded py-1">{idx + 1}</div>
                            <input 
                                type="number" 
                                value={tap.dist} 
                                onChange={(e) => onTapUpdate!(idx, 'dist', Number(e.target.value))}
                                className="col-span-2 p-1 border border-cad-300 rounded text-xs font-mono w-full"
                                placeholder="Dist"
                            />
                            <input 
                                type="number" 
                                value={tap.diameter} 
                                onChange={(e) => onTapUpdate!(idx, 'diameter', Number(e.target.value))}
                                className="col-span-2 p-1 border border-cad-300 rounded text-xs font-mono w-full"
                                placeholder="Dia"
                            />
                                <input 
                                type="number" 
                                value={tap.angle} 
                                onChange={(e) => onTapUpdate!(idx, 'angle', Number(e.target.value))}
                                className="col-span-2 p-1 border border-cad-300 rounded text-xs font-mono w-full"
                                placeholder="0"
                            />
                            <input 
                                type="text" 
                                value={tap.remark || ""} 
                                onChange={(e) => onTapUpdate!(idx, 'remark', e.target.value)}
                                className="col-span-5 p-1 border border-cad-300 rounded text-xs w-full"
                                placeholder="Optional..."
                            />
                        </div>
                    ))}
                </>
            ) : (
                <div className="text-xs text-cad-400 italic p-2 text-center">No taps configured.</div>
            )}
            </div>
        </div>

        {/* NPT Config */}
        <div className="col-span-2 md:col-span-4 lg:col-span-6 mt-1">
            <div className="bg-cad-50 border border-cad-200 rounded p-2">
            <label className="block text-xs font-bold text-cad-500 mb-2 uppercase tracking-wide">NPT Port Configuration</label>
            {params.nptQty > 0 ? (
                <>
                    <div className="grid grid-cols-12 gap-2 mb-1 text-[10px] font-bold text-cad-400 px-1">
                        <div className="col-span-1 text-center">#</div>
                        <div className="col-span-2">Dist</div>
                        <div className="col-span-2">Size</div>
                        <div className="col-span-2">Angle</div>
                        <div className="col-span-5">Remark</div>
                    </div>
                    {params.nptPorts && params.nptPorts.map((port: any, idx: number) => (
                        <div key={idx} className="grid grid-cols-12 gap-2 mb-2 items-center">
                            <div className="col-span-1 text-xs font-mono font-bold text-center bg-cad-200 rounded py-1 text-purple-600">NPT{idx + 1}</div>
                            <input 
                                type="number" 
                                value={port.dist} 
                                onChange={(e) => onNptUpdate!(idx, 'dist', Number(e.target.value))}
                                className="col-span-2 p-1 border border-cad-300 rounded text-xs font-mono w-full"
                                placeholder="Dist"
                            />
                            <select
                                value={port.size}
                                onChange={(e) => onNptUpdate!(idx, 'size', e.target.value)}
                                className="col-span-2 p-1 border border-cad-300 rounded text-xs font-mono w-full"
                            >
                                <option value='1/2"'>1/2"</option>
                                <option value='1"'>1"</option>
                                <option value='1-1/2"'>1-1/2"</option>
                                <option value='2"'>2"</option>
                            </select>
                                <input 
                                type="number" 
                                value={port.angle} 
                                onChange={(e) => onNptUpdate!(idx, 'angle', Number(e.target.value))}
                                className="col-span-2 p-1 border border-cad-300 rounded text-xs font-mono w-full"
                                placeholder="0"
                            />
                            <input 
                                type="text" 
                                value={port.remark || ""} 
                                onChange={(e) => onNptUpdate!(idx, 'remark', e.target.value)}
                                className="col-span-5 p-1 border border-cad-300 rounded text-xs w-full"
                                placeholder="Optional..."
                            />
                        </div>
                    ))}
                </>
            ) : (
                <div className="text-xs text-cad-400 italic p-2 text-center">No NPT ports configured.</div>
            )}
            </div>
        </div>
    </>
);

export const BlindPlateInputs: React.FC<InputProps> = ({ params, onChange }) => (
    <>
        <NumInput label="Diameter Ø (mm)" value={params.d1} onChange={v => onChange('d1', v)} />
    </>
);

export const BlastGateDamperInputs: React.FC<InputProps> = ({ params, onChange }) => (
    <>
        <NumInput label="Diameter Ø (mm)" value={params.d1} onChange={v => onChange('d1', v)} />
        <NumInput label="Length L (mm)" value={params.length} onChange={v => onChange('length', v)} />
    </>
);

export const AngleFlangeInputs: React.FC<InputProps> = ({ params, onChange }) => (
    <>
        <NumInput label="Diameter Ø (mm)" value={params.d1} onChange={v => onChange('d1', v)} />
    </>
);