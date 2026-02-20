
import { DuctParams } from "../../types";
import { createSvg, drawDim, drawFlange, drawAnnotation, VIEW_BOX_SIZE, V_CONSTANTS } from "../svgUtils";
import { calculateRadialBranchPath } from "../geometry/branchMath";

export const generateSaddle = (params: DuctParams, activeField: string | null = null) => {
    const VIEW_WIDTH = VIEW_BOX_SIZE;
    const VIEW_HEIGHT = 500;
    const cx = VIEW_WIDTH / 2;
    const cy = VIEW_HEIGHT / 2;
    
    const mainD = params.d1 || 1000;
    const tapD = params.d2 || 450;
    const collarL = params.length || 100;

    // SCHEMATIC CLAMPING
    // Limit visual sizes
    const V_TAP_W = Math.min(tapD, 250); 
    
    // Main D usually large. Clamp visual radius.
    // Ensure V_MAIN_R > V_TAP_W/2 to avoid math error
    let V_R_DRAW = Math.min(mainD/2, 600);
    if (V_R_DRAW < V_TAP_W/2 + 20) {
        V_R_DRAW = V_TAP_W/2 + 50; 
    }

    const V_COLLAR_H = Math.min(collarL, 100); 
    
    const yArcTop = cy + 50; 
    const yCenterMain = yArcTop + V_R_DRAW;
    
    const geo = calculateRadialBranchPath(cx, yCenterMain, V_R_DRAW, V_TAP_W/2, 0, V_COLLAR_H, false);

    const V_SADDLE_W = V_TAP_W * 1.5;
    const dySaddle = Math.sqrt(V_R_DRAW*V_R_DRAW - (V_SADDLE_W/2)*(V_SADDLE_W/2));
    const ySaddle = yCenterMain - dySaddle;
    
    const startX = cx - V_SADDLE_W/2;
    const endX = cx + V_SADDLE_W/2;

    const arcPath = `
        M${startX},${ySaddle}
        A${V_R_DRAW},${V_R_DRAW} 0 0,1 ${endX},${ySaddle}
    `;
    
    const f1 = drawFlange(geo.endPoint.x, geo.endPoint.y, V_TAP_W, false);

    const skirtW = V_TAP_W + 20;
    const dySkirt = Math.sqrt(V_R_DRAW*V_R_DRAW - (skirtW/2)*(skirtW/2));
    const ySkirt = yCenterMain - dySkirt;
    
    const skirtPath = `
        M${cx - skirtW/2},${ySkirt}
        A${V_R_DRAW},${V_R_DRAW} 0 0,1 ${cx + skirtW/2},${ySkirt}
    `;
    
    const dyIntersect = Math.sqrt(V_R_DRAW*V_R_DRAW - (V_TAP_W/2)*(V_TAP_W/2));
    const yIntersect = yCenterMain - dyIntersect;
    
    const fillet = `
        <line x1="${cx - V_TAP_W/2}" y1="${yIntersect}" x2="${cx - skirtW/2}" y2="${ySkirt}" class="line" />
        <line x1="${cx + V_TAP_W/2}" y1="${yIntersect}" x2="${cx + skirtW/2}" y2="${ySkirt}" class="line" />
    `;

    const dimTap = drawDim(cx - V_TAP_W/2, geo.endPoint.y - 20, cx + V_TAP_W/2, geo.endPoint.y - 20, `Ø${tapD}`, 'top', 0, 'd2', activeField);
    const dimLen = drawDim(cx + V_TAP_W/2, geo.endPoint.y, cx + V_TAP_W/2, yIntersect, `${collarL}`, 'right', 40, 'length', activeField);
    const dimMain = drawDim(startX, ySaddle + 20, endX, ySaddle + 20, `Ø${mainD}`, 'bottom', 20, 'd1', activeField);

    const centerLine = `<line x1="${cx}" y1="${geo.endPoint.y - 20}" x2="${cx}" y2="${ySaddle + 40}" class="center-line" />`;

    let remark1 = "";
    if (params.flangeRemark1) {
        remark1 = drawAnnotation(cx - V_TAP_W/2, geo.endPoint.y, params.flangeRemark1, true, false, 60, false).svg;
    }

    const svgContent = `
        <path d="${arcPath}" class="line" fill="none" />
        <path d="${geo.path}" class="line" fill="none" />
        <path d="${skirtPath}" class="line" fill="none" />
        ${fillet}
        ${f1}
        ${centerLine}
        ${dimTap}
        ${dimLen}
        ${dimMain}
        ${remark1}
    `;

    return createSvg(svgContent, VIEW_WIDTH, VIEW_HEIGHT);
};
