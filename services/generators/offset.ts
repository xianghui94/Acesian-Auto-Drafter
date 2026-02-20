
import { DuctParams } from "../../types";
import { createSvg, drawDim, drawFlange, drawAnnotation, VIEW_BOX_SIZE, V_CONSTANTS } from "../svgUtils";

export const generateOffset = (params: DuctParams, activeField: string | null = null) => {
    const VIEW_WIDTH = VIEW_BOX_SIZE;
    const VIEW_HEIGHT = 500;
    const cx = VIEW_WIDTH / 2;
    const cy = VIEW_HEIGHT / 2;
    
    const realD1 = params.d1 || 500;
    const realD2 = params.d2 !== undefined ? params.d2 : realD1;
    const realL = params.length || 800;
    const realH = params.offset || 200;

    // SCHEMATIC CLAMPING & DELTA
    const V_LEN = Math.min(realL, V_CONSTANTS.MAX_LEN);
    
    // Proportional Scaling with Min Step
    const maxReal = Math.max(realD1, realD2);
    let V_DIAM1 = (realD1 / maxReal) * V_CONSTANTS.MAX_DIAM;
    let V_DIAM2 = (realD2 / maxReal) * V_CONSTANTS.MAX_DIAM;
    
    const MIN_VISUAL_STEP = 30;
    if (realD1 !== realD2 && Math.abs(V_DIAM1 - V_DIAM2) < MIN_VISUAL_STEP) {
        if (realD1 > realD2) {
            V_DIAM2 = V_DIAM1 - MIN_VISUAL_STEP;
        } else {
            V_DIAM1 = V_DIAM2 - MIN_VISUAL_STEP;
        }
    }

    // Scale Visual Offset
    const V_OFF = Math.max(-150, Math.min(150, (realH / realD1) * 100)); 
    
    const cx1 = cx - V_LEN/2;
    const cy1 = cy + V_OFF/2; 
    
    const cx2 = cx + V_LEN/2;
    const cy2 = cy - V_OFF/2; 
    
    const R1 = V_DIAM1 / 2;
    const R2 = V_DIAM2 / 2;
    
    const stubLen = 40; 
    
    // Left Stub
    const xL_Start = cx1;
    const xL_Stub = cx1 + stubLen;
    const yL_Top = cy1 - R1;
    const yL_Bot = cy1 + R1;
    
    // Right Stub
    const xR_End = cx2;
    const xR_Stub = cx2 - stubLen;
    const yR_Top = cy2 - R2;
    const yR_Bot = cy2 + R2;
    
    const bodyPath = `
        M${xL_Start},${yL_Top} 
        L${xL_Stub},${yL_Top} 
        L${xR_Stub},${yR_Top} 
        L${xR_End},${yR_Top} 
        L${xR_End},${yR_Bot}
        L${xR_Stub},${yR_Bot}
        L${xL_Stub},${yL_Bot}
        L${xL_Start},${yL_Bot}
        Z
    `;
    
    const creases = `
        <line x1="${xL_Stub}" y1="${yL_Top}" x2="${xL_Stub}" y2="${yL_Bot}" class="line" stroke-width="1" />
        <line x1="${xR_Stub}" y1="${yR_Top}" x2="${xR_Stub}" y2="${yR_Bot}" class="line" stroke-width="1" />
    `;
    
    const centerLinePath = `M${xL_Start},${cy1} L${xL_Stub},${cy1} L${xR_Stub},${cy2} L${xR_End},${cy2}`;
    const cLineSvg = `<path d="${centerLinePath}" class="phantom-line" />`;
    
    const f1 = drawFlange(xL_Start, cy1, V_DIAM1, true);
    const f2 = drawFlange(xR_End, cy2, V_DIAM2, true);
    
    let remark1 = "";
    if (params.flangeRemark1) {
        remark1 = drawAnnotation(xL_Start, yL_Top, params.flangeRemark1, true, false, 80, false).svg;
    }
    
    let remark2 = "";
    if (params.flangeRemark2) {
        remark2 = drawAnnotation(xR_End, yR_Top, params.flangeRemark2, true, true, 80, false).svg;
    }
    
    // Dimensions
    const yTopMost = Math.min(yL_Top, yR_Top);
    const dimL = drawDim(xL_Start, yTopMost, xR_End, yTopMost, `L=${realL}`, 'top', 40, 'length', activeField);
    
    const dimD1 = drawDim(xL_Start - 10, yL_Top, xL_Start - 10, yL_Bot, `Ø${realD1}`, 'left', null, 'd1', activeField);
    const dimD2 = drawDim(xR_End + 10, yR_Top, xR_End + 10, yR_Bot, `Ø${realD2}`, 'right', null, 'd2', activeField);
    
    const dimOffH = 140; 
    let dimH = "";
    if (Math.abs(realH) > 0) { // Always show H if non-zero, even if visual offset is small
        dimH = drawDim(xR_End, cy1, xR_End, cy2, `H=${realH}`, 'right', dimOffH, 'offset', activeField);
    }
    
    const axisLower = `<line x1="${xL_Start}" y1="${cy1}" x2="${xR_End + dimOffH}" y2="${cy1}" class="center-line" />`;
    const axisUpper = `<line x1="${xR_End}" y1="${cy2}" x2="${xR_End + dimOffH}" y2="${cy2}" class="center-line" />`;

    return createSvg(
        `<path d="${bodyPath}" class="line" />` + 
        creases + cLineSvg + f1 + f2 + axisLower + axisUpper + dimL + dimD1 + dimD2 + dimH + remark1 + remark2,
        VIEW_WIDTH, VIEW_HEIGHT
    );
};
