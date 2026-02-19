
import React from 'react';
import { DuctParams } from '../../types';
import { NumInput, TextAreaInput, SelectInput } from '../InputFields';

interface InputProps {
    params: DuctParams;
    onChange: (key: string, val: any) => void;
    onFocus?: (id: string) => void;
    onBlur?: () => void;
}

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

export const BlindPlateInputs: React.FC<InputProps> = ({ params, onChange, onFocus, onBlur }) => (
    <>
        <NumInput label="Diameter Ø" fieldId="d1" value={params.d1} onChange={v => onChange('d1', v)} onFocus={onFocus} onBlur={onBlur} suffix="mm" />
        <div className="grid grid-cols-2 gap-2">
            <NumInput label="P.C.D" fieldId="pcd" value={params.pcd} onChange={v => onChange('pcd', v)} onFocus={onFocus} onBlur={onBlur} suffix="mm" />
            <NumInput label="Holes" fieldId="holeCount" value={params.holeCount} onChange={v => onChange('holeCount', v)} onFocus={onFocus} onBlur={onBlur} suffix="" step={2} />
        </div>
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
        <div className="grid grid-cols-2 gap-2">
            <NumInput label="P.C.D" fieldId="pcd" value={params.pcd} onChange={v => onChange('pcd', v)} onFocus={onFocus} onBlur={onBlur} suffix="mm" />
            <NumInput label="Holes" fieldId="holeCount" value={params.holeCount} onChange={v => onChange('holeCount', v)} onFocus={onFocus} onBlur={onBlur} suffix="" step={2} />
        </div>
    </>
);

export const ManualInputs: React.FC<InputProps> = ({ params, onChange, onFocus, onBlur }) => (
    <div className="col-span-2 md:col-span-3 space-y-4">
        <div className="p-4 bg-blue-50 text-blue-700 text-sm rounded border border-blue-100 flex items-start gap-2">
            <span className="text-lg">ℹ️</span>
            <span><strong>Manual Mode:</strong> Parametric sketch generation is disabled. Please enter a custom description below. The sketch area will be left blank.</span>
        </div>
        <TextAreaInput 
            label="Description" 
            value={params.userDescription || ""} 
            onChange={v => onChange('userDescription', v)} 
            onFocus={onFocus} 
            onBlur={onBlur} 
        />
    </div>
);
