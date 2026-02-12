import { DuctParams } from "../../types";
import { createSvg, drawDim, drawFlange, drawAnnotation, VIEW_BOX_SIZE, CFG } from "../svgUtils";

// --- Types & Constants ---
type Orientation = 'TOP' | 'BOT' | 'LEFT' | 'RIGHT' | 'TOP_RIGHT' | 'BOT_RIGHT' | 'BOT_LEFT' | 'TOP_LEFT';

interface FeaturePoint {
    dist: number;
    label: string;
    hasRemark: boolean;
    orientation: Orientation;
    type: 'tap' | 'npt';
    diameter: number; // Scaled diameter
    stickOut: number; // Scaled stickout length
}

const VIEW_WIDTH = 850;
const VIEW_HEIGHT = 600; 
const CY = VIEW_HEIGHT / 2;
const SCALE_FACTOR = 2.2; 

// --- Helper: Orientation Logic ---
const getOrientation = (angle: number): Orientation => {
    const norm = (angle % 360 + 360) % 360;
    if (norm >= 337.5 || norm < 22.5) return 'TOP';
    if (norm >= 22.5 && norm < 67.5) return 'TOP_RIGHT';
    if (norm >= 67.5 && norm < 112.5) return 'RIGHT';
    if (norm >= 112.5 && norm < 157.5) return 'BOT_RIGHT';
    if (norm >= 157.5 && norm < 202.5) return 'BOT';
    if (norm >= 202.5 && norm < 247.5) return 'BOT_LEFT';
    if (norm >= 247.5 && norm < 292.5) return 'LEFT';
    return 'TOP_LEFT';
};

// --- Helper: Draw Main Pipe Body ---
const drawPipeBody = (xL: number, yT: number, width: number, height: number, cxRight: number, d1: number, length: number) => {
    // Left View (Top View)
    const xR = xL + width;
    const yB = yT + height;
    
    let svg = "";
    // Fill background to hide grid lines behind pipe
    svg += `<rect x="${xL}" y="${yT}" width="${width}" height="${height}" class="line" fill="white" />`;
    svg += drawFlange(xL, CY, height, true);
    svg += drawFlange(xR, CY, height, true);
    svg += `<line x1="${xL-5}" y1="${CY}" x2="${xR+5}" y2="${CY}" class="center-line" />`;

    // Right View (Cross Section)
    svg += `<circle cx="${cxRight}" cy="${CY}" r="${height/2}" class="line" fill="white" />`;
    svg += `<line x1="${cxRight-10}" y1="${CY}" x2="${cxRight+10}" y2="${CY}" stroke="black" />`;
    svg += `<line x1="${cxRight}" y1="${CY-10}" x2="${cxRight}" y2="${CY+10}" stroke="black" />`;

    // View Titles - Increased to match dimension text size
    svg += `
        <text x="${xL + width/2}" y="${VIEW_HEIGHT - 30}" font-weight="bold" text-anchor="middle" font-size="${CFG.textSize}" text-decoration="underline">TOP VIEW</text>
        <text x="${cxRight}" y="${VIEW_HEIGHT - 30}" font-weight="bold" text-anchor="middle" font-size="${CFG.textSize}" text-decoration="underline">SIDE VIEW</text>
    `;
    
    // Diameter Dim (Left Side)
    svg += drawDim(xL - 10, yT, xL - 10, yB, `Ø${d1}`, 'left');

    return svg;
};

