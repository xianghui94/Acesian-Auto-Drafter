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

const VIEW_WIDTH = 800;
const VIEW_HEIGHT = 450; // Decreased height
const CY = 225; // Centered vertically
const SCALE_FACTOR = 1.1; 
const GEN_TEXT_SIZE = 24; 

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

    // View Titles
    svg += `
        <text x="${xL + width/2}" y="${VIEW_HEIGHT - 15}" font-weight="bold" text-anchor="middle" font-size="18" text-decoration="underline">TOP VIEW</text>
        <text x="${cxRight}" y="${VIEW_HEIGHT - 15}" font-weight="bold" text-anchor="middle" font-size="18" text-decoration="underline">SIDE VIEW</text>
    `;
    
    // Diameter Dim (Left Side)
    svg += drawDim(xL - 15, yT, xL - 15, yB, `Ø${d1}`, 'left');

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
    const fontSize = GEN_TEXT_SIZE; 

    if (f.orientation === 'TOP') {
        // Pointing at viewer: Circle + Flange
        svg += `<circle cx="${tx}" cy="${CY}" r="${r}" class="line" fill="white" />`;
        if (f.type === 'tap') {
            const rFlange = r + 5;
            svg += `<circle cx="${tx}" cy="${CY}" r="${rFlange}" class="line" fill="none" />`;
            // Bolt circle indication
            svg += `<circle cx="${tx}" cy="${CY}" r="${r + 2}" class="phantom-line" stroke-width="0.5" />`;
        }
        
        if (f.hasRemark) {
            // Annotation leader starting from top of circle
            const startY = CY - r;
            const res = drawAnnotation(tx, startY, f.label, true, true, 40, false, fontSize);
            svg += res.svg;
            
            // Check if annotation goes higher than pipe wall
            const highestPoint = startY - res.height;
            if (highestPoint < yT) {
                topExclusion = (yT - highestPoint) + 10;
            }
        } else {
            svg += `<text x="${tx}" y="${CY - r - 25}" class="${labelStyle}" font-size="${fontSize}">${f.label}</text>`;
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
            const fw = f.diameter + 8;
            const fh = 5;
            svg += `<rect x="${tx - fw/2}" y="${yTip}" width="${fw}" height="${fh}" class="flange" fill="white" />`;
        } else {
            const cw = f.diameter + 4;
            svg += `<rect x="${tx - cw/2}" y="${yTip}" width="${cw}" height="${8}" class="line" fill="white" />`;
        }

        if (f.hasRemark) {
            const res = drawAnnotation(tx, yTip, f.label, true, true, 40, false, fontSize);
            svg += res.svg;
            topExclusion = f.stickOut + res.height;
        } else {
            svg += `<text x="${tx}" y="${yTip - 25}" class="${labelStyle}" font-size="${fontSize}">${f.label}</text>`;
            topExclusion = f.stickOut + 40; 
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
            const fw = f.diameter + 8;
            const fh = 5;
            svg += `<rect x="${tx - fw/2}" y="${yTip - fh}" width="${fw}" height="${fh}" class="flange" fill="white" />`;
        } else {
            const cw = f.diameter + 4;
            svg += `<rect x="${tx - cw/2}" y="${yTip - 8}" width="${cw}" height="${8}" class="line" fill="white" />`;
        }
        
        if (f.hasRemark) {
            const res = drawAnnotation(tx, yTip, f.label, false, true, 40, false, fontSize);
            svg += res.svg;
            botExclusion = f.stickOut + res.height;
        } else {
            svg += `<text x="${tx}" y="${yTip + 25}" class="${labelStyle}" font-size="${fontSize}">${f.label}</text>`;
            botExclusion = f.stickOut + 40; 
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
        const fh = 5;
        const fw = f.diameter + 8;
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
    const labelR = rEnd + 40;
    const lx = cx + labelR * cos;
    const ly = cy + labelR * sin;
    
    svg += `<text x="${lx}" y="${ly}" class="dim-text" font-size="${GEN_TEXT_SIZE}" dominant-baseline="middle" text-anchor="middle">${angleDeg}°</text>`;
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
        // Correct Logic: 
        // Left (270deg) sticks UP -> Top Dims
        // Right (90deg) sticks DOWN -> Bot Dims
        if (f.orientation === 'LEFT' || f.orientation === 'TOP_LEFT' || f.orientation === 'BOT_LEFT') {
            topDims.push(f);
        } else if (f.orientation === 'RIGHT' || f.orientation === 'TOP_RIGHT' || f.orientation === 'BOT_RIGHT') {
            botDims.push(f);
        } else {
            // Balance vertical taps
            if (topDims.length <= botDims.length) topDims.push(f);
            else botDims.push(f);
        }
    });

    const renderStack = (items: typeof features, side: 'top' | 'bottom') => {
        // Sort by distance (ASC)
        items.sort((a,b) => a.dist - b.dist);

        const LEVEL_HEIGHT = 50; 
        const baseOffset = 40; 
        const clearance = side === 'top' ? minClearanceTop : minClearanceBot;
        const yRef = side === 'top' ? yRefTop : yRefBot;

        let stackSvg = "";
        const yPipeCenter = CY;

        items.forEach((item, index) => {
            const ratio = item.dist / totalLength;
            const tx = xStart + (ratio * viewWidth);
            
            // Strict Stacking: Tier = Index. 
            // Shortest dist = Tier 0 (Closest), Longest dist = Tier N (Furthest)
            // This ensures longer dim lines are physically "above" shorter ones.
            const tier = index;
            
            const currentOffset = baseOffset + clearance + (tier * LEVEL_HEIGHT);
            
            // Phantom center line inside pipe (from center to surface)
            stackSvg += `<line x1="${tx}" y1="${yPipeCenter}" x2="${tx}" y2="${yRef}" class="phantom-line" stroke-width="0.5" opacity="0.5" />`;
            
            // Dimension with extension lines starting from yRef (pipe surface)
            // Ensure drawing from Left Face (xStart) to Tap Center (tx)
            stackSvg += drawDim(xStart, yRef, tx, yRef, item.dist.toString(), side, currentOffset);
        });
        
        // Calculate the Y coordinate of the highest dimension in this stack
        const maxOffset = baseOffset + clearance + ((items.length > 0 ? items.length - 1 : 0) * LEVEL_HEIGHT);
        const finalY = side === 'top' ? yRef - maxOffset : yRef + maxOffset;

        return { svg: stackSvg, finalY };
    };

    const topResult = renderStack(topDims, 'top');
    const botResult = renderStack(botDims, 'bottom');

    svg += topResult.svg;
    svg += botResult.svg;

    // Total Length Dimension (Placed below the bottom stack)
    const totalDimY = botResult.finalY + 60; 
    svg += drawDim(xStart, totalDimY, xStart + viewWidth, totalDimY, `L=${totalLength}`, 'bottom', 0);

    return svg;
};

