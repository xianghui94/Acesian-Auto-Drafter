import { DuctParams } from "../../types";
import { createSvg, drawDim, drawFlange, drawAnnotation, VIEW_BOX_SIZE, V_CONSTANTS } from "../svgUtils";

const { LEN: V_LEN, DIAM_LG: V_DIAM_LG, DIAM_SM: V_DIAM_SM } = V_CONSTANTS;

export const generateReducer = (params: DuctParams) => {
  const cx = VIEW_BOX_SIZE / 2;
  const cy = VIEW_BOX_SIZE / 2;
  
  // Real dimensions
  const realL = params.length || 500;
  const realRC1 = params.extension1 !== undefined ? params.extension1 : 50; // Left (D1)
  const realRC2 = params.extension2 !== undefined ? params.extension2 : 50; // Right (D2)
  const realD1 = params.d1 || 500;
  const realD2 = params.d2 || 300;

  // Visual Geometry
  const L = V_LEN; // Fixed visual total length
  const D1 = V_DIAM_LG;
  const D2 = V_DIAM_SM;
  
  // Calculate visual lengths of RC1 and RC2 based on proportion to Real L
  // Note: If realL is very small, we might have issues, but assuming standard inputs.
  const scale = L / realL;
  let V_RC1 = realRC1 * scale;
  let V_RC2 = realRC2 * scale;
  
  // Safety clamp to ensure tapered section exists visually
  const minTaper = 40;
  if (V_RC1 + V_RC2 > L - minTaper) {
      // If extensions overlap, scale them down visually to fit
      const factor = (L - minTaper) / (V_RC1 + V_RC2);
      V_RC1 *= factor;
      V_RC2 *= factor;
  }
  
  const xLeft = cx - L/2;
  const xRight = cx + L/2;
  const xTransStart = xLeft + V_RC1;
  const xTransEnd = xRight - V_RC2;
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
  
  // Flanges
  const f1 = drawFlange(xLeft, cy, D1, true);
  const f2 = drawFlange(xRight, cy, D2, true);
  
  // Remarks
  let remark1 = "";
  if (params.flangeRemark1) {
      // Point to top of left flange, Text Above Line
      remark1 = drawAnnotation(xLeft, y1Top, params.flangeRemark1, true, false, 80, false).svg;
  }
  
  let remark2 = "";
  if (params.flangeRemark2) {
      // Point to top of right flange, Text Above Line
      remark2 = drawAnnotation(xRight, y2Top, params.flangeRemark2, true, true, 80, false).svg;
  }
  
  // Dimensions
  const dimL = drawDim(xLeft, y1Bot, xRight, y2Bot, `L=${realL}`, 'bottom', 60);
  const dimD1 = drawDim(xLeft, y1Top, xLeft, y1Bot, `D1=${realD1}`, 'left'); 
  const dimD2 = drawDim(xRight, y2Top, xRight, y2Bot, `D2=${realD2}`, 'right');

  // RC1 and RC2 Dimensions (Top)
  let dimRC1 = "";
  let dimRC2 = "";
  
  // Only draw if length is significant enough AND not equal to default (50)
  if (V_RC1 > 10 && realRC1 !== 50) {
      dimRC1 = drawDim(xLeft, y1Top, xTransStart, y1Top, `RC1=${realRC1}`, 'top', 30);
  }
  if (V_RC2 > 10 && realRC2 !== 50) {
      dimRC2 = drawDim(xTransEnd, y2Top, xRight, y2Top, `RC2=${realRC2}`, 'top', 30);
  }

  return createSvg(path + markers + dash + f1 + f2 + dimL + dimD1 + dimD2 + dimRC1 + dimRC2 + remark1 + remark2);
};