import { DuctParams } from "../../types";
import { createSvg, drawDim, drawFlange, drawAnnotation, VIEW_BOX_SIZE, V_CONSTANTS } from "../svgUtils";

const { LEN: V_LEN, DIAM: V_DIAM } = V_CONSTANTS;

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
  
  // Remarks
  let remark1 = "";
  if (params.flangeRemark1) {
      // Point to top of left flange. Style: Up, Left, Long Leader, Text Above Line.
      remark1 = drawAnnotation(x1, yTop, params.flangeRemark1, true, false, 80, false).svg;
  }
  
  let remark2 = "";
  if (params.flangeRemark2) {
      // Point to top of right flange. Style: Up, Right, Long Leader, Text Above Line.
      remark2 = drawAnnotation(x2, yTop, params.flangeRemark2, true, true, 80, false).svg;
  }
  
  const dimL = drawDim(x1, yBot, x2, yBot, `L=${params.length || 1000}`, 'bottom');
  const dimD = drawDim(x2, yTop, x2, yBot, `D=${params.d1 || 300}`, 'right');

  return createSvg(path + f1 + f2 + dimL + dimD + remark1 + remark2);
};