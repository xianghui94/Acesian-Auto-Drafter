import { DuctParams } from "../../types";
import { createSvg, drawDim, drawFlange, drawRotatedFlange, drawArrow, drawAnnotation, V_CONSTANTS } from "../svgUtils";

export const generateElbow = (params: DuctParams) => {
  const angle = params.angle || 90;
  const D_real = params.d1 || 500;
  const extReal1 = params.extension1 || 0;
  const extReal2 = params.extension2 || 0;
  
  // R Calculation (Inner Radius)
  // Default logic: If D < 200, R_inner ~ 1.0D (Center ~1.5D)
  //                If D >= 200, R_inner ~ 0.5D (Center ~1.0D)
  const valInnerR = params.radius !== undefined ? params.radius : ((D_real < 200) ? D_real * 1.0 : D_real * 0.5);
  
  // Visual Scaling based on shape ratio (R_inner / D)
  const rRatio = valInnerR / D_real;

  const V_D = V_CONSTANTS.DIAM;
  const V_R_Inner = V_D * rRatio;
  const V_R_Outer = V_R_Inner + V_D;
  const V_R_Center = V_R_Inner + V_D/2;
  
  // Extension Visual Scaling
  const V_EXT1 = (extReal1 / D_real) * V_D;
  const V_EXT2 = (extReal2 / D_real) * V_D;

  // Layout Constants
  const T = 0; // Tangent length for curve itself
  const xStart = 80; // Starting Flange Position (Fixed to ensure it fits on page)
  const y0 = 160; // Top Y position of horizontal leg
  
  // Coordinates for Curve Start
  const xCurveStart = xStart + V_EXT1; 
  const cx = xCurveStart + T; // Pivot point X (relative to start of curve)
  const cy = y0 + V_R_Outer; // Pivot point Y
  
  // Angles (in radians)
  const startRad = -Math.PI / 2;
  const sweepRad = (angle * Math.PI) / 180;
  const endRad = startRad + sweepRad;

  // Segment Calculation based on specific rules
  let numSegments = 2; // safety fallback
  if (angle === 90) {
      numSegments = (D_real <= 150) ? 4 : 5;
  } else if (angle === 60) {
      numSegments = (D_real <= 150) ? 2 : 4;
  } else if (angle === 45) {
      numSegments = (D_real <= 150) ? 2 : 3;
  } else if (angle === 30) {
      numSegments = (D_real <= 950) ? 2 : 3;
  } else {
      if (angle > 60) numSegments = 4;
      else if (angle > 30) numSegments = 3;
      else numSegments = 2;
  }

  // Generate Arc Points
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

  // Calculate Curve End Points (Tangential Limit)
  // endRad corresponds to the angle at the end of the sweep
  // The tangent vector points perpendicular to radius.
  // Radius Vector: (cos(endRad), sin(endRad))
  // Tangent Vector: (cos(endRad + PI/2), sin(endRad + PI/2))
  
  const tanAngle = endRad + Math.PI / 2;
  const tx = Math.cos(tanAngle);
  const ty = Math.sin(tanAngle);
  
  const curveEndOut = ptsOuter[numSegments];
  const curveEndIn = ptsInner[numSegments];
  const curveEndC = ptsCenter[numSegments];
  
  // Final Points (End of Extension 2)
  const finalOut = { x: curveEndOut.x + V_EXT2 * tx, y: curveEndOut.y + V_EXT2 * ty };
  const finalIn = { x: curveEndIn.x + V_EXT2 * tx, y: curveEndIn.y + V_EXT2 * ty };
  const finalC = { x: curveEndC.x + V_EXT2 * tx, y: curveEndC.y + V_EXT2 * ty };

  // --- Build Paths ---

  // Outer Path
  let dOuter = `M${xStart},${y0} L${xCurveStart},${y0}`; // Ext 1
  for (let i = 0; i <= numSegments; i++) dOuter += ` L${ptsOuter[i].x},${ptsOuter[i].y}`; // Curve
  dOuter += ` L${finalOut.x},${finalOut.y}`; // Ext 2

  // Inner Path
  let dInner = `M${xStart},${y0 + V_D} L${xCurveStart},${y0 + V_D}`; // Ext 1
  for (let i = 0; i <= numSegments; i++) dInner += ` L${ptsInner[i].x},${ptsInner[i].y}`; // Curve
  dInner += ` L${finalIn.x},${finalIn.y}`; // Ext 2

  // Center Line
  let dCenter = "";
  // Ext 1 Centerline
  dCenter += `<line x1="${xStart}" y1="${y0 + V_D/2}" x2="${xCurveStart}" y2="${y0 + V_D/2}" class="phantom-line" />`;
  // Curve Centerline
  let dCenterArc = `M${ptsCenter[0].x},${ptsCenter[0].y}`;
  for (let i = 1; i <= numSegments; i++) dCenterArc += ` L${ptsCenter[i].x},${ptsCenter[i].y}`;
  dCenter += `<path d="${dCenterArc}" class="phantom-line" />`;
  // Ext 2 Centerline
  dCenter += `<line x1="${curveEndC.x}" y1="${curveEndC.y}" x2="${finalC.x}" y2="${finalC.y}" class="phantom-line" />`;

  // Seams
  let seams = "";
  // Curve Radial Seams
  for (let i = 0; i <= numSegments; i++) {
    seams += `<line x1="${ptsInner[i].x}" y1="${ptsInner[i].y}" x2="${ptsOuter[i].x}" y2="${ptsOuter[i].y}" class="line" stroke-width="0.5" />`;
  }
  // Ext 1 Junction
  if (V_EXT1 > 0) {
      seams += `<line x1="${xCurveStart}" y1="${y0}" x2="${xCurveStart}" y2="${y0 + V_D}" class="line" stroke-width="0.5" />`;
  }
  // Ext 2 Junction
  if (V_EXT2 > 0) {
      seams += `<line x1="${curveEndIn.x}" y1="${curveEndIn.y}" x2="${curveEndOut.x}" y2="${curveEndOut.y}" class="line" stroke-width="0.5" />`;
  }

  // Flanges
  // F1 (Start)
  const f1 = drawFlange(xStart, y0 + V_D/2, V_D, true);
  
  // F2 (End) - Rotated
  const endDeg = tanAngle * 180 / Math.PI;
  const f2 = drawRotatedFlange(finalC.x, finalC.y, V_D, endDeg);
  
  // Remarks
  let remark1 = "";
  if (params.flangeRemark1) {
      // Point to top of start flange (xStart, y0)
      remark1 = drawAnnotation(xStart, y0, params.flangeRemark1, true, false, 60, false).svg;
  }
  
  let remark2 = "";
  if (params.flangeRemark2) {
      // Point to outer edge of end flange
      // Calculate "Top/Outer" corner of the rotated flange
      const fRad = V_D/2; 
      // Perpendicular vector (Rotation - 90deg) points to "outer" side relative to flow
      const px = Math.cos(tanAngle - Math.PI/2);
      const py = Math.sin(tanAngle - Math.PI/2);
      
      const fx = finalC.x + fRad * px; 
      const fy = finalC.y + fRad * py;
      
      remark2 = drawAnnotation(fx, fy, params.flangeRemark2, false, true, 60, false).svg;
  }

  // Dimensions
  // Diameter D
  const dimD = drawDim(xStart, y0, xStart, y0 + V_D, `D=${D_real}`, 'left');
  
  // Extension 1 Dimension
  let dimExt1 = "";
  if (V_EXT1 > 0) {
      dimExt1 = drawDim(xStart, y0, xCurveStart, y0, `${extReal1}`, 'top', 30);
  }

  // Extension 2 Dimension
  let dimExt2 = "";
  if (V_EXT2 > 0) {
      // Draw dim parallel to extension 2
      // Shift out by offset in normal direction
      const off = 30;
      const px = Math.cos(tanAngle - Math.PI/2);
      const py = Math.sin(tanAngle - Math.PI/2);
      
      const p1x = curveEndOut.x + off * px;
      const p1y = curveEndOut.y + off * py;
      const p2x = finalOut.x + off * px;
      const p2y = finalOut.y + off * py;

      // Manually constructing rotated dim line/text
      const mx = (p1x + p2x) / 2;
      const my = (p1y + p2y) / 2;
      const rot = endDeg; 
      
      // Arrow logic
      const arrow1 = drawArrow(p1x, p1y, rot + 180);
      const arrow2 = drawArrow(p2x, p2y, rot);
      
      dimExt2 = `
        <line x1="${curveEndOut.x}" y1="${curveEndOut.y}" x2="${p1x}" y2="${p1y}" class="dim-line" stroke-width="1" />
        <line x1="${finalOut.x}" y1="${finalOut.y}" x2="${p2x}" y2="${p2y}" class="dim-line" stroke-width="1" />
        <line x1="${p1x}" y1="${p1y}" x2="${p2x}" y2="${p2y}" class="dim-line" />
        <text x="${mx}" y="${my}" class="dim-text" text-anchor="middle" dominant-baseline="middle" transform="rotate(${rot}, ${mx}, ${my})" dy="-15">${extReal2}</text>
        ${arrow1} ${arrow2}
      `;
  }
  
  // Radius R
  const midAngle = startRad + sweepRad / 2;
  const ix = cx + V_R_Inner * Math.cos(midAngle);
  const iy = cy + V_R_Inner * Math.sin(midAngle);
  
  const labelDist = Math.max(V_R_Inner - 40, 10);
  const lx = cx + labelDist * Math.cos(midAngle);
  const ly = cy + labelDist * Math.sin(midAngle);
  
  const arrow = drawArrow(ix, iy, midAngle * 180 / Math.PI);
  const rLine = `<line x1="${lx}" y1="${ly}" x2="${ix}" y2="${iy}" class="dim-line" />`;
  const rText = `<text x="${lx}" y="${ly}" class="dim-text" text-anchor="middle" dominant-baseline="middle" dy="20">R=${Number(valInnerR).toFixed(0)}</text>`;

  const body = `<path d="${dOuter}" class="line" /><path d="${dInner}" class="line" />`;
  
  return createSvg(body + dCenter + seams + f1 + f2 + dimD + dimExt1 + dimExt2 + rLine + arrow + rText + remark1 + remark2);
};