import { DuctParams } from "../../types";
import { createSvg, drawDim, drawFlange, drawRotatedFlange, drawArrow, drawAnnotation, VIEW_BOX_SIZE, V_CONSTANTS } from "../svgUtils";

const { LEN: V_LEN, DIAM: V_DIAM, DIAM_LG: V_DIAM_LG, DIAM_SM: V_DIAM_SM, REDUCER_STRAIGHT: V_REDUCER_STRAIGHT, BRANCH_W: V_BRANCH_W, BRANCH_H: V_BRANCH_H, TRANS_LEN: V_TRANS_LEN, TRANS_TAN: V_TRANS_TAN } = V_CONSTANTS;

export const generateStraight = (params: DuctParams) => {
  const cx = VIEW_BOX_SIZE / 2;
  const cy = VIEW_BOX_SIZE / 2;
  const L = V_LEN;
  const D = V_DIAM;
  const x1 = cx - L/2;
  const x2 = cx + L/2;
  const yTop = cy - D/2;
  const yBot = cy + D/2;
  
  const path = `<path d="M${x1},${yTop} L${x2},${yTop} M${x1},${yBot} L${x2},${yBot}" class="line" />`;
  const f1 = drawFlange(x1, cy, D, true);
  const f2 = drawFlange(x2, cy, D, true);
  
  const dimL = drawDim(x1, yBot, x2, yBot, `L=${params.length || 1000}`, 'bottom');
  const dimD = drawDim(x2, yTop, x2, yBot, `D=${params.d1 || 300}`, 'right');

  return createSvg(path + f1 + f2 + dimL + dimD);
};

export const generateReducer = (params: DuctParams) => {
  const cx = VIEW_BOX_SIZE / 2;
  const cy = VIEW_BOX_SIZE / 2;
  const L = V_LEN;
  const S = V_REDUCER_STRAIGHT;
  const D1 = V_DIAM_LG;
  const D2 = V_DIAM_SM;
  const xLeft = cx - L/2;
  const xRight = cx + L/2;
  const xTransStart = xLeft + S;
  const xTransEnd = xRight - S;
  const y1Top = cy - D1/2;
  const y1Bot = cy + D1/2;
  const y2Top = cy - D2/2;
  const y2Bot = cy + D2/2;
  
  const dTop = `M${xLeft},${y1Top} L${xTransStart},${y1Top} L${xTransEnd},${y2Top} L${xRight},${y2Top}`;
  const dBot = `M${xLeft},${y1Bot} L${xTransStart},${y1Bot} L${xTransEnd},${y2Bot} L${xRight},${y2Bot}`;
  const dMark1 = `M${xTransStart},${y1Top} L${xTransStart},${y1Bot}`;
  const dMark2 = `M${xTransEnd},${y2Top} L${xTransEnd},${y2Bot}`;

  const path = `<path d="${dTop} ${dBot}" class="line" />`;
  const markers = `<path d="${dMark1} ${dMark2}" fill="none" stroke="black" stroke-width="0.5" stroke-dasharray="2,2" />`;
  const dash = `<line x1="${xLeft}" y1="${y1Top}" x2="${xLeft}" y2="${y1Bot}" class="center-line" /><line x1="${xRight}" y1="${y2Top}" x2="${xRight}" y2="${y2Bot}" class="center-line" />`;
  const f1 = drawFlange(xLeft, cy, D1, true);
  const f2 = drawFlange(xRight, cy, D2, true);
  
  const dimL = drawDim(xLeft, y1Bot, xRight, y2Bot, `L=${params.length || 500}`, 'bottom');
  const dimD1 = drawDim(xLeft, y1Top, xLeft, y1Bot, `D1=${params.d1 || 500}`, 'left'); 
  const dimD2 = drawDim(xRight, y2Top, xRight, y2Bot, `D2=${params.d2 || 300}`, 'right');

  return createSvg(path + markers + dash + f1 + f2 + dimL + dimD1 + dimD2);
};

