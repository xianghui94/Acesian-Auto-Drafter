import { DuctParams } from "../../types";
import { createSvg, drawDim, drawFlange, drawAnnotation, VIEW_BOX_SIZE, V_CONSTANTS } from "../svgUtils";

const { LEN: V_LEN, DIAM_LG: V_DIAM_LG, DIAM_SM: V_DIAM_SM, REDUCER_STRAIGHT: V_REDUCER_STRAIGHT } = V_CONSTANTS;

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
  
  const dimL = drawDim(xLeft, y1Bot, xRight, y2Bot, `L=${params.length || 500}`, 'bottom');
  const dimD1 = drawDim(xLeft, y1Top, xLeft, y1Bot, `D1=${params.d1 || 500}`, 'left'); 
  const dimD2 = drawDim(xRight, y2Top, xRight, y2Bot, `D2=${params.d2 || 300}`, 'right');

  return createSvg(path + markers + dash + f1 + f2 + dimL + dimD1 + dimD2 + remark1 + remark2);
};