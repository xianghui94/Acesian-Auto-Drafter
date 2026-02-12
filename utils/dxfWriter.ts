import { OrderHeader, OrderItem } from '../types';

/**
 * A lightweight, dependency-free DXF writer.
 * Handles basic entities: LINE, CIRCLE, LWPOLYLINE, TEXT.
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
  
    public addCircle(cx: number, cy: number, r: number, layer: string = "0", color: number = 7) {
      this.content.push(
        "  0", "CIRCLE",
        "  8", layer,
        " 62", color.toString(),
        " 10", cx.toFixed(3), " 20", cy.toFixed(3),
        " 40", r.toFixed(3)
      );
    }
  
    public addText(x: number, y: number, text: string, height: number, rotation: number = 0, layer: string = "TEXT", color: number = 7) {
        this.content.push(
          "  0", "TEXT",
          "  8", layer,
          " 62", color.toString(),
          " 10", x.toFixed(3), " 20", y.toFixed(3),
          " 40", height.toFixed(3),
          "  1", text,
          " 50", rotation.toFixed(3)
        );
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
  
/**
 * Internal Helper: Parses SVG and adds entities to the DxfWriter at a specific offset.
 */
const addSvgToDxf = (writer: DxfWriter, svgString: string, offsetX: number, offsetY: number) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgString, "image/svg+xml");

    const processElement = (el: Element, transform = { rotate: 0, cx: 0, cy: 0 }) => {
        // Handle Transforms (Basic rotation only as used in the app)
        let currentTransform = { ...transform };
        const transformAttr = el.getAttribute("transform");
        if (transformAttr && transformAttr.includes("rotate")) {
            const match = /rotate\(([^,]+),\s*([^,]+),\s*([^)]+)\)/.exec(transformAttr);
            if (match) {
            currentTransform = {
                rotate: parseFloat(match[1]),
                cx: parseFloat(match[2]),
                cy: parseFloat(match[3])
            };
            }
        }

        // Transform logic:
        // 1. Rotate locally if needed
        // 2. Flip Y (SVG +Y is Down, DXF +Y is Up)
        // 3. Translate by OffsetX, OffsetY (Global position)
        const applyTransform = (x: number, y: number) => {
            let resX = x;
            let resY = y;

            if (currentTransform.rotate !== 0) {
                const rad = currentTransform.rotate * Math.PI / 180;
                const cx = currentTransform.cx;
                const cy = currentTransform.cy;
                
                const tx = x - cx;
                const ty = y - cy;
                
                const rx = tx * Math.cos(rad) - ty * Math.sin(rad);
                const ry = tx * Math.sin(rad) + ty * Math.cos(rad);
                
                resX = rx + cx;
                resY = ry + cy;
            }

            // Flip Y for CAD space
            const finalX = resX;
            const finalY = -resY;

            return { x: finalX + offsetX, y: finalY + offsetY };
        };

        const tagName = el.tagName.toLowerCase();
        const getClass = (e: Element) => e.getAttribute("class") || "";
        const getColor = (c: string) => {
            if (c.includes("dim-line")) return 1; // Red
            if (c.includes("dim-text")) return 1; // Red
            if (c.includes("phantom-line")) return 8; // Gray
            if (c.includes("hidden-line")) return 8; // Gray
            if (c.includes("center-line")) return 8; // Gray
            return 7; // White/Black
        };
        const getLayer = (c: string) => {
            if (c.includes("dim")) return "DIMENSIONS";
            if (c.includes("phantom") || c.includes("center") || c.includes("hidden")) return "CONSTRUCTION";
            return "OBJECT";
        };

        if (tagName === "line") {
            const x1 = parseFloat(el.getAttribute("x1") || "0");
            const y1 = parseFloat(el.getAttribute("y1") || "0");
            const x2 = parseFloat(el.getAttribute("x2") || "0");
            const y2 = parseFloat(el.getAttribute("y2") || "0");
            
            const p1 = applyTransform(x1, y1);
            const p2 = applyTransform(x2, y2);
            
            writer.addLine(p1.x, p1.y, p2.x, p2.y, getLayer(getClass(el)), getColor(getClass(el)));
        }
        else if (tagName === "circle") {
            const cx = parseFloat(el.getAttribute("cx") || "0");
            const cy = parseFloat(el.getAttribute("cy") || "0");
            const r = parseFloat(el.getAttribute("r") || "0");
            
            const c = applyTransform(cx, cy);
            writer.addCircle(c.x, c.y, r, getLayer(getClass(el)), getColor(getClass(el)));
        }
        else if (tagName === "rect") {
            const x = parseFloat(el.getAttribute("x") || "0");
            const y = parseFloat(el.getAttribute("y") || "0");
            const w = parseFloat(el.getAttribute("width") || "0");
            const h = parseFloat(el.getAttribute("height") || "0");
            
            const p1 = applyTransform(x, y);
            const p2 = applyTransform(x + w, y);
            const p3 = applyTransform(x + w, y + h);
            const p4 = applyTransform(x, y + h);
            
            writer.addPolyline([p1, p2, p3, p4], true, getLayer(getClass(el)), getColor(getClass(el)));
        }
        else if (tagName === "text") {
            const x = parseFloat(el.getAttribute("x") || "0");
            const y = parseFloat(el.getAttribute("y") || "0");
            const content = el.textContent || "";
            
            let rot = 0;
            const tf = el.getAttribute("transform");
            if(tf && tf.includes("rotate")) {
                const m = /rotate\(([^,]+)/.exec(tf);
                if(m) rot = -parseFloat(m[1]);
            }

            const p = applyTransform(x, y);
            writer.addText(p.x, p.y, content, 20, rot, "TEXT", 1);
        }
        else if (tagName === "path") {
            const d = el.getAttribute("d") || "";
            const commands = d.match(/([A-Za-z])|([-0-9.]+)/g);
            
            if (commands) {
                let pts: {x: number, y: number}[] = [];
                let lastPt = { x: 0, y: 0 };
                
                for (let i=0; i<commands.length; i++) {
                    const token = commands[i];
                    if (/[A-Za-z]/.test(token)) {
                        const cmd = token.toUpperCase();
                        
                        if (cmd === "M") {
                            if (pts.length > 0) {
                                writer.addPolyline(pts, false, getLayer(getClass(el)), getColor(getClass(el)));
                                pts = [];
                            }
                            const x = parseFloat(commands[++i]);
                            const y = parseFloat(commands[++i]);
                            lastPt = { x, y };
                            pts.push(applyTransform(x, y));
                        } 
                        else if (cmd === "L") {
                            const x = parseFloat(commands[++i]);
                            const y = parseFloat(commands[++i]);
                            lastPt = { x, y };
                            pts.push(applyTransform(x, y));
                        }
                        else if (cmd === "Q") {
                            const x1 = parseFloat(commands[++i]);
                            const y1 = parseFloat(commands[++i]);
                            const x = parseFloat(commands[++i]);
                            const y = parseFloat(commands[++i]);
                            
                            const p0 = lastPt;
                            const steps = 6;
                            for(let s=1; s<=steps; s++) {
                                const t = s/steps;
                                const invT = 1 - t;
                                const bx = (invT*invT * p0.x) + (2 * invT * t * x1) + (t*t * x);
                                const by = (invT*invT * p0.y) + (2 * invT * t * y1) + (t*t * y);
                                pts.push(applyTransform(bx, by));
                            }
                            lastPt = { x, y };
                        }
                        else if (cmd === "A") {
                            i += 5; 
                            const x = parseFloat(commands[++i]);
                            const y = parseFloat(commands[++i]);
                            lastPt = { x, y };
                            pts.push(applyTransform(x, y));
                        }
                        else if (cmd === "Z") {
                            if (pts.length > 1) {
                                writer.addPolyline(pts, true, getLayer(getClass(el)), getColor(getClass(el)));
                            }
                            pts = [];
                        }
                    }
                }
                if (pts.length > 1) {
                    writer.addPolyline(pts, false, getLayer(getClass(el)), getColor(getClass(el)));
                }
            }
        }
        else if (tagName === "g" || tagName === "svg") {
            Array.from(el.children).forEach(child => processElement(child, currentTransform));
        }
    };

    processElement(doc.documentElement);
}

