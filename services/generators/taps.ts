
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
    paramIndex: number; // For highlighting linkage
}

const VIEW_WIDTH = 800;
const VIEW_HEIGHT = 450; 
const CY = 225; 
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
const drawPipeBody = (xL: number, yT: number, width: number, height: number, cxRight: number, d1: number, length: number, activeField: string | null) => {
    const xR = xL + width;
    const yB = yT + height;
    
    let svg = "";
    svg += `<rect x="${xL}" y="${yT}" width="${width}" height="${height}" class="line" fill="white" />`;
    svg += drawFlange(xL, CY, height, true);
    svg += drawFlange(xR, CY, height, true);
    svg += `<line x1="${xL-5}" y1="${CY}" x2="${xR+5}" y2="${CY}" class="center-line" />`;

    svg += `<circle cx="${cxRight}" cy="${CY}" r="${height/2}" class="line" fill="white" />`;
    svg += `<line x1="${cxRight-10}" y1="${CY}" x2="${cxRight+10}" y2="${CY}" stroke="black" />`;
    svg += `<line x1="${cxRight}" y1="${CY-10}" x2="${cxRight}" y2="${CY+10}" stroke="black" />`;

    svg += `
        <text x="${xL + width/2}" y="${VIEW_HEIGHT - 15}" font-weight="bold" text-anchor="middle" font-size="18" text-decoration="underline">TOP VIEW</text>
        <text x="${cxRight}" y="${VIEW_HEIGHT - 15}" font-weight="bold" text-anchor="middle" font-size="18" text-decoration="underline">SIDE VIEW</text>
    `;
    
    svg += drawDim(xL - 15, yT, xL - 15, yB, `Ø${d1}`, 'left', null, 'd1', activeField);

    return svg;
};

