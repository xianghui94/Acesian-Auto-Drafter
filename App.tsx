
import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { ItemBuilder } from './components/ItemBuilder';
import { OrderSheet } from './components/OrderSheet';
import { OrderHeader, OrderItem } from './types';
import { downloadSheetDxf } from './utils/dxfWriter';

// --- Lock Screen Component ---
const LockScreen = ({ onUnlock }: { onUnlock: () => void }) => {
    const [passcode, setPasscode] = useState("");
    const [error, setError] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (passcode === "admin") {
            onUnlock();
        } else {
            setError(true);
            setPasscode("");
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-cad-100">
            <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-sm border border-cad-200 animate-[fadeIn_0.3s_ease-out]">
                <div className="flex flex-col items-center mb-6">
                    <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-4 border border-blue-100 shadow-inner overflow-hidden relative">
                        {/* Try to load logo, fallback to icon */}
                        <img 
                            src="/logo_acesian.png" 
                            alt="Logo" 
                            className="w-16 h-16 object-contain z-10 relative"
                            onError={(e) => { (e.target as HTMLImageElement).style.opacity = '0'; }} 
                        />
                        <span className="text-3xl absolute z-0 text-blue-200">🔒</span>
                    </div>
                    <h2 className="text-xl font-bold text-cad-800">Acesian Auto-Drafter</h2>
                    <p className="text-xs text-cad-500 font-medium uppercase tracking-wider mt-1">System Locked</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="relative">
                        <input
                            type="password"
                            value={passcode}
                            onChange={(e) => { setPasscode(e.target.value); setError(false); }}
                            className={`w-full px-4 py-3 rounded-lg border text-center font-mono text-lg outline-none focus:ring-2 transition-all ${
                                error 
                                ? 'border-red-300 bg-red-50 text-red-900 focus:ring-red-200 placeholder-red-300' 
                                : 'border-cad-300 bg-cad-50 text-cad-900 focus:border-blue-500 focus:ring-blue-200'
                            }`}
                            placeholder="Enter Passcode"
                            autoFocus
                        />
                    </div>
                    
                    {error && (
                        <p className="text-xs text-red-600 text-center font-bold animate-pulse bg-red-100 py-1 rounded">
                            Incorrect Passcode
                        </p>
                    )}

                    <button
                        type="submit"
                        className="w-full bg-cad-900 hover:bg-black text-white font-bold py-3 rounded-lg shadow-lg hover:shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2"
                    >
                        <span>Unlock System</span>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                    </button>
                </form>

                <div className="mt-8 text-center border-t border-cad-100 pt-4">
                    <p className="text-[10px] text-cad-400">
                        Authorized Personnel Only<br/>
                        Acesian Technologies Pte Ltd
                    </p>
                </div>
            </div>
        </div>
    );
};

