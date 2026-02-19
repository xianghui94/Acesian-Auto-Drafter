
import { DuctParams } from "../../types";
import { createSvg, drawDim, drawFlange, drawAnnotation } from "../svgUtils";
import { calculateRadialBranchPath } from "../geometry/branchMath";

export const generateTee = (params: DuctParams, activeField: string | null = null) => {
  const VIEW_WIDTH = 800;
  const VIEW_HEIGHT = 450; // Reduced from 500
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
  
  // Remarks
  let remark1 = "";
  if (params.flangeRemark1) {
      // Point to Bottom-Left corner of Main Body
      remark1 = drawAnnotation(xL_Left, yB_Left, params.flangeRemark1, false, false, 130, false).svg;
  }
  
  let remark2 = "";
  if (params.flangeRemark2) {
      // Point to Bottom-Right corner of Main Body
      remark2 = drawAnnotation(xR_Left, yB_Left, params.flangeRemark2, false, true, 130, false).svg;
  }
  
  let remark3 = "";
  if (params.flangeRemark3) {
      // Point to Top Center of Branch
      remark3 = drawAnnotation(cxLeft, yBranchTop, params.flangeRemark3, true).svg;
  }

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
  const dimL = drawDim(xL_Left, yB_Left, xR_Left, yB_Left, `L=${L}`, 'bottom', 65, 'length', activeField); 
  const dimMd = drawDim(xL_Left - 15, yT_Left, xL_Left - 15, yB_Left, `Ø${Md}`, 'left', null, 'main_d', activeField);
  
  // --- SIDE VIEW (Right) ---
  // Rotated 90 deg anticlockwise from Branch Up
  // Result: Main Circle, Branch Left (270 deg)
  
  // 1. Main Circle
  const circleRight = `<circle cx="${cxRight}" cy="${cy}" r="${V_MD/2}" class="line" />`;
  
  // 2. Branch using Geometry Engine (270 deg = Left)
  const geo = calculateRadialBranchPath(cxRight, cy, V_MD/2, V_BD/2, 270, V_NECK, false);
  
  // 3. Render Geometry
  // Draw branch body first, then flange on top
  const branchRight = `<path d="${geo.path}" class="line" fill="white" />`;
  // Flange at tip
  const f4 = drawFlange(geo.endPoint.x, geo.endPoint.y, V_BD, true);

  // Dimensions Side View
  const dimBd = drawDim(geo.endPoint.x, geo.endPoint.y - V_BD/2, geo.endPoint.x, geo.endPoint.y + V_BD/2, `Ø${Bd}`, 'left', null, 'tap_d', activeField);
  
  // Branch Length Dimension (Side View)
  const xMainEdge = cxRight - V_MD/2;
  const dimBranchLen = drawDim(geo.endPoint.x, geo.endPoint.y - V_BD/2, xMainEdge, geo.endPoint.y - V_BD/2, `${neckLen}`, 'top', 30, 'branch_l', activeField);
  
  // Center Lines Side View
  const clRight = `
     <line x1="${geo.endPoint.x-10}" y1="${cy}" x2="${cxRight+V_MD/2+10}" y2="${cy}" class="center-line" />
     <line x1="${cxRight}" y1="${cy-V_MD/2-10}" x2="${cxRight}" y2="${cy+V_MD/2+10}" class="center-line" />
  `;

  // Titles
  const titles = `
    <text x="${cxLeft}" y="${VIEW_HEIGHT - 30}" font-weight="bold" text-anchor="middle" font-size="18" text-decoration="underline">TOP VIEW</text>
    <text x="${cxRight}" y="${VIEW_HEIGHT - 30}" font-weight="bold" text-anchor="middle" font-size="18" text-decoration="underline">SIDE VIEW</text>
  `;

  return createSvg(
     `<path d="${outlineLeft}" class="line" />` + weldLeft + f1 + f2 + f3 + clLeft + dimL + dimMd + remark1 + remark2 + remark3 +
     circleRight + branchRight + f4 + clRight + dimBd + dimBranchLen +
     titles,
     VIEW_WIDTH, VIEW_HEIGHT
  );
};
