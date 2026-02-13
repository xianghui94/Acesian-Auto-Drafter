
import { DuctParams } from "../../types";
import { createSvg, drawDim, drawFlange, drawAnnotation, VIEW_BOX_SIZE } from "../svgUtils";

export const generateBootTee = (params: DuctParams, activeField: string | null = null) => {
    const VIEW_WIDTH = VIEW_BOX_SIZE;
    const VIEW_HEIGHT = 400;
    const cx = VIEW_WIDTH / 2;
    const cy = VIEW_HEIGHT / 2 + 50; // Shift down slightly

    const d1 = params.d1 || 500;
    const d2 = params.d2 || 300;
    
    // Default values if not provided
    const a = params.a_len || 100;
    const b = params.b_len || 100;
    // This 'collarH' now represents the TOTAL Height (Transition + Straight)
    // Default is 175 (100 Trans + 75 Straight)
    const totalH = params.branch_len || 175;
    
    // Fixed non-editable dimension for Transition Height
    const TRANS_H_STD = 100;
    const SLOPE_W = 100;
    
    // Geometric clamping: If total H < 100, we must squash the transition
    const transH = Math.min(totalH, TRANS_H_STD); 
    
    // Calculated Length
    const length = params.length || (a + SLOPE_W + d2 + b);

    // Visual Scaling
    // We base the scale on D1 to keep it consistent
    const V_D1 = 140;
    const scale = V_D1 / d1;

    const V_D2 = d2 * scale;
    const V_L = length * scale;
    
    // Geometry Construction (Side View)
    const xLeft = cx - V_L/2;
    const xRight = cx + V_L/2;
    const yTop = cy - V_D1/2;
    const yBot = cy + V_D1/2;

    // Calculate visual widths based on inputs
    const V_a = a * scale;
    const V_Slope = SLOPE_W * scale;
    const V_b = b * scale;
    // V_D2 is already calculated
    
    // Start points
    const xSlopeStart = xLeft + V_a;
    const xBootTopStart = xSlopeStart + V_Slope;
    const xBootTopEnd = xBootTopStart + V_D2;
    
    // Vertical Heights
    const V_TransH = transH * scale;
    const V_TotalH = totalH * scale;
    
    const yTransTop = yTop - V_TransH;
    const yCollarTop = yTop - V_TotalH; // Top of the flange

    // --- Paths ---
    
    // Main Body
    const bodyPath = `
        M${xLeft},${yTop} L${xLeft},${yBot} L${xRight},${yBot} L${xRight},${yTop}
        L${xBootTopEnd},${yTop} 
        M${xSlopeStart},${yTop} L${xLeft},${yTop}
    `;

    // Boot Transition
    const bootPath = `
        M${xSlopeStart},${yTop} L${xBootTopStart},${yTransTop}
        L${xBootTopEnd},${yTransTop} L${xBootTopEnd},${yTop}
    `;
    
    // Boot Collar (Straight section on top of transition)
    // Only drawn if yTransTop != yCollarTop
    let collarPath = "";
    if (Math.abs(yTransTop - yCollarTop) > 0.1) {
        collarPath = `
            M${xBootTopStart},${yTransTop} L${xBootTopStart},${yCollarTop}
            M${xBootTopEnd},${yTransTop} L${xBootTopEnd},${yCollarTop}
        `;
    }
    
    // Weld line at base
    const weldLine = `
        M${xSlopeStart},${yTop} Q${(xSlopeStart+xBootTopEnd)/2},${yTop + V_D2*0.3} ${xBootTopEnd},${yTop}
    `;
    
    // Projection Lines for 'a' and 'b'
    // Dashed lines dropping from intersection points to dim line level
    const yDimLevel = yCollarTop - 40; // Top dim level
    const yProjBot = yDimLevel + 10;
    
    // Projection for 'a' (Left extension)
    // Project UPWARDS from the main body top line.
    
    const projUpStart = yTop;
    const projUpEnd = yDimLevel - 10; // Go slightly above dim line
    
    const projLines = `
        <line x1="${xLeft}" y1="${projUpStart}" x2="${xLeft}" y2="${projUpEnd}" class="hidden-line" stroke-opacity="0.6" />
        <line x1="${xSlopeStart}" y1="${projUpStart}" x2="${xSlopeStart}" y2="${projUpEnd}" class="hidden-line" stroke-opacity="0.6" />
        <line x1="${xBootTopStart}" y1="${yTransTop}" x2="${xBootTopStart}" y2="${projUpEnd}" class="hidden-line" stroke-opacity="0.6" />
        <line x1="${xBootTopEnd}" y1="${yTransTop}" x2="${xBootTopEnd}" y2="${projUpEnd}" class="hidden-line" stroke-opacity="0.6" />
        <line x1="${xRight}" y1="${projUpStart}" x2="${xRight}" y2="${projUpEnd}" class="hidden-line" stroke-opacity="0.6" />
    `;

    // Center Lines
    const clMain = `<line x1="${xLeft-10}" y1="${cy}" x2="${xRight+10}" y2="${cy}" class="center-line" />`;
    const clBoot = `<line x1="${(xBootTopStart+xBootTopEnd)/2}" y1="${yCollarTop-10}" x2="${(xBootTopStart+xBootTopEnd)/2}" y2="${yBot}" class="center-line" />`;

    // Flanges
    const f1 = drawFlange(xLeft, cy, V_D1, true);
    const f2 = drawFlange(xRight, cy, V_D1, true);
    // Top Flange
    const f3 = drawFlange((xBootTopStart+xBootTopEnd)/2, yCollarTop, V_D2, false);

    // --- Dimensions ---
    const activeD2 = activeField === 'd2';

    // 1. Length Dimensions (Top Chain)
    // Lift high enough
    const offsetTop = yTop - yDimLevel; // Positive distance to go up
    
    // a (Left Ext)
    const dimA = drawDim(xLeft, yTop, xSlopeStart, yTop, `${a}`, 'top', offsetTop, 'a_len', activeField);
    
    // Slope (100) - Not shown as requested
    
    // D2 (Top Width)
    const dimD2 = drawDim(xBootTopStart, yCollarTop, xBootTopEnd, yCollarTop, `Ø${d2}`, 'top', yCollarTop - yDimLevel, 'd2', activeField);
    
    // b (Right Ext)
    const dimB = drawDim(xBootTopEnd, yTop, xRight, yTop, `${b}`, 'top', offsetTop, 'b_len', activeField);

    // 2. Vertical Dimensions (Right Side)
    const xDimRight = xRight + 30;
    
    // Total Height H (Transition + Straight)
    // Measures from yTop (Main Body) to yCollarTop (Flange Face)
    // Extension lines project from xBootTopEnd
    const dimCollarH = drawDim(xBootTopEnd, yCollarTop, xBootTopEnd, yTop, `${totalH}`, 'right', xDimRight - xBootTopEnd, 'branch_len', activeField);

    // 3. Main Dimensions (Bottom)
    const dimL = drawDim(xLeft, yBot, xRight, yBot, `L=${length}`, 'bottom', 50, 'length', activeField);
    const dimD1 = drawDim(xLeft, yTop, xLeft, yBot, `Ø${d1}`, 'left', 30, 'd1', activeField);
    
    // 4. Angle Annotation
    // Draw arc for 45 deg
    const arc = `
        <path d="M${xSlopeStart + 30},${yTop} A30,30 0 0,0 ${xSlopeStart + 25},${yTop - 15}" fill="none" stroke="black" stroke-width="0.5" />
        <text x="${xSlopeStart + 45}" y="${yTop - 10}" font-size="12" font-family="sans-serif">45°</text>
    `;
    
    // Remarks
    let remarks = "";
    if (params.flangeRemark1) remarks += drawAnnotation(xLeft, yTop, params.flangeRemark1, true, false, 80).svg;
    if (params.flangeRemark2) remarks += drawAnnotation(xRight, yTop, params.flangeRemark2, true, true, 80).svg;

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