export default function App() {
  // Auth State
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    try {
        return sessionStorage.getItem('acesian_auth') === 'true';
    } catch {
        return false;
    }
  });

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
  
  // Edit / Insert Mode State
  const [editingItem, setEditingItem] = useState<OrderItem | null>(null);
  const [insertIndex, setInsertIndex] = useState<number | null>(null);

  // Helper: Re-calculate Item Numbers sequentially
  const reindexItems = (list: OrderItem[]): OrderItem[] => {
      return list.map((item, index) => ({
          ...item,
          itemNo: index + 1
      }));
  };

  const handleUnlock = () => {
    sessionStorage.setItem('acesian_auth', 'true');
    setIsAuthenticated(true);
  };

  const handleHeaderChange = (field: keyof OrderHeader, value: string) => {
    setHeader(prev => ({ ...prev, [field]: value }));
  };
  
  const handleBulkHeaderChange = (updates: Partial<OrderHeader>) => {
    setHeader(prev => ({ ...prev, ...updates }));
  };

  // Central Save Handler (Add / Update / Insert)
  const handleSaveItem = (itemData: any) => {
    let newItems = [...items];

    if (editingItem) {
        // Update Existing Item
        newItems = newItems.map(item => 
            item.id === editingItem.id 
                ? { ...item, ...itemData, id: item.id } // Preserve ID
                : item
        );
        setEditingItem(null);
    } else if (insertIndex !== null) {
        // Insert at specific index (Insert Before)
        const newItem: OrderItem = {
            id: Date.now().toString(),
            itemNo: 0, // Will be fixed by reindex
            ...itemData
        };
        newItems.splice(insertIndex, 0, newItem);
        setInsertIndex(null);
    } else {
        // Standard Add (Append to end)
        const newItem: OrderItem = {
            id: Date.now().toString(),
            itemNo: 0,
            ...itemData
        };
        newItems.push(newItem);
    }

    setItems(reindexItems(newItems));
  };

  const handleRemoveItem = (id: string) => {
    const newItems = items.filter(item => item.id !== id);
    setItems(reindexItems(newItems));
    
    // If we removed the item currently being edited, cancel edit mode
    if (editingItem && editingItem.id === id) {
        setEditingItem(null);
    }
  };

  const handleDuplicateItem = (item: OrderItem) => {
    const newItem: OrderItem = {
      ...item,
      id: Date.now().toString(),
      itemNo: 0, // Will be reindexed
    };
    // Add to end by default
    const newItems = [...items, newItem];
    setItems(reindexItems(newItems));
  };

  const handleMoveItem = (index: number, direction: 'up' | 'down') => {
      if (direction === 'up' && index === 0) return;
      if (direction === 'down' && index === items.length - 1) return;

      const newItems = [...items];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      
      // Swap
      [newItems[index], newItems[targetIndex]] = [newItems[targetIndex], newItems[index]];
      
      setItems(reindexItems(newItems));
  };

  // Triggers Edit Mode
  const handleEditClick = (item: OrderItem) => {
      setEditingItem(item);
      setInsertIndex(null);
      window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Triggers Insert Mode
  const handleInsertClick = (index: number) => {
      setInsertIndex(index);
      setEditingItem(null);
      window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelMode = () => {
      setEditingItem(null);
      setInsertIndex(null);
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

  if (!isAuthenticated) {
      return <LockScreen onUnlock={handleUnlock} />;
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-cad-50 font-sans text-cad-900 selection:bg-blue-100 print:h-auto print:w-auto print:overflow-visible print:block">
      
      {/* Left: Global Settings */}
      <Sidebar 
          header={header} 
          onChange={handleHeaderChange}
          onBulkChange={handleBulkHeaderChange} 
      />
      
      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full relative overflow-hidden print:h-auto print:overflow-visible print:block">
        
        {/* Top: Item Builder */}
        <ItemBuilder 
            onSave={handleSaveItem} 
            editingItem={editingItem}
            insertIndex={insertIndex}
            onCancel={handleCancelMode}
        />

        {/* Bottom: Preview (Updated overflow-y-auto to allow scrolling) */}
        <div className="flex-1 relative overflow-y-auto bg-cad-200 print:h-auto print:overflow-visible print:bg-white print:block">
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
                 title="Download all items as a single DXF file compatible with AutoCAD"
              >
                 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                 Export to AutoCAD (.dxf)
              </button>

              <button 
                 onClick={handlePrint}
                 className="bg-cad-800 hover:bg-cad-900 text-white px-6 py-2 rounded shadow-lg text-sm font-bold flex items-center gap-2"
              >
                 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                 Print / Save PDF
              </button>
           </div>

           <OrderSheet 
                header={header} 
                items={items} 
                onRemoveItem={handleRemoveItem}
                onEditItem={handleEditClick}
                onInsertBefore={handleInsertClick} 
                onDuplicateItem={handleDuplicateItem}
                onMoveItem={handleMoveItem}
            />
        </div>
      </main>
    </div>
  );
}
