import { OrderHeader, OrderItem } from '../types';

// --- Constants (Units in mm) ---
const A4_W = 210;
const A4_H = 297;
const MARGIN = 10;
const PAGE_GAP = 50; // Gap between pages in model space

// Content Area Zones (Y-coordinates from Bottom 0 to Top 297)
const CONTENT_W = A4_W - (MARGIN * 2); // 190
const CONTENT_H = A4_H - (MARGIN * 2); // 277
const CONTENT_L = MARGIN; // X Start
const CONTENT_R = MARGIN + CONTENT_W; // X End
const CONTENT_B = MARGIN; // Y Bottom
const CONTENT_T = MARGIN + CONTENT_H; // Y Top (287)

// Vertical Segment Heights
const H_HEADER = 30;
const H_INFO = 42;
const H_FOOTER = 10;
const H_ITEMS = CONTENT_H - H_HEADER - H_INFO - H_FOOTER; // 195

// Y Positions
const Y_HEADER_START = CONTENT_T - H_HEADER; // 257
const Y_INFO_START = Y_HEADER_START - H_INFO; // 215
const Y_ITEMS_START = Y_INFO_START; // 215
const Y_ITEMS_END = Y_ITEMS_START - H_ITEMS; // 20
const Y_FOOTER_START = Y_ITEMS_END; // 20

// Grid
const COL_W = CONTENT_W / 2; // 95
const ROW_H = H_ITEMS / 3; // 65

/**
 * Dependency-free DXF Writer class.
 */
class DxfWriter {
  private content: string[] = [];

  constructor() {
    this.header();
  }

  private header() {
    this.content.push(
      "  0", "SECTION",
      "  2", "HEADER",
      "  9", "$ACADVER", "  1", "AC1009",
      "  9", "$INSUNITS", " 70", "4", // 4 = Millimeters
      "  0", "ENDSEC",
      "  0", "SECTION",
      "  2", "ENTITIES"
    );
  }

  public addLine(x1: number, y1: number, x2: number, y2: number, layer: string = "0", color: number = 7) {
    this.content.push(
      "  0", "LINE",
      "  8", layer,
      " 62", color.toString(),
      " 10", x1.toFixed(3), " 20", y1.toFixed(3),
      " 11", x2.toFixed(3), " 21", y2.toFixed(3)
    );
  }

  public addRect(x: number, y: number, w: number, h: number, layer: string = "0", color: number = 7) {
    this.addPolyline([
        {x, y}, {x: x+w, y}, {x: x+w, y: y+h}, {x, y: y+h}
    ], true, layer, color);
  }

  public addCircle(cx: number, cy: number, r: number, layer: string = "0", color: number = 7) {
    this.content.push(
      "  0", "CIRCLE",
      "  8", layer,
      " 62", color.toString(),
      " 10", cx.toFixed(3), " 20", cy.toFixed(3),
      " 40", r.toFixed(3)
    );
  }

  public addText(
    x: number, y: number, text: string, height: number, 
    layer: string = "TEXT", color: number = 7, 
    align: 'left'|'center'|'right' = 'left', rotation: number = 0
  ) {
    // Basic DXF Text Alignment (Group 72): 0=Left, 1=Center, 2=Right
    let alignCode = 0;
    if (align === 'center') alignCode = 1;
    if (align === 'right') alignCode = 2;

    this.content.push(
      "  0", "TEXT",
      "  8", layer,
      " 62", color.toString(),
      " 10", x.toFixed(3), " 20", y.toFixed(3),
      " 40", height.toFixed(3),
      "  1", text,
      " 50", rotation.toFixed(3)
    );
    
    // For alignment to work in basic DXF readers, 11/21 coords must match 10/20 when aligned
    if (alignCode !== 0) {
        this.content.push(
            " 72", alignCode.toString(),
            " 11", x.toFixed(3), " 21", y.toFixed(3)
        );
    }
  }
  
  public addPolyline(points: {x: number, y: number}[], isClosed: boolean = false, layer: string = "0", color: number = 7) {
    if (points.length < 2) return;
    this.content.push(
      "  0", "LWPOLYLINE",
      "  8", layer,
      " 62", color.toString(),
      "100", "AcDbEntity",
      "100", "AcDbPolyline",
      " 90", points.length.toString(),
      " 70", isClosed ? "1" : "0"
    );
    points.forEach(p => {
      this.content.push(" 10", p.x.toFixed(3), " 20", p.y.toFixed(3));
    });
  }