// --- Helper: Draw Top View Feature ---
const drawFeatureTopView = (
    tx: number, 
    yT: number, 
    yB: number, 
    f: FeaturePoint,
    pipeDiam: number,
    activeField: string | null
): { svg: string, topExclusion: number, botExclusion: number } => {
    let svg = "";
    const r = f.diameter / 2;
    const rMain = pipeDiam / 2;
    
    const safeR = Math.min(r, rMain - 2); 
    const dip = rMain - Math.sqrt(rMain*rMain - safeR*safeR);

    let topExclusion = 0; 
    let botExclusion = 0;

    // Check if this feature is highlighted
    const isActive = activeField === (f.type === 'tap' ? `taps-diameter-${f.paramIndex}` : `npt-size-${f.paramIndex}`);
    const activeClass = isActive ? "highlight" : "";

    const labelStyle = f.type === 'npt' ? 'npt-text' : 'dim-text';
    const fontSize = GEN_TEXT_SIZE; 
    const effectiveLabelStyle = isActive ? `${labelStyle} highlight` : labelStyle;

    if (f.orientation === 'TOP') {
        svg += `<circle cx="${tx}" cy="${CY}" r="${r}" class="line ${activeClass}" fill="white" />`;
        if (f.type === 'tap') {
            const rFlange = r + 5;
            svg += `<circle cx="${tx}" cy="${CY}" r="${rFlange}" class="line ${activeClass}" fill="none" />`;
            svg += `<circle cx="${tx}" cy="${CY}" r="${r + 2}" class="phantom-line" stroke-width="0.5" />`;
        }
        
        if (f.hasRemark) {
            const startY = CY - r;
            const res = drawAnnotation(tx, startY, f.label, true, true, 40, false, fontSize);
            svg += res.svg;
            
            const highestPoint = startY - res.height;
            if (highestPoint < yT) {
                topExclusion = (yT - highestPoint) + 10;
            }
        } else {
            svg += `<text x="${tx}" y="${CY - r - 25}" class="${effectiveLabelStyle}" font-size="${fontSize}">${f.label}</text>`;
        }
    } 
    else if (f.orientation === 'BOT') {
        svg += `<circle cx="${tx}" cy="${CY}" r="${r}" class="hidden-line ${activeClass}" fill="none" />`;
    } 
    else if (f.orientation === 'LEFT' || f.orientation === 'TOP_LEFT' || f.orientation === 'BOT_LEFT') {
        const yTip = yT - f.stickOut;
        svg += `<line x1="${tx - r}" y1="${yTip}" x2="${tx - r}" y2="${yT}" class="line ${activeClass}" />`;
        svg += `<line x1="${tx + r}" y1="${yTip}" x2="${tx + r}" y2="${yT}" class="line ${activeClass}" />`;
        svg += `<path d="M${tx - r},${yT} Q${tx},${yT + dip*1.8} ${tx + r},${yT}" class="line ${activeClass}" fill="white" />`;

        if (f.type === 'tap') {
            const fw = f.diameter + 8;
            const fh = 5;
            svg += `<rect x="${tx - fw/2}" y="${yTip}" width="${fw}" height="${fh}" class="flange ${activeClass}" fill="white" />`;
        } else {
            const cw = f.diameter + 4;
            svg += `<rect x="${tx - cw/2}" y="${yTip}" width="${cw}" height="${8}" class="line ${activeClass}" fill="white" />`;
        }

        if (f.hasRemark) {
            const res = drawAnnotation(tx, yTip, f.label, true, true, 40, false, fontSize);
            svg += res.svg;
            topExclusion = f.stickOut + res.height;
        } else {
            svg += `<text x="${tx}" y="${yTip - 25}" class="${effectiveLabelStyle}" font-size="${fontSize}">${f.label}</text>`;
            topExclusion = f.stickOut + 40; 
        }
    }
    else if (f.orientation === 'RIGHT' || f.orientation === 'TOP_RIGHT' || f.orientation === 'BOT_RIGHT') {
        const yTip = yB + f.stickOut;
        svg += `<line x1="${tx - r}" y1="${yTip}" x2="${tx - r}" y2="${yB}" class="line ${activeClass}" />`;
        svg += `<line x1="${tx + r}" y1="${yTip}" x2="${tx + r}" y2="${yB}" class="line ${activeClass}" />`;
        svg += `<path d="M${tx - r},${yB} Q${tx},${yB - dip*1.8} ${tx + r},${yB}" class="line ${activeClass}" fill="white" />`;

        if (f.type === 'tap') {
            const fw = f.diameter + 8;
            const fh = 5;
            svg += `<rect x="${tx - fw/2}" y="${yTip - fh}" width="${fw}" height="${fh}" class="flange ${activeClass}" fill="white" />`;
        } else {
            const cw = f.diameter + 4;
            svg += `<rect x="${tx - cw/2}" y="${yTip - 8}" width="${cw}" height="${8}" class="line ${activeClass}" fill="white" />`;
        }
        
        if (f.hasRemark) {
            const res = drawAnnotation(tx, yTip, f.label, false, true, 40, false, fontSize);
            svg += res.svg;
            botExclusion = f.stickOut + res.height;
        } else {
            svg += `<text x="${tx}" y="${yTip + 25}" class="${effectiveLabelStyle}" font-size="${fontSize}">${f.label}</text>`;
            botExclusion = f.stickOut + 40; 
        }
    }

    return { svg, topExclusion, botExclusion };
};

