import { DuctParams } from "../../types";
import { createSvg, drawDim, VIEW_BOX_SIZE } from "../svgUtils";

export const generateAngleFlange = (params: DuctParams, activeField: string | null = null) => {
    const VIEW_WIDTH = VIEW_BOX_SIZE;
    const VIEW_HEIGHT = 500; // Reduced from 800
    const cx = VIEW_WIDTH / 2;
    const cy = VIEW_HEIGHT / 2;
    
    const d1 = params.d1 || 800;
    
    // Visual Proportions
    const V_OD = 300;
    const V_ID = 240;
    const V_PCD = 270;
    
    // Flange Body (Concentric Circles)
    const odCircle = `<circle cx="${cx}" cy="${cy}" r="${V_OD/2}" class="line" fill="none" />`;
    const idCircle = `<circle cx="${cx}" cy="${cy}" r="${V_ID/2}" class="line" fill="none" />`;
    const pcdCircle = `<circle cx="${cx}" cy="${cy}" r="${V_PCD/2}" class="phantom-line" />`;
    
    // Crosshair Center Lines
    const cLen = V_OD/2 + 30;
    const centerLines = `
        <line x1="${cx - cLen}" y1="${cy}" x2="${cx + cLen}" y2="${cy}" class="center-line" />
        <line x1="${cx}" y1="${cy - cLen}" x2="${cx}" y2="${cy + cLen}" class="center-line" />
    `;
    
    // Bolt Holes
    const numBolts = 20;
    let holes = "";
    for(let i=0; i<numBolts; i++) {
        const rad = (i * (360/numBolts)) * Math.PI / 180;
        const bx = cx + (V_PCD/2) * Math.cos(rad);
        const by = cy + (V_PCD/2) * Math.sin(rad);
        
        holes += `<circle cx="${bx}" cy="${by}" r="2" fill="none" stroke="black" stroke-width="1.5" />`;
    }
    
    // Dimension Pattern
    // Dimension takes from inner circle (ID) and moves further up to avoid overlap with OD.
    // V_OD radius is 150. Offset needs to be > 150.
    const dimOffset = 180;
    const dim = drawDim(cx - V_ID/2, cy, cx + V_ID/2, cy, `Ø${d1}`, 'top', dimOffset, 'd1', activeField);

    return createSvg(odCircle + idCircle + pcdCircle + centerLines + holes + dim, VIEW_WIDTH, VIEW_HEIGHT);
};