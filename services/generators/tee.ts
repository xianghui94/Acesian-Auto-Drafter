
import { DuctParams } from "../../types";
import { createSvg, drawDim, drawFlange, drawAnnotation, V_CONSTANTS } from "../svgUtils";
import { calculateRadialBranchPath } from "../geometry/branchMath";

export const generateTee = (params: DuctParams, activeField: string | null = null) => {
  const VIEW_WIDTH = 1000; // Increased width for better separation
  const VIEW_HEIGHT = 600; 
  const cy = 350; 
  
  // Separation: Left centered at 250, Right at 750
  const cxLeft = 250; 
  const cxRight = 750; 

  const Md = params.main_d || 500;
  const Bd = params.tap_d || 300;
  const L = params.length || (Bd + 200);
  const neckLen = params.branch_l || 100; 

  const V_MD = Math.min(Md, V_CONSTANTS.MAX_DIAM);
  let V_BD = Math.min(Bd, V_CONSTANTS.MAX_DIAM);
  if (Bd < Md) {
      V_BD = V_MD * (Bd/Md);
  }
  const V_L = Math.min(L, V_CONSTANTS.MAX_LEN);
  const V_NECK = Math.min(neckLen, V_CONSTANTS.BRANCH_MAX_LEN);
  
  // --- TOP VIEW (Left) ---
  const xL_Left = cxLeft - V_L/2;
  const xR_Left = cxLeft + V_L/2;
  const yT_Left = cy - V_MD/2;
  const yB_Left = cy + V_MD/2;

  const xBranchL = cxLeft - V_BD/2;
  const xBranchR = cxLeft + V_BD/2;
  const yBranchTop = yT_Left - V_NECK;

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

  const f1 = drawFlange(xL_Left, cy, V_MD, true);
  const f2 = drawFlange(xR_Left, cy, V_MD, true);
  const f3 = drawFlange(cxLeft, yBranchTop, V_BD, false);
  
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

  const rMain = V_MD / 2;
  const rBranch = V_BD / 2;
  const dip = rMain - Math.sqrt(Math.max(0, rMain*rMain - rBranch*rBranch));
  const weldLeft = `<path d="M${xBranchL},${yT_Left} Q${cxLeft},${yT_Left + dip*2} ${xBranchR},${yT_Left}" fill="none" stroke="black" stroke-width="1" />`;
  
  const clLeft = `
    <line x1="${xL_Left-10}" y1="${cy}" x2="${xR_Left+10}" y2="${cy}" class="center-line" />
    <line x1="${cxLeft}" y1="${yBranchTop-10}" x2="${cxLeft}" y2="${yB_Left+10}" class="center-line" />
  `;

  const dimL = drawDim(xL_Left, yB_Left, xR_Left, yB_Left, `L=${L}`, 'bottom', 65, 'length', activeField); 
  const dimMd = drawDim(xL_Left - 15, yT_Left, xL_Left - 15, yB_Left, `Ø${Md}`, 'left', null, 'main_d', activeField);
  
  // --- SIDE VIEW (Right) ---
  const circleRight = `<circle cx="${cxRight}" cy="${cy}" r="${V_MD/2}" class="line" />`;
  const geo = calculateRadialBranchPath(cxRight, cy, V_MD/2, V_BD/2, 270, V_NECK, false);
  const branchRight = `<path d="${geo.path}" class="line" fill="white" />`;
  const f4 = drawFlange(geo.endPoint.x, geo.endPoint.y, V_BD, true);

  const dimBd = drawDim(geo.endPoint.x, geo.endPoint.y - V_BD/2, geo.endPoint.x, geo.endPoint.y + V_BD/2, `Ø${Bd}`, 'left', null, 'tap_d', activeField);
  
  const xMainEdge = cxRight - V_MD/2;
  const dimBranchLen = drawDim(geo.endPoint.x, geo.endPoint.y - V_BD/2, xMainEdge, geo.endPoint.y - V_BD/2, `${neckLen}`, 'top', 30, 'branch_l', activeField);
  
  const clRight = `
     <line x1="${geo.endPoint.x-10}" y1="${cy}" x2="${cxRight+V_MD/2+10}" y2="${cy}" class="center-line" />
     <line x1="${cxRight}" y1="${cy-V_MD/2-10}" x2="${cxRight}" y2="${cy+V_MD/2+10}" class="center-line" />
  `;

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
