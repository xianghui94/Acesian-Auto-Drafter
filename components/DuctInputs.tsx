import React from 'react';
import { DuctParams } from '../types';
import { NumInput, TextAreaInput, SelectInput } from './InputFields';

interface InputProps {
    params: DuctParams;
    onChange: (key: string, val: any) => void;
    onFocus?: (id: string) => void;
    onBlur?: () => void;
    // Specific handlers for array updates
    onTapQtyChange?: (qty: number) => void;
    onNptQtyChange?: (qty: number) => void;
    onTapUpdate?: (index: number, field: string, value: any) => void;
    onNptUpdate?: (index: number, field: string, value: any) => void;
}

export const ElbowInputs: React.FC<InputProps> = ({ params, onChange, onFocus, onBlur }) => (
    <>
        <NumInput label="D1" fieldId="d1" value={params.d1} onChange={v => onChange('d1', v)} onFocus={onFocus} onBlur={onBlur} suffix="mm" />
        <SelectInput 
            label="Angle" 
            fieldId="angle"
            value={params.angle} 
            options={[30, 45, 60, 90]} 
            onChange={v => onChange('angle', Number(v))} 
            onFocus={onFocus} onBlur={onBlur}
        />
        <NumInput label="Radius R" fieldId="radius" value={params.radius} onChange={v => onChange('radius', v)} onFocus={onFocus} onBlur={onBlur} suffix="mm" />
        
        {/* Extensions */}
        <div className="grid grid-cols-2 gap-2">
            <NumInput label="Ext 1" fieldId="extension1" value={params.extension1 || 0} onChange={v => onChange('extension1', v)} onFocus={onFocus} onBlur={onBlur} suffix="mm" />
            <NumInput label="Ext 2" fieldId="extension2" value={params.extension2 || 0} onChange={v => onChange('extension2', v)} onFocus={onFocus} onBlur={onBlur} suffix="mm" />
        </div>
        
        {/* Flange Remarks */}
        <div className="col-span-2 grid grid-cols-2 gap-4 border-t border-cad-200 pt-2 mt-2">
            <TextAreaInput label="Flange 1 Remark" value={params.flangeRemark1 || ""} onChange={v => onChange('flangeRemark1', v)} onFocus={onFocus} onBlur={onBlur} />
            <TextAreaInput label="Flange 2 Remark" value={params.flangeRemark2 || ""} onChange={v => onChange('flangeRemark2', v)} onFocus={onFocus} onBlur={onBlur} />
        </div>
    </>
);

export const ReducerInputs: React.FC<InputProps> = ({ params, onChange, onFocus, onBlur }) => (
    <>
        <NumInput label="D1" fieldId="d1" value={params.d1} onChange={v => onChange('d1', v)} onFocus={onFocus} onBlur={onBlur} suffix="mm" />
        <NumInput label="D2" fieldId="d2" value={params.d2} onChange={v => onChange('d2', v)} onFocus={onFocus} onBlur={onBlur} suffix="mm" />
        <NumInput label="Total L" fieldId="length" value={params.length} onChange={v => onChange('length', v)} onFocus={onFocus} onBlur={onBlur} suffix="mm" />
        
        <SelectInput 
            label="Type" 
            value={params.reducerType || "Concentric"} 
            options={["Concentric", "Eccentric"]} 
            onChange={v => onChange('reducerType', v)} 
            fieldId="reducerType"
            onFocus={onFocus} onBlur={onBlur}
        />

        <div className="grid grid-cols-2 gap-2">
            <NumInput label="RC1" fieldId="extension1" value={params.extension1 || 50} onChange={v => onChange('extension1', v)} onFocus={onFocus} onBlur={onBlur} suffix="mm" />
            <NumInput label="RC2" fieldId="extension2" value={params.extension2 || 50} onChange={v => onChange('extension2', v)} onFocus={onFocus} onBlur={onBlur} suffix="mm" />
        </div>

        {/* Flange Remarks */}
        <div className="col-span-2 grid grid-cols-2 gap-4 border-t border-cad-200 pt-2 mt-2">
            <TextAreaInput label="Flange 1 Remark (Left)" value={params.flangeRemark1 || ""} onChange={v => onChange('flangeRemark1', v)} onFocus={onFocus} onBlur={onBlur} />
            <TextAreaInput label="Flange 2 Remark (Right)" value={params.flangeRemark2 || ""} onChange={v => onChange('flangeRemark2', v)} onFocus={onFocus} onBlur={onBlur} />
        </div>
    </>
);

