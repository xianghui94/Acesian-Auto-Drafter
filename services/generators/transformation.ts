
import { DuctParams } from "../../types";
import { createSvg, drawDim, drawFlange, drawAnnotation, VIEW_BOX_SIZE, V_CONSTANTS } from "../svgUtils";

const { TRANS_LEN: V_TRANS_LEN, TRANS_TAN: V_TRANS_TAN } = V_CONSTANTS;

export const generateTransformation = (params: DuctParams, activeField: string | null = null) => {
    const VIEW_WIDTH = VIEW_BOX_SIZE;
    const VIEW_HEIGHT = 500; // Reduced from 800
    const cx = VIEW_WIDTH / 2;
    const cy = VIEW_HEIGHT / 2;
    
    const realD = params.d1 || 500;
    const realS = params.height || 500; 
    const realH = params.offset || 0; // Vertical Offset

    // Visual Calculation for D and S (Diameter and Square Height)
    const BASE_MAX = 200; 
    let D, S;
    if (realD >= realS) {
        D = BASE_MAX; S = BASE_MAX * (realS / realD);
    } else {
        S = BASE_MAX; D = BASE_MAX * (realD / realS);
    }
    D = Math.max(D, 80); S = Math.max(S, 80);

    // Visual Calculation for Offset H
    // We scale the offset relative to the larger dimension (D or S)
    const maxRealDim = Math.max(realD, realS);
    const maxVisDim = Math.max(D, S);
    const ratio = maxVisDim / maxRealDim;
    // Limit visual offset so it doesn't fly off screen
    const V_OFFSET = Math.max(-150, Math.min(150, realH * ratio)); 

    const L = V_TRANS_LEN;
    const T = V_TRANS_TAN;
    const xLeft = cx - L/2;
    const xRight = cx + L/2;
    const xT1 = xLeft + T;
    const xT2 = xRight - T;
    
    // Round Side (Left) - Fixed at CY
    const yRoundTop = cy - D/2;
    const yRoundBot = cy + D/2;
    
    // Rect Side (Right) - Shifted by Offset
    // Assuming Positive Offset H = Shift Up (Flat Bottom scenario implies offset)
    // In drafting, usually "Offset" means distance between centerlines.
    // Let's implement: Rect Center = cy - V_OFFSET
    const cyRect = cy - V_OFFSET;
    const yRectTop = cyRect - S/2;
    const yRectBot = cyRect + S/2;
    
    const contour = `
        M${xLeft},${yRoundTop} L${xT1},${yRoundTop} L${xT2},${yRectTop} L${xRight},${yRectTop}
        M${xRight},${yRectBot} L${xT2},${yRectBot} L${xT1},${yRoundBot} L${xLeft},${yRoundBot}
        M${xLeft},${yRoundTop} L${xLeft},${yRoundBot}
        M${xRight},${yRectTop} L${xRight},${yRectBot}
    `;
    
    const crease = `
        <line x1="${xT1}" y1="${cy}" x2="${xT2}" y2="${yRectTop}" stroke="black" stroke-width="1" />
        <line x1="${xT1}" y1="${cy}" x2="${xT2}" y2="${yRectBot}" stroke="black" stroke-width="1" />
    `;
    
    // Center Lines
    const centerRound = `<line x1="${xLeft}" y1="${cy}" x2="${xT1 + 20}" y2="${cy}" class="center-line" />`;
    const centerRect = `<line x1="${xT2 - 20}" y1="${cyRect}" x2="${xRight}" y2="${cyRect}" class="center-line" />`;
    const centerConnect = `<line x1="${xT1}" y1="${cy}" x2="${xT2}" y2="${cyRect}" class="phantom-line" />`;

    const path = `<path d="${contour}" class="line" />`;
    const f1 = drawFlange(xLeft, cy, D, true);
    const f2 = drawFlange(xRight, cyRect, S, true);

    const dimD = drawDim(xLeft, yRoundTop, xLeft, yRoundBot, `Ø${params.d1 || 500}`, 'left', null, 'd1', activeField);
    
    // For Width x Height, we highlight if either is focused.
    const rectDimId = (activeField === 'width' || activeField === 'height') ? activeField : 'rect';
    const dimS = drawDim(xRight, yRectTop, xRight, yRectBot, `${params.width || 500}x${params.height || 500}`, 'right', null, rectDimId, activeField);
    
    // Length Dimension - Bottom
    const yDimBot = Math.max(yRoundBot, yRectBot);
    const dimL = drawDim(xLeft, yDimBot, xRight, yDimBot, `L=${params.length || 300}`, 'bottom', 40, 'length', activeField);
    
    // Offset H Dimension (Right Side, between centerlines)
    let dimH = "";
    if (Math.abs(V_OFFSET) > 10) {
        // Draw dimension further out right
        const xDimH = xRight + 140; // Increased from 80 to avoid overlap with Rect dim (offset ~65)
        dimH = drawDim(xDimH, cy, xDimH, cyRect, `H=${realH}`, 'right', 0, 'offset', activeField);
        // Extension lines for H
        dimH += `<line x1="${xLeft}" y1="${cy}" x2="${xDimH}" y2="${cy}" class="center-line" stroke-opacity="0.5" />`; // Extend Round Center
        dimH += `<line x1="${xRight}" y1="${cyRect}" x2="${xDimH}" y2="${cyRect}" class="center-line" stroke-opacity="0.5" />`; // Extend Rect Center
    }

    // Remarks
    let remark1 = "";
    if (params.flangeRemark1) {
        // Point to top of left flange (Round), Text Above Line
        remark1 = drawAnnotation(xLeft, yRoundTop, params.flangeRemark1, true, false, 80, false).svg;
    }
    
    let remark2 = "";
    if (params.flangeRemark2) {
        // Point to bottom of right flange (Rect), Leader goes down to avoid top clipping
        remark2 = drawAnnotation(xRight, yRectBot, params.flangeRemark2, false, true, 80, false).svg;
    }

    return createSvg(path + centerRound + centerRect + centerConnect + crease + f1 + f2 + dimD + dimS + dimL + dimH + remark1 + remark2, VIEW_WIDTH, VIEW_HEIGHT);
};