// --- Helper: Draw Top View Feature ---
const drawFeatureTopView = (
    tx: number, 
    yT: number, 
    yB: number, 
    f: FeaturePoint,
    pipeDiam: number
): { svg: string, topExclusion: number, botExclusion: number } => {
    let svg = "";
    const r = f.diameter / 2;
    const rMain = pipeDiam / 2;
    
    // Saddle dip calculation
    const safeR = Math.min(r, rMain - 2); 
    const dip = rMain - Math.sqrt(rMain*rMain - safeR*safeR);

    let topExclusion = 0; 
    let botExclusion = 0;

    const labelStyle = f.type === 'npt' ? 'npt-text' : 'dim-text';
    const fontSize = CFG.textSize; // Uses global text size (24)

    if (f.orientation === 'TOP') {
        // Pointing at viewer: Circle + Flange
        svg += `<circle cx="${tx}" cy="${CY}" r="${r}" class="line" fill="white" />`;
        if (f.type === 'tap') {
            const rFlange = r + 8;
            svg += `<circle cx="${tx}" cy="${CY}" r="${rFlange}" class="line" fill="none" />`;
            // Bolt circle indication
            svg += `<circle cx="${tx}" cy="${CY}" r="${r + 4}" class="phantom-line" stroke-width="0.5" />`;
        }
        
        if (f.hasRemark) {
            // Annotation leader starting from top of circle
            const startY = CY - r;
            const res = drawAnnotation(tx, startY, f.label, true);
            svg += res.svg;
            
            // Check if annotation goes higher than pipe wall
            const highestPoint = startY - res.height;
            if (highestPoint < yT) {
                topExclusion = (yT - highestPoint) + 20;
            }
        } else {
            // Increased offset for larger text
            svg += `<text x="${tx}" y="${CY - r - 30}" class="${labelStyle}" font-size="${fontSize}">${f.label}</text>`;
        }
    } 
    else if (f.orientation === 'BOT') {
        svg += `<circle cx="${tx}" cy="${CY}" r="${r}" class="hidden-line" fill="none" />`;
    } 
    else if (f.orientation === 'LEFT' || f.orientation === 'TOP_LEFT' || f.orientation === 'BOT_LEFT') {
        // "Left" in clock orientation means Top in Plan view (270 deg)
        const yTip = yT - f.stickOut;
        
        // Neck Lines
        svg += `<line x1="${tx - r}" y1="${yTip}" x2="${tx - r}" y2="${yT}" class="line" />`;
        svg += `<line x1="${tx + r}" y1="${yTip}" x2="${tx + r}" y2="${yT}" class="line" />`;
        
        // Saddle Curve
        svg += `<path d="M${tx - r},${yT} Q${tx},${yT + dip*1.8} ${tx + r},${yT}" class="line" fill="white" />`;

        // Flange / Coupling at Tip
        if (f.type === 'tap') {
            const fw = f.diameter + 14;
            const fh = 6;
            svg += `<rect x="${tx - fw/2}" y="${yTip}" width="${fw}" height="${fh}" class="flange" fill="white" />`;
        } else {
            const cw = f.diameter + 6;
            svg += `<rect x="${tx - cw/2}" y="${yTip}" width="${cw}" height="${10}" class="line" fill="white" />`;
        }

        if (f.hasRemark) {
            const res = drawAnnotation(tx, yTip, f.label, true);
            svg += res.svg;
            topExclusion = f.stickOut + res.height;
        } else {
            // Increased offset for larger text
            svg += `<text x="${tx}" y="${yTip - 30}" class="${labelStyle}" font-size="${fontSize}">${f.label}</text>`;
            topExclusion = f.stickOut + 45; // Extra buffer for text
        }
    }
    else if (f.orientation === 'RIGHT' || f.orientation === 'TOP_RIGHT' || f.orientation === 'BOT_RIGHT') {
        // "Right" in clock means Bottom in Plan view (90 deg)
        const yTip = yB + f.stickOut;
        
        // Neck Lines
        svg += `<line x1="${tx - r}" y1="${yTip}" x2="${tx - r}" y2="${yB}" class="line" />`;
        svg += `<line x1="${tx + r}" y1="${yTip}" x2="${tx + r}" y2="${yB}" class="line" />`;
        
        // Saddle Curve
        svg += `<path d="M${tx - r},${yB} Q${tx},${yB - dip*1.8} ${tx + r},${yB}" class="line" fill="white" />`;

        // Flange / Coupling at Tip
        if (f.type === 'tap') {
            const fw = f.diameter + 14;
            const fh = 6;
            svg += `<rect x="${tx - fw/2}" y="${yTip - fh}" width="${fw}" height="${fh}" class="flange" fill="white" />`;
        } else {
            const cw = f.diameter + 6;
            svg += `<rect x="${tx - cw/2}" y="${yTip - 10}" width="${cw}" height="${10}" class="line" fill="white" />`;
        }
        
        if (f.hasRemark) {
            const res = drawAnnotation(tx, yTip, f.label, false);
            svg += res.svg;
            botExclusion = f.stickOut + res.height;
        } else {
            // Increased offset for larger text
            svg += `<text x="${tx}" y="${yTip + 35}" class="${labelStyle}" font-size="${fontSize}">${f.label}</text>`;
            botExclusion = f.stickOut + 45; // Extra buffer for text
        }
    }

    return { svg, topExclusion, botExclusion };
};

