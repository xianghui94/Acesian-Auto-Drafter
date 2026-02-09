import { DuctParams } from "../../types";
import { createSvg, drawDim, drawFlange, VIEW_BOX_SIZE } from "../svgUtils";

export const generateBlastGateDamper = (params: DuctParams) => {
    // Layout: Left = Side View, Right = Front View
    const VIEW_WIDTH = 800;
    const VIEW_HEIGHT = 550;
    const cxLeft = 200;
    const cxRight = 550;
    const cy = VIEW_HEIGHT / 2 + 30; // Shift down slightly to make room for handle

    // Input values for text labels
    const realD = params.d1 || 500;
    const realL = params.length || 200; 
    
    // Fixed Visual Dimensions ("1 size fit all" based on D1500 proportions)
    // D1500 (D=1500, X=1650, L=200) -> D/X ~ 0.91, L/X ~ 0.12
    const V_X = 320; 
    const V_D = 290; 
    const V_L = 50; 
    
    // --- Right View (Front) ---
    // Square Body
    const rightView = `
        <rect x="${cxRight - V_X/2}" y="${cy - V_X/2}" width="${V_X}" height="${V_X}" class="line" />
        <circle cx="${cxRight}" cy="${cy}" r="${V_D/2}" class="line" />
    `;
    
    // Bolt Circle (PCD) & Bolts
    const V_PCD = V_D + ((V_X - V_D) * 0.5); 
    const pcdCircle = `<circle cx="${cxRight}" cy="${cy}" r="${V_PCD/2}" class="phantom-line" />`;
    
    const numBolts = 16;
    let bolts = "";
    for(let i=0; i<numBolts; i++) {
        const rad = (i * (360/numBolts)) * Math.PI / 180;
        const bx = cxRight + (V_PCD/2) * Math.cos(rad);
        const by = cy + (V_PCD/2) * Math.sin(rad);
        bolts += `<circle cx="${bx}" cy="${by}" r="2.5" fill="none" stroke="black" stroke-width="1" />`;
    }
    
    // Handle on Front View
    const handleW = V_X * 0.6;
    const handleH = 30;
    const handleY = cy - V_X/2 - handleH;
    const handleFront = `
        <polyline points="${cxRight - handleW/2},${cy - V_X/2} ${cxRight - handleW/2},${handleY} ${cxRight + handleW/2},${handleY} ${cxRight + handleW/2},${cy - V_X/2}" class="line" fill="none" />
        <line x1="${cxRight - handleW/2 + 5}" y1="${handleY + 5}" x2="${cxRight + handleW/2 - 5}" y2="${handleY + 5}" class="line" stroke-width="1" />
    `;

    // Center Lines
    const centerLinesRight = `
        <line x1="${cxRight - V_X/2 - 20}" y1="${cy}" x2="${cxRight + V_X/2 + 20}" y2="${cy}" class="phantom-line" />
        <line x1="${cxRight}" y1="${cy - V_X/2 - 20}" x2="${cxRight}" y2="${cy + V_X/2 + 20}" class="phantom-line" />
    `;

    // Dimensions Right
    // NOTE: Body Dim "X" removed per request.
    
    // Diameter pointing to circle
    const labelRad = V_D/2;
    const angle = 45 * Math.PI / 180;
    const pOnCircleX = cxRight + labelRad * Math.cos(angle);
    const pOnCircleY = cy + labelRad * Math.sin(angle);
    const pOutsideX = cxRight + (V_X/2 + 40) * Math.cos(angle);
    const pOutsideY = cy + (V_X/2 + 40) * Math.sin(angle);
    
    const dimDRight = `
        <line x1="${pOutsideX}" y1="${pOutsideY}" x2="${pOnCircleX}" y2="${pOnCircleY}" class="dim-line" />
        <polygon points="${pOnCircleX},${pOnCircleY} ${pOnCircleX + 10},${pOnCircleY - 4} ${pOnCircleX + 10},${pOnCircleY + 4}" fill="red" transform="rotate(45, ${pOnCircleX}, ${pOnCircleY})" />
        <text x="${pOutsideX + 5}" y="${pOutsideY + 5}" class="dim-text" text-anchor="start" dominant-baseline="hanging">Ø${realD}</text>
    `;

    // --- Left View (Side) ---
    const xL = cxLeft - V_L/2;
    const xR = cxLeft + V_L/2;
    const yT = cy - V_D/2; 
    const yB = cy + V_D/2;
    
    // Main Body Box (Duct Body)
    const bodySide = `<rect x="${xL}" y="${yT}" width="${V_L}" height="${V_D}" class="line" fill="none" />`;
    
    // Flanges
    const f1 = drawFlange(xL, cy, V_D, true);
    const f2 = drawFlange(xR, cy, V_D, true);

    // Blade Mechanism (Center)
    const bladeHousingH = V_X/2; // Matches square top
    const housingTop = cy - bladeHousingH;
    const housingW = Math.max(15, V_L * 0.4);
    
    const housing = `<rect x="${cxLeft - housingW/2}" y="${housingTop}" width="${housingW}" height="${bladeHousingH - V_D/2}" class="line" fill="white" />`;
    
    // Handle Side View
    const handleStemH = 30;
    const handleStemTop = housingTop - handleStemH;
    
    const handleSide = `
        <line x1="${cxLeft}" y1="${housingTop}" x2="${cxLeft}" y2="${handleStemTop}" class="line" stroke-width="2" />
        <polyline points="${cxLeft},${handleStemTop} ${cxLeft+10},${handleStemTop} ${cxLeft+10},${handleStemTop-15}" class="line" fill="none" />
    `;
    
    // NOTE: Side view labels (Steel Blade, etc.) removed per request.

    // Dimensions Left
    const dimLLeft = drawDim(xL, yB, xR, yB, `L=${realL}`, 'bottom', 30);
    const dimDLeft = drawDim(xL - 20, yT, xL - 20, yB, `Ø${realD}`, 'left', 10);
    
    // View Titles
    const titles = `
        <text x="${cxLeft}" y="${VIEW_HEIGHT - 20}" font-weight="bold" text-anchor="middle" font-size="18" text-decoration="underline">SIDE VIEW</text>
        <text x="${cxRight}" y="${VIEW_HEIGHT - 20}" font-weight="bold" text-anchor="middle" font-size="18" text-decoration="underline">FRONT VIEW</text>
    `;

    return createSvg(
        rightView + pcdCircle + bolts + handleFront + centerLinesRight + dimDRight +
        bodySide + f1 + f2 + housing + handleSide + dimLLeft + dimDLeft + titles,
        VIEW_WIDTH, VIEW_HEIGHT
    );
};