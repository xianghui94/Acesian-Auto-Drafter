
import { DuctParams } from "../../types";
import { createSvg, drawDim, drawFlange, drawRotatedFlange, drawAnnotation, VIEW_BOX_SIZE, V_CONSTANTS } from "../svgUtils";

export const generateLateralTee = (params: DuctParams, activeField: string | null = null) => {
    const VIEW_WIDTH = VIEW_BOX_SIZE;
    const VIEW_HEIGHT = 350; 
    const cy = 215; // Adjusted center Y
    const cx = VIEW_WIDTH / 2;

    const D1 = params.d1 || 500;   
    const D3 = params.d2 || 300;   
    const L = params.length || 800; 
    
    const a_input = params.a_len || 100;
    const b_input = params.b_len || 100; 
    const branch_len = params.branch_len || 100;

    // SCHEMATIC CLAMPING
    // Slightly increased max diameter for better proportion
    const MAX_LOCAL_DIAM = 115; 
    
    const V_D1 = Math.min(D1, MAX_LOCAL_DIAM);
    let V_D3 = Math.min(D3, MAX_LOCAL_DIAM);
    if (D3 < D1) V_D3 = V_D1 * (D3/D1); 
    
    // Scale Lengths
    const V_Total_W = Math.min(L, V_CONSTANTS.MAX_LEN);
    const V_Gap = V_D3 * 1.4142;
    const availableSpace = V_Total_W - V_Gap;
    
    let V_a, V_b;
    if (availableSpace > 0) {
        const ratioA = a_input / (a_input + b_input);
        V_a = availableSpace * ratioA;
        V_b = availableSpace * (1 - ratioA);
    } else {
        V_a = 20;
        V_b = 20;
    }

    // Scale Branch Length
    // Increased max visual length from 90 to 115 for better proportion
    const V_BranchL = Math.min(branch_len, 115);

    // Centering
    const Draw_W = V_a + V_Gap + V_b;
    const xLeft = cx - Draw_W / 2;
    const xRight = cx + Draw_W / 2;
    const yTop = cy - V_D1/2;
    const yBot = cy + V_D1/2;

    // --- Geometry Points ---
    const pGapStart = { x: xLeft + V_a, y: yTop }; 
    const pGapEnd = { x: xLeft + V_a + V_Gap, y: yTop }; 
    const pCenterBase = { x: (pGapStart.x + pGapEnd.x)/2, y: yTop };

    // 2. Branch Calculation (45 deg Up-Right)
    const angleDeg = -45;
    const angleRad = angleDeg * (Math.PI / 180);
    
    const pCenterEnd = {
        x: pCenterBase.x + Math.cos(angleRad) * V_BranchL,
        y: pCenterBase.y + Math.sin(angleRad) * V_BranchL
    };

    // Branch Width Perpendicular Vector
    const pRad = (angleDeg - 90) * (Math.PI / 180); 
    const dx_p = Math.cos(pRad) * (V_D3 / 2);
    const dy_p = Math.sin(pRad) * (V_D3 / 2);

    const pBranchEndLeft = { x: pCenterEnd.x + dx_p, y: pCenterEnd.y + dy_p };
    const pBranchEndRight = { x: pCenterEnd.x - dx_p, y: pCenterEnd.y - dy_p };
    
    // --- Paths ---
    const mainBodyPath = `
        M${pGapEnd.x},${pGapEnd.y} 
        L${xRight},${yTop} 
        L${xRight},${yBot} 
        L${xLeft},${yBot} 
        L${xLeft},${yTop} 
        L${pGapStart.x},${pGapStart.y}
    `;

    const branchBodyPath = `
        M${pGapStart.x},${pGapStart.y} 
        L${pBranchEndLeft.x},${pBranchEndLeft.y}
        L${pBranchEndRight.x},${pBranchEndRight.y}
        L${pGapEnd.x},${pGapEnd.y}
    `;

    const weldPath = `
        M${pGapStart.x},${yTop} 
        Q${pCenterBase.x},${yTop + V_D3 * 0.4} ${pGapEnd.x},${yTop}
    `;
    
    const projYEnd = yBot + 60; 
    const projLines = `
        <line x1="${pGapStart.x}" y1="${yTop}" x2="${pGapStart.x}" y2="${projYEnd}" class="hidden-line" stroke-opacity="0.6" />
        <line x1="${pGapEnd.x}" y1="${yTop}" x2="${pGapEnd.x}" y2="${projYEnd}" class="hidden-line" stroke-opacity="0.6" />
    `;

    const clMain = `<line x1="${xLeft-15}" y1="${cy}" x2="${xRight+15}" y2="${cy}" class="center-line" />`;
    const clBranchStart = { 
        x: pCenterBase.x - Math.cos(angleRad)*20, 
        y: pCenterBase.y - Math.sin(angleRad)*20 
    };
    const clBranchEnd = {
        x: pCenterEnd.x + Math.cos(angleRad)*30,
        y: pCenterEnd.y + Math.sin(angleRad)*30
    };
    const clBranch = `<line x1="${clBranchStart.x}" y1="${clBranchStart.y}" x2="${clBranchEnd.x}" y2="${clBranchEnd.y}" class="center-line" />`;

    const f1 = drawFlange(xLeft, cy, V_D1, true); 
    const f2 = drawFlange(xRight, cy, V_D1, true); 
    const f3 = drawRotatedFlange(pCenterEnd.x, pCenterEnd.y, V_D3, angleDeg); 

    // --- Dimensions (Tightened Spacing) ---
    const OFFSET_AB = 35; // Tightened
    const OFFSET_L = 60;  // Tightened
    const OFFSET_D = 40;
    
    const dimA = drawDim(xLeft, yBot, pGapStart.x, yBot, `a=${a_input}`, 'bottom', OFFSET_AB, 'a_len', activeField);
    const dimB = drawDim(pGapEnd.x, yBot, xRight, yBot, `b=${b_input}`, 'bottom', OFFSET_AB, 'b_len', activeField);
    const dimL = drawDim(xLeft, yBot, xRight, yBot, `L=${L}`, 'bottom', OFFSET_L, 'length', activeField);
    const dimD1 = drawDim(xLeft, yTop, xLeft, yBot, `Ø${D1}`, 'left', OFFSET_D, 'd1', activeField);

    const dimOff = 40; 
    const d3_p1 = { x: pBranchEndLeft.x + Math.cos(angleRad)*dimOff, y: pBranchEndLeft.y + Math.sin(angleRad)*dimOff };
    const d3_p2 = { x: pBranchEndRight.x + Math.cos(angleRad)*dimOff, y: pBranchEndRight.y + Math.sin(angleRad)*dimOff };
    
    const isActiveD2 = activeField === 'd2';
    const dClass = isActiveD2 ? "dim-line highlight" : "dim-line";
    const tClass = isActiveD2 ? "dim-text highlight" : "dim-text";
    
    const dimD3Svg = `
        <g data-param="d2" style="cursor: pointer;">
            <line x1="${pBranchEndLeft.x}" y1="${pBranchEndLeft.y}" x2="${d3_p1.x}" y2="${d3_p1.y}" class="${dClass}" stroke-width="1"/>
            <line x1="${pBranchEndRight.x}" y1="${pBranchEndRight.y}" x2="${d3_p2.x}" y2="${d3_p2.y}" class="${dClass}" stroke-width="1"/>
            <line x1="${d3_p1.x}" y1="${d3_p1.y}" x2="${d3_p2.x}" y2="${d3_p2.y}" class="${dClass}" />
            <text x="${(d3_p1.x+d3_p2.x)/2}" y="${(d3_p1.y+d3_p2.y)/2}" 
                transform="rotate(${angleDeg}, ${(d3_p1.x+d3_p2.x)/2}, ${(d3_p1.y+d3_p2.y)/2})"
                dy="-5" text-anchor="middle" class="${tClass}">Ø${D3}</text>
        </g>
    `;

    const br_p2 = { x: pBranchEndLeft.x, y: pBranchEndLeft.y }; 
    const backCos = Math.cos(angleRad);
    const backSin = Math.sin(angleRad);
    const br_p1 = { 
        x: br_p2.x - (backCos * V_BranchL), 
        y: br_p2.y - (backSin * V_BranchL) 
    };

    const dimBranchOff = 50; 
    const offRad = (angleDeg - 90) * (Math.PI / 180); 
    const ox = Math.cos(offRad) * dimBranchOff;
    const oy = Math.sin(offRad) * dimBranchOff;
    
    const l1 = { x: br_p1.x + ox, y: br_p1.y + oy };
    const l2 = { x: br_p2.x + ox, y: br_p2.y + oy };
    
    const isActiveBL = activeField === 'branch_len';
    const blClass = isActiveBL ? "dim-line highlight" : "dim-line";
    const blTextClass = isActiveBL ? "dim-text highlight" : "dim-text";

    const dimBranchLen = `
        <g data-param="branch_len" style="cursor: pointer;">
             <line x1="${br_p1.x}" y1="${br_p1.y}" x2="${l1.x}" y2="${l1.y}" class="${blClass}" stroke-width="1" />
             <line x1="${br_p2.x}" y1="${br_p2.y}" x2="${l2.x}" y2="${l2.y}" class="${blClass}" stroke-width="1" />
             <line x1="${l1.x}" y1="${l1.y}" x2="${l2.x}" y2="${l2.y}" class="${blClass}" />
             <text x="${(l1.x+l2.x)/2}" y="${(l1.y+l2.y)/2}" 
                transform="rotate(${angleDeg}, ${(l1.x+l2.x)/2}, ${(l1.y+l2.y)/2})"
                dy="-5" text-anchor="middle" class="${blTextClass}">${branch_len}</text>
        </g>
    `;

    const arcR = 40;
    const arcPath = `M${pCenterBase.x + arcR},${yTop} A${arcR},${arcR} 0 0,0 ${pCenterBase.x + Math.cos(angleRad)*arcR},${pCenterBase.y + Math.sin(angleRad)*arcR}`;
    const arcSvg = `
        <path d="${arcPath}" fill="none" stroke="black" stroke-width="0.5" />
        <text x="${pCenterBase.x + 50}" y="${yTop - 10}" font-family="sans-serif" font-size="12">45°</text>
    `;

    let remarks = "";
    if (params.flangeRemark1) remarks += drawAnnotation(xLeft, yTop, params.flangeRemark1, true, false, 50).svg;
    if (params.flangeRemark2) remarks += drawAnnotation(pBranchEndRight.x, pBranchEndRight.y, params.flangeRemark2, true, true, 50).svg;

    return createSvg(
        `<path d="${mainBodyPath}" class="line" />` + 
        `<path d="${branchBodyPath}" class="line" />` + 
        `<path d="${weldPath}" fill="none" stroke="black" stroke-width="1" />` +
        projLines + 
        f1 + f2 + f3 + clMain + clBranch + arcSvg +
        dimL + dimD1 + dimD3Svg + dimBranchLen + dimA + dimB + remarks,
        VIEW_WIDTH, VIEW_HEIGHT
    );
};