  public toDxfString(): string {
    this.content.push("  0", "ENDSEC", "  0", "EOF");
    return this.content.join("\n");
  }
}

// --- Layout Logic ---

/**
 * Draws the A4 Template borders and static text for a single page.
 */
const drawPageTemplate = (writer: DxfWriter, ox: number, oy: number, header: OrderHeader, pageNum: number, totalPages: number) => {
    const colorFrame = 7; // White/Black
    const colorText = 7; 
    
    // 1. Outer Border
    writer.addRect(ox + CONTENT_L, oy + CONTENT_B, CONTENT_W, CONTENT_H, "FRAME", colorFrame);

    // 2. Horizontal Dividers
    // Header Line
    writer.addLine(ox + CONTENT_L, oy + Y_HEADER_START, ox + CONTENT_R, oy + Y_HEADER_START, "FRAME", colorFrame);
    // Info Line
    writer.addLine(ox + CONTENT_L, oy + Y_INFO_START, ox + CONTENT_R, oy + Y_INFO_START, "FRAME", colorFrame);
    // Footer Line
    writer.addLine(ox + CONTENT_L, oy + Y_ITEMS_END, ox + CONTENT_R, oy + Y_ITEMS_END, "FRAME", colorFrame);

    // 3. Header Content (Logos & Company)
    // Left Placeholder (Acesian Logo)
    writer.addRect(ox + CONTENT_L + 2, oy + Y_HEADER_START + 4, 25, 22, "LOGO", 3); // Green box
    writer.addText(ox + CONTENT_L + 14.5, oy + Y_HEADER_START + 15, "LOGO", 4, "LOGO", 3, 'center');
    
    // Company Text (Center)
    const cx = ox + CONTENT_L + CONTENT_W / 2;
    const cyHead = oy + Y_HEADER_START;
    writer.addText(cx, cyHead + 22, "Acesian Technologies Pte Ltd", 5, "TEXT", colorText, 'center');
    writer.addText(cx, cyHead + 17, "Co Reg No. 200401285N", 2.5, "TEXT", colorText, 'center');
    writer.addText(cx, cyHead + 13, "33 Mactaggart Road #04-00, Singapore(368082)", 2.5, "TEXT", colorText, 'center');
    writer.addText(cx, cyHead + 9, "Tel: 67575310  Fax: 67575319", 2.5, "TEXT", colorText, 'center');
    writer.addText(cx, cyHead + 5, "E-mail: sales@acesian.com", 2.5, "TEXT", colorText, 'center');

    // Right Placeholders (Cert Logos)
    writer.addRect(ox + CONTENT_R - 55, oy + Y_HEADER_START + 4, 20, 16, "LOGO", 3);
    writer.addText(ox + CONTENT_R - 45, oy + Y_HEADER_START + 10, "CMT", 3, "LOGO", 3, 'center');
    writer.addRect(ox + CONTENT_R - 30, oy + Y_HEADER_START + 4, 25, 22, "LOGO", 3);
    writer.addText(ox + CONTENT_R - 17.5, oy + Y_HEADER_START + 15, "UKAS", 3, "LOGO", 3, 'center');

    // Order Spec Title
    writer.addText(cx, cyHead - 5, "ORDER SPECIFICATION (O.S)", 3.5, "TEXT", colorText, 'center');
    writer.addText(ox + CONTENT_L + 5, cyHead - 5, "BY CUSTOMER", 2.5, "TEXT", colorText, 'left');
    writer.addText(ox + CONTENT_R - 25, cyHead - 5, "BY ACESIAN", 2.5, "TEXT", colorText, 'left');

    // 4. Info Table Grid (5 rows of 6mm + last row 12mm = 42mm total)
    const rowY = [
        oy + Y_INFO_START + 36, // Row 1 Top
        oy + Y_INFO_START + 30,
        oy + Y_INFO_START + 24,
        oy + Y_INFO_START + 18,
        oy + Y_INFO_START + 12,
        oy + Y_INFO_START // Bottom
    ];
    
    // Draw horizontal lines for Info Table
    rowY.forEach(y => writer.addLine(ox + CONTENT_L, y, ox + CONTENT_R, y, "FRAME", colorFrame));

    // Draw Vertical dividers for Info Table
    // Pattern matches OrderSheet.tsx: Label(24) | Val(Flex) | Label(32) | Val(Flex) | Label(26) | Val(18)
    const x1 = ox + CONTENT_L + 24;
    const x2 = ox + CONTENT_L + (CONTENT_W/2); // Midpoint split
    const x3 = x2 + 32;
    // Optional 3rd column divider
    const x4 = ox + CONTENT_R - 44; 

    // Draw main verticals
    writer.addLine(x1, oy + Y_HEADER_START, x1, oy + Y_INFO_START, "FRAME", colorFrame);
    writer.addLine(x2, oy + Y_HEADER_START, x2, oy + Y_INFO_START, "FRAME", colorFrame);
    writer.addLine(x3, oy + Y_HEADER_START, x3, oy + Y_INFO_START, "FRAME", colorFrame);

    // Helper to fill text fields
    const addField = (row: number, label1: string, val1: string, label2: string, val2: string, label3?: string, val3?: string) => {
        const y = rowY[row] - 4; // Vertical center approx
        const h = 2.5;
        // Col 1
        writer.addText(ox + CONTENT_L + 2, y, label1 + ":", h, "LABEL", colorText);
        writer.addText(x1 + 2, y, val1, h, "TEXT", colorText);
        // Col 2
        writer.addText(x2 + 2, y, label2 + ":", h, "LABEL", colorText);
        writer.addText(x3 + 2, y, val2, h, "TEXT", colorText);
        // Col 3
        if (label3 && val3) {
            writer.addLine(x4, rowY[row+1], x4, rowY[row], "FRAME", colorFrame); // Add vertical line
            writer.addText(x4 + 2, y, label3, h, "LABEL", colorText);
            const x5 = x4 + 26; // Width of label 3
            writer.addLine(x5, rowY[row+1], x5, rowY[row], "FRAME", colorFrame);
            writer.addText(x5 + 2, y, val3, h, "TEXT", colorText);
        }
    };

    addField(0, "Company", header.company, "O.S. No.", header.osNo, "AF Type", header.afType);
    addField(1, "From", header.from, "P.O. No.", header.poNo, "Pressure", header.pressureRating);
    addField(2, "Project", header.project, "Prepared By", header.preparedBy);
    addField(3, "Date", header.date, "PIC", header.personInCharge);
    addField(4, "Lateral No", header.lateralNo, "Cust Ref", header.customerRef);
    
    // Last Row (Address - Taller)
    const yAddr = rowY[5] + 8;
    writer.addText(ox + CONTENT_L + 2, yAddr, "Req Date:", 2.5, "LABEL", colorText);
    writer.addText(x1 + 2, yAddr, header.requiredDate, 2.5, "TEXT", colorText);
    writer.addText(x2 + 2, yAddr, "Address:", 2.5, "LABEL", colorText);
    writer.addText(x3 + 2, yAddr, header.deliveryAddress.substring(0, 60), 2.5, "TEXT", colorText);
    
    // 5. Item Grid Lines
    // Vertical Center Line
    writer.addLine(ox + CONTENT_L + COL_W, oy + Y_ITEMS_START, ox + CONTENT_L + COL_W, oy + Y_ITEMS_END, "FRAME", colorFrame);
    
    // Horizontal Dividers (3 Rows)
    const yR1 = oy + Y_ITEMS_START - ROW_H;
    const yR2 = yR1 - ROW_H;
    
    writer.addLine(ox + CONTENT_L, yR1, ox + CONTENT_R, yR1, "FRAME", colorFrame);
    writer.addLine(ox + CONTENT_L, yR2, ox + CONTENT_R, yR2, "FRAME", colorFrame);

    // 6. Footer
    writer.addText(ox + CONTENT_R - 5, oy + Y_ITEMS_END - 6, `Page ${pageNum} of ${totalPages}`, 3, "TEXT", colorText, 'right');
};

