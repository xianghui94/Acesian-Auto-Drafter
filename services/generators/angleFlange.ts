import { DuctParams } from "../../types";
import { createSvg, drawDim, drawAnnotation, VIEW_BOX_SIZE } from "../svgUtils";
import { getFlangeParams } from "../flangeStandards";

export const generateAngleFlange = (params: DuctParams, activeField: string | null = null) => {
    const VIEW_WIDTH = VIEW_BOX_SIZE;
    const VIEW_HEIGHT = 450; // Reduced to fit layout better
    const cx = VIEW_WIDTH / 2;
    const cy = VIEW_HEIGHT / 2;
    
    const d1 = params.d1 || 800;
    
    // Standard lookup
    const std = getFlangeParams(d1);
    const realPCD = params.pcd !== undefined ? params.pcd : std.bcd;
    const numBolts = params.holeCount !== undefined ? params.holeCount : std.holeCount;

    // Detect Manual Override
    const isManual = (params.pcd !== undefined && params.pcd !== std.bcd) || 
                     (params.holeCount !== undefined && params.holeCount !== std.holeCount);

    // Scale logic
    const theoreticalOD = realPCD + 40; 
    const targetSize = 320; // Reduce scale target to fit dimensions in 450px height
    const scale = targetSize / theoreticalOD;

    const V_R_ID = (d1 / 2) * scale;
    const V_R_PCD = (realPCD / 2) * scale;
    const V_R_OD = V_R_PCD + 15; 

    // Flange Body (Concentric Circles)
    const odCircle = `<circle cx="${cx}" cy="${cy}" r="${V_R_OD}" class="line" fill="none" />`;
    const idCircle = `<circle cx="${cx}" cy="${cy}" r="${V_R_ID}" class="line" fill="none" />`;
    const pcdCircle = `<circle cx="${cx}" cy="${cy}" r="${V_R_PCD}" class="phantom-line" />`;
    
    // Crosshair Center Lines
    const cLen = V_R_OD + 30;
    const centerLines = `
        <line x1="${cx - cLen}" y1="${cy}" x2="${cx + cLen}" y2="${cy}" class="center-line" />
        <line x1="${cx}" y1="${cy - cLen}" x2="${cx}" y2="${cy + cLen}" class="center-line" />
    `;
    
    // Bolt Holes & Annotation
    let holes = "";
    let annotation = "";
    const targetHoleIdx = Math.round(numBolts / 4); // Target hole at ~90deg (3 o'clock)
    
    for(let i=0; i<numBolts; i++) {
        // Start from -90 (Top)
        const rad = (i * (360/numBolts) - 90) * Math.PI / 180;
        const bx = cx + V_R_PCD * Math.cos(rad);
        const by = cy + V_R_PCD * Math.sin(rad);
        
        holes += `<circle cx="${bx}" cy="${by}" r="2.5" fill="none" stroke="black" stroke-width="1.5" />`;
        
        // Point to the target hole (Right side) if manual override exists
        if (isManual && i === targetHoleIdx) {
            // Leader goes Down-Right to avoid Top Dimension collision
            annotation = drawAnnotation(bx, by, `P.C.D: ${realPCD}\n${numBolts} HOLES`, false, true, 45, false).svg;
        }
    }
    
    // Dimension Pattern
    const dimOffset = V_R_OD + 25;
    const dim = drawDim(cx - V_R_ID, cy, cx + V_R_ID, cy, `Ø${d1}`, 'top', dimOffset, 'd1', activeField);

    return createSvg(odCircle + idCircle + pcdCircle + centerLines + holes + dim + annotation, VIEW_WIDTH, VIEW_HEIGHT);
};