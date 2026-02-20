
import { DuctParams } from "../../types";
import { createSvg, drawDim, drawFlange, drawAnnotation, VIEW_BOX_SIZE, V_CONSTANTS } from "../svgUtils";

export const generateBootTee = (params: DuctParams, activeField: string | null = null) => {
    const VIEW_WIDTH = VIEW_BOX_SIZE;
    const VIEW_HEIGHT = 600; // Increased from 400
    const cx = VIEW_WIDTH / 2;
    const cy = VIEW_HEIGHT / 2 + 80; // Shifted down significantly

    const d1 = params.d1 || 500;
    const d2 = params.d2 || 300;
    const a = params.a_len || 100;
    const b = params.b_len || 100;
    const totalH = params.branch_len || 175;
    const length = params.length || (a + 100 + d2 + b);

    // SCHEMATIC CLAMPING
    const V_D1 = Math.min(d1, V_CONSTANTS.MAX_DIAM);
    
    // Scale others based on V_D1
    let V_D2 = Math.min(d2, V_CONSTANTS.MAX_DIAM);
    if (d2 < d1) V_D2 = V_D1 * (d2/d1);

    const V_L = Math.min(length, V_CONSTANTS.MAX_LEN);
    
    const slopeW = 100;
    const sumParts = a + slopeW + d2 + b;
    
    const V_a = (a / sumParts) * V_L;
    const V_Slope = (slopeW / sumParts) * V_L;
    const V_b = (b / sumParts) * V_L;
    const V_BootTopWidth = (d2 / sumParts) * V_L; 
    
    // Height Clamping
    const V_TotalH = Math.min(totalH, 200); 
    const V_TransH = Math.min(100, V_TotalH * 0.6);
    
    const xLeft = cx - V_L/2;
    const xRight = cx + V_L/2;
    const yTop = cy - V_D1/2;
    const yBot = cy + V_D1/2;

    const xSlopeStart = xLeft + V_a;
    const xBootTopStart = xSlopeStart + V_Slope;
    const xBootTopEnd = xBootTopStart + V_BootTopWidth;
    
    const yTransTop = yTop - V_TransH;
    const yCollarTop = yTop - V_TotalH; 

    // --- Paths ---
    const bodyPath = `
        M${xLeft},${yTop} L${xLeft},${yBot} L${xRight},${yBot} L${xRight},${yTop}
        L${xBootTopEnd},${yTop} 
        M${xSlopeStart},${yTop} L${xLeft},${yTop}
    `;

    const bootPath = `
        M${xSlopeStart},${yTop} L${xBootTopStart},${yTransTop}
        L${xBootTopEnd},${yTransTop} L${xBootTopEnd},${yTop}
    `;
    
    let collarPath = "";
    if (Math.abs(yTransTop - yCollarTop) > 0.1) {
        collarPath = `
            M${xBootTopStart},${yTransTop} L${xBootTopStart},${yCollarTop}
            M${xBootTopEnd},${yTransTop} L${xBootTopEnd},${yCollarTop}
        `;
    }
    
    const weldLine = `
        M${xSlopeStart},${yTop} Q${(xSlopeStart+xBootTopEnd)/2},${yTop + V_D2*0.3} ${xBootTopEnd},${yTop}
    `;
    
    const yDimLevel = yCollarTop - 40; 
    const projUpStart = yTop;
    const projUpEnd = yDimLevel - 10; 
    
    const projLines = `
        <line x1="${xLeft}" y1="${projUpStart}" x2="${xLeft}" y2="${projUpEnd}" class="hidden-line" stroke-opacity="0.6" />
        <line x1="${xSlopeStart}" y1="${projUpStart}" x2="${xSlopeStart}" y2="${projUpEnd}" class="hidden-line" stroke-opacity="0.6" />
        <line x1="${xBootTopStart}" y1="${yTransTop}" x2="${xBootTopStart}" y2="${projUpEnd}" class="hidden-line" stroke-opacity="0.6" />
        <line x1="${xBootTopEnd}" y1="${yTransTop}" x2="${xBootTopEnd}" y2="${projUpEnd}" class="hidden-line" stroke-opacity="0.6" />
        <line x1="${xRight}" y1="${projUpStart}" x2="${xRight}" y2="${projUpEnd}" class="hidden-line" stroke-opacity="0.6" />
    `;

    const clMain = `<line x1="${xLeft-10}" y1="${cy}" x2="${xRight+10}" y2="${cy}" class="center-line" />`;
    const clBoot = `<line x1="${(xBootTopStart+xBootTopEnd)/2}" y1="${yCollarTop-10}" x2="${(xBootTopStart+xBootTopEnd)/2}" y2="${yBot}" class="center-line" />`;

    const f1 = drawFlange(xLeft, cy, V_D1, true);
    const f2 = drawFlange(xRight, cy, V_D1, true);
    const f3 = drawFlange((xBootTopStart+xBootTopEnd)/2, yCollarTop, V_BootTopWidth, false);

    // --- Dimensions ---
    const offsetTop = yTop - yDimLevel; 
    
    const dimA = drawDim(xLeft, yTop, xSlopeStart, yTop, `${a}`, 'top', offsetTop, 'a_len', activeField);
    const dimD2 = drawDim(xBootTopStart, yCollarTop, xBootTopEnd, yCollarTop, `Ø${d2}`, 'top', yCollarTop - yDimLevel, 'd2', activeField);
    const dimB = drawDim(xBootTopEnd, yTop, xRight, yTop, `${b}`, 'top', offsetTop, 'b_len', activeField);

    const xDimRight = xRight + 30;
    const dimCollarH = drawDim(xBootTopEnd, yCollarTop, xBootTopEnd, yTop, `${totalH}`, 'right', xDimRight - xBootTopEnd, 'branch_len', activeField);

    const dimL = drawDim(xLeft, yBot, xRight, yBot, `L=${length}`, 'bottom', 50, 'length', activeField);
    const dimD1 = drawDim(xLeft, yTop, xLeft, yBot, `Ø${d1}`, 'left', 30, 'd1', activeField);
    
    const arc = `
        <path d="M${xSlopeStart + 30},${yTop} A30,30 0 0,0 ${xSlopeStart + 25},${yTop - 15}" fill="none" stroke="black" stroke-width="0.5" />
        <text x="${xSlopeStart + 45}" y="${yTop - 10}" font-size="12" font-family="sans-serif">45°</text>
    `;
    
    let remarks = "";
    if (params.flangeRemark1) remarks += drawAnnotation(xLeft, yTop, params.flangeRemark1, true, false, 80).svg;
    if (params.flangeRemark2) remarks += drawAnnotation(xRight, yTop, params.flangeRemark2, true, true, 80).svg;
    if (params.flangeRemark3) remarks += drawAnnotation((xBootTopStart+xBootTopEnd)/2, yCollarTop, params.flangeRemark3, true, true, 80).svg;

    return createSvg(
        `<path d="${bodyPath} ${bootPath} ${collarPath}" class="line" fill="none" />` + 
        `<path d="${weldLine}" fill="none" stroke="black" stroke-width="1" />` +
        projLines + 
        clMain + clBoot + f1 + f2 + f3 + arc +
        dimA + dimD2 + dimB + dimCollarH +
        dimL + dimD1 + remarks,
        VIEW_WIDTH, VIEW_HEIGHT
    );
};