export const generateElbow = (params: DuctParams) => {
  const angle = params.angle || 90;
  const D_real = params.d1 || 500;
  
  // R Calculation (Inner Radius)
  // Default logic: If D < 200, R_inner ~ 1.0D (Center ~1.5D)
  //                If D >= 200, R_inner ~ 0.5D (Center ~1.0D)
  const valInnerR = params.radius !== undefined ? params.radius : ((D_real < 200) ? D_real * 1.0 : D_real * 0.5);
  
  // Visual Scaling based on shape ratio (R_inner / D)
  const rRatio = valInnerR / D_real;

  const V_D = V_CONSTANTS.DIAM;
  const V_R_Inner = V_D * rRatio;
  const V_R_Outer = V_R_Inner + V_D;
  const V_R_Center = V_R_Inner + V_D/2;

  // Layout Constants
  const T = 0; // Tangent length
  const x0 = 60; 
  const y0 = 120;
  
  // Pivot Point
  const cx = x0 + T;
  const cy = y0 + V_R_Outer;
  
  // Angles (in radians)
  const startRad = -Math.PI / 2;
  const sweepRad = (angle * Math.PI) / 180;
  const endRad = startRad + sweepRad;

  // Segment Calculation based on specific rules
  let numSegments = 2; // safety fallback
  if (angle === 90) {
      numSegments = (D_real <= 150) ? 4 : 5;
  } else if (angle === 60) {
      numSegments = (D_real <= 150) ? 2 : 4;
  } else if (angle === 45) {
      numSegments = (D_real <= 150) ? 2 : 3;
  } else if (angle === 30) {
      numSegments = (D_real <= 950) ? 2 : 3;
  } else {
      // General scaling for other angles
      if (angle > 60) numSegments = 4;
      else if (angle > 30) numSegments = 3;
      else numSegments = 2;
  }

  // Generate Points
  const ptsOuter = [];
  const ptsInner = [];
  const ptsCenter = [];

  for (let i = 0; i <= numSegments; i++) {
    const frac = i / numSegments;
    const theta = startRad + (sweepRad * frac);
    const cos = Math.cos(theta);
    const sin = Math.sin(theta);
    
    ptsOuter.push({ x: cx + V_R_Outer * cos, y: cy + V_R_Outer * sin });
    ptsInner.push({ x: cx + V_R_Inner * cos, y: cy + V_R_Inner * sin });
    ptsCenter.push({ x: cx + V_R_Center * cos, y: cy + V_R_Center * sin });
  }

  // End Extensions
  const tanAngle = endRad + Math.PI / 2;
  const tx = Math.cos(tanAngle);
  const ty = Math.sin(tanAngle);
  
  const lastOut = ptsOuter[numSegments];
  const lastIn = ptsInner[numSegments];
  const lastC = ptsCenter[numSegments];
  
  const endOut = { x: lastOut.x + T * tx, y: lastOut.y + T * ty };
  const endIn = { x: lastIn.x + T * tx, y: lastIn.y + T * ty };
  const endC = { x: lastC.x + T * tx, y: lastC.y + T * ty };

  // Build Paths
  let dOuter = `M${x0},${y0} L${ptsOuter[0].x},${ptsOuter[0].y}`;
  for (let i = 1; i <= numSegments; i++) dOuter += ` L${ptsOuter[i].x},${ptsOuter[i].y}`;
  dOuter += ` L${endOut.x},${endOut.y}`;

  let dInner = `M${x0},${y0 + V_D} L${ptsInner[0].x},${ptsInner[0].y}`;
  for (let i = 1; i <= numSegments; i++) dInner += ` L${ptsInner[i].x},${ptsInner[i].y}`;
  dInner += ` L${endIn.x},${endIn.y}`;

  // Visual Centerline
  let dCenter = `M${x0 + V_D/2},${y0}`; 
  for (let i = 0; i <= numSegments; i++) dCenter += ` L${ptsCenter[i].x},${ptsCenter[i].y}`;
  dCenter += ` L${endC.x},${endC.y}`;
  const centerLinePath = `<path d="${dCenter}" class="phantom-line" />`;

  // Seams
  let seams = "";
  for (let i = 0; i <= numSegments; i++) {
    seams += `<line x1="${ptsInner[i].x}" y1="${ptsInner[i].y}" x2="${ptsOuter[i].x}" y2="${ptsOuter[i].y}" class="line" stroke-width="0.5" />`;
  }

  // Flanges
  // Start Flange (Vertical)
  const f1 = drawFlange(x0, y0 + V_D/2, V_D, true);
  
  // End Flange (Rotated)
  const endDeg = tanAngle * 180 / Math.PI;
  const f2 = drawRotatedFlange(endC.x, endC.y, V_D, endDeg);
  
  // Remarks
  let remark1 = "";
  if (params.flangeRemark1) {
      // Point to top of start flange (x0, y0)
      remark1 = drawAnnotation(x0, y0, params.flangeRemark1, true).svg;
  }
  
  let remark2 = "";
  if (params.flangeRemark2) {
      // Point to outer edge of end flange
      // End flange center: endC
      // Tangent Angle (Direction of flow): tanAngle
      // Flange direction: tanAngle + 90 deg
      // We want to point to the "Outer" side relative to the bend
      
      const fRad = V_D/2; 
      // Perpendicular vector for flange direction
      // CHANGED: Use -PI/2 to get Outer normal vector instead of Inner
      const px = Math.cos(tanAngle - Math.PI/2);
      const py = Math.sin(tanAngle - Math.PI/2);
      
      const fx = endC.x + fRad * px; 
      const fy = endC.y + fRad * py;
      
      remark2 = drawAnnotation(fx, fy, params.flangeRemark2, false).svg;
  }

  // Dimensions
  const dimD = drawDim(x0, y0, x0, y0 + V_D, `D=${D_real}`, 'left');
  
  // Radius R (Pointing to Inner Radius)
  const midAngle = startRad + sweepRad / 2;
  const ix = cx + V_R_Inner * Math.cos(midAngle);
  const iy = cy + V_R_Inner * Math.sin(midAngle);
  
  // Label Position (Inward from inner arc)
  const labelDist = Math.max(V_R_Inner - 40, 10);
  const lx = cx + labelDist * Math.cos(midAngle);
  const ly = cy + labelDist * Math.sin(midAngle);
  
  // Arrow pointing FROM label TO inner arc
  const arrow = drawArrow(ix, iy, midAngle * 180 / Math.PI);
  const rLine = `<line x1="${lx}" y1="${ly}" x2="${ix}" y2="${iy}" class="dim-line" />`;
  const rText = `<text x="${lx}" y="${ly}" class="dim-text" text-anchor="middle" dominant-baseline="middle" dy="20">R=${Number(valInnerR).toFixed(0)}</text>`;

  const body = `<path d="${dOuter}" class="line" /><path d="${dInner}" class="line" />`;
  
  return createSvg(body + centerLinePath + seams + f1 + f2 + dimD + rLine + arrow + rText + remark1 + remark2);
};

