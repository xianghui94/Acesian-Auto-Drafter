
import { DuctParams } from "../../types";
import { createSvg, drawDim, drawFlange, drawAnnotation, VIEW_BOX_SIZE, V_CONSTANTS } from "../svgUtils";

const { TRANS_TAN: V_TRANS_TAN } = V_CONSTANTS;

export const generateTransformation = (params: DuctParams, activeField: string | null = null) => {
    const VIEW_WIDTH = VIEW_BOX_SIZE;
    const VIEW_HEIGHT = 500;
    const cx = VIEW_WIDTH / 2;
    const cy = VIEW_HEIGHT / 2;
    
    const realD = params.d1 || 500;
    const realS = params.height || 500; 
    const realL = params.length || 300;
    const realH = params.offset || 0; 

    // SCHEMATIC CLAMPING
    const V_D = Math.min(realD, V_CONSTANTS.MAX_DIAM);
    const V_S = Math.min(realS, V_CONSTANTS.MAX_DIAM);
    const V_L = Math.min(realL, V_CONSTANTS.MAX_LEN);

    // Visual Offset H
    const V_OFFSET = Math.max(-100, Math.min(100, (realH / Math.max(realD, realS)) * 100)); 

    const L = V_L;
    const T = V_TRANS_TAN;
    const xLeft = cx - L/2;
    const xRight = cx + L/2;
    const xT1 = xLeft + T;
    const xT2 = xRight - T;
    
    const yRoundTop = cy - V_D/2;
    const yRoundBot = cy + V_D/2;
    
    const cyRect = cy - V_OFFSET;
    const yRectTop = cyRect - V_S/2;
    const yRectBot = cyRect + V_S/2;
    
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
    
    const centerRound = `<line x1="${xLeft}" y1="${cy}" x2="${xT1 + 20}" y2="${cy}" class="center-line" />`;
    const centerRect = `<line x1="${xT2 - 20}" y1="${cyRect}" x2="${xRight}" y2="${cyRect}" class="center-line" />`;
    const centerConnect = `<line x1="${xT1}" y1="${cy}" x2="${xT2}" y2="${cyRect}" class="phantom-line" />`;

    const path = `<path d="${contour}" class="line" />`;
    const f1 = drawFlange(xLeft, cy, V_D, true);
    const f2 = drawFlange(xRight, cyRect, V_S, true);

    const dimD = drawDim(xLeft, yRoundTop, xLeft, yRoundBot, `Ø${params.d1 || 500}`, 'left', null, 'd1', activeField);
    
    const rectDimId = (activeField === 'width' || activeField === 'height') ? activeField : 'rect';
    const dimS = drawDim(xRight, yRectTop, xRight, yRectBot, `${params.width || 500}x${params.height || 500}`, 'right', null, rectDimId, activeField);
    
    const yDimBot = Math.max(yRoundBot, yRectBot);
    const dimL = drawDim(xLeft, yDimBot, xRight, yDimBot, `L=${params.length || 300}`, 'bottom', 40, 'length', activeField);
    
    let dimH = "";
    if (realH !== 0) { // Always show H dim if not 0
        const xDimH = xRight + 140; 
        dimH = drawDim(xDimH, cy, xDimH, cyRect, `H=${realH}`, 'right', 0, 'offset', activeField);
        dimH += `<line x1="${xLeft}" y1="${cy}" x2="${xDimH}" y2="${cy}" class="center-line" stroke-opacity="0.5" />`; 
        dimH += `<line x1="${xRight}" y1="${cyRect}" x2="${xDimH}" y2="${cyRect}" class="center-line" stroke-opacity="0.5" />`; 
    }

    let remark1 = "";
    if (params.flangeRemark1) {
        remark1 = drawAnnotation(xLeft, yRoundTop, params.flangeRemark1, true, false, 80, false).svg;
    }
    
    let remark2 = "";
    if (params.flangeRemark2) {
        remark2 = drawAnnotation(xRight, yRectBot, params.flangeRemark2, false, true, 80, false).svg;
    }

    return createSvg(path + centerRound + centerRect + centerConnect + crease + f1 + f2 + dimD + dimS + dimL + dimH + remark1 + remark2, VIEW_WIDTH, VIEW_HEIGHT);
};
