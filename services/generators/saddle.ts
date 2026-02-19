
import { DuctParams } from "../../types";
import { createSvg, drawDim, drawFlange, drawAnnotation, VIEW_BOX_SIZE } from "../svgUtils";
import { calculateRadialBranchPath } from "../geometry/branchMath";

export const generateSaddle = (params: DuctParams, activeField: string | null = null) => {
    const VIEW_WIDTH = VIEW_BOX_SIZE;
    const VIEW_HEIGHT = 500;
    const cx = VIEW_WIDTH / 2;
    const cy = VIEW_HEIGHT / 2;
    
    // Inputs
    const mainD = params.d1 || 1000;
    const tapD = params.d2 || 450;
    const collarL = params.length || 100;

    // Visual Constants
    const V_MAIN_R_MAX = 600; // Visual radius for a flat-ish curve
    const V_TAP_W_MAX = 200;
    
    // Calculate visual dimensions
    let ratio = tapD / mainD;
    const V_TAP_W = Math.min(V_TAP_W_MAX, 250); 
    const V_MAIN_R = V_TAP_W / (2 * ratio);
    
    // Clamp Main R
    const V_R_DRAW = Math.max(150, Math.min(V_MAIN_R, 1200));

    // Calculate Geometry using shared engine
    // Saddle sits on TOP (angle 0)
    const V_COLLAR_H = 80; 
    
    // NOTE: The shared engine draws the branch relative to the CENTER of the main pipe.
    // For a saddle, we often only see the top arc of the main pipe, not the whole circle.
    // However, to ensure consistency, we can position the Main Pipe center far below the viewport
    // so that the top arc aligns where we want it.
    
    const yArcTop = cy + 50; 
    const yCenterMain = yArcTop + V_R_DRAW;
    
    const geo = calculateRadialBranchPath(cx, yCenterMain, V_R_DRAW, V_TAP_W/2, 0, V_COLLAR_H, false);

    // Draw Main Duct Arc (The Saddle Base)
    const V_SADDLE_W = V_TAP_W * 1.5;
    const dySaddle = Math.sqrt(V_R_DRAW*V_R_DRAW - (V_SADDLE_W/2)*(V_SADDLE_W/2));
    const ySaddle = yCenterMain - dySaddle;
    
    const startX = cx - V_SADDLE_W/2;
    const endX = cx + V_SADDLE_W/2;

    const arcPath = `
        M${startX},${ySaddle}
        A${V_R_DRAW},${V_R_DRAW} 0 0,1 ${endX},${ySaddle}
    `;
    
    // Flange on top of tap
    const f1 = drawFlange(geo.endPoint.x, geo.endPoint.y, V_TAP_W, false);

    // Skirt line at intersection
    const skirtW = V_TAP_W + 20;
    const dySkirt = Math.sqrt(V_R_DRAW*V_R_DRAW - (skirtW/2)*(skirtW/2));
    const ySkirt = yCenterMain - dySkirt;
    
    const skirtPath = `
        M${cx - skirtW/2},${ySkirt}
        A${V_R_DRAW},${V_R_DRAW} 0 0,1 ${cx + skirtW/2},${ySkirt}
    `;
    
    // Connect skirt to tap (Fillet)
    // The geo path contains points p1, p2, p3, p4. 
    // We need to know where the base of the tap connects to draw the fillet.
    // We can infer it from the tap width.
    const dyIntersect = Math.sqrt(V_R_DRAW*V_R_DRAW - (V_TAP_W/2)*(V_TAP_W/2));
    const yIntersect = yCenterMain - dyIntersect;
    
    const fillet = `
        <line x1="${cx - V_TAP_W/2}" y1="${yIntersect}" x2="${cx - skirtW/2}" y2="${ySkirt}" class="line" />
        <line x1="${cx + V_TAP_W/2}" y1="${yIntersect}" x2="${cx + skirtW/2}" y2="${ySkirt}" class="line" />
    `;

    // Dimensions
    const dimTap = drawDim(cx - V_TAP_W/2, geo.endPoint.y - 20, cx + V_TAP_W/2, geo.endPoint.y - 20, `Ø${tapD}`, 'top', 0, 'd2', activeField);
    
    // Collar Length
    const dimLen = drawDim(cx + V_TAP_W/2, geo.endPoint.y, cx + V_TAP_W/2, yIntersect, `${collarL}`, 'right', 40, 'length', activeField);
    
    // Main Diameter
    const dimMain = drawDim(startX, ySaddle + 20, endX, ySaddle + 20, `Ø${mainD}`, 'bottom', 20, 'd1', activeField);

    // Center Line
    const centerLine = `<line x1="${cx}" y1="${geo.endPoint.y - 20}" x2="${cx}" y2="${ySaddle + 40}" class="center-line" />`;

    // Remarks
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
