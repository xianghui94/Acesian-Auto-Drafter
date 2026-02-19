import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { ItemBuilder } from './components/ItemBuilder';
import { OrderSheet } from './components/OrderSheet';
import { AiWizard } from './components/AiWizard';
import { OrderHeader, OrderItem, SavedProject } from './types';
import { downloadSheetDxf } from './utils/dxfWriter';
import { generateDuctDrawing } from './services/geminiService';

// --- Lock Screen Component (Unchanged) ---
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
                    </button>
                </form>
            </div>
        </div>
    );
};

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    try {
        return sessionStorage.getItem('acesian_auth') === 'true';
    } catch {
        return false;
    }
  });

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

  const [items, setItems] = useState<OrderItem[]>([]);
  const [editingItem, setEditingItem] = useState<OrderItem | null>(null);
  const [insertIndex, setInsertIndex] = useState<number | null>(null);
  const [showSummary, setShowSummary] = useState(true);
  const [includeSummaryInPrint, setIncludeSummaryInPrint] = useState(true);
  
  // AI Feature State
  const [showAiWizard, setShowAiWizard] = useState(false);

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

  const handleSaveItem = (itemData: any) => {
    let newItems = [...items];

    if (editingItem) {
        newItems = newItems.map(item => 
            item.id === editingItem.id 
                ? { ...item, ...itemData, id: item.id } 
                : item
        );
        setEditingItem(null);
    } else if (insertIndex !== null) {
        const newItem: OrderItem = {
            id: Date.now().toString(),
            itemNo: 0, 
            ...itemData
        };
        newItems.splice(insertIndex, 0, newItem);
        setInsertIndex(null);
    } else {
        const newItem: OrderItem = {
            id: Date.now().toString(),
            itemNo: 0,
            ...itemData
        };
        newItems.push(newItem);
    }

    setItems(reindexItems(newItems));
  };

  // Bulk import from AI
  const handleAiImport = (importedItems: any[]) => {
      // Process imported items to generate SVGs
      const processedItems = importedItems.map((item, idx) => ({
          ...item,
          id: `ai-${Date.now()}-${idx}`,
          itemNo: 0,
          // Generate the SVG now based on extracted params
          sketchSvg: generateDuctDrawing(item.componentType, item.params)
      }));
      
      const newItems = [...items, ...processedItems];
      setItems(reindexItems(newItems));
  };

  const handleRemoveItem = (id: string) => {
    const newItems = items.filter(item => item.id !== id);
    setItems(reindexItems(newItems));
    if (editingItem && editingItem.id === id) setEditingItem(null);
  };

  const handleDuplicateItem = (item: OrderItem) => {
    const newItem: OrderItem = {
      ...item,
      id: Date.now().toString(),
      itemNo: 0, 
    };
    const newItems = [...items, newItem];
    setItems(reindexItems(newItems));
  };

  const handleMoveItem = (index: number, direction: 'up' | 'down') => {
      if (direction === 'up' && index === 0) return;
      if (direction === 'down' && index === items.length - 1) return;
      const newItems = [...items];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      [newItems[index], newItems[targetIndex]] = [newItems[targetIndex], newItems[index]];
      setItems(reindexItems(newItems));
  };

  const handleEditClick = (item: OrderItem) => {
      setEditingItem(item);
      setInsertIndex(null);
      window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleInsertClick = (index: number) => {
      setInsertIndex(index);
      setEditingItem(null);
      window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelMode = () => {
      setEditingItem(null);
      setInsertIndex(null);
  };

  const handlePrint = () => window.print();

  const handleDownloadDxf = () => {
    if (items.length === 0) { alert("No items to export."); return; }
    downloadSheetDxf(items, header);
  };

  const handleSaveProject = () => {
      const data: SavedProject = { version: "1.0", timestamp: Date.now(), header: header, items: items };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${header.project || "Project"}_${header.osNo || "Data"}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  const handleLoadProject = (file: File) => {
      const reader = new FileReader();
      reader.onload = (e) => {
          try {
              const data = JSON.parse(e.target?.result as string) as SavedProject;
              if (data.header && Array.isArray(data.items)) {
                  if (window.confirm("Load project? This will replace your current workspace.")) {
                      setHeader(data.header);
                      setItems(data.items);
                      setEditingItem(null);
                      setInsertIndex(null);
                  }
              } else { alert("Invalid project file structure."); }
          } catch (err) { alert("Failed to parse project file."); }
      };
      reader.readAsText(file);
  };

  if (!isAuthenticated) return <LockScreen onUnlock={handleUnlock} />;

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-cad-50 font-sans text-cad-900 selection:bg-blue-100 print:h-auto print:w-auto print:overflow-visible print:block">
      
      <Sidebar 
          header={header} 
          onChange={handleHeaderChange}
          onBulkChange={handleBulkHeaderChange} 
          onSaveProject={handleSaveProject}
          onLoadProject={handleLoadProject}
          onOpenAiWizard={() => setShowAiWizard(true)}
      />
      
      <main className="flex-1 flex flex-col h-full relative overflow-hidden print:h-auto print:overflow-visible print:block">
        
        <ItemBuilder 
            onSave={handleSaveItem} 
            editingItem={editingItem}
            insertIndex={insertIndex}
            onCancel={handleCancelMode}
        />

        <div className="flex-1 relative overflow-y-auto bg-cad-200 print:h-auto print:overflow-visible print:bg-white print:block">
           <div className="no-print absolute top-4 right-8 z-30 flex flex-col items-end gap-2">
              <div className="flex gap-2">
                  <button 
                     onClick={() => setItems([])}
                     className="bg-red-50 hover:bg-red-100 text-red-600 px-4 py-2 rounded shadow border border-red-200 text-sm font-semibold"
                  >
                    Clear All
                  </button>
                  <button 
                     onClick={handleDownloadDxf}
                     className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded shadow-lg text-sm font-bold flex items-center gap-2"
                  >
                     <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                     Export DXF
                  </button>
                  <button 
                     onClick={handlePrint}
                     className="bg-cad-800 hover:bg-cad-900 text-white px-6 py-2 rounded shadow-lg text-sm font-bold flex items-center gap-2"
                  >
                     <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                     Print / PDF
                  </button>
              </div>

              <div className="bg-white/90 backdrop-blur p-2 rounded shadow border border-cad-200 text-xs flex gap-4">
                  <label className="flex items-center gap-1 cursor-pointer select-none text-cad-700 font-bold">
                      <input type="checkbox" checked={showSummary} onChange={(e) => setShowSummary(e.target.checked)} />
                      Show Weight Calc
                  </label>
                  {showSummary && (
                      <label className="flex items-center gap-1 cursor-pointer select-none text-cad-700 font-bold">
                          <input type="checkbox" checked={includeSummaryInPrint} onChange={(e) => setIncludeSummaryInPrint(e.target.checked)} />
                          Print Calc
                      </label>
                  )}
              </div>
           </div>

           <OrderSheet 
                header={header} 
                items={items} 
                onRemoveItem={handleRemoveItem}
                onEditItem={handleEditClick}
                onInsertBefore={handleInsertClick} 
                onDuplicateItem={handleDuplicateItem}
                onMoveItem={handleMoveItem}
                showSummary={showSummary}
                printSummary={includeSummaryInPrint}
            />
        </div>

        {/* AI Wizard Modal */}
        {showAiWizard && (
            <AiWizard 
                onClose={() => setShowAiWizard(false)} 
                onImport={handleAiImport} 
            />
        )}
      </main>
    </div>
  );
}