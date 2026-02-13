import { DuctParams } from "../../types";
import { createSvg, drawDim, drawAnnotation, VIEW_BOX_SIZE } from "../svgUtils";
import { getFlangeParams } from "../flangeStandards";

export const generateBlindPlate = (params: DuctParams, activeField: string | null = null) => {
    const VIEW_WIDTH = VIEW_BOX_SIZE;
    const VIEW_HEIGHT = 500; // Reduced to trim whitespace
    const cx = VIEW_WIDTH / 2;
    const cy = VIEW_HEIGHT / 2;
    
    const dNominal = params.d1 || 200;
    
    // Get Standard Params for comparison
    const std = getFlangeParams(dNominal);
    
    // Use params if present, else standard
    const realPCD = params.pcd !== undefined ? params.pcd : std.bcd;
    const numBolts = params.holeCount !== undefined ? params.holeCount : std.holeCount;

    // Detect Manual Override
    const isManual = (params.pcd !== undefined && params.pcd !== std.bcd) || 
                     (params.holeCount !== undefined && params.holeCount !== std.holeCount);

    
    // Scale Logic: Maximize view usage based on standard flange proportions
    const theoreticalOD = realPCD + 40;
    // Reduce target size to allow room for dimensions within smaller height
    const targetSize = 350; 
    const scale = targetSize / theoreticalOD;
    
    const V_R_PCD = (realPCD / 2) * scale;
    const V_R_ID = (dNominal / 2) * scale;
    const V_R_OD = V_R_PCD + 20; 
    
    const circle = `<circle cx="${cx}" cy="${cy}" r="${V_R_OD}" class="line" />`;
    // ID circle as phantom to show nominal size
    const idCircle = `<circle cx="${cx}" cy="${cy}" r="${V_R_ID}" class="phantom-line" stroke-dasharray="5,5" />`; 
    
    const pcdCircle = `<circle cx="${cx}" cy="${cy}" r="${V_R_PCD}" class="phantom-line" />`;
    const centerLong = `<line x1="${cx-V_R_OD-20}" y1="${cy}" x2="${cx+V_R_OD+20}" y2="${cy}" class="phantom-line" /><line x1="${cx}" y1="${cy-V_R_OD-20}" x2="${cx}" y2="${cy+V_R_OD+20}" class="phantom-line" />`;

    // Reinforcement Angle Bars & Labels
    let bars = "";
    let barLabel = "";
    const R_BARS = V_R_PCD - 10; 
    const barStyle = 'stroke="#15803d" stroke-width="4" stroke-linecap="round" fill="none"'; // Green color
    
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
        // Draw label at bottom center
        const labelY = cy + V_R_OD + 50;
        const textTop = labelY - 25;
        const rimBot = cy + V_R_OD + 10;
        
        barLabel = `
            <line x1="${cx}" y1="${textTop}" x2="${cx}" y2="${rimBot}" stroke="black" stroke-width="1" />
            <text x="${cx}" y="${labelY}" font-family="sans-serif" font-size="28" font-weight="bold" fill="black" text-anchor="middle">${labelText}</text>
        `;
    }

    // Bolt Holes & Manual Override Annotation
    let holes = "";
    let annotation = "";
    const holeR = 3.5;
    const targetHoleIdx = Math.round(numBolts / 4); // Target hole at ~90deg (3 o'clock)
    
    for(let i=0; i<numBolts; i++) {
        // Start from -90 (Top)
        const rad = (i * (360/numBolts) - 90) * Math.PI / 180;
        const bx = cx + V_R_PCD * Math.cos(rad);
        const by = cy + V_R_PCD * Math.sin(rad);
        holes += `<circle cx="${bx}" cy="${by}" r="${holeR}" class="line" stroke-width="1.5" />`;
        
        // Point to the target hole (Right side) if manual override exists
        if (isManual && i === targetHoleIdx) {
            // Leader goes Down-Right to avoid Top Dimension collision
            annotation = drawAnnotation(bx, by, `P.C.D: ${realPCD}\n${numBolts} HOLES`, false, true, 45, false).svg;
        }
    }

    // Dimensions
    const dimTop = drawDim(cx - V_R_ID, cy, cx + V_R_ID, cy, `Ø${dNominal}`, 'top', V_R_OD + 25, 'd1', activeField);

    return createSvg(circle + idCircle + pcdCircle + centerLong + bars + barLabel + holes + dimTop + annotation, VIEW_WIDTH, VIEW_HEIGHT);
};