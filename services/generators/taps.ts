
import { DuctParams } from "../../types";
import { createSvg, drawDim, drawFlange, drawAnnotation, VIEW_BOX_SIZE, CFG, V_CONSTANTS } from "../svgUtils";
import { calculateRadialBranchPath } from "../geometry/branchMath";

type Orientation = 'TOP' | 'BOT' | 'LEFT' | 'RIGHT' | 'TOP_RIGHT' | 'BOT_RIGHT' | 'BOT_LEFT' | 'TOP_LEFT';

interface FeaturePoint {
    dist: number;
    label: string;
    hasRemark: boolean;
    orientation: Orientation;
    type: 'tap' | 'npt';
    diameter: number; 
    stickOut: number; 
    paramIndex: number; 
    angleDeg: number; 
}

const VIEW_WIDTH = 800;
const VIEW_HEIGHT = 650; // Increased from 450 to show dim stacks
const CY = 325; // Shifted down
const GEN_TEXT_SIZE = 24; 

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

const drawFeatureSideView = (cx: number, cy: number, f: FeaturePoint, pipeRad: number, activeField: string | null) => {
    const isActive = activeField === (f.type === 'tap' ? `taps-angle-${f.paramIndex}` : `npt-angle-${f.paramIndex}`);
    const activeClass = isActive ? "highlight" : "";
    const activeTextClass = isActive ? "dim-text highlight" : "dim-text";

    const geo = calculateRadialBranchPath(
        cx, 
        cy, 
        pipeRad, 
        f.diameter / 2, 
        f.angleDeg, 
        f.stickOut,
        f.type === 'tap'
    );

    let svg = "";
    svg += `<path d="${geo.path}" class="line ${activeClass}" fill="white" />`;
    if (geo.flangePath) {
        svg += `<path d="${geo.flangePath}" class="flange ${activeClass}" fill="white" stroke-width="2" />`;
    }
    svg += `<text x="${geo.labelPoint.x}" y="${geo.labelPoint.y}" class="${activeTextClass}" font-size="${GEN_TEXT_SIZE}" dominant-baseline="middle" text-anchor="middle">${f.angleDeg}°</text>`;
    svg += `<line x1="${cx}" y1="${cy}" x2="${geo.endPoint.x}" y2="${geo.endPoint.y}" stroke="#999" stroke-dasharray="2,2" stroke-width="0.5" />`;

    return svg;
};

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

export const generateStraightWithTaps = (params: DuctParams, activeField: string | null = null) => {
    const realD1 = params.d1 || 500;
    const realL = params.length || 1000;
    
    // SCHEMATIC CLAMPING
    const V_D = Math.min(realD1, V_CONSTANTS.MAX_DIAM);
    const V_L = Math.min(realL, V_CONSTANTS.MAX_LEN);
    
    const cxLeft = 320; 
    const cxRight = 720; 
    
    const xL = cxLeft - V_L/2;
    const xR = cxLeft + V_L/2;
    const yT = CY - V_D/2;
    const yB = CY + V_D/2;

    const features: FeaturePoint[] = [];
    
    (params.taps || []).forEach((t: any, idx: number) => {
        let vTapDiam = (t.diameter / realD1) * V_D;
        vTapDiam = Math.min(vTapDiam, V_CONSTANTS.MAX_DIAM * 0.9);

        features.push({
            dist: t.dist,
            label: t.remark || `Ø${t.diameter}`,
            hasRemark: !!t.remark,
            orientation: getOrientation(t.angle || 0),
            type: 'tap',
            diameter: vTapDiam,
            stickOut: 30,
            paramIndex: idx,
            angleDeg: t.angle || 0
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
            paramIndex: idx,
            angleDeg: n.angle || 0
        });
    });

    let svgContent = "";
    
    svgContent += drawPipeBody(xL, yT, V_L, V_D, cxRight, realD1, realL, activeField);

    let maxStickTop = 0;
    let maxStickBot = 0;

    features.forEach(f => {
        const ratio = Math.max(0, Math.min(1, f.dist / realL));
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
        realL, 
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
