import React from 'react';

// Common interface for inputs
interface BaseInputProps {
    label: string;
    value: number | string;
    onChange: (val: any) => void;
    suffix?: string;
    step?: number;
    // New props for highlighting
    fieldId?: string;
    onFocus?: (id: string) => void;
    onBlur?: () => void;
}

export const NumInput = ({ label, value, onChange, suffix, step = 10, fieldId, onFocus, onBlur }: BaseInputProps) => {
    // Determine suffix based on label if not provided
    const displaySuffix = suffix || (label.toLowerCase().includes('angle') || label.includes('°') ? '°' : 'mm');
    // Sanitize label for ID if not provided
    const safeId = fieldId || label.toLowerCase().replace(/[^a-z0-9]/g, '');

    return (
        <div>
            <label 
                htmlFor={safeId}
                className="block text-[10px] uppercase font-bold text-cad-400 mb-1 tracking-wider cursor-pointer hover:text-blue-500 transition-colors"
            >{label}</label>
            <div className="relative group">
                <input 
                    id={safeId}
                    type="number" 
                    value={value} 
                    onChange={(e) => onChange(Number(e.target.value))}
                    onFocus={() => onFocus && onFocus(safeId)}
                    onBlur={() => onBlur && onBlur()}
                    className="w-full p-2 pr-8 border border-cad-300 rounded text-sm font-mono focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                />
                <span className="absolute right-8 top-1/2 -translate-y-1/2 text-cad-400 text-xs font-semibold pointer-events-none">
                    {displaySuffix}
                </span>
                
                {/* Stepper Buttons (Visible on Hover/Focus) */}
                <div className="absolute right-0 top-0 h-full flex flex-col border-l border-cad-200 opacity-0 group-hover:opacity-100 transition-opacity bg-cad-50 rounded-r">
                    <button 
                        tabIndex={-1}
                        onClick={() => onChange(Number(value) + (step))}
                        className="flex-1 px-1 hover:bg-blue-100 text-cad-500 text-[8px] leading-none border-b border-cad-200"
                    >▲</button>
                    <button 
                        tabIndex={-1}
                        onClick={() => onChange(Number(value) - (step))}
                        className="flex-1 px-1 hover:bg-blue-100 text-cad-500 text-[8px] leading-none"
                    >▼</button>
                </div>
            </div>
        </div>
    );
};

export const TextInput = ({ label, value, onChange, fieldId, onFocus, onBlur }: BaseInputProps) => {
    const safeId = fieldId || label.toLowerCase().replace(/[^a-z0-9]/g, '');
    return (
        <div>
            <label 
                htmlFor={safeId}
                className="block text-[10px] uppercase font-bold text-cad-400 mb-1 tracking-wider cursor-pointer hover:text-blue-500 transition-colors"
            >{label}</label>
            <input 
                id={safeId}
                type="text" 
                value={value} 
                onChange={(e) => onChange(e.target.value)}
                onFocus={() => onFocus && onFocus(safeId)}
                onBlur={() => onBlur && onBlur()}
                className="w-full p-2 border border-cad-300 rounded text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
            />
        </div>
    );
};

export const TextAreaInput = ({ label, value, onChange, fieldId, onFocus, onBlur }: BaseInputProps) => {
    const safeId = fieldId || label.toLowerCase().replace(/[^a-z0-9]/g, '');
    return (
        <div>
            <label 
                htmlFor={safeId}
                className="block text-[10px] uppercase font-bold text-cad-400 mb-1 tracking-wider cursor-pointer hover:text-blue-500 transition-colors"
            >{label}</label>
            <textarea 
                id={safeId}
                value={value} 
                onChange={(e) => onChange(e.target.value)}
                onFocus={() => onFocus && onFocus(safeId)}
                onBlur={() => onBlur && onBlur()}
                className="w-full p-2 border border-cad-300 rounded text-sm font-sans focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none resize-y transition-all"
                rows={3}
            />
        </div>
    );
};

export const SelectInput = ({ label, value, options, onChange, fieldId, onFocus, onBlur }: { label: string, value: string | number, options: (string | number)[], onChange: (v: string) => void, fieldId?: string, onFocus?: (id:string)=>void, onBlur?:()=>void }) => {
    const safeId = fieldId || label.toLowerCase().replace(/[^a-z0-9]/g, '');
    return (
        <div>
            <label 
                htmlFor={safeId}
                className="block text-[10px] uppercase font-bold text-cad-400 mb-1 tracking-wider cursor-pointer hover:text-blue-500 transition-colors"
            >{label}</label>
            <div className="relative">
                <select 
                    id={safeId}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    onFocus={() => onFocus && onFocus(safeId)}
                    onBlur={() => onBlur && onBlur()}
                    className="w-full p-2 border border-cad-300 rounded text-sm bg-white font-mono focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none appearance-none"
                >
                    {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-cad-500">
                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                </div>
            </div>
        </div>
    );
};