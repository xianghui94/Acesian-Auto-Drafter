import React, { useState } from 'react';
import { OrderHeader } from '../types';

interface SidebarProps {
  header: OrderHeader;
  onChange: (field: keyof OrderHeader, value: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ header, onChange }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <aside className={`no-print bg-white border-r border-cad-200 flex flex-col h-full shadow-lg z-10 transition-all duration-300 ease-in-out ${isCollapsed ? 'w-12' : 'w-full md:w-80'}`}>
      
      {/* Toggle Button */}
      <button 
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="h-10 w-full flex items-center justify-center border-b border-cad-200 bg-cad-50 text-cad-500 hover:bg-cad-100 hover:text-cad-800 focus:outline-none"
        title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
      >
         {isCollapsed ? (
             <span className="text-xl">»</span>
         ) : (
             <div className="flex items-center gap-2 w-full px-4">
                 <span className="text-xl">«</span>
                 <span className="text-xs font-bold uppercase">Hide Menu</span>
             </div>
         )}
      </button>

      <div className={`flex flex-col h-full overflow-y-auto ${isCollapsed ? 'hidden' : 'block'}`}>
          <div className="p-6 border-b border-cad-200 bg-cad-50">
            <h1 className="text-xl font-bold text-cad-800 flex items-center gap-2">
              <span className="text-2xl">📝</span> Order Setup
            </h1>
            <p className="text-xs text-cad-500 mt-1 uppercase tracking-wider font-semibold">Header Information</p>
          </div>

          <div className="p-6 space-y-4">
            <InputGroup label="Company" value={header.company} onChange={(v) => onChange('company', v)} />
            <InputGroup label="From" value={header.from} onChange={(v) => onChange('from', v)} />
            <InputGroup label="Project" value={header.project} onChange={(v) => onChange('project', v)} />
            <InputGroup label="Date" type="date" value={header.date} onChange={(v) => onChange('date', v)} />
            <InputGroup label="Lateral No" value={header.lateralNo} onChange={(v) => onChange('lateralNo', v)} />
            <InputGroup label="Required Date" type="date" value={header.requiredDate} onChange={(v) => onChange('requiredDate', v)} />
            
            <div className="border-t border-cad-200 my-4"></div>
            
            <InputGroup label="O.S. No." value={header.osNo} onChange={(v) => onChange('osNo', v)} />
            <InputGroup label="P.O. No." value={header.poNo} onChange={(v) => onChange('poNo', v)} />
            <InputGroup label="Prepared By" value={header.preparedBy} onChange={(v) => onChange('preparedBy', v)} />
            <InputGroup label="Person in Charge" value={header.personInCharge} onChange={(v) => onChange('personInCharge', v)} />
            <InputGroup label="Customer Ref" value={header.customerRef} onChange={(v) => onChange('customerRef', v)} />
            
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-cad-600">Delivery Address</label>
              <textarea
                value={header.deliveryAddress}
                onChange={(e) => onChange('deliveryAddress', e.target.value)}
                className="w-full p-2 bg-white border border-cad-300 rounded text-cad-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-sm"
                rows={3}
              />
            </div>

            <div className="border-t border-cad-200 my-4"></div>

            <div className="grid grid-cols-2 gap-2">
                <InputGroup label="AF Type" value={header.afType} onChange={(v) => onChange('afType', v)} />
                <InputGroup label="Pressure Rating" value={header.pressureRating} onChange={(v) => onChange('pressureRating', v)} />
            </div>
          </div>
      </div>
    </aside>
  );
};

const InputGroup = ({ label, value, onChange, type = "text" }: { label: string, value: string, onChange: (v: string) => void, type?: string }) => (
  <div className="flex flex-col gap-1">
    <label className="text-xs font-semibold text-cad-600">{label}</label>
    <input 
      type={type}
      value={value} 
      onChange={(e) => onChange(e.target.value)} 
      className="w-full p-2 bg-white border border-cad-300 rounded text-cad-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-sm font-medium"
    />
  </div>
);