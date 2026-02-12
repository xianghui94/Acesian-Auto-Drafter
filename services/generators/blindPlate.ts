import { DuctParams } from "../../types";
import { createSvg, drawDim, VIEW_BOX_SIZE } from "../svgUtils";

const BLIND_PLATE_LOOKUP: Record<number, number> = {
    100: 156, 150: 206, 200: 260, 250: 310, 300: 368, 350: 417,
    400: 467, 450: 517, 500: 578, 550: 628, 600: 678, 650: 728,
    700: 778, 750: 828, 800: 878, 850: 928, 900: 978, 950: 1028,
    1000: 1079, 1100: 1178, 1200: 1278, 1300: 1378, 1400: 1478,
    1500: 1578, 1600: 1703, 1700: 1803, 1800: 1903, 1900: 2003,
    2000: 2102
};

export const generateBlindPlate = (params: DuctParams, activeField: string | null = null) => {
    const VIEW_WIDTH = VIEW_BOX_SIZE;
    const VIEW_HEIGHT = 600; // Reduced from 800
    const cx = VIEW_WIDTH / 2;
    const cy = VIEW_HEIGHT / 2;
    
    const dNominal = params.d1 || 200;
    
    // Lookup OD from table, or default to dNominal + 50 if not found
    const realOD = BLIND_PLATE_LOOKUP[dNominal] || (dNominal + 50);
    
    // Fixed visual radius for Outer Diameter
    const V_R = 190; 
    
    // Calculate Visual Inner Diameter based on ratio
    let ratio = dNominal / realOD;
    if (ratio > 0.95) ratio = 0.95; 
    
    const V_R_ID = V_R * ratio;
    const V_R_PCD = (V_R + V_R_ID) / 2;
    
    const circle = `<circle cx="${cx}" cy="${cy}" r="${V_R}" class="line" />`;
    const idCircle = `<circle cx="${cx}" cy="${cy}" r="${V_R_ID}" class="phantom-line" />`;
    const pcd = `<circle cx="${cx}" cy="${cy}" r="${V_R_PCD}" class="phantom-line" />`;
    const centerLong = `<line x1="${cx-V_R-20}" y1="${cy}" x2="${cx+V_R+20}" y2="${cy}" class="phantom-line" /><line x1="${cx}" y1="${cy-V_R-20}" x2="${cx}" y2="${cy+V_R+20}" class="phantom-line" />`;

    // Reinforcement Angle Bars & Labels
    let bars = "";
    let barLabel = "";
    const R_BARS = V_R_PCD - 10; 
    const barStyle = 'stroke="#15803d" stroke-width="4" stroke-linecap="round" fill="none"'; // Green color from sketch, thick
    
    let labelText = "";
    let showLabel = false;

    if (dNominal >= 650 && dNominal < 1200) {
        // Single Horizontal
        bars += `<line x1="${cx - R_BARS}" y1="${cy}" x2="${cx + R_BARS}" y2="${cy}" ${barStyle} />`;
        labelText = "Angle Bar 30mm x 30mm x 3mm";
        showLabel = true;
    } else if (dNominal >= 1200 && dNominal < 1700) {
        // Cross (+ pattern)
        bars += `<line x1="${cx - R_BARS}" y1="${cy}" x2="${cx + R_BARS}" y2="${cy}" ${barStyle} />`;
        bars += `<line x1="${cx}" y1="${cy - R_BARS}" x2="${cx}" y2="${cy + R_BARS}" ${barStyle} />`;
        labelText = "2 x Angle Bar 30mm x 30mm x 3mm";
        showLabel = true;
    } else if (dNominal >= 1700) {
        // Grid (Hash # pattern)
        const off = R_BARS * 0.4;
        const chordLen = Math.sqrt(R_BARS*R_BARS - off*off);
        
        bars += `<line x1="${cx - chordLen}" y1="${cy - off}" x2="${cx + chordLen}" y2="${cy - off}" ${barStyle} />`;
        bars += `<line x1="${cx - chordLen}" y1="${cy + off}" x2="${cx + chordLen}" y2="${cy + off}" ${barStyle} />`;
        bars += `<line x1="${cx - off}" y1="${cy - chordLen}" x2="${cx - off}" y2="${cy + chordLen}" ${barStyle} />`;
        bars += `<line x1="${cx + off}" y1="${cy - chordLen}" x2="${cx + off}" y2="${cy + chordLen}" ${barStyle} />`;
        
        if (dNominal < 2000) {
            labelText = "2 x 2 Angle Bar 40mm x 40mm x 4mm";
        } else {
            labelText = "2 x 2 Angle Bar 50mm x 50mm x 5mm"; 
        }
        showLabel = true;
    }

    if (showLabel) {
        // Draw label at bottom
        const labelY = cy + V_R + 45;
        // Leader line pointing to the angle bar (approx center)
        const leaderPath = `M${cx},${cy+10} L${cx+20},${labelY-15} L${cx+50},${labelY-15}`;
        
        barLabel = `
            <path d="${leaderPath}" fill="none" stroke="black" stroke-width="1" />
            <text x="${cx+55}" y="${labelY-10}" font-family="sans-serif" font-size="14" font-weight="bold" fill="black">${labelText}</text>
        `;
    }

    // Bolt Holes
    const numBolts = 12; 
    let holes = "";
    const holeR = 4;
    for(let i=0; i<numBolts; i++) {
        const rad = (i * (360/numBolts) - 90) * Math.PI / 180;
        const bx = cx + V_R_PCD * Math.cos(rad);
        const by = cy + V_R_PCD * Math.sin(rad);
        holes += `<circle cx="${bx}" cy="${by}" r="${holeR}" class="line" stroke-width="1.5" />`;
    }

    // Top Dimension
    const dimTop = drawDim(cx - V_R_ID, cy, cx + V_R_ID, cy, `Ø${dNominal}`, 'top', V_R + 30, 'd1', activeField);

    return createSvg(circle + idCircle + pcd + centerLong + bars + barLabel + holes + dimTop, VIEW_WIDTH, VIEW_HEIGHT);
};