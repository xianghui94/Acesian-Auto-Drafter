import { DuctParams } from "../../types";
import { createSvg, drawDim, drawFlange, drawAnnotation, VIEW_BOX_SIZE } from "../svgUtils";

export const generateOffset = (params: DuctParams, activeField: string | null = null) => {
    const VIEW_WIDTH = VIEW_BOX_SIZE;
    const VIEW_HEIGHT = 500; // Reduced from 800
    const cx = VIEW_WIDTH / 2;
    const cy = VIEW_HEIGHT / 2;
    
    const realD = params.d1 || 500;
    const realL = params.length || 800;
    const realH = params.offset || 200;

    // Visual Scales
    const V_LEN = 300;
    const V_DIAM = 120;
    const V_OFF = 100; // Visual height offset
    
    // Calculate coordinates
    // Center point left duct (Lower/Bottom-Left)
    const cx1 = cx - V_LEN/2;
    const cy1 = cy + V_OFF/2; 
    
    // Center point right duct (Higher/Top-Right)
    const cx2 = cx + V_LEN/2;
    const cy2 = cy - V_OFF/2; 
    
    const R = V_DIAM / 2;
    
    const stubLen = 40; // Straight sections before bend
    
    // Left Stub
    const xL_Start = cx1;
    const xL_Stub = cx1 + stubLen;
    const yL_Top = cy1 - R;
    const yL_Bot = cy1 + R;
    
    // Right Stub
    const xR_End = cx2;
    const xR_Stub = cx2 - stubLen;
    const yR_Top = cy2 - R;
    const yR_Bot = cy2 + R;
    
    // Path geometry
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
    
    // Crease lines
    const creases = `
        <line x1="${xL_Stub}" y1="${yL_Top}" x2="${xL_Stub}" y2="${yL_Bot}" class="line" stroke-width="1" />
        <line x1="${xR_Stub}" y1="${yR_Top}" x2="${xR_Stub}" y2="${yR_Bot}" class="line" stroke-width="1" />
    `;
    
    // Center Line (Internal)
    const centerLinePath = `M${xL_Start},${cy1} L${xL_Stub},${cy1} L${xR_Stub},${cy2} L${xR_End},${cy2}`;
    const cLineSvg = `<path d="${centerLinePath}" class="phantom-line" />`;
    
    // Flanges
    const f1 = drawFlange(xL_Start, cy1, V_DIAM, true);
    const f2 = drawFlange(xR_End, cy2, V_DIAM, true);
    
    // Remarks
    let remark1 = "";
    if (params.flangeRemark1) {
        // Point to top of left flange
        remark1 = drawAnnotation(xL_Start, yL_Top, params.flangeRemark1, true, false, 80, false).svg;
    }
    
    let remark2 = "";
    if (params.flangeRemark2) {
        // Point to top of right flange
        remark2 = drawAnnotation(xR_End, yR_Top, params.flangeRemark2, true, true, 80, false).svg;
    }
    
    // --- Dimensions ---
    
    // 1. Length L (Top)
    const dimL_Y_Target = yR_Top - 40;
    const offsetL = yL_Top - dimL_Y_Target;
    const dimL = drawDim(xL_Start, yL_Top, xR_End, yR_Top, `L=${realL}`, 'top', offsetL, 'length', activeField);
    
    // 2. Diameter (Left)
    const dimD = drawDim(xL_Start - 10, yL_Top, xL_Start - 10, yL_Bot, `Ø${realD}`, 'left', null, 'd1', activeField);
    
    // 3. Offset H (Right side, Center-to-Center)
    const dimOffH = 60;
    const dimH = drawDim(xR_End, cy1, xR_End, cy2, `H=${realH}`, 'right', dimOffH, 'offset', activeField);
    
    // Extended Axis Lines for H dimension
    // Lower Axis: Extends from the Left Start to the dimension line on the right
    // This visualizes the reference plane of the lower duct
    const axisLower = `<line x1="${xL_Start}" y1="${cy1}" x2="${xR_End + dimOffH}" y2="${cy1}" class="center-line" />`;
    
    // Upper Axis: Extends from Right End to dimension line
    const axisUpper = `<line x1="${xR_End}" y1="${cy2}" x2="${xR_End + dimOffH}" y2="${cy2}" class="center-line" />`;

    return createSvg(
        `<path d="${bodyPath}" class="line" />` + 
        creases + cLineSvg + f1 + f2 + axisLower + axisUpper + dimL + dimD + dimH + remark1 + remark2,
        VIEW_WIDTH, VIEW_HEIGHT
    );
};