/**
 * Draws a single item into its specific grid cell.
 */
const drawItem = (writer: DxfWriter, ox: number, oy: number, item: OrderItem, slotIdx: number, startItemIdx: number) => {
    // Slot 0-5
    const row = Math.floor(slotIdx / 2);
    const col = slotIdx % 2;
    
    // Coordinates of Cell Top-Left
    const cellX = ox + CONTENT_L + (col * COL_W);
    const cellY = oy + Y_ITEMS_START - (row * ROW_H); // Top Y of cell
    const cellW = COL_W;
    
    // Internal Grid Lines for Item Attributes
    // Row 1: Attributes (H=5mm) -> Y: cellY down to cellY-5
    // Row 2: Tag/Desc (H=5mm) -> Y: cellY-5 down to cellY-10
    // Row 3: Notes (H=5mm) -> Y: cellBottom up to cellBottom+5
    
    const yAttr = cellY - 5;
    const yDesc = cellY - 10;
    const yNote = cellY - ROW_H + 5;
    const cellBot = cellY - ROW_H;

    const colorLine = 7;
    const txtH = 2.0;

    // Horizontal Lines inside cell
    writer.addLine(cellX, yAttr, cellX + cellW, yAttr, "FRAME", colorLine);
    writer.addLine(cellX, yDesc, cellX + cellW, yDesc, "FRAME", colorLine);
    writer.addLine(cellX, yNote, cellX + cellW, yNote, "FRAME", colorLine);

    // Vertical Lines for Attributes
    // Widths: Item(18%), Qty(12%), Thk(15%), Mat(30%), Coat(Rest)
    const w1 = cellW * 0.18;
    const w2 = cellW * 0.12;
    const w3 = cellW * 0.15;
    const w4 = cellW * 0.30;
    
    let cx = cellX + w1; writer.addLine(cx, cellY, cx, yAttr, "FRAME", colorLine);
    cx += w2; writer.addLine(cx, cellY, cx, yAttr, "FRAME", colorLine);
    cx += w3; writer.addLine(cx, cellY, cx, yAttr, "FRAME", colorLine);
    cx += w4; writer.addLine(cx, cellY, cx, yAttr, "FRAME", colorLine);

    // Tag Vertical Line (30%)
    const wTag = cellW * 0.30;
    writer.addLine(cellX + wTag, yAttr, cellX + wTag, yDesc, "FRAME", colorLine);

    // --- Fill Text ---
    const ty1 = cellY - 3.5;
    writer.addText(cellX + 1, ty1, `Item: ${startItemIdx + slotIdx + 1}`, txtH);
    writer.addText(cellX + w1 + 1, ty1, `Qty: ${item.qty}`, txtH);
    writer.addText(cellX + w1 + w2 + 1, ty1, `Thk: ${item.thickness}`, txtH);
    writer.addText(cellX + w1 + w2 + w3 + 1, ty1, `Mat: ${item.material}`, txtH);
    writer.addText(cellX + w1 + w2 + w3 + w4 + 1, ty1, `Coat: ${item.coating}`, txtH);

    const ty2 = yAttr - 3.5;
    writer.addText(cellX + 1, ty2, `Tag: ${item.tagNo}`, txtH);
    writer.addText(cellX + wTag + 1, ty2, `Desc: ${item.description}`, txtH);

    const ty3 = cellBot + 1.5;
    writer.addText(cellX + 1, ty3, `Note: ${item.notes}`, txtH);

    // --- SVG Drawing ---
    if (item.sketchSvg) {
        // Sketch Area: Y range [yDesc] down to [yNote]
        // Height = yDesc - yNote = (cellY - 10) - (cellBot + 5) = 65 - 15 = 50mm
        const sketchH = 50;
        const sketchW = cellW - 4; // Margin
        
        // Target Box Center
        const targetCx = cellX + cellW/2;
        const targetCy = (yDesc + yNote) / 2;
        
        // Add SVG to specific target
        addSvgToDxf(writer, item.sketchSvg, targetCx, targetCy, sketchW, sketchH);
    }
};