export const generateTee = (params: DuctParams) => {
  const VIEW_WIDTH = 800;
  const VIEW_HEIGHT = 500;
  const cy = VIEW_HEIGHT / 2;
  const cxLeft = VIEW_WIDTH * 0.3;
  const cxRight = VIEW_WIDTH * 0.75;

  const Md = params.main_d || 500;
  const Bd = params.tap_d || 300;
  const L = params.length || (Bd + 200);
  const neckLen = params.branch_l || 100; // User input or default 100

  // Visual scaling
  // We want the Main Diameter to be visually consistent, say 120px
  const V_MD = 120;
  const scale = V_MD / Md;
  const V_BD = Bd * scale;
  const V_L = L * scale;
  const V_NECK = neckLen * scale;

  // --- TOP VIEW (Left) ---
  // T-Shape: Main Horizontal, Branch Up.
  const xL_Left = cxLeft - V_L/2;
  const xR_Left = cxLeft + V_L/2;
  const yT_Left = cy - V_MD/2;
  const yB_Left = cy + V_MD/2;

  // Branch (Vertical Up)
  const xBranchL = cxLeft - V_BD/2;
  const xBranchR = cxLeft + V_BD/2;
  const yBranchTop = yT_Left - V_NECK;

  // Outline
  const outlineLeft = `
    M${xL_Left},${yB_Left} 
    L${xL_Left},${yT_Left} 
    L${xBranchL},${yT_Left} 
    L${xBranchL},${yBranchTop} 
    L${xBranchR},${yBranchTop} 
    L${xBranchR},${yT_Left} 
    L${xR_Left},${yT_Left} 
    L${xR_Left},${yB_Left} 
    Z
  `;

  // Flanges Top View
  const f1 = drawFlange(xL_Left, cy, V_MD, true);
  const f2 = drawFlange(xR_Left, cy, V_MD, true);
  const f3 = drawFlange(cxLeft, yBranchTop, V_BD, false);

  // Weld Line (Saddle Curve)
  const rMain = V_MD / 2;
  const rBranch = V_BD / 2;
  const dip = rMain - Math.sqrt(Math.max(0, rMain*rMain - rBranch*rBranch));
  const weldLeft = `<path d="M${xBranchL},${yT_Left} Q${cxLeft},${yT_Left + dip*2} ${xBranchR},${yT_Left}" fill="none" stroke="black" stroke-width="1" />`;
  
  // Center Lines Top View
  const clLeft = `
    <line x1="${xL_Left-10}" y1="${cy}" x2="${xR_Left+10}" y2="${cy}" class="center-line" />
    <line x1="${cxLeft}" y1="${yBranchTop-10}" x2="${cxLeft}" y2="${yB_Left+10}" class="center-line" />
  `;

  // Dimensions Top View
  const dimL = drawDim(xL_Left, yB_Left, xR_Left, yB_Left, `L=${L}`, 'bottom');
  const dimMd = drawDim(xL_Left - 15, yT_Left, xL_Left - 15, yB_Left, `Ø${Md}`, 'left');
  
  // --- SIDE VIEW (Right) ---
  // Rotated 90 deg anticlockwise from Branch Up
  // Result: Main Circle, Branch Left
  
  // Main Circle
  const circleRight = `<circle cx="${cxRight}" cy="${cy}" r="${V_MD/2}" class="line" />`;
  
  // Branch Left (Rectangle extending left)
  // Intersection with circle at x = cxRight - sqrt(R^2 - y^2)
  const yBranchTop_R = cy - V_BD/2;
  const yBranchBot_R = cy + V_BD/2;
  
  const dxIntersect = Math.sqrt(Math.max(0, (V_MD/2)*(V_MD/2) - (V_BD/2)*(V_BD/2)));
  const xIntersect = cxRight - dxIntersect;
  const xBranchTip = cxRight - (V_MD/2) - V_NECK;
  
  const branchRight = `
    M${xIntersect},${yBranchTop_R} 
    L${xBranchTip},${yBranchTop_R} 
    L${xBranchTip},${yBranchBot_R} 
    L${xIntersect},${yBranchBot_R}
  `;
  // Note: Not closed with Z to avoid line crossing circle interior
  
  // Flange Side View (Vertical at tip)
  const f4 = drawFlange(xBranchTip, cy, V_BD, true);

  // Weld Line Side View (Fillet)
  const weldRight = `
    <path d="M${xIntersect},${yBranchTop_R} Q${xIntersect-2},${yBranchTop_R-5} ${xIntersect+5},${yBranchTop_R-5}" stroke="black" fill="none" stroke-width="0.5" />
    <path d="M${xIntersect},${yBranchBot_R} Q${xIntersect-2},${yBranchBot_R+5} ${xIntersect+5},${yBranchBot_R+5}" stroke="black" fill="none" stroke-width="0.5" />
  `;

  // Dimensions Side View
  const dimBd = drawDim(xBranchTip, yBranchTop_R, xBranchTip, yBranchBot_R, `Ø${Bd}`, 'left');
  
  // Branch Length Dimension (Side View)
  // From tip to the main duct edge (vertical tangent at center-line level)
  const xMainEdge = cxRight - V_MD/2;
  const dimBranchLen = drawDim(xBranchTip, yBranchTop_R, xMainEdge, yBranchTop_R, `${neckLen}`, 'top', 30);
  
  // Center Lines Side View
  const clRight = `
     <line x1="${xBranchTip-10}" y1="${cy}" x2="${cxRight+V_MD/2+10}" y2="${cy}" class="center-line" />
     <line x1="${cxRight}" y1="${cy-V_MD/2-10}" x2="${cxRight}" y2="${cy+V_MD/2+10}" class="center-line" />
  `;

  // Titles
  const titles = `
    <text x="${cxLeft}" y="${VIEW_HEIGHT - 30}" font-weight="bold" text-anchor="middle" font-size="18" text-decoration="underline">TOP VIEW</text>
    <text x="${cxRight}" y="${VIEW_HEIGHT - 30}" font-weight="bold" text-anchor="middle" font-size="18" text-decoration="underline">SIDE VIEW</text>
  `;

  return createSvg(
     `<path d="${outlineLeft}" class="line" />` + weldLeft + f1 + f2 + f3 + clLeft + dimL + dimMd +
     circleRight + `<path d="${branchRight}" class="line" />` + weldRight + f4 + clRight + dimBd + dimBranchLen +
     titles,
     VIEW_WIDTH, VIEW_HEIGHT
  );
};

