import { DuctParams } from "../../types";
import { createSvg, drawDim, drawFlange, VIEW_BOX_SIZE } from "../svgUtils";

export const generateMultibladeDamper = (params: DuctParams, activeField: string | null = null) => {
    const VIEW_WIDTH = VIEW_BOX_SIZE;
    const VIEW_HEIGHT = 500; // Reduced from 800
    const cy = VIEW_HEIGHT / 2;

    const cxLeft = 250; // Spaced out better (was 130)
    const cxRight = 550; // Spaced out better (was 360)
    
    const realL = params.length || 400; 
    const V_HEIGHT = 225; 
    const V_WIDTH = 110;   
    const seg1 = V_WIDTH * 0.25;
    const seg2 = V_WIDTH * 0.50;
    const seg3 = V_WIDTH * 0.25;
    
    // Left View (Side View)
    const xL = cxLeft - V_WIDTH/2;
    const xR = cxLeft + V_WIDTH/2;
    const yT = cy - V_HEIGHT/2;
    const yB = cy + V_HEIGHT/2;
    const xM1 = xL + seg1;
    const xM2 = xM1 + seg2;

    const rect = `<rect x="${xL}" y="${yT}" width="${V_WIDTH}" height="${V_HEIGHT}" class="line" />`;
    const dividers = `
        <line x1="${xM1}" y1="${yT}" x2="${xM1}" y2="${yB}" class="line" stroke-width="1" />
        <line x1="${xM2}" y1="${yT}" x2="${xM2}" y2="${yB}" class="line" stroke-width="1" />
    `;
    const flanges = drawFlange(xL, cy, V_HEIGHT, true) + drawFlange(xR, cy, V_HEIGHT, true);
    
    // Handle/Actuator Side View
    const actuatorSide = `
        <rect x="${cxLeft - 10}" y="${cy - 10}" width="${20}" height="${20}" fill="#ddd" stroke="black" />
        <line x1="${cxLeft}" y1="${cy}" x2="${cxLeft + 40}" y2="${cy + 10}" stroke="black" stroke-width="3" />
        <circle cx="${cxLeft + 40}" cy="${cy + 10}" r="6" fill="black" />
    `;
    
    // Dimensions Side View
    const dimL = drawDim(xL, yT, xR, yT, `L=${realL}`, 'top', null, 'length', activeField);
    
    // Right View (Front View)
    const rOuter = (V_HEIGHT/2) + 12;
    const boxSize = V_HEIGHT + 35;
    const dashedBox = `<rect x="${cxRight - boxSize/2}" y="${cy - boxSize/2}" width="${boxSize}" height="${boxSize}" class="hidden-line" />`;
    const circle = `<circle cx="${cxRight}" cy="${cy}" r="${V_HEIGHT/2}" class="line" />`;
    const cFlange = `<circle cx="${cxRight}" cy="${cy}" r="${rOuter}" class="flange" fill="none" />`;
    const rBolt = rOuter - 6;
    const bolts = `
        <circle cx="${cxRight}" cy="${cy - rBolt}" r="3" fill="black" />
        <circle cx="${cxRight}" cy="${cy + rBolt}" r="3" fill="black" />
        <circle cx="${cxRight - rBolt}" cy="${cy}" r="3" fill="black" />
        <circle cx="${cxRight + rBolt}" cy="${cy}" r="3" fill="black" />
    `;
    const numBlades = 6;
    let blades = "";
    const step = V_HEIGHT / numBlades;
    for(let i=1; i<numBlades; i++) {
        const y = (cy - V_HEIGHT/2) + i*step;
        const dy = Math.abs(y - cy);
        const R = V_HEIGHT/2;
        const dx = Math.sqrt(R*R - dy*dy);
        blades += `<line x1="${cxRight - dx}" y1="${y}" x2="${cxRight + dx}" y2="${y}" class="line" stroke-width="1" />`;
    }
    const actX = cxRight + boxSize/2; 
    const actuatorFront = `
        <rect x="${actX}" y="${cy - 20}" width="${25}" height="${40}" fill="#ddd" stroke="black" />
        <line x1="${actX + 25}" y1="${cy}" x2="${actX + 45}" y2="${cy}" stroke="black" stroke-width="3" />
        <line x1="${actX + 35}" y1="${cy}" x2="${actX + 55}" y2="${cy}" stroke="black" stroke-width="3" /> 
        <rect x="${actX+35}" y="${cy-20}" width="4" height="40" fill="black" /> 
    `;
    const dimD = drawDim(cxRight + boxSize/2 + 5, cy - V_HEIGHT/2, cxRight + boxSize/2 + 5, cy + V_HEIGHT/2, `Ø${params.d1}`, 'right', null, 'd1', activeField);

    return createSvg(
        dashedBox + cFlange + circle + bolts + blades + actuatorFront + dimD + rect + dividers + flanges + actuatorSide + dimL,
        VIEW_WIDTH, VIEW_HEIGHT
    );
};