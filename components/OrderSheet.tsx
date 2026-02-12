import React from 'react';
import { OrderHeader, OrderItem } from '../types';

interface OrderSheetProps {
  header: OrderHeader;
  items: OrderItem[];
  onRemoveItem: (id: string) => void;
}

const ITEMS_PER_PAGE = 6;

// --- IMAGE INSTRUCTIONS ---
// To make the logos appear when deployed to Vercel:
// 1. Create a folder named "public" in your project root (same level as index.html).
// 2. Place your image files inside that folder.
// 3. Ensure they are named exactly: 
//    - logo_acesian.png
//    - logo_cmt.png
//    - logo_gic_ukas.png
// 4. Vercel/Vite will automatically serve them at the paths used below (e.g., src="/logo_acesian.png").

export const OrderSheet: React.FC<OrderSheetProps> = ({ header, items, onRemoveItem }) => {
  
  // Split items into pages
  const pages = [];
  if (items.length === 0) {
    pages.push([]); // At least one page
  } else {
    for (let i = 0; i < items.length; i += ITEMS_PER_PAGE) {
      pages.push(items.slice(i, i + ITEMS_PER_PAGE));
    }
  }

  return (
    <div className="flex flex-col gap-8 bg-cad-200 p-8 items-center print:p-0 print:gap-0 print:bg-white print:block">
      {pages.map((pageItems, pageIndex) => (
        <SinglePage 
          key={pageIndex}
          header={header}
          items={pageItems}
          pageIndex={pageIndex}
          totalPages={pages.length}
          startIndex={pageIndex * ITEMS_PER_PAGE}
          onRemoveItem={onRemoveItem}
        />
      ))}
    </div>
  );
};

// --- Subcomponents ---

const SinglePage = ({ header, items, pageIndex, totalPages, startIndex, onRemoveItem }: any) => {
  // Fill empty slots to always show grid lines for 6 items
  const paddedItems = [...items];
  while (paddedItems.length < ITEMS_PER_PAGE) {
    paddedItems.push(null);
  }

  // Layout Calculation:
  // Total Content Height (A4 minus margins): ~277mm
  // Header: 30mm (Increased for logos)
  // Info Table: 30mm (5 rows x 6mm) + 12mm (Last Row) = 42mm
  // Footer: 10mm
  // Total Fixed: 30 + 42 + 10 = 82mm
  // Remaining for 3 rows of items: 277 - 82 = 195mm
  // Height per item row: 195 / 3 = 65mm
  // Adjusted to 64.5mm to accommodate border widths and avoid overflow
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
             {paddedItems.map((item: OrderItem | null, idx: number) => (
                 <div 
                    key={item ? item.id : `empty-${idx}`} 
                    className="w-1/2 border-b border-r border-black relative box-border even:border-r-0 flex flex-col overflow-hidden"
                    style={{ height: ITEM_HEIGHT }}
                 >
                     {item ? (
                        <>
                           {/* Row 1: Attributes - Box Style - Rebalanced Widths */}
                           <div className="flex border-b border-black text-[10px] leading-tight h-[5mm]">
                               <div className="w-[18%] border-r border-black pl-1 flex items-center bg-gray-50">
                                 <span className="font-bold mr-1">Item:</span>{startIndex + idx + 1}
                               </div>
                               <div className="w-[12%] border-r border-black pl-1 flex items-center">
                                 <span className="font-bold mr-1">Qty:</span>{item.qty}
                               </div>
                               <div className="w-[15%] border-r border-black pl-1 flex items-center">
                                 <span className="font-bold mr-1">Thk:</span>{item.thickness}
                               </div>
                               <div className="w-[30%] border-r border-black pl-1 flex items-center overflow-hidden">
                                 <span className="font-bold mr-1">Mat:</span><span className="truncate">{item.material}</span>
                               </div>
                               <div className="flex-1 pl-1 flex items-center">
                                 <span className="font-bold mr-1">Coat:</span>{item.coating}
                               </div>
                           </div>
                           
                           {/* Row 2: Tag & Desc - Box Style */}
                           <div className="flex border-b border-black text-[10px] leading-tight h-[5mm]">
                               <div className="w-[30%] border-r border-black pl-1 flex items-center overflow-hidden">
                                 <span className="font-bold mr-1">Tag:</span><span className="truncate">{item.tagNo}</span>
                               </div>
                               <div className="flex-1 pl-1 flex items-center overflow-hidden">
                                 <span className="font-bold mr-1">Desc:</span><span className="truncate font-medium">{item.description}</span>
                               </div>
                           </div>

                           {/* Sketch Area */}
                           <div className="flex-1 w-full flex items-center justify-center overflow-hidden p-1 min-h-0">
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
                           
                           {/* Remove Button (No Print) */}
                           <button 
                             onClick={() => onRemoveItem(item.id)}
                             className="no-print absolute top-1 right-1 text-red-400 hover:text-red-600 font-bold px-1 bg-white z-10"
                           >
                             ✕
                           </button>
                        </>
                     ) : (
                        <div className="w-full h-full"></div>
                     )}
                 </div>
             ))}
          </div>

          {/* Footer - Fixed Height 10mm */}
          <div className="flex-none h-[10mm] border-t border-black flex items-end justify-end px-2 pb-1">
              <div className="text-xs font-bold">Page {pageIndex + 1} of {totalPages}</div>
          </div>

      </div>
    </div>
  );
};

const HeaderRow = ({ label1, val1, label2, val2, label3, val3, className, val2Class }: any) => (
    <div className={`flex border-b border-black last:border-0 items-center text-[9px] ${className || 'h-[6mm]'}`}>
        <div className="w-[24mm] p-1 border-r border-black font-bold truncate bg-gray-50 h-full flex items-center">{label1}:</div>
        <div className="flex-1 p-1 border-r border-black truncate h-full flex items-center">{val1}</div>
        <div className="w-[32mm] p-1 border-r border-black font-bold truncate bg-gray-50 h-full flex items-center">{label2}:</div>
        <div className={`flex-1 p-1 border-r border-black h-full flex items-center overflow-hidden ${val2Class || 'truncate'}`}>{val2}</div>
        {label3 && (
            <>
                <div className="w-[26mm] p-1 border-r border-black font-bold truncate bg-gray-50 h-full flex items-center">{label3}</div>
                <div className="w-[18mm] p-1 truncate h-full flex items-center">{val3}</div>
            </>
        )}
    </div>
);