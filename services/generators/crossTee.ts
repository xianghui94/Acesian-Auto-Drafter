
import { DuctParams } from "../../types";
import { createSvg, drawDim, drawFlange, drawAnnotation } from "../svgUtils";
import { calculateRadialBranchPath } from "../geometry/branchMath";

export const generateCrossTee = (params: DuctParams, activeField: string | null = null) => {
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
  const V_MD = 120;
  const scale = V_MD / Md;
  const V_BD = Bd * scale;
  const V_L = L * scale;
  const V_NECK = neckLen * scale;

  // --- TOP VIEW (Left) ---
  const xL_Left = cxLeft - V_L/2;
  const xR_Left = cxLeft + V_L/2;
  const yT_Left = cy - V_MD/2;
  const yB_Left = cy + V_MD/2;

  const xBranchL = cxLeft - V_BD/2;
  const xBranchR = cxLeft + V_BD/2;
  const yBranchTop = yT_Left - V_NECK;
  const yBranchBot = yB_Left + V_NECK;

  const outlineLeft = `
    M${xL_Left},${yB_Left} 
    L${xL_Left},${yT_Left} 
    L${xBranchL},${yT_Left} 
    L${xBranchL},${yBranchTop} 
    L${xBranchR},${yBranchTop} 
    L${xBranchR},${yT_Left} 
    L${xR_Left},${yT_Left} 
    L${xR_Left},${yB_Left} 
    L${xBranchR},${yB_Left}
    L${xBranchR},${yBranchBot}
    L${xBranchL},${yBranchBot}
    L${xBranchL},${yB_Left}
    Z
  `;

  // Flanges Top View
  const f1 = drawFlange(xL_Left, cy, V_MD, true); 
  const f2 = drawFlange(xR_Left, cy, V_MD, true); 
  const f3 = drawFlange(cxLeft, yBranchTop, V_BD, false); 
  const f4 = drawFlange(cxLeft, yBranchBot, V_BD, false); 
  
  // Remarks
  let remark1 = "";
  if (params.flangeRemark1) {
      remark1 = drawAnnotation(xL_Left, yB_Left, params.flangeRemark1, false, false, 130, false).svg;
  }
  
  let remark2 = "";
  if (params.flangeRemark2) {
      remark2 = drawAnnotation(xR_Left, yB_Left, params.flangeRemark2, false, true, 130, false).svg;
  }
  
  let remark3 = "";
  if (params.flangeRemark3) {
      remark3 = drawAnnotation(cxLeft, yBranchTop, params.flangeRemark3, true).svg;
  }

  let remark4 = "";
  if (params.flangeRemark4) {
      remark4 = drawAnnotation(cxLeft, yBranchBot, params.flangeRemark4, false, true, 60).svg;
  }

  // Weld Line
  const rMain = V_MD / 2;
  const rBranch = V_BD / 2;
  const dip = rMain - Math.sqrt(Math.max(0, rMain*rMain - rBranch*rBranch));
  
  const weldTop = `<path d="M${xBranchL},${yT_Left} Q${cxLeft},${yT_Left + dip*2} ${xBranchR},${yT_Left}" fill="none" stroke="black" stroke-width="1" />`;
  const weldBot = `<path d="M${xBranchL},${yB_Left} Q${cxLeft},${yB_Left - dip*2} ${xBranchR},${yB_Left}" fill="none" stroke="black" stroke-width="1" />`;
  
  const clLeft = `
    <line x1="${xL_Left-10}" y1="${cy}" x2="${xR_Left+10}" y2="${cy}" class="center-line" />
    <line x1="${cxLeft}" y1="${yBranchTop-10}" x2="${cxLeft}" y2="${yBranchBot+10}" class="center-line" />
  `;

  const dimL = drawDim(xL_Left, yB_Left, xR_Left, yB_Left, `L=${L}`, 'bottom', 65, 'length', activeField);
  const dimMd = drawDim(xL_Left - 15, yT_Left, xL_Left - 15, yB_Left, `Ø${Md}`, 'left', null, 'main_d', activeField);
  
  // --- SIDE VIEW (Right) ---
  
  // Main Circle
  const circleRight = `<circle cx="${cxRight}" cy="${cy}" r="${V_MD/2}" class="line" />`;
  
  // Left Branch (270 deg)
  const geoLeft = calculateRadialBranchPath(cxRight, cy, V_MD/2, V_BD/2, 270, V_NECK, false);
  // Right Branch (90 deg)
  const geoRight = calculateRadialBranchPath(cxRight, cy, V_MD/2, V_BD/2, 90, V_NECK, false);
  
  const branchLeft = `<path d="${geoLeft.path}" class="line" fill="white" />`;
  const branchRight = `<path d="${geoRight.path}" class="line" fill="white" />`;
  
  const f5 = drawFlange(geoLeft.endPoint.x, geoLeft.endPoint.y, V_BD, true);
  const f6 = drawFlange(geoRight.endPoint.x, geoRight.endPoint.y, V_BD, true);

  // Dimensions Side View
  const dimBd = drawDim(geoLeft.endPoint.x, geoLeft.endPoint.y - V_BD/2, geoLeft.endPoint.x, geoLeft.endPoint.y + V_BD/2, `Ø${Bd}`, 'left', null, 'tap_d', activeField);
  
  const xMainEdgeLeft = cxRight - V_MD/2;
  const dimBranchLen = drawDim(geoLeft.endPoint.x, geoLeft.endPoint.y - V_BD/2, xMainEdgeLeft, geoLeft.endPoint.y - V_BD/2, `${neckLen}`, 'top', 30, 'branch_l', activeField);
  
  const clRight = `
     <line x1="${geoLeft.endPoint.x-10}" y1="${cy}" x2="${geoRight.endPoint.x+10}" y2="${cy}" class="center-line" />
     <line x1="${cxRight}" y1="${cy-V_MD/2-10}" x2="${cxRight}" y2="${cy+V_MD/2+10}" class="center-line" />
  `;

  const titles = `
    <text x="${cxLeft}" y="${VIEW_HEIGHT - 30}" font-weight="bold" text-anchor="middle" font-size="18" text-decoration="underline">TOP VIEW</text>
    <text x="${cxRight}" y="${VIEW_HEIGHT - 30}" font-weight="bold" text-anchor="middle" font-size="18" text-decoration="underline">SIDE VIEW</text>
  `;

  return createSvg(
     `<path d="${outlineLeft}" class="line" />` + weldTop + weldBot + f1 + f2 + f3 + f4 + clLeft + dimL + dimMd + remark1 + remark2 + remark3 + remark4 +
     circleRight + branchLeft + branchRight + f5 + f6 + clRight + dimBd + dimBranchLen +
     titles,
     VIEW_WIDTH, VIEW_HEIGHT
  );
};
