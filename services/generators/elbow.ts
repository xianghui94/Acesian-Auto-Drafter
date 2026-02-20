
import { DuctParams } from "../../types";
import { createSvg, drawDim, drawFlange, drawRotatedFlange, drawArrow, drawAnnotation, V_CONSTANTS, VIEW_BOX_SIZE } from "../svgUtils";

export const generateElbow = (params: DuctParams, activeField: string | null = null) => {
  const VIEW_WIDTH = VIEW_BOX_SIZE;
  const VIEW_HEIGHT = 500;
  
  const angle = params.angle || 90;
  const D_real = params.d1 || 500;
  const extReal1 = params.extension1 || 0;
  const extReal2 = params.extension2 || 0;
  
  // Logic from AI agent: Radius defaults to 0.5D or 1.0D if not specified
  const valInnerR = params.radius !== undefined ? params.radius : ((D_real < 200) ? D_real * 1.0 : D_real * 0.5);

  // SCHEMATIC CLAMPING
  // 1. Clamp Diameter
  const V_D = Math.min(D_real, V_CONSTANTS.MAX_DIAM);
  
  // 2. Scale Radius relative to Clamped D
  const rRatio = valInnerR / D_real;
  const V_R_Inner = V_D * rRatio;
  const V_R_Outer = V_R_Inner + V_D;
  const V_R_Center = V_R_Inner + V_D/2;

  // 3. Scale Extensions (Clamp max visual length for extensions)
  const MAX_V_EXT = 100;
  // If ext is large (e.g. 500), we clamp it to 100px.
  // If ext is small (e.g. 50), we show it somewhat proportionally or min 20.
  const calcVExt = (realExt: number) => {
      if (realExt <= 0) return 0;
      if (realExt > D_real) return MAX_V_EXT; // Very long extension
      return (realExt / D_real) * V_D;
  };

  const V_EXT1 = calcVExt(extReal1);
  const V_EXT2 = calcVExt(extReal2);

  const T = 0; 
  const xStart = 250; 
  const y0 = 100; 
  
  const xCurveStart = xStart + V_EXT1; 
  const cx = xCurveStart + T; 
  const cy = y0 + V_R_Outer; 
  
  const startRad = -Math.PI / 2;
  const sweepRad = (angle * Math.PI) / 180;
  const endRad = startRad + sweepRad;

  // Segment logic for smooth arc
  let numSegments = 2; 
  if (angle === 90) numSegments = 5;
  else if (angle >= 60) numSegments = 4;
  else if (angle >= 30) numSegments = 3;

  const ptsOuter = [];
  const ptsInner = [];
  const ptsCenter = [];

  for (let i = 0; i <= numSegments; i++) {
    const frac = i / numSegments;
    const theta = startRad + (sweepRad * frac);
    const cos = Math.cos(theta);
    const sin = Math.sin(theta);
    
    ptsOuter.push({ x: cx + V_R_Outer * cos, y: cy + V_R_Outer * sin });
    ptsInner.push({ x: cx + V_R_Inner * cos, y: cy + V_R_Inner * sin });
    ptsCenter.push({ x: cx + V_R_Center * cos, y: cy + V_R_Center * sin });
  }

  const tanAngle = endRad + Math.PI / 2;
  const tx = Math.cos(tanAngle);
  const ty = Math.sin(tanAngle);
  
  const curveEndOut = ptsOuter[numSegments];
  const curveEndIn = ptsInner[numSegments];
  const curveEndC = ptsCenter[numSegments];
  
  const finalOut = { x: curveEndOut.x + V_EXT2 * tx, y: curveEndOut.y + V_EXT2 * ty };
  const finalIn = { x: curveEndIn.x + V_EXT2 * tx, y: curveEndIn.y + V_EXT2 * ty };
  const finalC = { x: curveEndC.x + V_EXT2 * tx, y: curveEndC.y + V_EXT2 * ty };

  let dOuter = `M${xStart},${y0} L${xCurveStart},${y0}`; 
  for (let i = 0; i <= numSegments; i++) dOuter += ` L${ptsOuter[i].x},${ptsOuter[i].y}`; 
  dOuter += ` L${finalOut.x},${finalOut.y}`; 

  let dInner = `M${xStart},${y0 + V_D} L${xCurveStart},${y0 + V_D}`; 
  for (let i = 0; i <= numSegments; i++) dInner += ` L${ptsInner[i].x},${ptsInner[i].y}`; 
  dInner += ` L${finalIn.x},${finalIn.y}`; 

  let dCenter = "";
  dCenter += `<line x1="${xStart}" y1="${y0 + V_D/2}" x2="${xCurveStart}" y2="${y0 + V_D/2}" class="phantom-line" />`;
  let dCenterArc = `M${ptsCenter[0].x},${ptsCenter[0].y}`;
  for (let i = 1; i <= numSegments; i++) dCenterArc += ` L${ptsCenter[i].x},${ptsCenter[i].y}`;
  dCenter += `<path d="${dCenterArc}" class="phantom-line" />`;
  dCenter += `<line x1="${curveEndC.x}" y1="${curveEndC.y}" x2="${finalC.x}" y2="${finalC.y}" class="phantom-line" />`;

  let seams = "";
  for (let i = 0; i <= numSegments; i++) {
    seams += `<line x1="${ptsInner[i].x}" y1="${ptsInner[i].y}" x2="${ptsOuter[i].x}" y2="${ptsOuter[i].y}" class="line" stroke-width="0.5" />`;
  }
  if (V_EXT1 > 0) seams += `<line x1="${xCurveStart}" y1="${y0}" x2="${xCurveStart}" y2="${y0 + V_D}" class="line" stroke-width="0.5" />`;
  if (V_EXT2 > 0) seams += `<line x1="${curveEndIn.x}" y1="${curveEndIn.y}" x2="${curveEndOut.x}" y2="${curveEndOut.y}" class="line" stroke-width="0.5" />`;

  const f1 = drawFlange(xStart, y0 + V_D/2, V_D, true);
  const endDeg = tanAngle * 180 / Math.PI;
  const f2 = drawRotatedFlange(finalC.x, finalC.y, V_D, endDeg);
  
  let remark1 = "";
  if (params.flangeRemark1) remark1 = drawAnnotation(xStart, y0, params.flangeRemark1, true, false, 60, false).svg;
  
  let remark2 = "";
  if (params.flangeRemark2) {
      const fRad = V_D/2; 
      const px = Math.cos(tanAngle - Math.PI/2);
      const py = Math.sin(tanAngle - Math.PI/2);
      const fx = finalC.x + fRad * px; 
      const fy = finalC.y + fRad * py;
      remark2 = drawAnnotation(fx, fy, params.flangeRemark2, false, true, 60, false).svg;
  }

  // Highlightable Dimensions
  const dimD = drawDim(xStart, y0, xStart, y0 + V_D, `D=${D_real}`, 'left', null, 'd1', activeField);
  
  let dimExt1 = "";
  if (V_EXT1 > 10 || extReal1 > 0) {
      dimExt1 = drawDim(xStart, y0, xCurveStart, y0, `${extReal1}`, 'top', 30, 'extension1', activeField);
  }

  let dimExt2 = "";
  if (V_EXT2 > 10 || extReal2 > 0) {
      const off = 30;
      const px = Math.cos(tanAngle - Math.PI/2);
      const py = Math.sin(tanAngle - Math.PI/2);
      const p1x = curveEndOut.x + off * px;
      const p1y = curveEndOut.y + off * py;
      const p2x = finalOut.x + off * px;
      const p2y = finalOut.y + off * py;
      const mx = (p1x + p2x) / 2;
      const my = (p1y + p2y) / 2;
      const rot = endDeg; 
      const arrow1 = drawArrow(p1x, p1y, rot + 180, activeField === 'extension2');
      const arrow2 = drawArrow(p2x, p2y, rot, activeField === 'extension2');
      const cls = activeField === 'extension2' ? 'dim-line highlight' : 'dim-line';
      const txtCls = activeField === 'extension2' ? 'dim-text highlight' : 'dim-text';
      
      dimExt2 = `
        <line x1="${curveEndOut.x}" y1="${curveEndOut.y}" x2="${p1x}" y2="${p1y}" class="${cls}" stroke-width="1" />
        <line x1="${finalOut.x}" y1="${finalOut.y}" x2="${p2x}" y2="${p2y}" class="${cls}" stroke-width="1" />
        <line x1="${p1x}" y1="${p1y}" x2="${p2x}" y2="${p2y}" class="${cls}" />
        <text x="${mx}" y="${my}" class="${txtCls}" text-anchor="middle" dominant-baseline="middle" transform="rotate(${rot}, ${mx}, ${my})" dy="-15">${extReal2}</text>
        ${arrow1} ${arrow2}
      `;
  }
  
  const midAngle = startRad + sweepRad / 2;
  const ix = cx + V_R_Inner * Math.cos(midAngle);
  const iy = cy + V_R_Inner * Math.sin(midAngle);
  const labelDist = Math.max(V_R_Inner - 40, 10);
  const lx = cx + labelDist * Math.cos(midAngle);
  const ly = cy + labelDist * Math.sin(midAngle);
  
  const isRActive = activeField === 'radius';
  const arrow = drawArrow(ix, iy, midAngle * 180 / Math.PI, isRActive);
  const rLine = `<line x1="${lx}" y1="${ly}" x2="${ix}" y2="${iy}" class="${isRActive?'dim-line highlight':'dim-line'}" />`;
  const rText = `<text x="${lx}" y="${ly}" class="${isRActive?'dim-text highlight':'dim-text'}" text-anchor="middle" dominant-baseline="middle" dy="20">R=${Number(valInnerR).toFixed(0)}</text>`;

  const body = `<path d="${dOuter}" class="line" /><path d="${dInner}" class="line" />`;
  
  return createSvg(body + dCenter + seams + f1 + f2 + dimD + dimExt1 + dimExt2 + rLine + arrow + rText + remark1 + remark2, VIEW_WIDTH, VIEW_HEIGHT);
};
