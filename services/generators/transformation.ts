import { DuctParams } from "../../types";
import { createSvg, drawDim, drawFlange, drawAnnotation, VIEW_BOX_SIZE, V_CONSTANTS } from "../svgUtils";

const { TRANS_LEN: V_TRANS_LEN, TRANS_TAN: V_TRANS_TAN } = V_CONSTANTS;

export const generateTransformation = (params: DuctParams) => {
    const cx = VIEW_BOX_SIZE / 2;
    const cy = VIEW_BOX_SIZE / 2;
    const realD = params.d1 || 500;
    const realS = params.height || 500; 
    const BASE_MAX = 200; 
    let D, S;
    if (realD >= realS) {
        D = BASE_MAX; S = BASE_MAX * (realS / realD);
    } else {
        S = BASE_MAX; D = BASE_MAX * (realD / realS);
    }
    D = Math.max(D, 80); S = Math.max(S, 80);
    const L = V_TRANS_LEN;
    const T = V_TRANS_TAN;
    const xLeft = cx - L/2;
    const xRight = cx + L/2;
    const xT1 = xLeft + T;
    const xT2 = xRight - T;
    const yRoundTop = cy - D/2;
    const yRoundBot = cy + D/2;
    const yRectTop = cy - S/2;
    const yRectBot = cy + S/2;
    
    const contour = `
        M${xLeft},${yRoundTop} L${xT1},${yRoundTop} L${xT2},${yRectTop} L${xRight},${yRectTop}
        M${xRight},${yRectBot} L${xT2},${yRectBot} L${xT1},${yRoundBot} L${xLeft},${yRoundBot}
        M${xLeft},${yRoundTop} L${xLeft},${yRoundBot}
        M${xRight},${yRectTop} L${xRight},${yRectBot}
    `;
    const center = `<line x1="${xLeft}" y1="${cy}" x2="${xRight}" y2="${cy}" class="center-line" />`;
    const crease = `
        <line x1="${xT1}" y1="${cy}" x2="${xT2}" y2="${yRectTop}" stroke="black" stroke-width="1" />
        <line x1="${xT1}" y1="${cy}" x2="${xT2}" y2="${yRectBot}" stroke="black" stroke-width="1" />
    `;
    const path = `<path d="${contour}" class="line" />`;
    const f1 = drawFlange(xLeft, cy, D, true);
    const f2 = drawFlange(xRight, cy, S, true);
    const dimD = drawDim(xLeft, yRoundTop, xLeft, yRoundBot, `Ø${params.d1 || 500}`, 'left');
    const dimS = drawDim(xRight, yRectTop, xRight, yRectBot, `${params.width || 500}x${params.height || 500}`, 'right');
    const dimL = drawDim(xLeft, yRectBot, xRight, yRectBot, `L=${params.length || 300}`, 'bottom');
    
    // Remarks
    let remark1 = "";
    if (params.flangeRemark1) {
        // Point to top of left flange (Round), Text Above Line
        remark1 = drawAnnotation(xLeft, yRoundTop, params.flangeRemark1, true, false, 80, false).svg;
    }
    
    let remark2 = "";
    if (params.flangeRemark2) {
        // Point to top of right flange (Rect), Text Above Line
        remark2 = drawAnnotation(xRight, yRectTop, params.flangeRemark2, true, true, 80, false).svg;
    }

    return createSvg(path + center + crease + f1 + f2 + dimD + dimS + dimL + remark1 + remark2);
};