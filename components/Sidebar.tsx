
import React, { useState, useEffect } from 'react';
import { OrderHeader } from '../types';

interface SidebarProps {
  header: OrderHeader;
  onChange: (field: keyof OrderHeader, value: string) => void;
  onBulkChange: (updates: Partial<OrderHeader>) => void;
}

interface SavedProfile {
    id: string;
    name: string;
    data: Partial<OrderHeader>;
}

export const Sidebar: React.FC<SidebarProps> = ({ header, onChange, onBulkChange }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  // Address Book State
  const [showAddressBook, setShowAddressBook] = useState(false);
  const [savedProfiles, setSavedProfiles] = useState<SavedProfile[]>([]);
  const [newProfileName, setNewProfileName] = useState("");

  // Load profiles from localStorage on mount
  useEffect(() => {
      const saved = localStorage.getItem('acesian_address_book');
      if (saved) {
          try {
              setSavedProfiles(JSON.parse(saved));
          } catch (e) {
              console.error("Failed to parse address book", e);
          }
      }
  }, []);

  const handleSaveProfile = () => {
      if (!newProfileName.trim()) {
          alert("Please enter a name for this profile");
          return;
      }
      // Save relevant customer fields
      const profile: SavedProfile = {
          id: Date.now().toString(),
          name: newProfileName,
          data: {
              company: header.company,
              from: header.from,
              project: header.project,
              preparedBy: header.preparedBy,
              personInCharge: header.personInCharge,
              customerRef: header.customerRef,
              deliveryAddress: header.deliveryAddress,
              afType: header.afType,
              pressureRating: header.pressureRating
          }
      };
      const updated = [...savedProfiles, profile];
      setSavedProfiles(updated);
      localStorage.setItem('acesian_address_book', JSON.stringify(updated));
      setNewProfileName("");
  };

  const handleLoadProfile = (profile: SavedProfile) => {
      if (window.confirm(`Load profile "${profile.name}"? This will overwrite current header fields.`)) {
          onBulkChange(profile.data);
          setShowAddressBook(false);
      }
  };

  const handleDeleteProfile = (id: string) => {
      if (window.confirm("Are you sure you want to delete this profile?")) {
          const updated = savedProfiles.filter(p => p.id !== id);
          setSavedProfiles(updated);
          localStorage.setItem('acesian_address_book', JSON.stringify(updated));
      }
  };

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
            <div className="flex items-center justify-between">
                <h1 className="text-xl font-bold text-cad-800 flex items-center gap-2">
                <span className="text-2xl">📝</span> Order Setup
                </h1>
                <button 
                    onClick={() => setShowAddressBook(true)}
                    className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200 font-bold border border-blue-200 flex items-center gap-1 shadow-sm"
                    title="Open Address Book"
                >
                    <span>📒</span> Book
                </button>
            </div>
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

      {/* Address Book Modal */}
      {showAddressBook && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
              <div className="bg-white rounded-lg shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[85vh] animate-[fadeIn_0.2s_ease-out]">
                  <div className="p-4 bg-cad-50 border-b border-cad-200 flex justify-between items-center">
                      <h3 className="font-bold text-cad-800 flex items-center gap-2 text-lg">
                          <span>📒</span> Address Book
                      </h3>
                      <button 
                        onClick={() => setShowAddressBook(false)} 
                        className="text-cad-400 hover:text-red-500 transition-colors font-bold p-1 rounded-full hover:bg-red-50"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                  </div>
                  
                  <div className="p-4 bg-blue-50 border-b border-blue-100">
                      <label className="block text-xs font-bold text-blue-800 mb-2 uppercase tracking-wide">Save Current Header Info</label>
                      <div className="flex gap-2">
                          <input 
                              type="text" 
                              placeholder="Profile Name (e.g. Acme Corp - Jurong)" 
                              value={newProfileName}
                              onChange={(e) => setNewProfileName(e.target.value)}
                              className="flex-1 p-2 border border-blue-200 rounded text-sm focus:outline-none focus:border-blue-500 shadow-sm"
                              onKeyDown={(e) => e.key === 'Enter' && handleSaveProfile()}
                          />
                          <button 
                              onClick={handleSaveProfile}
                              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1 rounded text-sm font-bold shadow-sm transition-colors"
                          >
                              Save
                          </button>
                      </div>
                      <p className="text-[10px] text-blue-600 mt-2 flex items-start gap-1">
                          <span className="text-lg leading-none">ℹ️</span>
                          <span>Saves: Company, From, Project, Prepared By, Person In Charge, Cust Ref, Address, AF Type, Pressure.</span>
                      </p>
                  </div>

                  <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
                      <label className="block text-xs font-bold text-cad-500 uppercase tracking-wide mb-1">Saved Profiles</label>
                      {savedProfiles.length === 0 ? (
                          <div className="text-center text-cad-400 text-sm py-8 border-2 border-dashed border-cad-200 rounded-lg">
                              No saved profiles yet.
                          </div>
                      ) : (
                          savedProfiles.map(profile => (
                              <div key={profile.id} className="bg-white border border-cad-200 rounded-lg p-3 hover:shadow-md transition-shadow flex justify-between items-center group">
                                  <div className="overflow-hidden mr-3">
                                      <div className="font-bold text-sm text-cad-800 truncate" title={profile.name}>{profile.name}</div>
                                      <div className="text-xs text-cad-500 truncate" title={profile.data.company}>{profile.data.company || 'No Company'}</div>
                                  </div>
                                  <div className="flex gap-2 shrink-0">
                                      <button 
                                          onClick={() => handleLoadProfile(profile)}
                                          className="text-xs bg-green-50 text-green-700 px-3 py-1.5 rounded hover:bg-green-100 font-bold border border-green-200 transition-colors"
                                          title="Load into form"
                                      >
                                          Load
                                      </button>
                                      <button 
                                          onClick={() => handleDeleteProfile(profile.id)}
                                          className="text-xs bg-red-50 text-red-700 px-3 py-1.5 rounded hover:bg-red-100 font-bold border border-red-200 transition-colors"
                                          title="Delete profile"
                                      >
                                          Delete
                                      </button>
                                  </div>
                              </div>
                          ))
                      )}
                  </div>
              </div>
          </div>
      )}
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