export const generateTransformation = (params: DuctParams) => {
    const cx = VIEW_BOX_SIZE / 2;
    const cy = VIEW_BOX_SIZE / 2;
    const realD = params.d1 || 500;
    const realS = params.height || 500; 
    const BASE_MAX = 200; 
    let D, S;
    if (realD >= realS) {
        D = BASE_MAX; S = BASE_MAX * (realS / realD);
    } else {
        S = BASE_MAX; D = BASE_MAX * (realD / realS);
    }
    D = Math.max(D, 80); S = Math.max(S, 80);
    const L = V_TRANS_LEN;
    const T = V_TRANS_TAN;
    const xLeft = cx - L/2;
    const xRight = cx + L/2;
    const xT1 = xLeft + T;
    const xT2 = xRight - T;
    const yRoundTop = cy - D/2;
    const yRoundBot = cy + D/2;
    const yRectTop = cy - S/2;
    const yRectBot = cy + S/2;
    
    const contour = `
        M${xLeft},${yRoundTop} L${xT1},${yRoundTop} L${xT2},${yRectTop} L${xRight},${yRectTop}
        M${xRight},${yRectBot} L${xT2},${yRectBot} L${xT1},${yRoundBot} L${xLeft},${yRoundBot}
        M${xLeft},${yRoundTop} L${xLeft},${yRoundBot}
        M${xRight},${yRectTop} L${xRight},${yRectBot}
    `;
    const center = `<line x1="${xLeft}" y1="${cy}" x2="${xRight}" y2="${cy}" class="center-line" />`;
    const crease = `
        <line x1="${xT1}" y1="${cy}" x2="${xT2}" y2="${yRectTop}" stroke="black" stroke-width="1" />
        <line x1="${xT1}" y1="${cy}" x2="${xT2}" y2="${yRectBot}" stroke="black" stroke-width="1" />
    `;
    const path = `<path d="${contour}" class="line" />`;
    const f1 = drawFlange(xLeft, cy, D, true);
    const f2 = drawFlange(xRight, cy, S, true);
    const dimD = drawDim(xLeft, yRoundTop, xLeft, yRoundBot, `Ø${params.d1 || 500}`, 'left');
    const dimS = drawDim(xRight, yRectTop, xRight, yRectBot, `${params.width || 500}x${params.height || 500}`, 'right');
    const dimL = drawDim(xLeft, yRectBot, xRight, yRectBot, `L=${params.length || 300}`, 'bottom');
    
    return createSvg(path + center + crease + f1 + f2 + dimD + dimS + dimL);
};
