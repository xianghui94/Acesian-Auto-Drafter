import { DuctParams } from "../../types";
import { createSvg, drawDim, drawFlange, drawAnnotation, VIEW_BOX_SIZE } from "../svgUtils";

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
    // We maintain a ratio between tap and main to show curvature correctly
    let ratio = tapD / mainD;
    // visual tap width
    const V_TAP_W = Math.min(V_TAP_W_MAX, 250); 
    // visual main radius based on ratio
    const V_MAIN_R = V_TAP_W / (2 * ratio);
    
    // Clamp Main R so it doesn't look like a straight line or too small
    const V_R_DRAW = Math.max(150, Math.min(V_MAIN_R, 1200));

    // Height of tap
    const V_COLLAR_H = 80; 

    // Coordinates
    // The saddle sits on top of the arc. 
    // Arc Center (cx, yArcCenter)
    // We want the "top" of the arc to be at roughly cy + 50
    const yArcTop = cy + 50;
    const yArcCenter = yArcTop + V_R_DRAW;
    
    const xTapL = cx - V_TAP_W/2;
    const xTapR = cx + V_TAP_W/2;
    const yTapTop = yArcTop - V_COLLAR_H;

    // Calculate intersection points of Tap vertical lines with the Arc
    // circle equation: (x-cx)^2 + (y-yArcCenter)^2 = R^2
    // y = yArcCenter - sqrt(R^2 - (x-cx)^2)
    const dyIntersect = Math.sqrt(V_R_DRAW*V_R_DRAW - (V_TAP_W/2)*(V_TAP_W/2));
    const yIntersect = yArcCenter - dyIntersect;
    
    // Draw Tap Body
    const tapBody = `
        M${xTapL},${yTapTop} 
        L${xTapL},${yIntersect}
        M${xTapR},${yTapTop}
        L${xTapR},${yIntersect}
    `;

    // Draw Main Duct Arc (The Saddle Base)
    // We draw an arc slightly wider than the tap
    const V_SADDLE_W = V_TAP_W * 1.5;
    const dySaddle = Math.sqrt(V_R_DRAW*V_R_DRAW - (V_SADDLE_W/2)*(V_SADDLE_W/2));
    const ySaddle = yArcCenter - dySaddle;
    
    const startX = cx - V_SADDLE_W/2;
    const endX = cx + V_SADDLE_W/2;

    const arcPath = `
        M${startX},${ySaddle}
        A${V_R_DRAW},${V_R_DRAW} 0 0,1 ${endX},${ySaddle}
    `;
    
    // Flange on top of tap
    const f1 = drawFlange(cx, yTapTop, V_TAP_W, false); // horizontal flange

    // Weld / Skirt line at intersection
    // Visualize the saddle plate extending slightly
    const skirtW = V_TAP_W + 20;
    const dySkirt = Math.sqrt(V_R_DRAW*V_R_DRAW - (skirtW/2)*(skirtW/2));
    const ySkirt = yArcCenter - dySkirt;
    
    const skirtPath = `
        M${cx - skirtW/2},${ySkirt}
        A${V_R_DRAW},${V_R_DRAW} 0 0,1 ${cx + skirtW/2},${ySkirt}
    `;
    
    // Connect skirt to tap (Fillet)
    const fillet = `
        <line x1="${xTapL}" y1="${yIntersect}" x2="${cx - skirtW/2}" y2="${ySkirt}" class="line" />
        <line x1="${xTapR}" y1="${yIntersect}" x2="${cx + skirtW/2}" y2="${ySkirt}" class="line" />
    `;

    // Dimensions
    // 1. Tap Diameter (Top)
    const dimTap = drawDim(xTapL, yTapTop - 20, xTapR, yTapTop - 20, `Ø${tapD}`, 'top', 0, 'd2', activeField);
    
    // 2. Collar Length (Side)
    const dimLen = drawDim(xTapR, yTapTop, xTapR, yIntersect, `${collarL}`, 'right', 40, 'length', activeField);
    
    // 3. Main Diameter (Below)
    // We define points on the arc to dimension
    const dimMain = drawDim(startX, ySaddle + 20, endX, ySaddle + 20, `Ø${mainD}`, 'bottom', 20, 'd1', activeField);

    // Center Line
    const centerLine = `<line x1="${cx}" y1="${yTapTop - 20}" x2="${cx}" y2="${ySaddle + 40}" class="center-line" />`;

    // Remarks
    let remark1 = "";
    if (params.flangeRemark1) {
        remark1 = drawAnnotation(xTapL, yTapTop, params.flangeRemark1, true, false, 60, false).svg;
    }

    const svgContent = `
        <path d="${arcPath}" class="line" fill="none" />
        <path d="${tapBody}" class="line" fill="none" />
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