import { DuctParams } from "../../types";
import { createSvg, drawDim, drawFlange, drawAnnotation } from "../svgUtils";

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
  
  // Remarks
  let remark1 = "";
  if (params.flangeRemark1) {
      // Point to Bottom-Left corner of Main Body (moved from Top-Left)
      // FLIP TO LEFT: isRight = false
      // Move further down: leaderLength = 130, textBelow = false (keep text above line) to clear dim line
      remark1 = drawAnnotation(xL_Left, yB_Left, params.flangeRemark1, false, false, 130, false).svg;
  }
  
  let remark2 = "";
  if (params.flangeRemark2) {
      // Point to Bottom-Right corner of Main Body (moved from Top-Right)
      // Keep Right: isRight = true (default)
      // Move further down: leaderLength = 130, textBelow = false (keep text above line) to clear dim line
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
  const dimL = drawDim(xL_Left, yB_Left, xR_Left, yB_Left, `L=${L}`, 'bottom', 65); // Moved down slightly to avoid remark overlapping if any
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
     `<path d="${outlineLeft}" class="line" />` + weldLeft + f1 + f2 + f3 + clLeft + dimL + dimMd + remark1 + remark2 + remark3 +
     circleRight + `<path d="${branchRight}" class="line" />` + weldRight + f4 + clRight + dimBd + dimBranchLen +
     titles,
     VIEW_WIDTH, VIEW_HEIGHT
  );
};