/**
 * Parses SVG string and adds entities to DXF writer, scaled and centered in target box.
 */
const addSvgToDxf = (writer: DxfWriter, svgString: string, tx: number, ty: number, maxW: number, maxH: number) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgString, "image/svg+xml");
    const svgEl = doc.documentElement;
    
    // 1. Get ViewBox
    let vbW = 500, vbH = 500;
    const viewBox = svgEl.getAttribute("viewBox");
    if (viewBox) {
        const parts = viewBox.split(/\s+|,/).map(parseFloat);
        if (parts.length === 4) {
            vbW = parts[2];
            vbH = parts[3];
        }
    }
    
    // 2. Calculate Scale
    const scaleX = maxW / vbW;
    const scaleY = maxH / vbH;
    const scale = Math.min(scaleX, scaleY) * 0.9; // 90% fill margin

    // 3. Transform Helper
    // SVG Coordinate System: Y Down. DXF Coordinate System: Y Up.
    // SVG Center (vbW/2, vbH/2) -> DXF Target (tx, ty)
    // Formula:
    // dxf_x = tx + (svg_x - center_x) * scale
    // dxf_y = ty - (svg_y - center_y) * scale  (Flip Y relative to center)
    
    const transformPt = (x: number, y: number) => {
        return {
            x: tx + (x - vbW/2) * scale,
            y: ty - (y - vbH/2) * scale
        };
    };

    const processElement = (el: Element, parentTransform = {rotate:0, cx:0, cy:0}) => {
         let rot = 0;
         let cx = 0, cy = 0;
         const tf = el.getAttribute("transform");
         if (tf && tf.includes("rotate")) {
             const m = /rotate\(([^,]+),\s*([^,]+),\s*([^)]+)\)/.exec(tf);
             if (m) {
                 rot = parseFloat(m[1]);
                 cx = parseFloat(m[2]);
                 cy = parseFloat(m[3]);
             } else {
                 const m2 = /rotate\(([^)]+)\)/.exec(tf);
                 if(m2) rot = parseFloat(m2[1]);
             }
         }

         // Local transformation logic
         const applyLocal = (x: number, y: number) => {
             if (rot !== 0) {
                 const rad = rot * Math.PI / 180;
                 const dx = x - cx;
                 const dy = y - cy;
                 return {
                     x: cx + dx*Math.cos(rad) - dy*Math.sin(rad),
                     y: cy + dx*Math.sin(rad) + dy*Math.cos(rad)
                 };
             }
             return {x, y};
         };

         const tag = el.tagName.toLowerCase();
         const getLayer = (e: Element) => {
             const c = e.getAttribute("class") || "";
             if (c.includes("dim")) return "DIMENSIONS";
             if (c.includes("phantom") || c.includes("center") || c.includes("hidden")) return "CONSTRUCTION";
             if (c.includes("flange")) return "FLANGES";
             return "OBJECT";
         };
         const getColor = (e: Element) => {
             const c = e.getAttribute("class") || "";
             if (c.includes("dim")) return 1; // Red
             if (c.includes("phantom") || c.includes("hidden")) return 8; // Gray
             return 7; // White
         };

         if (tag === "line") {
             const x1 = parseFloat(el.getAttribute("x1") || "0");
             const y1 = parseFloat(el.getAttribute("y1") || "0");
             const x2 = parseFloat(el.getAttribute("x2") || "0");
             const y2 = parseFloat(el.getAttribute("y2") || "0");
             const p1local = applyLocal(x1, y1);
             const p2local = applyLocal(x2, y2);
             const p1 = transformPt(p1local.x, p1local.y);
             const p2 = transformPt(p2local.x, p2local.y);
             writer.addLine(p1.x, p1.y, p2.x, p2.y, getLayer(el), getColor(el));
         } 
         else if (tag === "rect") {
             const x = parseFloat(el.getAttribute("x") || "0");
             const y = parseFloat(el.getAttribute("y") || "0");
             const w = parseFloat(el.getAttribute("width") || "0");
             const h = parseFloat(el.getAttribute("height") || "0");
             // Transform corners
             const pts = [
                 {x, y}, {x: x+w, y}, {x: x+w, y: y+h}, {x, y: y+h}
             ].map(p => applyLocal(p.x, p.y)).map(p => transformPt(p.x, p.y));
             writer.addPolyline(pts, true, getLayer(el), getColor(el));
         }
         else if (tag === "circle") {
             const cx = parseFloat(el.getAttribute("cx") || "0");
             const cy = parseFloat(el.getAttribute("cy") || "0");
             const r = parseFloat(el.getAttribute("r") || "0");
             const c = transformPt(applyLocal(cx, cy).x, applyLocal(cx, cy).y);
             writer.addCircle(c.x, c.y, r * scale, getLayer(el), getColor(el));
         }
         else if (tag === "path") {
            const d = el.getAttribute("d") || "";
            const commands = d.match(/([A-Za-z])|([-0-9.]+)/g);
            if (commands) {
                let pts: {x: number, y: number}[] = [];
                let currLocal = {x:0, y:0};
                
                for(let i=0; i<commands.length; i++) {
                    const token = commands[i];
                    if(/[A-Za-z]/.test(token)) {
                        const cmd = token.toUpperCase();
                        if (cmd === "M" || cmd === "L") {
                            const x = parseFloat(commands[++i]);
                            const y = parseFloat(commands[++i]);
                            currLocal = applyLocal(x, y);
                            pts.push(transformPt(currLocal.x, currLocal.y));
                            if (cmd === "M" && pts.length > 1) {
                                pts = [transformPt(currLocal.x, currLocal.y)];
                            }
                        } else if (cmd === "Z") {
                            if (pts.length > 1) writer.addPolyline(pts, true, getLayer(el), getColor(el));
                            pts = [];
                        } else if (cmd === "Q") {
                            // Quadratic Bezier Interpolation
                            const x1 = parseFloat(commands[++i]);
                            const y1 = parseFloat(commands[++i]);
                            const x = parseFloat(commands[++i]);
                            const y = parseFloat(commands[++i]);
                            
                            const p0 = currLocal;
                            const steps = 6;
                            for(let s=1; s<=steps; s++) {
                                const t = s/steps;
                                const invT = 1-t;
                                const bx = (invT*invT * p0.x) + (2*invT*t * x1) + (t*t * x);
                                const by = (invT*invT * p0.y) + (2*invT*t * y1) + (t*t * y);
                                const bt = applyLocal(bx, by);
                                pts.push(transformPt(bt.x, bt.y));
                            }
                            currLocal = applyLocal(x, y);
                        }
                    }
                }
                if (pts.length > 1) writer.addPolyline(pts, false, getLayer(el), getColor(el));
            }
         }
         else if (tag === "text") {
             const x = parseFloat(el.getAttribute("x") || "0");
             const y = parseFloat(el.getAttribute("y") || "0");
             const text = el.textContent || "";
             const p = transformPt(applyLocal(x, y).x, applyLocal(x, y).y);
             
             let fontSize = 24;
             const fsAttr = el.getAttribute("font-size");
             if(fsAttr) fontSize = parseFloat(fsAttr);
             
             // Scale font size
             const finalH = fontSize * scale;
             
             // Calculate rotation. 
             // SVG +Rot is CW (screen Y down). DXF +Rot is CCW (cartesian Y up).
             // Since we flip Y in transformPt, the visual direction of rotation is mirrored.
             // Visually -90 (up) in SVG becomes +90 in DXF.
             let finalRot = -rot; 
             
             let align: 'left'|'center'|'right' = 'left';
             const anchor = el.getAttribute("text-anchor");
             if (anchor === "middle") align = 'center';
             if (anchor === "end") align = 'right';

             writer.addText(p.x, p.y, text, finalH, getLayer(el), getColor(el), align, finalRot);
         }
         else if (tag === "g") {
             Array.from(el.children).forEach(c => processElement(c, {rotate: rot, cx, cy}));
         }
    };
    
    Array.from(svgEl.children).forEach(c => processElement(c));
};