// --- Main Generator ---
export const generateStraightWithTaps = (params: DuctParams) => {
    const d1 = params.d1 || 500;
    const len = params.length || 1000;
    
    // Visual Scales
    const V_D = 100 * SCALE_FACTOR; 
    const V_L = 340 * SCALE_FACTOR; 
    
    // View Layout (Shifted Apart)
    const cxLeft = 320; // Shifted Right significantly for Top View
    const cxRight = 720; // Shifted Right for Side View
    
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
            stickOut: 30
        });
    });

    (params.nptPorts || []).forEach((n: any) => {
        features.push({
            dist: n.dist,
            label: n.remark || `Ø${n.size} NPT`,
            hasRemark: !!n.remark,
            orientation: getOrientation(n.angle || 0),
            type: 'npt',
            diameter: 25, 
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
    
    svgContent += `<circle cx="${sx}" cy="${sy}" r="4" fill="black" />`;

    // Flange Remarks
    if (params.flangeRemark1) {
        // xL, yT is Top-Left corner of pipe body
        svgContent += drawAnnotation(xL, yT, params.flangeRemark1, true, false, 60, false, GEN_TEXT_SIZE).svg;
    }
    if (params.flangeRemark2) {
        // xR, yT is Top-Right corner of pipe body
        svgContent += drawAnnotation(xR, yT, params.flangeRemark2, true, true, 60, false, GEN_TEXT_SIZE).svg;
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
    const cutY1 = yT - 30 - maxStickTop;
    const cutY2 = yB + 30 + maxStickBot;
    svgContent += `
        <line x1="${cutX}" y1="${cutY1}" x2="${cutX}" y2="${cutY2}" class="phantom-line" stroke-width="2" />
        <polyline points="${cutX-8},${cutY1} ${cutX},${cutY1} ${cutX},${cutY1+8}" fill="none" stroke="black" stroke-width="3" />
        <polyline points="${cutX-8},${cutY2} ${cutX},${cutY2} ${cutX},${cutY2-8}" fill="none" stroke="black" stroke-width="3" />
        <text x="${cutX}" y="${cutY1-8}" font-weight="bold" text-anchor="middle" font-size="${GEN_TEXT_SIZE}">A</text>
        <text x="${cutX}" y="${cutY2+20}" font-weight="bold" text-anchor="middle" font-size="${GEN_TEXT_SIZE}">A</text>
    `;

    return createSvg(svgContent, VIEW_WIDTH, VIEW_HEIGHT);
};