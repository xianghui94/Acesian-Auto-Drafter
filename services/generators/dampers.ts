import { DuctParams } from "../../types";
import { createSvg, drawDim, drawFlange, VIEW_BOX_SIZE, V_CONSTANTS } from "../svgUtils";

const { DIAM: V_DIAM } = V_CONSTANTS;

export const generateVolumeDamper = (params: DuctParams) => {
    const cy = VIEW_BOX_SIZE / 2 + 10; 
    const D = V_DIAM + 30; 
    const L = 150; 
    const cxFront = 120; 
    const cxSide = 350; 
    const rOuter = (D/2) + 12;
    
    const frontFlange = `<circle cx="${cxFront}" cy="${cy}" r="${rOuter}" class="line" fill="none" />`;
    const frontInner = `<circle cx="${cxFront}" cy="${cy}" r="${D/2}" class="line" />`;
    const rBolt = rOuter - 6;
    const bolts = `
        <circle cx="${cxFront}" cy="${cy - rBolt}" r="3" fill="black" />
        <circle cx="${cxFront}" cy="${cy + rBolt}" r="3" fill="black" />
        <circle cx="${cxFront - rBolt}" cy="${cy}" r="3" fill="black" />
        <circle cx="${cxFront + rBolt}" cy="${cy}" r="3" fill="black" />
    `;
    const cLines = `
        <line x1="${cxFront - rOuter - 15}" y1="${cy}" x2="${cxFront + rOuter + 15}" y2="${cy}" class="center-line" />
        <line x1="${cxFront}" y1="${cy - rOuter - 15}" x2="${cxFront}" y2="${cy + rOuter + 15}" class="center-line" />
        <line x1="${cxSide - L/2 - 15}" y1="${cy}" x2="${cxSide + L/2 + 15}" y2="${cy}" class="center-line" />
    `;
    const blade = `<ellipse cx="${cxFront}" cy="${cy}" rx="${D/2}" ry="${D/2 * 0.3}" fill="none" stroke="black" stroke-width="1" />`;
    const dimD = drawDim(cxFront - rOuter, cy - rOuter, cxFront + rOuter, cy - rOuter, `Ø${params.d1}`, 'top');
    const xLeft = cxSide - L/2;
    const xRight = cxSide + L/2;
    const yTop = cy - D/2;
    const yBot = cy + D/2;
    const sideRect = `<rect x="${xLeft}" y="${yTop}" width="${L}" height="${D}" class="line" />`;
    const f1 = drawFlange(xLeft, cy, D, true);
    const f2 = drawFlange(xRight, cy, D, true);
    const dimL = drawDim(xLeft, yTop, xRight, yTop, `L=${params.length}`, 'top');
    
    let mechanism = "";
    const pSize = 50;
    mechanism += `<rect x="${cxSide - pSize/2}" y="${cy - pSize/2}" width="${pSize}" height="${pSize}" fill="white" stroke="black" stroke-width="1" />`;

    if (params.actuation === "Handle") {
        const qR = 18;
        const qPath = `M${cxSide - qR},${cy} A${qR},${qR} 0 0,1 ${cxSide},${cy - qR}`; 
        mechanism += `<path d="${qPath}" fill="none" stroke="black" stroke-width="1" />`;
        mechanism += `<line x1="${cxSide-qR}" y1="${cy}" x2="${cxSide+qR}" y2="${cy}" stroke="black" stroke-width="0.5" />`;
        const hW = 12;
        const hL = 80;
        mechanism += `<rect x="${cxSide - hW/2}" y="${cy - 8}" width="${hW}" height="${hL}" rx="${hW/2}" fill="white" stroke="black" stroke-width="2" />`;
        mechanism += `<circle cx="${cxSide}" cy="${cy}" r="4" fill="black" />`;
    } else {
        const gSize = 35;
        mechanism += `<rect x="${cxSide - gSize/2}" y="${cy - gSize/2}" width="${gSize}" height="${gSize}" fill="#ddd" stroke="black" stroke-width="1" />`;
        const wR = 20;
        mechanism += `<circle cx="${cxSide}" cy="${cy}" r="${wR}" fill="white" stroke="black" stroke-width="2" />`;
        mechanism += `<line x1="${cxSide - wR}" y1="${cy}" x2="${cxSide + wR}" y2="${cy}" stroke="black" stroke-width="1" />`;
        mechanism += `<line x1="${cxSide}" y1="${cy - wR}" x2="${cxSide}" y2="${cy + wR}" stroke="black" stroke-width="1" />`;
        mechanism += `<circle cx="${cxSide}" cy="${cy}" r="5" fill="black" />`;
        mechanism += `<line x1="${cxSide}" y1="${cy+wR}" x2="${cxSide}" y2="${cy+wR+15}" stroke="black" stroke-width="3" />`;
        mechanism += `<line x1="${cxSide-15}" y1="${cy+wR+15}" x2="${cxSide+15}" y2="${cy+wR+15}" stroke="black" stroke-width="3" />`;
    }
    return createSvg(frontFlange + frontInner + bolts + blade + cLines + dimD + sideRect + f1 + f2 + dimL + mechanism);
};

export const generateMultibladeDamper = (params: DuctParams) => {
    const cxLeft = 130;
    const cxRight = 360;
    const cy = VIEW_BOX_SIZE / 2 + 20;
    const realL = params.length || 400; 
    const V_HEIGHT = 225; 
    const V_WIDTH = 110;   
    const seg1 = V_WIDTH * 0.25;
    const seg2 = V_WIDTH * 0.50;
    const seg3 = V_WIDTH * 0.25;
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
    const actuatorSide = `
        <rect x="${cxLeft - 10}" y="${cy - 10}" width="${20}" height="${20}" fill="#ddd" stroke="black" />
        <line x1="${cxLeft}" y1="${cy}" x2="${cxLeft + 40}" y2="${cy + 10}" stroke="black" stroke-width="3" />
        <circle cx="${cxLeft + 40}" cy="${cy + 10}" r="6" fill="black" />
    `;
    const dimL = drawDim(xL, yT, xR, yT, `L=${realL}`, 'top');
    const dim100a = `<text x="${xL + seg1/2}" y="${yT - 20}" class="dim-text" font-size="16">100</text>`;
    const dim200 = `<text x="${cxLeft}" y="${yT - 20}" class="dim-text" font-size="16">200</text>`;
    const dim100b = `<text x="${xR - seg3/2}" y="${yT - 20}" class="dim-text" font-size="16">100</text>`;
    
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
    const dimD = drawDim(cxRight + boxSize/2 + 5, cy - V_HEIGHT/2, cxRight + boxSize/2 + 5, cy + V_HEIGHT/2, `Ø${params.d1}`, 'right');

    return createSvg(dashedBox + cFlange + circle + bolts + blades + actuatorFront + dimD + rect + dividers + flanges + actuatorSide + dimL + dim100a + dim200 + dim100b);
};