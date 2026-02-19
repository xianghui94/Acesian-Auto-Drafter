
import React from 'react';
import { DuctParams } from '../../types';
import { NumInput, TextAreaInput } from '../InputFields';

interface InputProps {
    params: DuctParams;
    onChange: (key: string, val: any) => void;
    onFocus?: (id: string) => void;
    onBlur?: () => void;
}

export const TeeInputs: React.FC<InputProps> = ({ params, onChange, onFocus, onBlur }) => (
    <>
        <NumInput label="Main D" fieldId="main_d" value={params.main_d} onChange={v => onChange('main_d', v)} onFocus={onFocus} onBlur={onBlur} />
        <NumInput label="Tap D" fieldId="tap_d" value={params.tap_d} onChange={v => onChange('tap_d', v)} onFocus={onFocus} onBlur={onBlur} />
        <NumInput label="Body L" fieldId="length" value={params.length} onChange={v => onChange('length', v)} onFocus={onFocus} onBlur={onBlur} />
        <NumInput label="Branch L" fieldId="branch_l" value={params.branch_l} onChange={v => onChange('branch_l', v)} onFocus={onFocus} onBlur={onBlur} />
        
        <div className="col-span-2 md:col-span-4 lg:col-span-6 grid grid-cols-3 gap-4 border-t border-cad-200 pt-2 mt-2">
             <TextAreaInput label="F1 Remark (Left)" value={params.flangeRemark1 || ""} onChange={v => onChange('flangeRemark1', v)} onFocus={onFocus} onBlur={onBlur} />
             <TextAreaInput label="F2 Remark (Right)" value={params.flangeRemark2 || ""} onChange={v => onChange('flangeRemark2', v)} onFocus={onFocus} onBlur={onBlur} />
             <TextAreaInput label="F3 Remark (Branch)" value={params.flangeRemark3 || ""} onChange={v => onChange('flangeRemark3', v)} onFocus={onFocus} onBlur={onBlur} />
        </div>
    </>
);

export const CrossTeeInputs: React.FC<InputProps> = ({ params, onChange, onFocus, onBlur }) => (
    <>
        <NumInput label="Main D" fieldId="main_d" value={params.main_d} onChange={v => onChange('main_d', v)} onFocus={onFocus} onBlur={onBlur} />
        <NumInput label="Branch D" fieldId="tap_d" value={params.tap_d} onChange={v => onChange('tap_d', v)} onFocus={onFocus} onBlur={onBlur} />
        <NumInput label="Body L" fieldId="length" value={params.length} onChange={v => onChange('length', v)} onFocus={onFocus} onBlur={onBlur} />
        <NumInput label="Branch L" fieldId="branch_l" value={params.branch_l} onChange={v => onChange('branch_l', v)} onFocus={onFocus} onBlur={onBlur} />
        
        <div className="col-span-2 md:col-span-3 grid grid-cols-2 gap-4 border-t border-cad-200 pt-2 mt-2">
             <TextAreaInput label="F1 Remark (Left)" value={params.flangeRemark1 || ""} onChange={v => onChange('flangeRemark1', v)} onFocus={onFocus} onBlur={onBlur} />
             <TextAreaInput label="F2 Remark (Right)" value={params.flangeRemark2 || ""} onChange={v => onChange('flangeRemark2', v)} onFocus={onFocus} onBlur={onBlur} />
             <TextAreaInput label="F3 Remark (Top)" value={params.flangeRemark3 || ""} onChange={v => onChange('flangeRemark3', v)} onFocus={onFocus} onBlur={onBlur} />
             <TextAreaInput label="F4 Remark (Bot)" value={params.flangeRemark4 || ""} onChange={v => onChange('flangeRemark4', v)} onFocus={onFocus} onBlur={onBlur} />
        </div>
    </>
);

