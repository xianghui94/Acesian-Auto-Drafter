
import { DuctParams } from "../../types";
import { createSvg, drawDim, drawFlange, drawAnnotation, VIEW_BOX_SIZE, V_CONSTANTS } from "../svgUtils";

export const generateStraight = (params: DuctParams, activeField: string | null = null) => {
  const VIEW_WIDTH = VIEW_BOX_SIZE;
  const VIEW_HEIGHT = 350;
  const cx = VIEW_WIDTH / 2;
  const cy = VIEW_HEIGHT / 2;
  
  const realL = params.length || 1000;
  const realD = params.d1 || 300;

  // SCHEMATIC CLAMPING
  // Clamp visual dimensions to prevent overflow
  const V_L = Math.min(realL, V_CONSTANTS.MAX_LEN);
  const V_D = Math.min(realD, V_CONSTANTS.MAX_DIAM);

  const x1 = cx - V_L/2;
  const x2 = cx + V_L/2;
  const yTop = cy - V_D/2;
  const yBot = cy + V_D/2;
  
  const path = `<path d="M${x1},${yTop} L${x2},${yTop} M${x1},${yBot} L${x2},${yBot}" class="line" />`;
  const f1 = drawFlange(x1, cy, V_D, true);
  const f2 = drawFlange(x2, cy, V_D, true);
  
  // Remarks
  let remark1 = "";
  if (params.flangeRemark1) {
      remark1 = drawAnnotation(x1, yTop, params.flangeRemark1, true, false, 80, false).svg;
  }
  
  let remark2 = "";
  if (params.flangeRemark2) {
      remark2 = drawAnnotation(x2, yTop, params.flangeRemark2, true, true, 80, false).svg;
  }
  
  const dimL = drawDim(x1, yBot, x2, yBot, `L=${realL}`, 'bottom', null, 'length', activeField);
  const dimD = drawDim(x2, yTop, x2, yBot, `D=${realD}`, 'right', null, 'd1', activeField);

  return createSvg(path + f1 + f2 + dimL + dimD + remark1 + remark2, VIEW_WIDTH, VIEW_HEIGHT);
};
