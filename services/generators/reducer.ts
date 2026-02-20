
import { DuctParams } from "../../types";
import { createSvg, drawDim, drawFlange, drawAnnotation, VIEW_BOX_SIZE, V_CONSTANTS } from "../svgUtils";

export const generateReducer = (params: DuctParams, activeField: string | null = null) => {
  const VIEW_WIDTH = VIEW_BOX_SIZE;
  const VIEW_HEIGHT = 500;
  const cx = VIEW_WIDTH / 2;
  const cy = VIEW_HEIGHT / 2;
  const isEccentric = params.reducerType === "Eccentric";
  
  // Real dimensions
  const realL = params.length || 500;
  const realRC1 = params.extension1 !== undefined ? params.extension1 : 50; 
  const realRC2 = params.extension2 !== undefined ? params.extension2 : 50;
  const realD1 = params.d1 || 500;
  const realD2 = params.d2 || 300;

  // SCHEMATIC CLAMPING
  // 1. Clamp main diameters
  const V_D1 = Math.min(realD1, V_CONSTANTS.MAX_DIAM);
  
  // 2. Logic to ensure visual difference even if real difference is small (e.g. 5mm)
  // Calculate proportional V_D2
  let V_D2 = (realD2 / realD1) * V_D1;
  
  // Enforce Schematic Limits
  const MIN_VISUAL_STEP = 30; // Minimum pixel difference to look "reduced"
  
  if (realD1 > realD2) {
      // D1 is bigger. Ensure V_D2 is noticeably smaller.
      if (V_D1 - V_D2 < MIN_VISUAL_STEP) {
          V_D2 = V_D1 - MIN_VISUAL_STEP;
      }
  } else if (realD2 > realD1) {
      // D2 is bigger. 
      // First clamp V_D2 to max
      V_D2 = Math.min(realD2, V_CONSTANTS.MAX_DIAM);
      // Ensure V_D1 is noticeably smaller than V_D2
      if (V_D2 - V_D1 < MIN_VISUAL_STEP) {
          // If V_D2 is already maxed, shrink V_D1
          // If V_D1 is maxed, shrink it
          // Basically ensure delta
          const targetD1 = V_D2 - MIN_VISUAL_STEP;
          // But V_D1 was calculated based on D1/MaxD1. 
          // We override for schematic purpose.
          // Since we use const V_D1 above, we might need to adjust variables.
          // Let's just adjust V_D2 up if space allows, or V_D1 down?
          // Simpler: Just make sure |V_D1 - V_D2| >= Step.
          // Since we defined V_D1 first, let's redefine V_D2 relative to it or adjust drawing.
      }
  }
  
  // Re-evaluation for simplicity:
  // Calculate both proportional to MAX_DIAM
  const maxReal = Math.max(realD1, realD2);
  let vD1_Draw = (realD1 / maxReal) * V_CONSTANTS.MAX_DIAM;
  let vD2_Draw = (realD2 / maxReal) * V_CONSTANTS.MAX_DIAM;
  
  // Enforce min step
  if (realD1 !== realD2 && Math.abs(vD1_Draw - vD2_Draw) < MIN_VISUAL_STEP) {
      if (realD1 > realD2) {
          vD2_Draw = vD1_Draw - MIN_VISUAL_STEP;
      } else {
          vD1_Draw = vD2_Draw - MIN_VISUAL_STEP;
      }
  }
  
  // 3. Clamp Total Length
  const V_L = Math.min(realL, V_CONSTANTS.MAX_LEN);

  let v_rc1 = (realRC1 / realL) * V_L;
  let v_rc2 = (realRC2 / realL) * V_L;
  
  const minTaper = 50;
  if (v_rc1 + v_rc2 > V_L - minTaper) {
      const scale = (V_L - minTaper) / (v_rc1 + v_rc2);
      v_rc1 *= scale;
      v_rc2 *= scale;
  }

  const xLeft = cx - V_L/2;
  const xRight = cx + V_L/2;
  const xTransStart = xLeft + v_rc1;
  const xTransEnd = xRight - v_rc2;
  
  let y1Top, y1Bot, y2Top, y2Bot;
  let centerLines = "";

  if (isEccentric) {
      const maxR = Math.max(vD1_Draw/2, vD2_Draw/2);
      const bottomY = cy + maxR - 20; 
      
      y1Bot = bottomY;
      y1Top = bottomY - vD1_Draw;
      
      y2Bot = bottomY;
      y2Top = bottomY - vD2_Draw;

      const cy1 = (y1Top + y1Bot) / 2;
      const cy2 = (y2Top + y2Bot) / 2;

      centerLines = `
        <line x1="${xLeft}" y1="${cy1}" x2="${xTransStart}" y2="${cy1}" class="center-line" />
        <line x1="${xTransEnd}" y1="${cy2}" x2="${xRight}" y2="${cy2}" class="center-line" />
        <line x1="${xTransStart}" y1="${cy1}" x2="${xTransEnd}" y2="${cy2}" class="center-line" />
      `;
  } else {
      y1Top = cy - vD1_Draw/2;
      y1Bot = cy + vD1_Draw/2;
      y2Top = cy - vD2_Draw/2;
      y2Bot = cy + vD2_Draw/2;

      centerLines = `<line x1="${xLeft}" y1="${cy}" x2="${xRight}" y2="${cy}" class="center-line" />`;
  }
  
  const dTop = `M${xLeft},${y1Top} L${xTransStart},${y1Top} L${xTransEnd},${y2Top} L${xRight},${y2Top}`;
  const dBot = `M${xLeft},${y1Bot} L${xTransStart},${y1Bot} L${xTransEnd},${y2Bot} L${xRight},${y2Bot}`;
  const dMark1 = `M${xTransStart},${y1Top} L${xTransStart},${y1Bot}`;
  const dMark2 = `M${xTransEnd},${y2Top} L${xTransEnd},${y2Bot}`;

  const path = `<path d="${dTop} ${dBot}" class="line" />`;
  const markers = `<path d="${dMark1} ${dMark2}" fill="none" stroke="black" stroke-width="0.5" stroke-dasharray="2,2" />`;
  
  const cy1 = (y1Top + y1Bot) / 2;
  const cy2 = (y2Top + y2Bot) / 2;
  
  const f1 = drawFlange(xLeft, cy1, vD1_Draw, true);
  const f2 = drawFlange(xRight, cy2, vD2_Draw, true);
  
  let remark1 = "";
  if (params.flangeRemark1) {
      remark1 = drawAnnotation(xLeft, y1Top, params.flangeRemark1, true, false, 80, false).svg;
  }
  
  let remark2 = "";
  if (params.flangeRemark2) {
      remark2 = drawAnnotation(xRight, y2Top, params.flangeRemark2, true, true, 80, false).svg;
  }
  
  const yDimBot = Math.max(y1Bot, y2Bot);
  const dimL = drawDim(xLeft, yDimBot, xRight, yDimBot, `L=${realL}`, 'bottom', 60, 'length', activeField);
  const dimD1 = drawDim(xLeft, y1Top, xLeft, y1Bot, `D1=${realD1}`, 'left', null, 'd1', activeField); 
  const dimD2 = drawDim(xRight, y2Top, xRight, y2Bot, `D2=${realD2}`, 'right', null, 'd2', activeField);

  let dimRC1 = "";
  let dimRC2 = "";
  
  if (v_rc1 > 15 && realRC1 !== 50) {
      dimRC1 = drawDim(xLeft, y1Top, xTransStart, y1Top, `RC1=${realRC1}`, 'top', 30, 'extension1', activeField);
  }
  if (v_rc2 > 15 && realRC2 !== 50) {
      dimRC2 = drawDim(xTransEnd, y2Top, xRight, y2Top, `RC2=${realRC2}`, 'top', 30, 'extension2', activeField);
  }

  return createSvg(path + markers + centerLines + f1 + f2 + dimL + dimD1 + dimD2 + dimRC1 + dimRC2 + remark1 + remark2, VIEW_WIDTH, VIEW_HEIGHT);
};
