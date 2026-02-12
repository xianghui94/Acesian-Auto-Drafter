import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { ItemBuilder } from './components/ItemBuilder';
import { OrderSheet } from './components/OrderSheet';
import { OrderHeader, OrderItem } from './types';
import { downloadSheetDxf } from './utils/dxfWriter';

export default function App() {
  // Order Header State
  const [header, setHeader] = useState<OrderHeader>({
    company: "--- Pte Ltd",
    from: "Mr -",
    project: "",
    date: new Date().toISOString().split('T')[0],
    lateralNo: "",
    requiredDate: "",
    osNo: "OS-AT",
    poNo: "-",
    preparedBy: "",
    personInCharge: "",
    customerRef: "ACE/",
    deliveryAddress: "",
    afType: "1",
    pressureRating: "2500 PA"
  });

  // Items State
  const [items, setItems] = useState<OrderItem[]>([]);

  const handleHeaderChange = (field: keyof OrderHeader, value: string) => {
    setHeader(prev => ({ ...prev, [field]: value }));
  };

  const handleAddItem = (itemData: any) => {
    const newItem: OrderItem = {
      id: Date.now().toString(),
      itemNo: items.length + 1,
      ...itemData
    };
    setItems(prev => [...prev, newItem]);
  };

  const handleRemoveItem = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadDxf = () => {
    if (items.length === 0) {
      alert("No items to export.");
      return;
    }
    downloadSheetDxf(items, header);
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-cad-50 font-sans text-cad-900 selection:bg-blue-100 print:h-auto print:w-auto print:overflow-visible print:block">
      
      {/* Left: Global Settings */}
      <Sidebar header={header} onChange={handleHeaderChange} />
      
      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full relative overflow-hidden print:h-auto print:overflow-visible print:block">
        
        {/* Top: Item Builder */}
        <ItemBuilder onAddItem={handleAddItem} />

        {/* Bottom: Preview */}
        <div className="flex-1 relative overflow-auto bg-cad-200 print:h-auto print:overflow-visible print:bg-white print:block">
           {/* Print Toolbar */}
           <div className="no-print absolute top-4 right-8 z-30 flex gap-2">
              <button 
                 onClick={() => setItems([])}
                 className="bg-red-50 hover:bg-red-100 text-red-600 px-4 py-2 rounded shadow border border-red-200 text-sm font-semibold"
              >
                Clear All
              </button>
              
              <button 
                 onClick={handleDownloadDxf}
                 className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded shadow-lg text-sm font-bold flex items-center gap-2"
                 title="Download all items as a single DXF file"
              >
                 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                 Download Sheet DXF
              </button>

              <button 
                 onClick={handlePrint}
                 className="bg-cad-800 hover:bg-cad-900 text-white px-6 py-2 rounded shadow-lg text-sm font-bold flex items-center gap-2"
              >
                 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                 Print / Save PDF
              </button>
           </div>

           <OrderSheet header={header} items={items} onRemoveItem={handleRemoveItem} />
        </div>
      </main>
    </div>
  );
}