// --- Helper: Draw Side View Feature ---
const drawFeatureSideView = (cx: number, cy: number, f: FeaturePoint, pipeRad: number) => {
    let svg = "";
    
    let angleDeg = 0;
    switch (f.orientation) {
        case 'TOP': angleDeg = 0; break; 
        case 'TOP_RIGHT': angleDeg = 45; break;
        case 'RIGHT': angleDeg = 90; break;
        case 'BOT_RIGHT': angleDeg = 135; break;
        case 'BOT': angleDeg = 180; break;
        case 'BOT_LEFT': angleDeg = 225; break;
        case 'LEFT': angleDeg = 270; break;
        case 'TOP_LEFT': angleDeg = 315; break;
    }
    
    const rad = (angleDeg - 90) * Math.PI / 180;
    const rStart = pipeRad;
    const rEnd = pipeRad + f.stickOut;

    // Vector for center line
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);

    // Perpendicular vector for half-width
    const pCos = Math.cos(rad + Math.PI/2);
    const pSin = Math.sin(rad + Math.PI/2);
    const hw = f.diameter / 2;

    // Neck Points
    const p1 = { x: cx + rStart*cos + hw*pCos, y: cy + rStart*sin + hw*pSin };
    const p2 = { x: cx + rEnd*cos + hw*pCos,   y: cy + rEnd*sin + hw*pSin };
    const p3 = { x: cx + rEnd*cos - hw*pCos,   y: cy + rEnd*sin - hw*pSin };
    const p4 = { x: cx + rStart*cos - hw*pCos, y: cy + rStart*sin - hw*pSin };

    svg += `<path d="M${p1.x},${p1.y} L${p2.x},${p2.y} L${p3.x},${p3.y} L${p4.x},${p4.y} Z" class="line" fill="white" />`;

    // Flange (Rectangular box at end)
    if (f.type === 'tap') {
        const fh = 6;
        const fw = f.diameter + 14;
        const hfw = fw/2;
        
        // Flange corners relative to end center
        const fFaceC = { x: cx + rEnd*cos, y: cy + rEnd*sin };
        const fBackC = { x: cx + (rEnd-fh)*cos, y: cy + (rEnd-fh)*sin };
        
        const f1 = { x: fFaceC.x + hfw*pCos, y: fFaceC.y + hfw*pSin };
        const f2 = { x: fBackC.x + hfw*pCos, y: fBackC.y + hfw*pSin };
        const f3 = { x: fBackC.x - hfw*pCos, y: fBackC.y - hfw*pSin };
        const f4 = { x: fFaceC.x - hfw*pCos, y: fFaceC.y - hfw*pSin };
        
        svg += `<path d="M${f1.x},${f1.y} L${f2.x},${f2.y} L${f3.x},${f3.y} L${f4.x},${f4.y} Z" class="flange" fill="white" stroke-width="2" />`;
    }

    // Leader line to label
    const labelR = rEnd + 45; // Increased length for larger text
    const lx = cx + labelR * cos;
    const ly = cy + labelR * sin;
    
    // Updated font size to match CFG.textSize (24px)
    svg += `<text x="${lx}" y="${ly}" class="dim-text" font-size="${CFG.textSize}" dominant-baseline="middle" text-anchor="middle">${angleDeg}°</text>`;
    svg += `<line x1="${cx}" y1="${cy}" x2="${p2.x}" y2="${p2.y}" stroke="#999" stroke-dasharray="2,2" stroke-width="0.5" />`;

    return svg;
};

