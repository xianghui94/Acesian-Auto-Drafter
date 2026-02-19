
import React, { useMemo } from 'react';
import { OrderHeader, OrderItem } from '../types';
import { calculateOrderTotals } from '../services/calculators';

interface OrderSheetProps {
  header: OrderHeader;
  items: OrderItem[];
  onRemoveItem: (id: string) => void;
  onEditItem: (item: OrderItem) => void;
  onInsertBefore: (index: number) => void;
  onDuplicateItem: (item: OrderItem) => void;
  onMoveItem: (index: number, direction: 'up' | 'down') => void;
  showSummary?: boolean;
  printSummary?: boolean;
}

const ITEMS_PER_PAGE = 6;

export const OrderSheet: React.FC<OrderSheetProps> = ({ 
    header, 
    items, 
    onRemoveItem, 
    onEditItem, 
    onInsertBefore, 
    onDuplicateItem, 
    onMoveItem,
    showSummary = false,
    printSummary = false
}) => {
  
  const totals = useMemo(() => calculateOrderTotals(items), [items]);

  if (items.length === 0) {
      return (
          <div className="flex flex-col items-center justify-center p-12 bg-white rounded-lg shadow-sm border border-cad-200 text-center max-w-2xl mx-auto mt-8">
              <div className="text-6xl mb-4">Drafting Board</div>
              <h2 className="text-2xl font-bold text-cad-800 mb-2">No Items Yet</h2>
              <p className="text-cad-500 mb-6">Select a component type from the builder above and click "Add Item" to start your order sheet.</p>
              <div className="p-4 bg-cad-50 rounded text-sm text-cad-600 border border-cad-100 text-left space-y-2">
                  <p><strong>⚡ Shortcut:</strong> Use <span className="font-mono bg-white px-1 border rounded">Ctrl+Enter</span> to quick add.</p>
                  <p><strong>👀 Preview:</strong> Click inputs to see dimensions highlight in the sketch.</p>
              </div>
          </div>
      );
  }

  // Split items into pages
  const pages = [];
  for (let i = 0; i < items.length; i += ITEMS_PER_PAGE) {
    pages.push(items.slice(i, i + ITEMS_PER_PAGE));
  }

  return (
    <div className="flex relative">
        <div className="flex flex-col gap-8 bg-cad-200 p-8 items-center print:p-0 print:gap-0 print:bg-white print:block w-full">
        {pages.map((pageItems, pageIndex) => (
            <div key={pageIndex} id={`page-${pageIndex + 1}`}>
                <SinglePage 
                    header={header}
                    items={pageItems}
                    pageIndex={pageIndex}
                    totalPages={pages.length}
                    startIndex={pageIndex * ITEMS_PER_PAGE}
                    onRemoveItem={onRemoveItem}
                    onEditItem={onEditItem}
                    onInsertBefore={onInsertBefore}
                    onDuplicateItem={onDuplicateItem}
                    onMoveItem={onMoveItem}
                />
            </div>
        ))}

        {/* Summary Page */}
        {showSummary && (
            <div className={`w-full max-w-[210mm] ${printSummary ? 'print:block' : 'print:hidden'}`}>
                <div className="a4-page bg-white p-10 flex flex-col">
                    <div className="border-b-2 border-cad-900 pb-4 mb-6">
                        <h1 className="text-2xl font-bold text-cad-900">Estimation Summary</h1>
                        <div className="flex justify-between mt-2 text-sm text-cad-600">
                            <span>Project: <span className="font-bold text-cad-800">{header.project || 'N/A'}</span></span>
                            <span>OS No: <span className="font-bold text-cad-800">{header.osNo || 'N/A'}</span></span>
                            <span>Date: <span className="font-bold text-cad-800">{header.date}</span></span>
                        </div>
                    </div>

                    <div className="flex-1 overflow-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-cad-50 text-cad-900 uppercase text-xs font-bold">
                                <tr>
                                    <th className="px-4 py-2 border-b border-cad-200">#</th>
                                    <th className="px-4 py-2 border-b border-cad-200">Description</th>
                                    <th className="px-4 py-2 border-b border-cad-200">Material</th>
                                    <th className="px-4 py-2 border-b border-cad-200">Thk</th>
                                    <th className="px-4 py-2 border-b border-cad-200 text-right">Qty</th>
                                    <th className="px-4 py-2 border-b border-cad-200 text-right">Est. Area (m²)</th>
                                    <th className="px-4 py-2 border-b border-cad-200 text-right">Est. Weight (kg)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-cad-100">
                                {totals.itemDetails.map((item, idx) => (
                                    <tr key={item.id} className="hover:bg-cad-50">
                                        <td className="px-4 py-2 text-cad-500 font-mono">{idx + 1}</td>
                                        <td className="px-4 py-2 font-medium">{item.description}</td>
                                        <td className="px-4 py-2">{item.material}</td>
                                        <td className="px-4 py-2">{item.thickness}</td>
                                        <td className="px-4 py-2 text-right">{item.qty}</td>
                                        <td className="px-4 py-2 text-right font-mono text-cad-600">{item.stats.area.toFixed(2)}</td>
                                        <td className="px-4 py-2 text-right font-mono text-cad-600">{item.stats.weight.toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="mt-8 border-t-2 border-cad-900 pt-4 flex justify-end">
                        <div className="w-64 bg-cad-50 p-4 rounded border border-cad-200">
                            <div className="flex justify-between mb-2">
                                <span className="font-bold text-cad-600">Total Area:</span>
                                <span className="font-mono font-bold text-lg">{totals.totalArea} m²</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="font-bold text-cad-600">Total Weight:</span>
                                <span className="font-mono font-bold text-lg">{totals.totalWeight} kg</span>
                            </div>
                            <div className="mt-2 text-[10px] text-cad-400 italic text-right border-t border-cad-200 pt-1">
                                * Estimations based on geometric approximation.
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )}

        </div>

        {/* Mini Map (Table of Contents) - Only visible on large screens */}
        <div className="hidden xl:block fixed right-4 top-24 bottom-4 w-32 no-print overflow-y-auto pr-2 pointer-events-none">
            <div className="pointer-events-auto bg-white/80 backdrop-blur rounded-lg shadow border border-cad-200 p-2 flex flex-col gap-2">
                <span className="text-[10px] font-bold uppercase text-cad-400 text-center">Page Index</span>
                {pages.map((_, idx) => (
                    <a 
                        key={idx} 
                        href={`#page-${idx + 1}`}
                        className="block text-center text-xs py-1 px-2 rounded hover:bg-blue-50 text-cad-600 hover:text-blue-600 font-medium transition-colors"
                        onClick={(e) => {
                            e.preventDefault();
                            document.getElementById(`page-${idx + 1}`)?.scrollIntoView({ behavior: 'smooth' });
                        }}
                    >
                        Page {idx + 1}
                    </a>
                ))}
            </div>
        </div>
    </div>
  );
};

// --- Subcomponents ---

const SinglePage = ({ header, items, pageIndex, totalPages, startIndex, onRemoveItem, onEditItem, onInsertBefore, onDuplicateItem, onMoveItem }: any) => {
  // Fill empty slots to always show grid lines for 6 items
  const paddedItems = [...items];
  while (paddedItems.length < ITEMS_PER_PAGE) {
    paddedItems.push(null);
  }

  const ITEM_HEIGHT = "64.5mm";

  return (
    <div className="a4-page text-black font-sans text-sm flex flex-col">
      {/* Main Frame Border: Fills the padded area (190mm x 277mm) */}
      <div className="w-full h-full border-2 border-black flex flex-col relative box-border">
          
          {/* Header - Fixed Height 30mm */}
          <div className="flex-none h-[30mm] border-b border-black overflow-hidden relative flex flex-col">
              {/* Top Row: Logos & Text */}
              <div className="flex-1 flex flex-row items-center justify-between px-2 pt-1">
                  
                  {/* Left: Acesian Logo */}
                  <div className="w-[25mm] h-[22mm] flex-none flex items-center justify-center">
                      <img 
                        src="/logo_acesian.png" 
                        alt="Acesian" 
                        className="w-full h-full object-contain"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} 
                      />
                  </div>

                  {/* Center: Company Info */}
                  <div className="flex-1 text-center flex flex-col justify-center">
                      <h1 className="text-xl font-serif font-bold tracking-wide leading-none mb-0.5">Acesian Technologies Pte Ltd</h1>
                      <div className="flex justify-center gap-1 text-[8px] text-gray-800 leading-tight">
                        <p>Company Registration No. 200401285N</p>
                      </div>
                      <div className="flex justify-center gap-1 text-[8px] text-gray-800 leading-tight">
                        <p>33 Mactaggart Road #04-00, Singapore(368082)</p>
                      </div>
                      <div className="flex justify-center gap-3 text-[8px] text-gray-800 leading-tight mt-0.5">
                        <p>Tel : 67575310</p>
                        <p>Fax : 67575319</p>
                      </div>
                      <div className="flex justify-center gap-1 text-[8px] text-gray-800 leading-tight">
                        <p>E-mail : sales@acesian.com</p>
                      </div>
                  </div>

                  {/* Right: Cert Logos */}
                  <div className="flex-none flex items-center gap-2 h-[22mm] pr-1">
                      {/* CMT Logo */}
                      <img 
                        src="/logo_cmt.png" 
                        alt="CMT" 
                        className="h-[16mm] w-auto object-contain"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}  
                      />
                      
                      {/* GIC/UKAS Logo */}
                      <img 
                        src="/logo_gic_ukas.png" 
                        alt="GIC/UKAS" 
                        className="h-[22mm] w-auto object-contain"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}  
                      />
                  </div>
              </div>

              {/* Bottom Row: Title and Labels */}
              <div className="flex-none h-[6mm] relative flex items-end justify-center pb-1">
                  <span className="font-bold underline text-sm">ORDER SPECIFICATION ( O.S )</span>
                  <span className="absolute left-2 bottom-0.5 text-[9px] font-bold underline">BY CUSTOMER</span>
                  <span className="absolute right-2 bottom-0.5 text-[9px] font-bold underline">BY ACESIAN</span>
              </div>
          </div>

          {/* Info Table - Fixed Height 42mm */}
          <div className="flex-none h-[42mm] border-b border-black text-[10px] overflow-hidden">
              <HeaderRow label1="Company" val1={header.company || '--- Pte Ltd'} label2="O.S. No." val2={header.osNo} label3="AF Type" val3={header.afType} />
              <HeaderRow label1="From" val1={header.from} label2="P.O. No." val2={header.poNo} label3="Pressure Rating" val3={header.pressureRating} />
              <HeaderRow label1="Project" val1={header.project} label2="Prepared By" val2={header.preparedBy} />
              <HeaderRow label1="Date" val1={header.date} label2="Person in Charge" val2={header.personInCharge} />
              <HeaderRow label1="Lateral No" val1={header.lateralNo} label2="Customer Ref" val2={header.customerRef} />
              {/* Last Row: Taller for Address with text wrapping */}
              <HeaderRow 
                 label1="Required Date" val1={header.requiredDate} 
                 label2="Delivery Address" val2={header.deliveryAddress} 
                 className="h-[12mm]"
                 val2Class="whitespace-normal leading-tight" 
              />
          </div>

          {/* Items Grid - Expanded Height */}
          <div className="flex-1 flex flex-wrap content-start">
             {paddedItems.map((item: OrderItem | null, idx: number) => {
                 const absoluteIndex = startIndex + idx;
                 return (
                 <div 
                    key={item ? item.id : `empty-${idx}`} 
                    className="w-1/2 border-b border-r border-black relative box-border even:border-r-0 flex flex-col overflow-hidden group"
                    style={{ height: ITEM_HEIGHT }}
                 >
                     {item ? (
                        <>
                           {/* Row 1: Description | Material */}
                           <div className="flex border-b border-black text-[10px] leading-tight h-[5mm]">
                               <div className="w-[70%] border-r border-black pl-1 flex items-center overflow-hidden">
                                 <span className="font-bold mr-1">Desc:</span><span className="truncate font-medium">{item.description}</span>
                               </div>
                               <div className="w-[30%] pl-1 flex items-center overflow-hidden">
                                 <span className="font-bold mr-1">Material:</span><span className="truncate">{item.material}</span>
                               </div>
                           </div>
                           
                           {/* Row 2: Item No | Thk | Qty | Coating */}
                           <div className="flex border-b border-black text-[10px] leading-tight h-[5mm]">
                               <div className="w-[20%] border-r border-black pl-1 flex items-center bg-gray-50">
                                 <span className="font-bold mr-1">Item No:</span>{absoluteIndex + 1}
                               </div>
                               <div className="w-[20%] border-r border-black pl-1 flex items-center">
                                 <span className="font-bold mr-1">Thk:</span>{item.thickness}
                               </div>
                               <div className="w-[20%] border-r border-black pl-1 flex items-center">
                                 <span className="font-bold mr-1">Qty:</span>{item.qty}
                               </div>
                               <div className="flex-1 pl-1 flex items-center">
                                 <span className="font-bold mr-1">Coating:</span>{item.coating}
                               </div>
                           </div>

                           {/* Row 3: Tag No */}
                           <div className="flex border-b border-black text-[10px] leading-tight h-[5mm]">
                               <div className="w-full pl-1 flex items-center overflow-hidden">
                                 <span className="font-bold mr-1">Tag No:</span><span className="truncate">{item.tagNo}</span>
                               </div>
                           </div>

                           {/* Sketch Area */}
                           <div className="flex-1 w-full flex items-center justify-center overflow-hidden p-1 min-h-0 relative">
                               {item.sketchSvg && (
                                  <div 
                                    className="w-full h-full flex items-center justify-center"
                                    dangerouslySetInnerHTML={{ __html: item.sketchSvg }} 
                                  />
                               )}
                           </div>

                           {/* Note Section */}
                           <div className="flex-none border-t border-black px-1 h-[5mm] text-[9px] leading-none flex items-center overflow-hidden whitespace-nowrap">
                               <span className="font-bold mr-1">Note:</span>{item.notes}
                           </div>
                           
                           {/* Action Buttons (No Print) */}
                           <div className="no-print absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 p-1 rounded border border-gray-200 shadow-sm z-20">
                             <div className="flex flex-col gap-0.5 border-r border-gray-200 pr-1 mr-1">
                                 <button 
                                   onClick={() => onMoveItem(absoluteIndex, 'up')}
                                   className="text-gray-600 hover:text-blue-600 text-[10px] px-1 hover:bg-gray-100 rounded"
                                   title="Move Up"
                                 >▲</button>
                                 <button 
                                   onClick={() => onMoveItem(absoluteIndex, 'down')}
                                   className="text-gray-600 hover:text-blue-600 text-[10px] px-1 hover:bg-gray-100 rounded"
                                   title="Move Down"
                                 >▼</button>
                             </div>
                             <button 
                               onClick={() => onInsertBefore(absoluteIndex)}
                               className="text-green-600 hover:text-green-800 text-[10px] font-bold px-1.5 py-0.5 bg-green-50 rounded border border-green-200"
                               title="Insert new item before this one"
                             >
                               + Insert
                             </button>
                             <button 
                               onClick={() => onDuplicateItem(item)}
                               className="text-purple-600 hover:text-purple-800 text-[10px] font-bold px-1.5 py-0.5 bg-purple-50 rounded border border-purple-200"
                               title="Duplicate Item"
                             >
                               ❐ Copy
                             </button>
                             <button 
                               onClick={() => onEditItem(item)}
                               className="text-blue-600 hover:text-blue-800 text-[10px] font-bold px-1.5 py-0.5 bg-blue-50 rounded border border-blue-200"
                               title="Edit Item"
                             >
                               ✎ Edit
                             </button>
                             <button 
                               onClick={() => onRemoveItem(item.id)}
                               className="text-red-600 hover:text-red-800 text-[10px] font-bold px-1.5 py-0.5 bg-red-50 rounded border border-red-200"
                               title="Remove Item"
                             >
                               ✕
                             </button>
                           </div>
                        </>
                     ) : (
                        <div className="w-full h-full"></div>
                     )}
                 </div>
                 );
             })}
          </div>

          {/* Footer - Fixed Height 10mm */}
          <div className="flex-none h-[10mm] border-t border-black flex items-end justify-end px-2 pb-1">
              <div className="text-xs font-bold">Page {pageIndex + 1} of {totalPages}</div>
          </div>

      </div>
    </div>
  );
};

const HeaderRow = ({ label1, val1, label2, val2, label3, val3, className, val2Class }: any) => {
    // Standard Grid: [25mm | 55mm | 25mm | Flex ] OR [25mm | 55mm | 25mm | 30mm | 30mm | 25mm]
    return (
        <div className={`flex border-b border-black last:border-0 items-center text-[9px] ${className || 'h-[6mm]'}`}>
            {/* Col 1 */}
            <div className="w-[25mm] p-1 border-r border-black font-bold truncate bg-gray-50 h-full flex items-center">{label1}:</div>
            {/* Col 2 */}
            <div className="w-[55mm] p-1 border-r border-black truncate h-full flex items-center">{val1}</div>
            
            {/* Col 3 */}
            <div className="w-[25mm] p-1 border-r border-black font-bold truncate bg-gray-50 h-full flex items-center">{label2}:</div>
            
            {label3 ? (
                <>
                    {/* Col 4 (Short) */}
                    <div className="w-[30mm] p-1 border-r border-black truncate h-full flex items-center">{val2}</div>
                    {/* Col 5 */}
                    <div className="w-[30mm] p-1 border-r border-black font-bold truncate bg-gray-50 h-full flex items-center">{label3}:</div>
                    {/* Col 6 */}
                    <div className="w-[25mm] p-1 truncate h-full flex items-center">{val3}</div>
                </>
            ) : (
                /* Col 4 (Long) */
                <div className={`flex-1 p-1 border-r border-black h-full flex items-center overflow-hidden ${val2Class || 'truncate'}`}>{val2}</div>
            )}
        </div>
    );
};