/**
 * Main Export Function
 * Arranges pages side-by-side in Model Space.
 */
export const downloadSheetDxf = (items: OrderItem[], header: OrderHeader) => {
    const writer = new DxfWriter();
    const filename = `${header.project.replace(/[^a-z0-9]/gi, '_') || 'Project'}_${header.osNo || 'Order'}_Layout`;

    // 1. Chunk Items
    const ITEMS_PER_PAGE = 6;
    const pages = [];
    if (items.length === 0) pages.push([]);
    else {
        for(let i=0; i<items.length; i+=ITEMS_PER_PAGE) {
            pages.push(items.slice(i, i+ITEMS_PER_PAGE));
        }
    }

    // 2. Loop Pages (Side by Side)
    pages.forEach((pageItems, i) => {
        // Offset each page by A4 width + gap
        const pageOffsetX = i * (A4_W + PAGE_GAP);
        const pageOffsetY = 0;

        // Draw Template (Header, Grid, etc)
        drawPageTemplate(writer, pageOffsetX, pageOffsetY, header, i+1, pages.length);

        // Draw Items in Grid
        pageItems.forEach((item, slotIdx) => {
             drawItem(writer, pageOffsetX, pageOffsetY, item, slotIdx, i*ITEMS_PER_PAGE);
        });
    });

    // 3. Download
    const blob = new Blob([writer.toDxfString()], { type: "application/dxf" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename + ".dxf";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};