export const StraightInputs: React.FC<InputProps> = ({ params, onChange, onFocus, onBlur }) => (
    <>
        <NumInput label="D1" fieldId="d1" value={params.d1} onChange={v => onChange('d1', v)} onFocus={onFocus} onBlur={onBlur} suffix="mm" />
        <NumInput label="Len" fieldId="length" value={params.length} onChange={v => onChange('length', v)} onFocus={onFocus} onBlur={onBlur} suffix="mm" />

        {/* Flange Remarks */}
        <div className="col-span-2 grid grid-cols-2 gap-4 border-t border-cad-200 pt-2 mt-2">
            <TextAreaInput label="Flange 1 Remark (Left)" value={params.flangeRemark1 || ""} onChange={v => onChange('flangeRemark1', v)} onFocus={onFocus} onBlur={onBlur} />
            <TextAreaInput label="Flange 2 Remark (Right)" value={params.flangeRemark2 || ""} onChange={v => onChange('flangeRemark2', v)} onFocus={onFocus} onBlur={onBlur} />
        </div>
    </>
);

export const TeeInputs: React.FC<InputProps> = ({ params, onChange, onFocus, onBlur }) => (
    <>
        <NumInput label="Main D" fieldId="main_d" value={params.main_d} onChange={v => onChange('main_d', v)} onFocus={onFocus} onBlur={onBlur} />
        <NumInput label="Tap D" fieldId="tap_d" value={params.tap_d} onChange={v => onChange('tap_d', v)} onFocus={onFocus} onBlur={onBlur} />
        <NumInput label="Body L" fieldId="length" value={params.length} onChange={v => onChange('length', v)} onFocus={onFocus} onBlur={onBlur} />
        <NumInput label="Branch L" fieldId="branch_l" value={params.branch_l} onChange={v => onChange('branch_l', v)} onFocus={onFocus} onBlur={onBlur} />
        
        {/* Flange Remarks */}
        <div className="col-span-2 md:col-span-4 lg:col-span-6 grid grid-cols-3 gap-4 border-t border-cad-200 pt-2 mt-2">
             <TextAreaInput label="F1 Remark (Left)" value={params.flangeRemark1 || ""} onChange={v => onChange('flangeRemark1', v)} onFocus={onFocus} onBlur={onBlur} />
             <TextAreaInput label="F2 Remark (Right)" value={params.flangeRemark2 || ""} onChange={v => onChange('flangeRemark2', v)} onFocus={onFocus} onBlur={onBlur} />
             <TextAreaInput label="F3 Remark (Branch)" value={params.flangeRemark3 || ""} onChange={v => onChange('flangeRemark3', v)} onFocus={onFocus} onBlur={onBlur} />
        </div>
    </>
);

export const TransformationInputs: React.FC<InputProps> = ({ params, onChange, onFocus, onBlur }) => (
    <>
        <NumInput label="Diameter Ø" fieldId="d1" value={params.d1} onChange={v => onChange('d1', v)} onFocus={onFocus} onBlur={onBlur} />
        <NumInput label="Rect L" fieldId="width" value={params.width} onChange={v => onChange('width', v)} onFocus={onFocus} onBlur={onBlur} />
        <NumInput label="Rect W" fieldId="height" value={params.height} onChange={v => onChange('height', v)} onFocus={onFocus} onBlur={onBlur} />
        <NumInput label="Length L" fieldId="length" value={params.length} onChange={v => onChange('length', v)} onFocus={onFocus} onBlur={onBlur} />

        {/* Flange Remarks */}
        <div className="col-span-2 grid grid-cols-2 gap-4 border-t border-cad-200 pt-2 mt-2">
            <TextAreaInput label="Round Flange Remark" value={params.flangeRemark1 || ""} onChange={v => onChange('flangeRemark1', v)} onFocus={onFocus} onBlur={onBlur} />
            <TextAreaInput label="Rect Flange Remark" value={params.flangeRemark2 || ""} onChange={v => onChange('flangeRemark2', v)} onFocus={onFocus} onBlur={onBlur} />
        </div>
    </>
);

export const VolumeDamperInputs: React.FC<InputProps> = ({ params, onChange, onFocus, onBlur }) => (
    <>
        <NumInput label="Diameter Ø" fieldId="d1" value={params.d1} onChange={v => onChange('d1', v)} onFocus={onFocus} onBlur={onBlur} />
        <div>
            <label className="block text-[10px] uppercase font-bold text-cad-400 mb-1">Length L (Fixed)</label>
            <input 
                type="number" 
                value={params.length} 
                disabled
                className="w-full p-2 border border-cad-200 bg-cad-50 rounded text-sm font-mono text-cad-500 cursor-not-allowed"
            />
        </div>
        <SelectInput 
            label="Actuation" 
            value={params.actuation} 
            options={["Handle", "Worm Gear"]} 
            onChange={v => onChange('actuation', v)} 
        />
    </>
);