// --- Helper: Dimension Stacking ---
const drawDimensionStack = (
    features: FeaturePoint[], 
    xStart: number, 
    viewWidth: number, 
    totalLength: number,
    yRefTop: number,
    yRefBot: number,
    minClearanceTop: number,
    minClearanceBot: number
) => {
    let svg = "";
    
    // Group logic ...
    const topDims: typeof features = [];
    const botDims: typeof features = [];

    features.forEach(f => {
        if (f.orientation === 'LEFT' || f.orientation === 'TOP_LEFT' || f.orientation === 'BOT_LEFT') {
            botDims.push(f);
        } else if (f.orientation === 'RIGHT' || f.orientation === 'TOP_RIGHT' || f.orientation === 'BOT_RIGHT') {
            topDims.push(f);
        } else {
            if (topDims.length <= botDims.length) topDims.push(f);
            else botDims.push(f);
        }
    });

    const renderStack = (items: typeof features, side: 'top' | 'bottom') => {
        items.sort((a,b) => a.dist - b.dist);

        const tiers: number[] = [];
        const TEXT_WIDTH_GAP = 70; 
        const LEVEL_HEIGHT = 25;

        // Base Y start (clearance from pipe/features)
        const baseOffset = 20; // Reduced slightly since minClearance includes text buffer now
        const clearance = side === 'top' ? minClearanceTop : minClearanceBot;
        const startY = side === 'top' 
            ? yRefTop - clearance - baseOffset
            : yRefBot + clearance + baseOffset;

        let stackSvg = "";

        items.forEach(item => {
            const ratio = item.dist / totalLength;
            const tx = xStart + (ratio * viewWidth);
            
            let chosenTier = 0;
            while (true) {
                const lastX = tiers[chosenTier] || -9999;
                if (tx > lastX + TEXT_WIDTH_GAP) {
                    tiers[chosenTier] = tx;
                    break;
                }
                chosenTier++;
            }

            const yLevel = side === 'top' 
                ? startY - (chosenTier * LEVEL_HEIGHT)
                : startY + (chosenTier * LEVEL_HEIGHT);

            const yPipeCenter = CY;
            
            stackSvg += `<line x1="${tx}" y1="${yPipeCenter}" x2="${tx}" y2="${yLevel}" class="phantom-line" stroke-width="0.5" opacity="0.5" />`;
            stackSvg += drawDim(xStart, yLevel, tx, yLevel, item.dist.toString(), side, 0);
        });

        const maxTier = tiers.length > 0 ? tiers.length - 1 : 0;
        const finalY = side === 'top'
            ? startY - (maxTier * LEVEL_HEIGHT)
            : startY + (maxTier * LEVEL_HEIGHT);
            
        return { svg, finalY };
    };

    const topResult = renderStack(topDims, 'top');
    const botResult = renderStack(botDims, 'bottom');

    svg += topResult.svg;
    svg += botResult.svg;

    const totalDimY = botResult.finalY + 40;
    svg += drawDim(xStart, totalDimY, xStart + viewWidth, totalDimY, `L=${totalLength}`, 'bottom', 0);

    return svg;
};