export const LateralTeeInputs: React.FC<InputProps> = ({ params, onChange, onFocus, onBlur }) => (
    <>
        <NumInput label="Main Ø (D1)" fieldId="d1" value={params.d1} onChange={v => onChange('d1', v)} onFocus={onFocus} onBlur={onBlur} />
        <NumInput label="Branch Ø (D3)" fieldId="d2" value={params.d2} onChange={v => onChange('d2', v)} onFocus={onFocus} onBlur={onBlur} />
        <NumInput label="Length L" fieldId="length" value={params.length} onChange={v => onChange('length', v)} onFocus={onFocus} onBlur={onBlur} />
        
        <div className="grid grid-cols-3 gap-2 col-span-2">
            <NumInput label="Collar a" fieldId="a_len" value={params.a_len || 100} onChange={v => onChange('a_len', v)} onFocus={onFocus} onBlur={onBlur} />
            <NumInput label="Collar b" fieldId="b_len" value={params.b_len || 100} onChange={v => onChange('b_len', v)} onFocus={onFocus} onBlur={onBlur} />
            <NumInput label="Branch L" fieldId="branch_len" value={params.branch_len || 100} onChange={v => onChange('branch_len', v)} onFocus={onFocus} onBlur={onBlur} />
        </div>

        <div className="col-span-2 grid grid-cols-2 gap-4 border-t border-cad-200 pt-2 mt-2">
            <TextAreaInput label="Main Flange Remark" value={params.flangeRemark1 || ""} onChange={v => onChange('flangeRemark1', v)} onFocus={onFocus} onBlur={onBlur} />
            <TextAreaInput label="Branch Flange Remark" value={params.flangeRemark2 || ""} onChange={v => onChange('flangeRemark2', v)} onFocus={onFocus} onBlur={onBlur} />
        </div>
    </>
);

export const BootTeeInputs: React.FC<InputProps> = ({ params, onChange, onFocus, onBlur }) => (
    <>
        <NumInput label="Main Ø (D1)" fieldId="d1" value={params.d1} onChange={v => onChange('d1', v)} onFocus={onFocus} onBlur={onBlur} />
        <NumInput label="Branch Ø (D2)" fieldId="d2" value={params.d2} onChange={v => onChange('d2', v)} onFocus={onFocus} onBlur={onBlur} />
        <NumInput label="Length L" fieldId="length" value={params.length} onChange={v => onChange('length', v)} onFocus={onFocus} onBlur={onBlur} />

        <NumInput label="Ext a" fieldId="a_len" value={params.a_len || 100} onChange={v => onChange('a_len', v)} onFocus={onFocus} onBlur={onBlur} />
        <NumInput label="Ext b" fieldId="b_len" value={params.b_len || 100} onChange={v => onChange('b_len', v)} onFocus={onFocus} onBlur={onBlur} />
        <NumInput label="Collar H" fieldId="branch_len" value={params.branch_len || 75} onChange={v => onChange('branch_len', v)} onFocus={onFocus} onBlur={onBlur} />

        <div className="col-span-2 md:col-span-3 grid grid-cols-3 gap-4 border-t border-cad-200 pt-2 mt-2">
            <TextAreaInput label="F1 Remark (Left)" value={params.flangeRemark1 || ""} onChange={v => onChange('flangeRemark1', v)} onFocus={onFocus} onBlur={onBlur} />
            <TextAreaInput label="F2 Remark (Right)" value={params.flangeRemark2 || ""} onChange={v => onChange('flangeRemark2', v)} onFocus={onFocus} onBlur={onBlur} />
            <TextAreaInput label="F3 Remark (Branch)" value={params.flangeRemark3 || ""} onChange={v => onChange('flangeRemark3', v)} onFocus={onFocus} onBlur={onBlur} />
        </div>
    </>
);

export const SaddleInputs: React.FC<InputProps> = ({ params, onChange, onFocus, onBlur }) => (
    <>
        <NumInput label="Main Ø (D1)" fieldId="d1" value={params.d1} onChange={v => onChange('d1', v)} onFocus={onFocus} onBlur={onBlur} />
        <NumInput label="Tap Ø (D2)" fieldId="d2" value={params.d2} onChange={v => onChange('d2', v)} onFocus={onFocus} onBlur={onBlur} />
        <NumInput label="Collar L" fieldId="length" value={params.length} onChange={v => onChange('length', v)} onFocus={onFocus} onBlur={onBlur} />
        
        <div className="col-span-2 grid grid-cols-2 gap-4 border-t border-cad-200 pt-2 mt-2">
            <TextAreaInput label="Flange Remark" value={params.flangeRemark1 || ""} onChange={v => onChange('flangeRemark1', v)} onFocus={onFocus} onBlur={onBlur} />
        </div>
    </>
);
