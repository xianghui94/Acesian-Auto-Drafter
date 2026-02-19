
import React, { useState, useRef } from 'react';
import readXlsxFile from 'read-excel-file';
import { Sidebar } from './components/Sidebar';
import { ItemBuilder } from './components/ItemBuilder';
import { OrderSheet } from './components/OrderSheet';
import { OrderHeader, OrderItem, SavedProject } from './types';
import { downloadSheetDxf } from './utils/dxfWriter';
import { parseExcelDataWithAI } from './services/excelAgent';

// --- Lock Screen Component (Separated Passcode & API Key) ---
const LockScreen = ({ onUnlock }: { onUnlock: (apiKey?: string) => void }) => {
    const [passcode, setPasscode] = useState("");
    const [apiKey, setApiKey] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        // Simulate network delay for UX
        await new Promise(r => setTimeout(r, 600));

        // 1. Validate Access Passcode
        if (passcode.toLowerCase() !== "admin") {
            setError("Incorrect Access Passcode");
            setLoading(false);
            return;
        }

        // 2. Validate API Key format if provided
        if (apiKey && apiKey.length < 20) {
            setError("Invalid Google API Key format");
            setLoading(false);
            return;
        }

        onUnlock(apiKey || undefined);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-cad-100">
            <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md border border-cad-200 animate-[fadeIn_0.3s_ease-out]">
                <div className="flex flex-col items-center mb-6">
                    <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-4 border border-blue-100 shadow-inner overflow-hidden relative">
                        <img 
                            src="/logo_acesian.png" 
                            alt="Logo" 
                            className="w-16 h-16 object-contain z-10 relative"
                            onError={(e) => { (e.target as HTMLImageElement).style.opacity = '0'; }} 
                        />
                        <span className="text-3xl absolute z-0 text-blue-200">🔐</span>
                    </div>
                    <h2 className="text-xl font-bold text-cad-800">Acesian Auto-Drafter</h2>
                    <p className="text-xs text-cad-500 font-medium uppercase tracking-wider mt-1">Authorized Personnel Only</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded text-red-600 text-xs font-bold text-center">
                            {error}
                        </div>
                    )}

                    {/* 1. App Passcode */}
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-cad-600 uppercase">Access Passcode <span className="text-red-500">*</span></label>
                        <input
                            type="password"
                            value={passcode}
                            onChange={(e) => setPasscode(e.target.value)}
                            className="w-full px-4 py-3 rounded-lg border border-cad-300 bg-cad-50 text-center font-mono text-sm outline-none focus:ring-2 focus:border-blue-500 focus:ring-blue-200"
                            placeholder="Enter Access Code"
                            autoFocus
                        />
                    </div>

                    <div className="relative flex py-2 items-center">
                        <div className="flex-grow border-t border-cad-200"></div>
                        <span className="flex-shrink-0 mx-2 text-cad-400 text-[10px] uppercase">AI Configuration (Optional)</span>
                        <div className="flex-grow border-t border-cad-200"></div>
                    </div>

                    {/* 2. API Key */}
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-cad-600 uppercase">Google Gemini API Key</label>
                        <input
                            type="password"
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            className="w-full px-4 py-3 rounded-lg border border-cad-300 bg-white text-center font-mono text-sm outline-none focus:ring-2 focus:border-purple-500 focus:ring-purple-200 placeholder:text-cad-300"
                            placeholder="Leave empty for Manual Mode"
                        />
                        <div className="text-[10px] text-center text-cad-400">
                            Required only for "Import Excel" feature. <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-blue-500 hover:underline">Get Key</a>
                        </div>
                    </div>
                    
                    <button
                        type="submit"
                        disabled={loading || !passcode}
                        className={`w-full font-bold py-3 rounded-lg shadow-lg hover:shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2 mt-4 
                            ${passcode ? 'bg-cad-900 hover:bg-black text-white' : 'bg-cad-200 text-cad-400 cursor-not-allowed'}`}
                    >
                        {loading ? 'Verifying...' : 'Login System'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default function App() {
  // Auth State: Checks if authenticated via Passcode
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return sessionStorage.getItem('acesian_auth_token') === 'valid';
  });

  // Derived state to check if AI is available
  const hasApiKey = !!sessionStorage.getItem('acesian_api_key');

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

  const [items, setItems] = useState<OrderItem[]>([]);
  const [editingItem, setEditingItem] = useState<OrderItem | null>(null);
  const [insertIndex, setInsertIndex] = useState<number | null>(null);
  const [showSummary, setShowSummary] = useState(true);
  const [includeSummaryInPrint, setIncludeSummaryInPrint] = useState(true);
  
  // AI Agent State
  const [isProcessingExcel, setIsProcessingExcel] = useState(false);
  const excelInputRef = useRef<HTMLInputElement>(null);

  const reindexItems = (list: OrderItem[]): OrderItem[] => {
      return list.map((item, index) => ({
          ...item,
          itemNo: index + 1
      }));
  };

  const handleUnlock = (key?: string) => {
    sessionStorage.setItem('acesian_auth_token', 'valid');
    if (key) {
        sessionStorage.setItem('acesian_api_key', key);
    } else {
        sessionStorage.removeItem('acesian_api_key');
    }
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
        newItems = newItems.map(item => item.id === editingItem.id ? { ...item, ...itemData, id: item.id } : item);
        setEditingItem(null);
    } else if (insertIndex !== null) {
        const newItem: OrderItem = { id: Date.now().toString(), itemNo: 0, ...itemData };
        newItems.splice(insertIndex, 0, newItem);
        setInsertIndex(null);
    } else {
        const newItem: OrderItem = { id: Date.now().toString(), itemNo: 0, ...itemData };
        newItems.push(newItem);
    }
    setItems(reindexItems(newItems));
  };

  const handleRemoveItem = (id: string) => {
    const newItems = items.filter(item => item.id !== id);
    setItems(reindexItems(newItems));
    if (editingItem && editingItem.id === id) setEditingItem(null);
  };

  const handleDuplicateItem = (item: OrderItem) => {
    const newItem: OrderItem = { ...item, id: Date.now().toString(), itemNo: 0 };
    setItems(reindexItems([...items, newItem]));
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

  // --- Excel Agent Logic ---
  const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!hasApiKey) {
          alert("Feature Locked: No API Key provided during login.\n\nPlease reload the app and enter a valid Google Gemini API Key to use AI features.");
          e.target.value = ""; // Reset file input
          return;
      }
      
      if (e.target.files && e.target.files.length > 0) {
          const file = e.target.files[0];
          setIsProcessingExcel(true);
          try {
              const rows = await readXlsxFile(file);
              // Rows is an array of arrays. Convert to array of objects for better AI context.
              // Assume Row 0 is header
              const headers = rows[0].map(h => String(h));
              const data = rows.slice(1).map(row => {
                  let obj: any = {};
                  headers.forEach((h, i) => { obj[h] = row[i]; });
                  return obj;
              });

              const aiItems = await parseExcelDataWithAI(data);
              
              if (aiItems.length > 0) {
                  const confirmMsg = `AI successfully parsed ${aiItems.length} items.\n\nClick OK to append them to your order sheet.`;
                  if (window.confirm(confirmMsg)) {
                      setItems(prev => reindexItems([...prev, ...aiItems]));
                  }
              } else {
                  alert("AI could not identify any ductwork items in this file.");
              }

          } catch (err) {
              console.error(err);
              alert("Error processing Excel file. Ensure it is a valid .xlsx or .csv.");
          } finally {
              setIsProcessingExcel(false);
              e.target.value = ""; // Reset
          }
      }
  };

  if (!isAuthenticated) {
      return <LockScreen onUnlock={handleUnlock} />;
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-cad-50 font-sans text-cad-900 selection:bg-blue-100 print:h-auto print:w-auto print:overflow-visible print:block">
      
      {/* Loading Overlay */}
      {isProcessingExcel && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex flex-col items-center justify-center text-white">
              <div className="text-4xl animate-bounce mb-4">🤖</div>
              <h2 className="text-2xl font-bold">AI Agent is Thinking...</h2>
              <p className="text-sm opacity-80">Reading Excel • Interpreting Data • Generating Drawings</p>
          </div>
      )}

      <Sidebar 
          header={header} 
          onChange={handleHeaderChange}
          onBulkChange={handleBulkHeaderChange} 
          onSaveProject={handleSaveProject}
          onLoadProject={handleLoadProject}
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
                     onClick={() => hasApiKey ? excelInputRef.current?.click() : alert("Feature Locked: No API Key provided during login.\n\nPlease reload and enter a valid Google Gemini API Key.")}
                     className={`${hasApiKey ? 'bg-purple-600 hover:bg-purple-700 animate-[pulse_3s_infinite]' : 'bg-gray-400 cursor-not-allowed'} text-white px-4 py-2 rounded shadow-lg text-sm font-bold flex items-center gap-2 transition-colors`}
                     title={hasApiKey ? "Import Excel with Gemini AI" : "Locked: No API Key"}
                  >
                     {hasApiKey ? (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                     ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                     )}
                     Import Excel {hasApiKey ? '(AI)' : '(Locked)'}
                  </button>
                  <input type="file" ref={excelInputRef} onChange={handleExcelUpload} accept=".xlsx, .csv" className="hidden" disabled={!hasApiKey} />

                  <button 
                     onClick={() => setItems([])}
                     className="bg-red-50 hover:bg-red-100 text-red-600 px-4 py-2 rounded shadow border border-red-200 text-sm font-semibold"
                  >
                    Clear
                  </button>
                  
                  <button 
                     onClick={handleDownloadDxf}
                     className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded shadow-lg text-sm font-bold flex items-center gap-2"
                  >
                     <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                     DXF
                  </button>

                  <button 
                     onClick={handlePrint}
                     className="bg-cad-800 hover:bg-cad-900 text-white px-6 py-2 rounded shadow-lg text-sm font-bold flex items-center gap-2"
                  >
                     <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                     PDF
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
      </main>
    </div>
  );
}