// --- Main Generator ---
export const generateStraightWithTaps = (params: DuctParams) => {
    const d1 = params.d1 || 500;
    const len = params.length || 1000;
    
    // Visual Scales
    const V_D = 80 * SCALE_FACTOR;
    const V_L = 140 * SCALE_FACTOR;
    
    // View Layout
    const gap = 350;
    const cxLeft = (VIEW_WIDTH - gap) / 2;
    const cxRight = (VIEW_WIDTH + gap) / 2;
    
    const xL = cxLeft - V_L/2;
    const xR = cxLeft + V_L/2;
    const yT = CY - V_D/2;
    const yB = CY + V_D/2;

    const features: FeaturePoint[] = [];
    
    (params.taps || []).forEach((t: any) => {
        features.push({
            dist: t.dist,
            label: t.remark || `Ø${t.diameter}`,
            hasRemark: !!t.remark,
            orientation: getOrientation(t.angle || 0),
            type: 'tap',
            diameter: (t.diameter / d1) * V_D,
            stickOut: 35
        });
    });

    (params.nptPorts || []).forEach((n: any) => {
        features.push({
            dist: n.dist,
            label: n.remark || `Ø${n.size} NPT`,
            hasRemark: !!n.remark,
            orientation: getOrientation(n.angle || 0),
            type: 'npt',
            diameter: 20, 
            stickOut: 15
        });
    });

    let svgContent = "";
    
    svgContent += drawPipeBody(xL, yT, V_L, V_D, cxRight, d1, len);

    let maxStickTop = 0;
    let maxStickBot = 0;

    features.forEach(f => {
        const ratio = Math.max(0, Math.min(1, f.dist / len));
        const tx = xL + (ratio * V_L);
        
        const res = drawFeatureTopView(tx, yT, yB, f, V_D);
        svgContent += res.svg;
        
        if (res.topExclusion > maxStickTop) maxStickTop = res.topExclusion;
        if (res.botExclusion > maxStickBot) maxStickBot = res.botExclusion;
    });

    features.forEach(f => {
        svgContent += drawFeatureSideView(cxRight, CY, f, V_D/2);
    });

    const seamAngle = params.seamAngle || 0;
    const sRad = (seamAngle - 90) * Math.PI / 180;
    const sx = cxRight + (V_D/2) * Math.cos(sRad);
    const sy = CY + (V_D/2) * Math.sin(sRad);
    
    // Increased dot size by 50% (r=4 -> r=6)
    svgContent += `<circle cx="${sx}" cy="${sy}" r="6" fill="black" />`;

    // Flange Remarks
    // Placement strategy to minimize collision with taps and dimension stacks
    // F1 (Left): Point to Top-Left, Go Up & Left. Avoids dimension stack which is centered/right-biased usually.
    // F2 (Right): Point to Top-Right, Go Up & Right.
    if (params.flangeRemark1) {
        // xL, yT is Top-Left corner of pipe body
        svgContent += drawAnnotation(xL, yT, params.flangeRemark1, true, false, 80, false).svg;
    }
    if (params.flangeRemark2) {
        // xR, yT is Top-Right corner of pipe body
        svgContent += drawAnnotation(xR, yT, params.flangeRemark2, true, true, 80, false).svg;
    }

    svgContent += drawDimensionStack(
        features, 
        xL, 
        V_L, 
        len, 
        yT, 
        yB, 
        maxStickTop, 
        maxStickBot
    );
    
    // Cut Lines (A-A)
    const cutX = xL + 25;
    // Push cut lines clear of dimensions if possible, or just standard
    const cutY1 = yT - 40 - maxStickTop;
    const cutY2 = yB + 40 + maxStickBot;
    svgContent += `
        <line x1="${cutX}" y1="${cutY1}" x2="${cutX}" y2="${cutY2}" class="phantom-line" stroke-width="2" />
        <polyline points="${cutX-8},${cutY1} ${cutX},${cutY1} ${cutX},${cutY1+8}" fill="none" stroke="black" stroke-width="3" />
        <polyline points="${cutX-8},${cutY2} ${cutX},${cutY2} ${cutX},${cutY2-8}" fill="none" stroke="black" stroke-width="3" />
        <text x="${cutX}" y="${cutY1-8}" font-weight="bold" text-anchor="middle" font-size="${CFG.textSize}">A</text>
        <text x="${cutX}" y="${cutY2+20}" font-weight="bold" text-anchor="middle" font-size="${CFG.textSize}">A</text>
    `;

    return createSvg(svgContent, VIEW_WIDTH, VIEW_HEIGHT);
};