import { DuctParams } from "../../types";
import { createSvg, drawDim, drawFlange, VIEW_BOX_SIZE } from "../svgUtils";

export const generateStraightWithTaps = (params: DuctParams) => {
    // Layout: Left = Top View (Plan), Right = Cross-section (Side View)
    // Using a rectangular ViewBox to maximize zoom in the OrderSheet container (aspect ~1.8:1)
    const VIEW_WIDTH = 850; 
    const VIEW_HEIGHT = 550; 
    const cy = VIEW_HEIGHT / 2;

    const d1 = params.d1 || 500;
    const len = params.length || 1000;
    const taps = params.taps || [];
    const nptPorts = params.nptPorts || [];

    // Scale Logic - Increase base visual size by ~50%
    const scaleFactor = 2.2;
    const V_D = 80 * scaleFactor; 
    const V_L = 140 * scaleFactor; 
    const scale = V_D / d1; 
    
    // View positions
    const gap = 350; 
    const cxLeft = (VIEW_WIDTH - gap) / 2; 
    const cxRight = (VIEW_WIDTH + gap) / 2; 

    // --- Top View (Left) ---
    const xL = cxLeft - V_L/2;
    const xR = cxLeft + V_L/2;
    const yT = cy - V_D/2;
    const yB = cy + V_D/2;

    // Drawing Layers
    let bottomLayer = ""; 
    let pipeLayer = "";   
    let topLayer = "";    
    
    pipeLayer += `<rect x="${xL}" y="${yT}" width="${V_L}" height="${V_D}" class="line" fill="white" />`; 
    pipeLayer += drawFlange(xL, cy, V_D, true) + drawFlange(xR, cy, V_D, true);
    pipeLayer += `<line x1="${xL-5}" y1="${cy}" x2="${xR+5}" y2="${cy}" class="center-line" />`;
    
    const sortedTaps = [...taps].sort((a: any, b: any) => a.dist - b.dist);
    const sortedNPTs = [...nptPorts].sort((a: any, b: any) => a.dist - b.dist);

    let featuresForDims: any[] = [];
    sortedTaps.forEach(t => featuresForDims.push({...t, type: 'tap'}));
    sortedNPTs.forEach(n => featuresForDims.push({...n, type: 'npt'}));
    featuresForDims.sort((a,b) => a.dist - b.dist);

    // --- Render Taps ---
    sortedTaps.forEach((tap) => {
        const ang = (tap.angle || 0) % 360;
        const normAngle = (ang + 360) % 360; 
        
        const ratio = Math.max(0, Math.min(1, tap.dist / len));
        const tx = xL + (ratio * V_L);
        
        const vTapDiam = (tap.diameter * scale);
        const vTapRad = vTapDiam / 2;
        const vTapStickOut = 35; 
        const vFlangeW = vTapDiam + 10;
        const vFlangeThk = 6;
        
        const tapLabel = (tap.remark && tap.remark.trim() !== "") ? tap.remark : `Ø${tap.diameter}`;

        let orientation = 'TOP';
        if (normAngle >= 22.5 && normAngle < 67.5) orientation = 'TOP_RIGHT';      
        else if (normAngle >= 67.5 && normAngle < 112.5) orientation = 'RIGHT';   
        else if (normAngle >= 112.5 && normAngle < 157.5) orientation = 'BOT_RIGHT'; 
        else if (normAngle >= 157.5 && normAngle < 202.5) orientation = 'BOT';     
        else if (normAngle >= 202.5 && normAngle < 247.5) orientation = 'BOT_LEFT'; 
        else if (normAngle >= 247.5 && normAngle < 292.5) orientation = 'LEFT';    
        else if (normAngle >= 292.5 && normAngle < 337.5) orientation = 'TOP_LEFT'; 
        else orientation = 'TOP'; 

        switch (orientation) {
            case 'BOT': 
                bottomLayer += `<circle cx="${tx}" cy="${cy}" r="${vTapRad}" class="hidden-line" fill="none" />`;
                bottomLayer += `<circle cx="${tx}" cy="${cy}" r="${vTapRad + 5}" class="hidden-line" stroke-width="0.5" fill="none" />`;
                break;
                
            case 'TOP': 
                topLayer += `<circle cx="${tx}" cy="${cy}" r="${vTapRad}" class="line" fill="white" />`;
                topLayer += `<circle cx="${tx}" cy="${cy}" r="${vTapRad + 5}" class="line" stroke-width="0.5" stroke-dasharray="2,2" fill="none" />`;
                topLayer += `<text x="${tx}" y="${cy - vTapRad - 10}" class="dim-text" font-size="14">${tapLabel}</text>`;
                break;

            case 'LEFT': 
                bottomLayer += `<rect x="${tx - vTapDiam/2}" y="${yT - vTapStickOut}" width="${vTapDiam}" height="${vTapStickOut}" class="line" fill="white" />`; 
                bottomLayer += `<rect x="${tx - vFlangeW/2}" y="${yT - vTapStickOut}" width="${vFlangeW}" height="${vFlangeThk}" class="flange" />`; 
                topLayer += `<text x="${tx}" y="${yT - vTapStickOut - 12}" class="dim-text" font-size="14">${tapLabel}</text>`;
                break;

            case 'RIGHT': 
                bottomLayer += `<rect x="${tx - vTapDiam/2}" y="${yB}" width="${vTapDiam}" height="${vTapStickOut}" class="line" fill="white" />`; 
                bottomLayer += `<rect x="${tx - vFlangeW/2}" y="${yB + vTapStickOut - vFlangeThk}" width="${vFlangeW}" height="${vFlangeThk}" class="flange" />`; 
                topLayer += `<text x="${tx}" y="${yB + vTapStickOut + 18}" class="dim-text" font-size="14">${tapLabel}</text>`;
                break;

            case 'TOP_RIGHT': 
            case 'TOP_LEFT': 
                {
                    const isUp = (orientation === 'TOP_LEFT');
                    const ySurf = isUp ? cy - 0.7 * (V_D/2) : cy + 0.7 * (V_D/2);
                    const yTip = isUp ? cy - 0.7 * (V_D/2 + vTapStickOut) : cy + 0.7 * (V_D/2 + vTapStickOut);
                    const labelY = isUp ? yTip - 10 : yTip + 15;
                    
                    topLayer += `<path d="M${tx - vTapDiam/2},${ySurf} L${tx + vTapDiam/2},${ySurf} L${tx + vTapDiam/2},${yTip} L${tx - vTapDiam/2},${yTip} Z" class="line" fill="white" />`;
                    const ry = vTapDiam/2 * 0.7; 
                    topLayer += `<ellipse cx="${tx}" cy="${yTip}" rx="${vTapDiam/2}" ry="${ry}" class="flange" />`;
                    topLayer += `<text x="${tx}" y="${labelY}" class="dim-text" font-size="14">${tapLabel}</text>`;
                }
                break;
                
            case 'BOT_RIGHT': 
            case 'BOT_LEFT': 
                {
                    const isUp = (orientation === 'BOT_LEFT');
                    const ySurf = isUp ? cy - 0.7 * (V_D/2) : cy + 0.7 * (V_D/2);
                    const yTip = isUp ? cy - 0.7 * (V_D/2 + vTapStickOut) : cy + 0.7 * (V_D/2 + vTapStickOut);
                    
                    bottomLayer += `<path d="M${tx - vTapDiam/2},${ySurf} L${tx - vTapDiam/2},${yTip}" class="hidden-line" />`;
                    bottomLayer += `<path d="M${tx + vTapDiam/2},${ySurf} L${tx + vTapDiam/2},${yTip}" class="hidden-line" />`;
                    
                    const ry = vTapDiam/2 * 0.7; 
                    bottomLayer += `<ellipse cx="${tx}" cy="${yTip}" rx="${vTapDiam/2}" ry="${ry}" class="hidden-line" fill="none" />`;
                }
                break;
        }
    });

    // --- Render NPT Ports ---
    sortedNPTs.forEach((port) => {
        const ang = (port.angle || 0) % 360;
        const normAngle = (ang + 360) % 360;
        
        const ratio = Math.max(0, Math.min(1, port.dist / len));
        const tx = xL + (ratio * V_L);

        const vPortRad = 10;
        const vPortStickOut = 14;
        
        const portLabel = (port.remark && port.remark.trim() !== "") ? port.remark : `Ø${port.size} NPT TP`;

        let orientation = 'TOP';
        if (normAngle >= 45 && normAngle < 135) orientation = 'RIGHT';      
        else if (normAngle >= 135 && normAngle < 225) orientation = 'BOT';  
        else if (normAngle >= 225 && normAngle < 315) orientation = 'LEFT'; 
        else orientation = 'TOP'; 

        switch (orientation) {
            case 'TOP': 
                topLayer += `<circle cx="${tx}" cy="${cy}" r="${vPortRad}" class="line" fill="white" />`;
                topLayer += `<circle cx="${tx}" cy="${cy}" r="${vPortRad/2}" class="line" fill="none" />`; 
                topLayer += `<line x1="${tx}" y1="${cy-vPortRad}" x2="${tx+20}" y2="${cy-40}" class="line" stroke-width="0.5" />`;
                topLayer += `<line x1="${tx+20}" y1="${cy-40}" x2="${tx+50}" y2="${cy-40}" class="line" stroke-width="0.5" />`;
                topLayer += `<text x="${tx+50}" y="${cy-45}" class="npt-text" text-anchor="end">${portLabel}</text>`;
                break;

            case 'BOT': 
                bottomLayer += `<circle cx="${tx}" cy="${cy}" r="${vPortRad}" class="hidden-line" fill="none" />`;
                bottomLayer += `<circle cx="${tx}" cy="${cy}" r="${vPortRad/2}" class="hidden-line" fill="none" />`;
                break;

            case 'LEFT': 
                bottomLayer += `<rect x="${tx - vPortRad/2}" y="${yT - vPortStickOut}" width="${vPortRad}" height="${vPortStickOut}" class="line" fill="white" />`;
                topLayer += `<text x="${tx}" y="${yT - vPortStickOut - 6}" class="npt-text">${portLabel}</text>`;
                break;
            
            case 'RIGHT': 
                bottomLayer += `<rect x="${tx - vPortRad/2}" y="${yB}" width="${vPortRad}" height="${vPortStickOut}" class="line" fill="white" />`;
                topLayer += `<text x="${tx}" y="${yB + vPortStickOut + 14}" class="npt-text">${portLabel}</text>`;
                break;
        }
    });

    // --- Dimensions Logic ---
    let featureDims = "";
    
    const distGroups = new Map<number, any[]>();
    featuresForDims.forEach(f => {
        if (!distGroups.has(f.dist)) distGroups.set(f.dist, []);
        distGroups.get(f.dist).push(f);
    });
    
    const sortedDists = Array.from(distGroups.keys()).sort((a,b) => a - b);
    
    const topDims: any[] = [];
    const botDims: any[] = [];
    let preferBottom = true; 

    sortedDists.forEach(d => {
        const group = distGroups.get(d);
        if (group.length > 1) {
            group.forEach((item: any, i: number) => {
                if (i % 2 === 0) botDims.push(item);
                else topDims.push(item);
            });
        } else {
            if (preferBottom) botDims.push(group[0]);
            else topDims.push(group[0]);
            preferBottom = !preferBottom; 
        }
    });

    const renderStackedDims = (items: any[], side: 'top' | 'bottom') => {
        let svg = "";
        const levels: number[] = []; 

        items.forEach(item => {
            const ratio = Math.max(0, Math.min(1, item.dist / len));
            const tx = xL + (ratio * V_L);
            
            let level = 0;
            while(true) {
                const lastX = levels[level];
                if (lastX === undefined) {
                    levels[level] = tx;
                    break;
                }
                if (Math.abs(tx - lastX) > 60) { 
                    levels[level] = tx;
                    break;
                }
                level++;
            }
            
            const baseOff = 60;
            const levelStep = 25; 
            const totalOff = baseOff + (level * levelStep);
            
            const yOrg = (side === 'top') ? yT : yB;
            const yDim = (side === 'top') ? yOrg - totalOff : yOrg + totalOff;
            
            svg += `<line x1="${tx}" y1="${yOrg}" x2="${tx}" y2="${yDim}" class="phantom-line" stroke-width="0.5" />`;
            svg += `<line x1="${xL}" y1="${yOrg}" x2="${xL}" y2="${yDim}" class="line" stroke-width="0.5" />`;
            svg += drawDim(xL, yDim, tx, yDim, `${item.dist}`, side, 0);
        });
        
        return svg;
    };

    featureDims += renderStackedDims(topDims, 'top');
    featureDims += renderStackedDims(botDims, 'bottom');

    const dimD = drawDim(xL - 10, yT, xL - 10, yB, `Ø${d1}`, 'left');
    
    const botLevels = Math.ceil(botDims.length / 2); 
    const dimL_Y = yB + 60 + (botLevels * 25) + 30; 
    const dimL = drawDim(xL, dimL_Y, xR, dimL_Y, `L=${len}`, 'bottom', 0);

    const cutX = xL + 20;
    const cutTopY = yT - 40; 
    const cutBotY = yB + 40;
    const cutLine = `
        <line x1="${cutX}" y1="${cutTopY}" x2="${cutX}" y2="${cutBotY}" class="phantom-line" stroke-width="2" />
        <line x1="${cutX}" y1="${cutTopY}" x2="${cutX}" y2="${cutTopY+15}" stroke="black" stroke-width="3" />
        <line x1="${cutX}" y1="${cutBotY}" x2="${cutX}" y2="${cutBotY-15}" stroke="black" stroke-width="3" />
        <polyline points="${cutX-8},${cutTopY} ${cutX},${cutTopY} ${cutX},${cutTopY+8}" fill="none" stroke="black" stroke-width="3" />
        <polyline points="${cutX-8},${cutBotY} ${cutX},${cutBotY} ${cutX},${cutBotY-8}" fill="none" stroke="black" stroke-width="3" />
        <text x="${cutX}" y="${cutTopY-8}" font-weight="bold" text-anchor="middle" font-size="18">A</text>
        <text x="${cutX}" y="${cutBotY+20}" font-weight="bold" text-anchor="middle" font-size="18">A</text>
    `;

    // --- Right View Visuals ---
    const circle = `<circle cx="${cxRight}" cy="${cy}" r="${V_D/2}" class="line" />`;
    const centerMark = `<line x1="${cxRight-10}" y1="${cy}" x2="${cxRight+10}" y2="${cy}" stroke="black" /><line x1="${cxRight}" y1="${cy-10}" x2="${cxRight}" y2="${cy+10}" stroke="black" />`;
    
    const seamAngle = params.seamAngle !== undefined ? params.seamAngle : 0;
    const sRad = (seamAngle - 90) * Math.PI / 180;
    const sx = cxRight + (V_D/2) * Math.cos(sRad);
    const sy = cy + (V_D/2) * Math.sin(sRad);
    const seamDot = `<circle cx="${sx}" cy="${sy}" r="5" fill="black" />`;

    let tapVisualsRight = "";
    
    sortedTaps.forEach(tap => {
        const angle = tap.angle || 0;
        const rad = (angle - 90) * Math.PI / 180;
        const R = V_D/2;
        const stubLen = 35;
        
        const vTapDiam = (tap.diameter * scale);
        
        const x1 = cxRight + R * Math.cos(rad);
        const y1 = cy + R * Math.sin(rad);
        const x2 = cxRight + (R + stubLen) * Math.cos(rad);
        const y2 = cy + (R + stubLen) * Math.sin(rad);
        
        const px = Math.cos(rad + Math.PI/2) * (vTapDiam/2);
        const py = Math.sin(rad + Math.PI/2) * (vTapDiam/2);
        const p1x = x1 + px, p1y = y1 + py;
        const p4x = x2 + px, p4y = y2 + py;
        const p2x = x1 - px, p2y = y1 - py;
        const p3x = x2 - px, p3y = y2 - py;
        
        tapVisualsRight += `<path d="M${p1x},${p1y} L${p4x},${p4y} M${p2x},${p2y} L${p3x},${p3y}" class="line" />`;
        
        const vFlangeW = vTapDiam + 10;
        const fx = Math.cos(rad + Math.PI/2) * (vFlangeW/2);
        const fy = Math.sin(rad + Math.PI/2) * (vFlangeW/2);
        const f1x = x2 - fx, f1y = y2 - fy;
        const f2x = x2 + fx, f2y = y2 + fy;
        
        tapVisualsRight += `<line x1="${f1x}" y1="${f1y}" x2="${f2x}" y2="${f2y}" class="flange" stroke-width="2" />`;
        
        const labelR = R + stubLen + 25;
        const lx = cxRight + labelR * Math.cos(rad);
        const ly = cy + labelR * Math.sin(rad);
        tapVisualsRight += `<text x="${lx}" y="${ly}" class="dim-text" font-size="14" dominant-baseline="middle">${angle}°</text>`;
        tapVisualsRight += `<line x1="${cxRight}" y1="${cy}" x2="${x1}" y2="${y1}" stroke="#999" stroke-dasharray="2,2" stroke-width="0.5" />`;
    });

    sortedNPTs.forEach(port => {
        const angle = port.angle || 0;
        const rad = (angle - 90) * Math.PI / 180;
        const R = V_D/2;
        const stubLen = 16; 
        const vPortRad = 10;

        const x1 = cxRight + R * Math.cos(rad);
        const y1 = cy + R * Math.sin(rad);
        const x2 = cxRight + (R + stubLen) * Math.cos(rad);
        const y2 = cy + (R + stubLen) * Math.sin(rad);
        
        const px = Math.cos(rad + Math.PI/2) * (vPortRad);
        const py = Math.sin(rad + Math.PI/2) * (vPortRad);
        
        const p1x = x1 + px, p1y = y1 + py;
        const p4x = x2 + px, p4y = y2 + py;
        const p2x = x1 - px, p2y = y1 - py;
        const p3x = x2 - px, p3y = y2 - py;
        
        tapVisualsRight += `<path d="M${p1x},${p1y} L${p4x},${p4y} L${p3x},${p3y} L${p2x},${p2y} Z" class="line" fill="white" />`;
        
        tapVisualsRight += `<line x1="${p4x}" y1="${p4y}" x2="${p3x}" y2="${p3y}" stroke="black" stroke-width="2" />`;

        const labelR = R + stubLen + 20;
        const lx = cxRight + labelR * Math.cos(rad);
        const ly = cy + labelR * Math.sin(rad);
        tapVisualsRight += `<text x="${lx}" y="${ly}" class="npt-text" dominant-baseline="middle">${angle}°</text>`;
        tapVisualsRight += `<line x1="${cxRight}" y1="${cy}" x2="${x1}" y2="${y1}" stroke="#999" stroke-dasharray="2,2" stroke-width="0.5" />`;
    });
    
    const degLabels = `
        <text x="${cxRight}" y="${cy - V_D/2 - 16}" font-size="14" text-anchor="middle">0°</text>
        <text x="${cxRight + V_D/2 + 16}" y="${cy}" font-size="14" dominant-baseline="middle">90°</text>
        <text x="${cxRight}" y="${cy + V_D/2 + 16}" font-size="14" text-anchor="middle">180°</text>
        <text x="${cxRight - V_D/2 - 16}" y="${cy}" font-size="14" text-anchor="end" dominant-baseline="middle">270°</text>
    `;

    const viewLabels = `
        <text x="${cxLeft}" y="${cy + V_D/2 + 160}" font-weight="bold" text-anchor="middle" font-size="18" text-decoration="underline">TOP VIEW</text>
        <text x="${cxRight}" y="${cy + V_D/2 + 160}" font-weight="bold" text-anchor="middle" font-size="18" text-decoration="underline">SIDE VIEW</text>
    `;

    return createSvg(
        bottomLayer + 
        pipeLayer + 
        topLayer +
        
        dimD + cutLine + featureDims + dimL +
        circle + centerMark + seamDot + tapVisualsRight + degLabels + viewLabels,
        VIEW_WIDTH,
        VIEW_HEIGHT
    );
};