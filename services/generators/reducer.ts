import { DuctParams } from "../../types";
import { createSvg, drawDim, drawFlange, drawAnnotation, VIEW_BOX_SIZE, V_CONSTANTS } from "../svgUtils";

const { LEN: V_LEN, DIAM_LG: V_DIAM_LG, DIAM_SM: V_DIAM_SM } = V_CONSTANTS;

export const generateReducer = (params: DuctParams, activeField: string | null = null) => {
  const VIEW_WIDTH = VIEW_BOX_SIZE;
  const VIEW_HEIGHT = 500; // Reduced from 800
  const cx = VIEW_WIDTH / 2;
  const cy = VIEW_HEIGHT / 2;
  const isEccentric = params.reducerType === "Eccentric";
  
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
  
  let y1Top, y1Bot, y2Top, y2Bot;
  let centerLines = "";

  if (isEccentric) {
      // Flat Bottom Alignment for Eccentric
      // Align bottom edges of D1 and D2
      const maxR = Math.max(D1/2, D2/2);
      // We push it slightly up from bottom to fit remarks
      const bottomY = cy + maxR - 20; 
      
      y1Bot = bottomY;
      y1Top = bottomY - D1;
      
      y2Bot = bottomY;
      y2Top = bottomY - D2;

      // Calculate vertical centers for flanges
      const cy1 = (y1Top + y1Bot) / 2;
      const cy2 = (y2Top + y2Bot) / 2;

      centerLines = `
        <line x1="${xLeft}" y1="${cy1}" x2="${xTransStart}" y2="${cy1}" class="center-line" />
        <line x1="${xTransEnd}" y1="${cy2}" x2="${xRight}" y2="${cy2}" class="center-line" />
        <line x1="${xTransStart}" y1="${cy1}" x2="${xTransEnd}" y2="${cy2}" class="center-line" />
      `;
  } else {
      // Concentric Alignment
      y1Top = cy - D1/2;
      y1Bot = cy + D1/2;
      y2Top = cy - D2/2;
      y2Bot = cy + D2/2;

      centerLines = `<line x1="${xLeft}" y1="${cy}" x2="${xRight}" y2="${cy}" class="center-line" />`;
  }
  
  const dTop = `M${xLeft},${y1Top} L${xTransStart},${y1Top} L${xTransEnd},${y2Top} L${xRight},${y2Top}`;
  const dBot = `M${xLeft},${y1Bot} L${xTransStart},${y1Bot} L${xTransEnd},${y2Bot} L${xRight},${y2Bot}`;
  const dMark1 = `M${xTransStart},${y1Top} L${xTransStart},${y1Bot}`;
  const dMark2 = `M${xTransEnd},${y2Top} L${xTransEnd},${y2Bot}`;

  const path = `<path d="${dTop} ${dBot}" class="line" />`;
  const markers = `<path d="${dMark1} ${dMark2}" fill="none" stroke="black" stroke-width="0.5" stroke-dasharray="2,2" />`;
  
  // Flanges
  const cy1 = (y1Top + y1Bot) / 2;
  const cy2 = (y2Top + y2Bot) / 2;
  
  const f1 = drawFlange(xLeft, cy1, D1, true);
  const f2 = drawFlange(xRight, cy2, D2, true);
  
  // Remarks
  let remark1 = "";
  if (params.flangeRemark1) {
      remark1 = drawAnnotation(xLeft, y1Top, params.flangeRemark1, true, false, 80, false).svg;
  }
  
  let remark2 = "";
  if (params.flangeRemark2) {
      remark2 = drawAnnotation(xRight, y2Top, params.flangeRemark2, true, true, 80, false).svg;
  }
  
  // Dimensions
  const yDimBot = Math.max(y1Bot, y2Bot);
  const dimL = drawDim(xLeft, yDimBot, xRight, yDimBot, `L=${realL}`, 'bottom', 60, 'length', activeField);
  const dimD1 = drawDim(xLeft, y1Top, xLeft, y1Bot, `D1=${realD1}`, 'left', null, 'd1', activeField); 
  const dimD2 = drawDim(xRight, y2Top, xRight, y2Bot, `D2=${realD2}`, 'right', null, 'd2', activeField);

  // RC1 and RC2 Dimensions (Top)
  let dimRC1 = "";
  let dimRC2 = "";
  
  if (V_RC1 > 10 && realRC1 !== 50) {
      dimRC1 = drawDim(xLeft, y1Top, xTransStart, y1Top, `RC1=${realRC1}`, 'top', 30, 'extension1', activeField);
  }
  if (V_RC2 > 10 && realRC2 !== 50) {
      dimRC2 = drawDim(xTransEnd, y2Top, xRight, y2Top, `RC2=${realRC2}`, 'top', 30, 'extension2', activeField);
  }

  return createSvg(path + markers + centerLines + f1 + f2 + dimL + dimD1 + dimD2 + dimRC1 + dimRC2 + remark1 + remark2, VIEW_WIDTH, VIEW_HEIGHT);
};