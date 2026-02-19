
import React from 'react';
import { DuctParams } from '../../types';
import { NumInput, TextAreaInput, SelectInput } from '../InputFields';

interface InputProps {
    params: DuctParams;
    onChange: (key: string, val: any) => void;
    onFocus?: (id: string) => void;
    onBlur?: () => void;
}

export const StraightInputs: React.FC<InputProps> = ({ params, onChange, onFocus, onBlur }) => (
    <>
        <NumInput label="D1" fieldId="d1" value={params.d1} onChange={v => onChange('d1', v)} onFocus={onFocus} onBlur={onBlur} suffix="mm" />
        <NumInput label="Len" fieldId="length" value={params.length} onChange={v => onChange('length', v)} onFocus={onFocus} onBlur={onBlur} suffix="mm" />

        <div className="col-span-2 grid grid-cols-2 gap-4 border-t border-cad-200 pt-2 mt-2">
            <TextAreaInput label="Flange 1 Remark (Left)" value={params.flangeRemark1 || ""} onChange={v => onChange('flangeRemark1', v)} onFocus={onFocus} onBlur={onBlur} />
            <TextAreaInput label="Flange 2 Remark (Right)" value={params.flangeRemark2 || ""} onChange={v => onChange('flangeRemark2', v)} onFocus={onFocus} onBlur={onBlur} />
        </div>
    </>
);

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
        
        <div className="grid grid-cols-2 gap-2">
            <NumInput label="Ext 1" fieldId="extension1" value={params.extension1 || 0} onChange={v => onChange('extension1', v)} onFocus={onFocus} onBlur={onBlur} suffix="mm" />
            <NumInput label="Ext 2" fieldId="extension2" value={params.extension2 || 0} onChange={v => onChange('extension2', v)} onFocus={onFocus} onBlur={onBlur} suffix="mm" />
        </div>
        
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

        <div className="col-span-2 grid grid-cols-2 gap-4 border-t border-cad-200 pt-2 mt-2">
            <TextAreaInput label="Flange 1 Remark (Left)" value={params.flangeRemark1 || ""} onChange={v => onChange('flangeRemark1', v)} onFocus={onFocus} onBlur={onBlur} />
            <TextAreaInput label="Flange 2 Remark (Right)" value={params.flangeRemark2 || ""} onChange={v => onChange('flangeRemark2', v)} onFocus={onFocus} onBlur={onBlur} />
        </div>
    </>
);

export const OffsetInputs: React.FC<InputProps> = ({ params, onChange, onFocus, onBlur }) => (
    <>
        <NumInput label="Diameter Ø (D1)" fieldId="d1" value={params.d1} onChange={v => onChange('d1', v)} onFocus={onFocus} onBlur={onBlur} />
        <NumInput label="Diameter Ø (D2)" fieldId="d2" value={params.d2} onChange={v => onChange('d2', v)} onFocus={onFocus} onBlur={onBlur} />
        <NumInput label="Length L" fieldId="length" value={params.length} onChange={v => onChange('length', v)} onFocus={onFocus} onBlur={onBlur} />
        <NumInput label="Offset H" fieldId="offset" value={params.offset} onChange={v => onChange('offset', v)} onFocus={onFocus} onBlur={onBlur} />
        
        <div className="col-span-2 grid grid-cols-2 gap-4 border-t border-cad-200 pt-2 mt-2">
            <TextAreaInput label="Flange 1 Remark (Left)" value={params.flangeRemark1 || ""} onChange={v => onChange('flangeRemark1', v)} onFocus={onFocus} onBlur={onBlur} />
            <TextAreaInput label="Flange 2 Remark (Right)" value={params.flangeRemark2 || ""} onChange={v => onChange('flangeRemark2', v)} onFocus={onFocus} onBlur={onBlur} />
        </div>
    </>
);

export const TransformationInputs: React.FC<InputProps> = ({ params, onChange, onFocus, onBlur }) => (
    <>
        <NumInput label="Diameter Ø" fieldId="d1" value={params.d1} onChange={v => onChange('d1', v)} onFocus={onFocus} onBlur={onBlur} />
        <NumInput label="Rect L" fieldId="width" value={params.width} onChange={v => onChange('width', v)} onFocus={onFocus} onBlur={onBlur} />
        <NumInput label="Rect W" fieldId="height" value={params.height} onChange={v => onChange('height', v)} onFocus={onFocus} onBlur={onBlur} />
        <NumInput label="Length L" fieldId="length" value={params.length} onChange={v => onChange('length', v)} onFocus={onFocus} onBlur={onBlur} />
        <NumInput label="Offset H" fieldId="offset" value={params.offset || 0} onChange={v => onChange('offset', v)} onFocus={onFocus} onBlur={onBlur} />

        <div className="col-span-2 grid grid-cols-2 gap-4 border-t border-cad-200 pt-2 mt-2">
            <TextAreaInput label="Round Flange Remark" value={params.flangeRemark1 || ""} onChange={v => onChange('flangeRemark1', v)} onFocus={onFocus} onBlur={onBlur} />
            <TextAreaInput label="Rect Flange Remark" value={params.flangeRemark2 || ""} onChange={v => onChange('flangeRemark2', v)} onFocus={onFocus} onBlur={onBlur} />
        </div>
    </>
);