// --- Helper: Draw Side View Feature ---
const drawFeatureSideView = (cx: number, cy: number, f: FeaturePoint, pipeRad: number, activeField: string | null) => {
    let svg = "";
    
    // Check if this feature's angle input is highlighted
    const isActive = activeField === (f.type === 'tap' ? `taps-angle-${f.paramIndex}` : `npt-angle-${f.paramIndex}`);
    const activeClass = isActive ? "highlight" : "";
    const activeTextClass = isActive ? "dim-text highlight" : "dim-text";

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
    
    // Calculate Tap Geometry
    const hw = f.diameter / 2;
    // Calculate radial distance to intersection point on circle surface (chord logic)
    // rIntersect^2 + hw^2 = pipeRad^2  => rIntersect = sqrt(pipeRad^2 - hw^2)
    // Clamp hw to avoid sqrt of negative if tap >= pipe (geometric limit)
    const safeHw = Math.min(hw, pipeRad - 0.5);
    const rIntersect = Math.sqrt(pipeRad * pipeRad - safeHw * safeHw);
    
    const rStart = rIntersect; // Base of tap sits on intersection line
    const rEnd = pipeRad + f.stickOut; // Outer edge relative to theoretical center surface

    const cos = Math.cos(rad);
    const sin = Math.sin(rad);

    const pCos = Math.cos(rad + Math.PI/2);
    const pSin = Math.sin(rad + Math.PI/2);

    // Points: 
    // p1 (Base Left), p2 (Top Left), p3 (Top Right), p4 (Base Right)
    const p1 = { x: cx + rStart*cos + safeHw*pCos, y: cy + rStart*sin + safeHw*pSin };
    const p2 = { x: cx + rEnd*cos + safeHw*pCos,   y: cy + rEnd*sin + safeHw*pSin };
    const p3 = { x: cx + rEnd*cos - safeHw*pCos,   y: cy + rEnd*sin - safeHw*pSin };
    const p4 = { x: cx + rStart*cos - safeHw*pCos, y: cy + rStart*sin - safeHw*pSin };

    // Path construction:
    // M p1 L p2 L p3 L p4 (Trapezoid/Rectangle)
    // Then Arc back to p1 to conform to cylinder surface
    // The arc is A rx ry rot large_arc sweep end_x end_y
    // Radius is pipeRad.
    // Direction: p4 -> p1.
    // If angleDeg=0 (Top): p4 is Right, p1 is Left. Arc goes p4->p1 counter-clockwise around center?
    // Let's check logic:
    // angle=0 -> rad=-90. cos=0, sin=-1. pCos=1, pSin=0.
    // p1 = (cx + hw, cy - rStart). Right side of top.
    // p4 = (cx - hw, cy - rStart). Left side of top.
    // Wait, p1 uses +pCos. If pCos=1, p1.x > cx. So p1 is Right.
    // p4 uses -pCos. p4.x < cx. So p4 is Left.
    // Path: p1 (Right) -> p2 (Right Top) -> p3 (Left Top) -> p4 (Left Base).
    // Close: p4 -> p1.
    // This goes Left -> Right.
    // The main circle goes Clockwise visually? Standard SVG circle is drawn 0->360.
    // On Top (y < cy), the circle arc goes Left -> Right.
    // So p4 -> p1 follows the circle arc direction if we use sweep=1?
    // Let's try sweep 1.
    
    svg += `<path d="M${p1.x},${p1.y} L${p2.x},${p2.y} L${p3.x},${p3.y} L${p4.x},${p4.y} A${pipeRad},${pipeRad} 0 0,1 ${p1.x},${p1.y} Z" class="line ${activeClass}" fill="white" />`;

    if (f.type === 'tap') {
        const fh = 5;
        const fw = f.diameter + 8;
        const hfw = fw/2;
        const fFaceC = { x: cx + rEnd*cos, y: cy + rEnd*sin };
        const fBackC = { x: cx + (rEnd-fh)*cos, y: cy + (rEnd-fh)*sin };
        const f1 = { x: fFaceC.x + hfw*pCos, y: fFaceC.y + hfw*pSin };
        const f2 = { x: fBackC.x + hfw*pCos, y: fBackC.y + hfw*pSin };
        const f3 = { x: fBackC.x - hfw*pCos, y: fBackC.y - hfw*pSin };
        const f4 = { x: fFaceC.x - hfw*pCos, y: fFaceC.y - hfw*pSin };
        
        svg += `<path d="M${f1.x},${f1.y} L${f2.x},${f2.y} L${f3.x},${f3.y} L${f4.x},${f4.y} Z" class="flange ${activeClass}" fill="white" stroke-width="2" />`;
    }

    const labelR = rEnd + 40;
    const lx = cx + labelR * cos;
    const ly = cy + labelR * sin;
    
    svg += `<text x="${lx}" y="${ly}" class="${activeTextClass}" font-size="${GEN_TEXT_SIZE}" dominant-baseline="middle" text-anchor="middle">${angleDeg}°</text>`;
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
    minClearanceBot: number,
    activeField: string | null
) => {
    let svg = "";
    
    const topDims: typeof features = [];
    const botDims: typeof features = [];

    features.forEach(f => {
        if (f.orientation === 'LEFT' || f.orientation === 'TOP_LEFT' || f.orientation === 'BOT_LEFT') {
            topDims.push(f);
        } else if (f.orientation === 'RIGHT' || f.orientation === 'TOP_RIGHT' || f.orientation === 'BOT_RIGHT') {
            botDims.push(f);
        } else {
            if (topDims.length <= botDims.length) topDims.push(f);
            else botDims.push(f);
        }
    });

    const renderStack = (items: typeof features, side: 'top' | 'bottom') => {
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
            const tier = index;
            const currentOffset = baseOffset + clearance + (tier * LEVEL_HEIGHT);
            
            stackSvg += `<line x1="${tx}" y1="${yPipeCenter}" x2="${tx}" y2="${yRef}" class="phantom-line" stroke-width="0.5" opacity="0.5" />`;
            
            // Link to dist ID
            const id = item.type === 'tap' ? `taps-dist-${item.paramIndex}` : `npt-dist-${item.paramIndex}`;
            stackSvg += drawDim(xStart, yRef, tx, yRef, item.dist.toString(), side, currentOffset, id, activeField);
        });
        
        const maxOffset = baseOffset + clearance + ((items.length > 0 ? items.length - 1 : 0) * LEVEL_HEIGHT);
        const finalY = side === 'top' ? yRef - maxOffset : yRef + maxOffset;

        return { svg: stackSvg, finalY };
    };

    const topResult = renderStack(topDims, 'top');
    const botResult = renderStack(botDims, 'bottom');

    svg += topResult.svg;
    svg += botResult.svg;

    const totalDimY = botResult.finalY + 60; 
    svg += drawDim(xStart, totalDimY, xStart + viewWidth, totalDimY, `L=${totalLength}`, 'bottom', 0, 'length', activeField);

    return svg;
};

