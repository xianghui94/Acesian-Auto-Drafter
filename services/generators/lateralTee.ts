
import { DuctParams } from "../../types";
import { createSvg, drawDim, drawFlange, drawRotatedFlange, drawAnnotation, VIEW_BOX_SIZE } from "../svgUtils";

export const generateLateralTee = (params: DuctParams, activeField: string | null = null) => {
    const VIEW_WIDTH = VIEW_BOX_SIZE;
    const VIEW_HEIGHT = 500;
    const cy = VIEW_HEIGHT / 2 + 50; // Shift down to allow room for branch
    const cx = VIEW_WIDTH / 2;

    const D1 = params.d1 || 500;   // Main Body
    const D3 = params.d2 || 300;   // Branch (Phi 3)
    const L = params.length || 800; // Total Length
    
    // Editable Params (with defaults for fallback)
    const a_input = params.a_len || 100;
    const b_input = params.b_len || 100; 
    const branch_len = params.branch_len || 100;

    // Geometric Logic
    const gap_real = D3 * 1.4142; 
    
    // We construct geometry based on L, a, and gap. 
    // This implies 'b' geometry is residual (L - a - gap). 
    // Ideally this matches 'b_input'.
    const b_geo = Math.max(50, L - a_input - gap_real);

    // --- Visual Scaling ---
    const V_D1 = 140; // Fixed visual size for Main D
    const scale = V_D1 / D1;
    
    const V_D3 = D3 * scale;
    const V_a = a_input * scale;
    const V_Gap = gap_real * scale;
    const V_b = b_geo * scale;
    const V_BranchL = branch_len * scale;
    
    // Total Visual Width
    const V_Total_W = V_a + V_Gap + V_b;

    // Centering
    const xLeft = cx - V_Total_W / 2;
    const xRight = cx + V_Total_W / 2;
    const yTop = cy - V_D1/2;
    const yBot = cy + V_D1/2;

    // --- Geometry Points ---
    
    // 1. Intersection Gap on Top Edge
    const pGapStart = { x: xLeft + V_a, y: yTop }; // End of 'a'
    const pGapEnd = { x: xLeft + V_a + V_Gap, y: yTop }; // Start of 'b'
    const pCenterBase = { x: (pGapStart.x + pGapEnd.x)/2, y: yTop };

    // 2. Branch Calculation (45 deg Up-Right)
    const angleDeg = -45;
    const angleRad = angleDeg * (Math.PI / 180);
    
    // Calculation for Face Position assuming 'Branch L' is the "Longest End" (Heel Length).
    // Heel connects pGapStart to pBranchEndLeft.
    // Length from pCenterBase (on axis) to pGapStart (Left intersection) is Radius / sin(45) = Radius * sqrt(2).
    // But along the axis direction, the projection of pGapStart is at distance -Radius from CenterBase.
    // So Heel Length = CenterlineLength - (-Radius) = CenterLen + Radius.
    // If we want Heel Length = BranchL, then CenterLen = BranchL - Radius.
    const radiusBranch = V_D3 * 0.5;
    const V_Branch_Center_Len = V_BranchL - radiusBranch; 

    // Center of Branch End Face
    const pCenterEnd = {
        x: pCenterBase.x + Math.cos(angleRad) * V_Branch_Center_Len,
        y: pCenterBase.y + Math.sin(angleRad) * V_Branch_Center_Len
    };

    // Branch Width Perpendicular Vector
    const pRad = (angleDeg - 90) * (Math.PI / 180); // -135 degrees
    const dx_p = Math.cos(pRad) * (V_D3 / 2);
    const dy_p = Math.sin(pRad) * (V_D3 / 2);

    // Branch End Corners (at Face)
    const pBranchEndLeft = { x: pCenterEnd.x + dx_p, y: pCenterEnd.y + dy_p };
    const pBranchEndRight = { x: pCenterEnd.x - dx_p, y: pCenterEnd.y - dy_p };
    
    // --- Paths ---

    // Main Body
    const mainBodyPath = `
        M${pGapEnd.x},${pGapEnd.y} 
        L${xRight},${yTop} 
        L${xRight},${yBot} 
        L${xLeft},${yBot} 
        L${xLeft},${yTop} 
        L${pGapStart.x},${pGapStart.y}
    `;

    // Branch Body
    const branchBodyPath = `
        M${pGapStart.x},${pGapStart.y} 
        L${pBranchEndLeft.x},${pBranchEndLeft.y}
        L${pBranchEndRight.x},${pBranchEndRight.y}
        L${pGapEnd.x},${pGapEnd.y}
    `;

    // Weld / Cut Line (Curved into pipe)
    const weldPath = `
        M${pGapStart.x},${yTop} 
        Q${pCenterBase.x},${yTop + V_D3 * 0.4} ${pGapEnd.x},${yTop}
    `;
    
    // Projection Lines for 'a' and 'b' dimensions
    // Dashed lines dropping from the top intersection points to the bottom dimension line
    // We extend them slightly past yBot to meet the dimension lines
    // Increased extension to match new offset (60)
    const projYEnd = yBot + 60; 
    const projLines = `
        <line x1="${pGapStart.x}" y1="${yTop}" x2="${pGapStart.x}" y2="${projYEnd}" class="hidden-line" stroke-opacity="0.6" />
        <line x1="${pGapEnd.x}" y1="${yTop}" x2="${pGapEnd.x}" y2="${projYEnd}" class="hidden-line" stroke-opacity="0.6" />
    `;

    // Centerlines
    const clMain = `<line x1="${xLeft-15}" y1="${cy}" x2="${xRight+15}" y2="${cy}" class="center-line" />`;
    
    // Branch Centerline
    const clBranchStart = { 
        x: pCenterBase.x - Math.cos(angleRad)*20, 
        y: pCenterBase.y - Math.sin(angleRad)*20 
    };
    const clBranchEnd = {
        x: pCenterEnd.x + Math.cos(angleRad)*30,
        y: pCenterEnd.y + Math.sin(angleRad)*30
    };
    const clBranch = `<line x1="${clBranchStart.x}" y1="${clBranchStart.y}" x2="${clBranchEnd.x}" y2="${clBranchEnd.y}" class="center-line" />`;

    // --- Flanges ---
    const f1 = drawFlange(xLeft, cy, V_D1, true); // Left
    const f2 = drawFlange(xRight, cy, V_D1, true); // Right
    const f3 = drawRotatedFlange(pCenterEnd.x, pCenterEnd.y, V_D3, angleDeg); // Branch (-45 deg)

    // --- Dimensions ---
    
    // 1. Main Dimensions (Bottom Stack)
    // OFFSETS INCREASED to remove cramping
    const OFFSET_AB = 60;
    const OFFSET_L = 100;
    const OFFSET_D = 50;
    
    // 'a' dimension (Left Bottom)
    // We use the same x-coordinates as the projection lines
    const dimA = drawDim(xLeft, yBot, pGapStart.x, yBot, `a=${a_input}`, 'bottom', OFFSET_AB, 'a_len', activeField);
    
    // 'b' dimension (Right Bottom)
    const dimB = drawDim(pGapEnd.x, yBot, xRight, yBot, `b=${b_input}`, 'bottom', OFFSET_AB, 'b_len', activeField);

    // Total Length (Bottom Level 2)
    const dimL = drawDim(xLeft, yBot, xRight, yBot, `L=${L}`, 'bottom', OFFSET_L, 'length', activeField);
    
    // Main D (Left)
    const dimD1 = drawDim(xLeft, yTop, xLeft, yBot, `Ø${D1}`, 'left', OFFSET_D, 'd1', activeField);

    // 2. Branch Dimensions
    
    // Branch D3 (Rotated at Face)
    const dimOff = 50; // Increased
    const d3_p1 = { x: pBranchEndLeft.x + Math.cos(angleRad)*dimOff, y: pBranchEndLeft.y + Math.sin(angleRad)*dimOff };
    const d3_p2 = { x: pBranchEndRight.x + Math.cos(angleRad)*dimOff, y: pBranchEndRight.y + Math.sin(angleRad)*dimOff };
    
    const isActiveD2 = activeField === 'd2';
    const dClass = isActiveD2 ? "dim-line highlight" : "dim-line";
    const tClass = isActiveD2 ? "dim-text highlight" : "dim-text";
    
    const dimD3Svg = `
        <g data-param="d2" style="cursor: pointer;">
            <line x1="${pBranchEndLeft.x}" y1="${pBranchEndLeft.y}" x2="${d3_p1.x}" y2="${d3_p1.y}" class="${dClass}" stroke-width="1"/>
            <line x1="${pBranchEndRight.x}" y1="${pBranchEndRight.y}" x2="${d3_p2.x}" y2="${d3_p2.y}" class="${dClass}" stroke-width="1"/>
            <line x1="${d3_p1.x}" y1="${d3_p1.y}" x2="${d3_p2.x}" y2="${d3_p2.y}" class="${dClass}" />
            <text x="${(d3_p1.x+d3_p2.x)/2}" y="${(d3_p1.y+d3_p2.y)/2}" 
                transform="rotate(${angleDeg}, ${(d3_p1.x+d3_p2.x)/2}, ${(d3_p1.y+d3_p2.y)/2})"
                dy="-5" text-anchor="middle" class="${tClass}">Ø${D3}</text>
        </g>
    `;

    // Branch Length (Along LEFT/UPPER side of branch)
    // This is now correctly the Longest End (Heel) due to the geometry calculation change.
    const br_p2 = { x: pBranchEndLeft.x, y: pBranchEndLeft.y }; // End at flange face corner
    
    // To ensure dimension line is parallel to branch axis:
    // Start Point: Calculate by projecting End Point BACKWARDS along the branch axis by V_BranchL.
    const backCos = Math.cos(angleRad);
    const backSin = Math.sin(angleRad);
    
    const br_p1 = { 
        x: br_p2.x - (backCos * V_BranchL), 
        y: br_p2.y - (backSin * V_BranchL) 
    };

    const dimBranchOff = 70; // Increased
    // Offset perpendicular vector (Angle - 90 = -135 deg)
    const offRad = (angleDeg - 90) * (Math.PI / 180); 
    const ox = Math.cos(offRad) * dimBranchOff;
    const oy = Math.sin(offRad) * dimBranchOff;
    
    const l1 = { x: br_p1.x + ox, y: br_p1.y + oy };
    const l2 = { x: br_p2.x + ox, y: br_p2.y + oy };
    
    const isActiveBL = activeField === 'branch_len';
    const blClass = isActiveBL ? "dim-line highlight" : "dim-line";
    const blTextClass = isActiveBL ? "dim-text highlight" : "dim-text";

    const dimBranchLen = `
        <g data-param="branch_len" style="cursor: pointer;">
             <line x1="${br_p1.x}" y1="${br_p1.y}" x2="${l1.x}" y2="${l1.y}" class="${blClass}" stroke-width="1" />
             <line x1="${br_p2.x}" y1="${br_p2.y}" x2="${l2.x}" y2="${l2.y}" class="${blClass}" stroke-width="1" />
             <line x1="${l1.x}" y1="${l1.y}" x2="${l2.x}" y2="${l2.y}" class="${blClass}" />
             <text x="${(l1.x+l2.x)/2}" y="${(l1.y+l2.y)/2}" 
                transform="rotate(${angleDeg}, ${(l1.x+l2.x)/2}, ${(l1.y+l2.y)/2})"
                dy="-5" text-anchor="middle" class="${blTextClass}">${branch_len}</text>
        </g>
    `;

    // 45 degree Arc
    const arcR = 50;
    const arcPath = `M${pCenterBase.x + arcR},${yTop} A${arcR},${arcR} 0 0,0 ${pCenterBase.x + Math.cos(angleRad)*arcR},${pCenterBase.y + Math.sin(angleRad)*arcR}`;
    const arcSvg = `
        <path d="${arcPath}" fill="none" stroke="black" stroke-width="0.5" />
        <text x="${pCenterBase.x + 60}" y="${yTop - 15}" font-family="sans-serif" font-size="14">45°</text>
    `;

    // Remarks
    let remarks = "";
    if (params.flangeRemark1) remarks += drawAnnotation(xLeft, yTop, params.flangeRemark1, true, false, 60).svg;
    if (params.flangeRemark2) remarks += drawAnnotation(pBranchEndRight.x, pBranchEndRight.y, params.flangeRemark2, true, true, 60).svg;

    return createSvg(
        `<path d="${mainBodyPath}" class="line" />` + 
        `<path d="${branchBodyPath}" class="line" />` + 
        `<path d="${weldPath}" fill="none" stroke="black" stroke-width="1" />` +
        projLines + 
        f1 + f2 + f3 + clMain + clBranch + arcSvg +
        dimL + dimD1 + dimD3Svg + dimBranchLen + dimA + dimB + remarks,
        VIEW_WIDTH, VIEW_HEIGHT
    );
};