/**
 * Downloads the entire order sheet as a single DXF file.
 * Items are arranged in a 2-column grid to mimic the paper layout.
 */
export const downloadSheetDxf = (items: OrderItem[], header: OrderHeader) => {
    const writer = new DxfWriter();
    const filename = `${header.project.replace(/[^a-z0-9]/gi, '_')}_${header.osNo}_OrderSheet`;

    // Add Sheet Info Header at the top
    writer.addText(0, 800, `PROJECT: ${header.project}`, 50, 0, "HEADER", 3);
    writer.addText(0, 700, `CLIENT: ${header.company}  |  OS NO: ${header.osNo}`, 40, 0, "HEADER", 3);
    writer.addText(0, 620, `DATE: ${header.date}  |  PREPARED BY: ${header.preparedBy}`, 30, 0, "HEADER", 3);

    // Layout Constants
    const COLS = 2; 
    const COL_WIDTH = 900;
    const ROW_HEIGHT = 800;
    const START_Y = 400;

    items.forEach((item, idx) => {
        if (!item.sketchSvg) return;

        const col = idx % COLS;
        const row = Math.floor(idx / COLS);

        const xOffset = col * COL_WIDTH;
        const yOffset = START_Y - (row * ROW_HEIGHT);

        // Add Item Label Text (Above the drawing)
        const labelBaseY = yOffset + 350; // Just above drawing area (approx -250 to +250 in SVG Y)
        
        writer.addText(xOffset, labelBaseY, `ITEM: ${item.itemNo}  TAG: ${item.tagNo}`, 25, 0, "LABELS", 2);
        writer.addText(xOffset, labelBaseY - 40, `QTY: ${item.qty}   MAT: ${item.material} ${item.thickness}mm`, 20, 0, "LABELS", 2);
        writer.addText(xOffset, labelBaseY - 70, `${item.description}`, 20, 0, "LABELS", 2);
        
        if (item.notes) {
             writer.addText(xOffset, labelBaseY - 100, `NOTE: ${item.notes}`, 15, 0, "LABELS", 1);
        }

        // Add Geometry
        // SVG center is (250, 250) or similar.
        // We want to center it at (xOffset + 250, yOffset - 250) roughly.
        // The addSvgToDxf applies offsets directly.
        // Note: Our Y flip means y=250 becomes y=-250.
        // So (x=250, y=250) becomes (250, -250).
        // If we simply pass xOffset, yOffset, the center will be at (xOffset + 250, yOffset - 250).
        addSvgToDxf(writer, item.sketchSvg, xOffset, yOffset);
        
        // Draw a bounding box for reference (Optional)
        // writer.addPolyline([
        //    {x: xOffset, y: yOffset}, 
        //    {x: xOffset + 500, y: yOffset},
        //    {x: xOffset + 500, y: yOffset - 500},
        //    {x: xOffset, y: yOffset - 500},
        //    {x: xOffset, y: yOffset}
        // ], true, "VIEWPORTS", 9);
    });

    const blob = new Blob([writer.toDxfString()], { type: "application/dxf" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename + ".dxf";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};