// --- Main Generator ---
export const generateStraightWithTaps = (params: DuctParams, activeField: string | null = null) => {
    const d1 = params.d1 || 500;
    const len = params.length || 1000;
    
    const V_D = 100 * SCALE_FACTOR; 
    const V_L = 340 * SCALE_FACTOR; 
    
    const cxLeft = 320; 
    const cxRight = 720; 
    
    const xL = cxLeft - V_L/2;
    const xR = cxLeft + V_L/2;
    const yT = CY - V_D/2;
    const yB = CY + V_D/2;

    const features: FeaturePoint[] = [];
    
    (params.taps || []).forEach((t: any, idx: number) => {
        features.push({
            dist: t.dist,
            label: t.remark || `Ø${t.diameter}`,
            hasRemark: !!t.remark,
            orientation: getOrientation(t.angle || 0),
            type: 'tap',
            diameter: (t.diameter / d1) * V_D,
            stickOut: 30,
            paramIndex: idx
        });
    });

    (params.nptPorts || []).forEach((n: any, idx: number) => {
        features.push({
            dist: n.dist,
            label: n.remark || `Ø${n.size} NPT`,
            hasRemark: !!n.remark,
            orientation: getOrientation(n.angle || 0),
            type: 'npt',
            diameter: 25, 
            stickOut: 15,
            paramIndex: idx
        });
    });

    let svgContent = "";
    
    svgContent += drawPipeBody(xL, yT, V_L, V_D, cxRight, d1, len, activeField);

    let maxStickTop = 0;
    let maxStickBot = 0;

    features.forEach(f => {
        const ratio = Math.max(0, Math.min(1, f.dist / len));
        const tx = xL + (ratio * V_L);
        
        const res = drawFeatureTopView(tx, yT, yB, f, V_D, activeField);
        svgContent += res.svg;
        
        if (res.topExclusion > maxStickTop) maxStickTop = res.topExclusion;
        if (res.botExclusion > maxStickBot) maxStickBot = res.botExclusion;
    });

    features.forEach(f => {
        svgContent += drawFeatureSideView(cxRight, CY, f, V_D/2, activeField);
    });

    const seamAngle = params.seamAngle || 0;
    const sRad = (seamAngle - 90) * Math.PI / 180;
    const sx = cxRight + (V_D/2) * Math.cos(sRad);
    const sy = CY + (V_D/2) * Math.sin(sRad);
    
    svgContent += `<circle cx="${sx}" cy="${sy}" r="4" fill="black" />`;

    if (params.flangeRemark1) {
        svgContent += drawAnnotation(xL, yT, params.flangeRemark1, true, false, 60, false, GEN_TEXT_SIZE).svg;
    }
    if (params.flangeRemark2) {
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
        maxStickBot,
        activeField
    );
    
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