export const MultibladeDamperInputs: React.FC<InputProps> = ({ params, onChange, onFocus, onBlur }) => (
    <>
        <NumInput label="Diameter Ø" fieldId="d1" value={params.d1} onChange={v => onChange('d1', v)} onFocus={onFocus} onBlur={onBlur} />
        <NumInput label="Length L" fieldId="length" value={params.length} onChange={v => onChange('length', v)} onFocus={onFocus} onBlur={onBlur} />
        <SelectInput 
            label="Blade Type" 
            value={params.bladeType} 
            options={["Parallel", "Opposed"]} 
            onChange={v => onChange('bladeType', v)} 
        />
    </>
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
}) => (
    <>
        <NumInput label="Main D" fieldId="d1" value={params.d1} onChange={v => onChange('d1', v)} onFocus={onFocus} onBlur={onBlur} />
        <NumInput label="Total L" fieldId="length" value={params.length} onChange={v => onChange('length', v)} onFocus={onFocus} onBlur={onBlur} />
        
        <div className="flex gap-2">
            <NumInput label="Qty Taps" value={params.tapQty || 0} onChange={onTapQtyChange!} />
            <NumInput label="Qty NPT" value={params.nptQty || 0} onChange={onNptQtyChange!} />
        </div>
        
        <SelectInput 
            label="Seam Pos" 
            value={params.seamAngle !== undefined ? params.seamAngle : 0} 
            options={[0, 45, 90, 135, 180, 225, 270, 315]} 
            onChange={v => onChange('seamAngle', Number(v))} 
        />
        
        {/* Flange Remarks */}
        <div className="col-span-2 grid grid-cols-2 gap-4 border-t border-cad-200 pt-2 mt-2">
            <TextAreaInput label="Flange 1 Remark (Left)" value={params.flangeRemark1 || ""} onChange={v => onChange('flangeRemark1', v)} onFocus={onFocus} onBlur={onBlur} />
            <TextAreaInput label="Flange 2 Remark (Right)" value={params.flangeRemark2 || ""} onChange={v => onChange('flangeRemark2', v)} onFocus={onFocus} onBlur={onBlur} />
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
                        <div key={idx} className="grid grid-cols-12 gap-2 mb-2 items-start">
                            <div className="col-span-1 text-xs font-mono font-bold text-center bg-cad-200 rounded py-1">{idx + 1}</div>
                            <input 
                                id={`taps-dist-${idx}`}
                                type="number" 
                                value={tap.dist} 
                                onChange={(e) => onTapUpdate!(idx, 'dist', Number(e.target.value))}
                                onFocus={() => onFocus && onFocus(`taps-dist-${idx}`)}
                                onBlur={onBlur}
                                className="col-span-2 p-1 border border-cad-300 rounded text-xs font-mono w-full focus:border-blue-500 outline-none"
                                placeholder="Dist"
                            />
                            <input 
                                id={`taps-diameter-${idx}`}
                                type="number" 
                                value={tap.diameter} 
                                onChange={(e) => onTapUpdate!(idx, 'diameter', Number(e.target.value))}
                                onFocus={() => onFocus && onFocus(`taps-diameter-${idx}`)}
                                onBlur={onBlur}
                                className="col-span-2 p-1 border border-cad-300 rounded text-xs font-mono w-full focus:border-blue-500 outline-none"
                                placeholder="Dia"
                            />
                                <input 
                                id={`taps-angle-${idx}`}
                                type="number" 
                                value={tap.angle} 
                                onChange={(e) => onTapUpdate!(idx, 'angle', Number(e.target.value))}
                                onFocus={() => onFocus && onFocus(`taps-angle-${idx}`)}
                                onBlur={onBlur}
                                className="col-span-2 p-1 border border-cad-300 rounded text-xs font-mono w-full focus:border-blue-500 outline-none"
                                placeholder="0"
                            />
                            <textarea
                                value={tap.remark || ""} 
                                onChange={(e) => onTapUpdate!(idx, 'remark', e.target.value)}
                                className="col-span-5 p-1 border border-cad-300 rounded text-xs w-full resize-y font-sans leading-tight focus:border-blue-500 outline-none"
                                placeholder="Optional..."
                                rows={2}
                                style={{ minHeight: '32px' }}
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
        <div className="col-span-2 md:col-span-4 lg:col-span-6 mt-2">
            <div className="bg-cad-50 border border-cad-200 rounded p-2">
            <label className="block text-xs font-bold text-cad-500 mb-2 uppercase tracking-wide">NPT Configuration</label>
            {params.nptQty > 0 ? (
                <>
                    <div className="grid grid-cols-12 gap-2 mb-1 text-[10px] font-bold text-cad-400 px-1">
                        <div className="col-span-1 text-center">#</div>
                        <div className="col-span-2">Dist</div>
                        <div className="col-span-2">Size</div>
                        <div className="col-span-2">Angle</div>
                        <div className="col-span-5">Remark</div>
                    </div>
                    {params.nptPorts && params.nptPorts.map((npt: any, idx: number) => (
                        <div key={idx} className="grid grid-cols-12 gap-2 mb-2 items-start">
                            <div className="col-span-1 text-xs font-mono font-bold text-center bg-cad-200 rounded py-1">{idx + 1}</div>
                            <input 
                                id={`npt-dist-${idx}`}
                                type="number" 
                                value={npt.dist} 
                                onChange={(e) => onNptUpdate!(idx, 'dist', Number(e.target.value))}
                                onFocus={() => onFocus && onFocus(`npt-dist-${idx}`)}
                                onBlur={onBlur}
                                className="col-span-2 p-1 border border-cad-300 rounded text-xs font-mono w-full focus:border-blue-500 outline-none"
                                placeholder="Dist"
                            />
                            <input 
                                id={`npt-size-${idx}`}
                                type="text" 
                                value={npt.size} 
                                onChange={(e) => onNptUpdate!(idx, 'size', e.target.value)}
                                onFocus={() => onFocus && onFocus(`npt-size-${idx}`)}
                                onBlur={onBlur}
                                className="col-span-2 p-1 border border-cad-300 rounded text-xs font-mono w-full focus:border-blue-500 outline-none"
                                placeholder='Size'
                            />
                            <input 
                                id={`npt-angle-${idx}`}
                                type="number" 
                                value={npt.angle} 
                                onChange={(e) => onNptUpdate!(idx, 'angle', Number(e.target.value))}
                                onFocus={() => onFocus && onFocus(`npt-angle-${idx}`)}
                                onBlur={onBlur}
                                className="col-span-2 p-1 border border-cad-300 rounded text-xs font-mono w-full focus:border-blue-500 outline-none"
                                placeholder="0"
                            />
                            <textarea
                                value={npt.remark || ""} 
                                onChange={(e) => onNptUpdate!(idx, 'remark', e.target.value)}
                                className="col-span-5 p-1 border border-cad-300 rounded text-xs w-full resize-y font-sans leading-tight focus:border-blue-500 outline-none"
                                placeholder="Optional..."
                                rows={2}
                                style={{ minHeight: '32px' }}
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

export const BlindPlateInputs: React.FC<InputProps> = ({ params, onChange, onFocus, onBlur }) => (
    <>
        <NumInput label="Diameter Ø" fieldId="d1" value={params.d1} onChange={v => onChange('d1', v)} onFocus={onFocus} onBlur={onBlur} suffix="mm" />
    </>
);

export const BlastGateDamperInputs: React.FC<InputProps> = ({ params, onChange, onFocus, onBlur }) => (
    <>
        <NumInput label="Diameter Ø" fieldId="d1" value={params.d1} onChange={v => onChange('d1', v)} onFocus={onFocus} onBlur={onBlur} />
        <NumInput label="Length L" fieldId="length" value={params.length} onChange={v => onChange('length', v)} onFocus={onFocus} onBlur={onBlur} />
    </>
);

export const AngleFlangeInputs: React.FC<InputProps> = ({ params, onChange, onFocus, onBlur }) => (
    <>
        <NumInput label="Diameter Ø" fieldId="d1" value={params.d1} onChange={v => onChange('d1', v)} onFocus={onFocus} onBlur={onBlur} />
    </>
);

export const OffsetInputs: React.FC<InputProps> = ({ params, onChange, onFocus, onBlur }) => (
    <>
        <NumInput label="Diameter Ø" fieldId="d1" value={params.d1} onChange={v => onChange('d1', v)} onFocus={onFocus} onBlur={onBlur} />
        <NumInput label="Length L" fieldId="length" value={params.length} onChange={v => onChange('length', v)} onFocus={onFocus} onBlur={onBlur} />
        <NumInput label="Offset H" fieldId="offset" value={params.offset} onChange={v => onChange('offset', v)} onFocus={onFocus} onBlur={onBlur} />
        
        {/* Flange Remarks */}
        <div className="col-span-2 grid grid-cols-2 gap-4 border-t border-cad-200 pt-2 mt-2">
            <TextAreaInput label="Flange 1 Remark (Left)" value={params.flangeRemark1 || ""} onChange={v => onChange('flangeRemark1', v)} onFocus={onFocus} onBlur={onBlur} />
            <TextAreaInput label="Flange 2 Remark (Right)" value={params.flangeRemark2 || ""} onChange={v => onChange('flangeRemark2', v)} onFocus={onFocus} onBlur={onBlur} />
        </div>
    </>
);