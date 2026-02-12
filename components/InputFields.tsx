import React from 'react';

export const NumInput = ({ label, value, onChange }: { label: string, value: number, onChange: (v: number) => void }) => (
    <div>
        <label className="block text-[10px] uppercase font-bold text-cad-400 mb-1">{label}</label>
        <input 
            type="number" 
            value={value} 
            onChange={(e) => onChange(Number(e.target.value))}
            className="w-full p-1.5 border border-cad-300 rounded text-sm font-mono focus:border-blue-500 outline-none"
        />
    </div>
);

export const TextInput = ({ label, value, onChange }: { label: string, value: string, onChange: (v: string) => void }) => (
    <div>
        <label className="block text-[10px] uppercase font-bold text-cad-400 mb-1">{label}</label>
        <input 
            type="text" 
            value={value} 
            onChange={(e) => onChange(e.target.value)}
            className="w-full p-1.5 border border-cad-300 rounded text-sm focus:border-blue-500 outline-none"
        />
    </div>
);

export const TextAreaInput = ({ label, value, onChange }: { label: string, value: string, onChange: (v: string) => void }) => (
    <div>
        <label className="block text-[10px] uppercase font-bold text-cad-400 mb-1">{label}</label>
        <textarea 
            value={value} 
            onChange={(e) => onChange(e.target.value)}
            className="w-full p-1.5 border border-cad-300 rounded text-sm font-sans focus:border-blue-500 outline-none resize-y"
            rows={3}
        />
    </div>
);

export const SelectInput = ({ label, value, options, onChange }: { label: string, value: string | number, options: (string | number)[], onChange: (v: string) => void }) => (
    <div>
        <label className="block text-[10px] uppercase font-bold text-cad-400 mb-1">{label}</label>
        <select 
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full p-1.5 border border-cad-300 rounded text-sm bg-white font-mono focus:border-blue-500 outline-none"
        >
            {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
    </div>
);