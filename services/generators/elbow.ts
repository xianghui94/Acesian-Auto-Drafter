import { DuctParams } from "../../types";
import { createSvg, drawDim, drawFlange, drawRotatedFlange, drawArrow, drawAnnotation, V_CONSTANTS } from "../svgUtils";

export const generateElbow = (params: DuctParams) => {
  const angle = params.angle || 90;
  const D_real = params.d1 || 500;
  
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

  // Layout Constants
  const T = 0; // Tangent length
  const x0 = 80; // Increased from 60 to prevent left clipping
  const y0 = 160; // Increased from 120 to provide more top space for remarks
  
  // Pivot Point
  const cx = x0 + T;
  const cy = y0 + V_R_Outer;
  
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
      // General scaling for other angles
      if (angle > 60) numSegments = 4;
      else if (angle > 30) numSegments = 3;
      else numSegments = 2;
  }

  // Generate Points
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

  // End Extensions
  const tanAngle = endRad + Math.PI / 2;
  const tx = Math.cos(tanAngle);
  const ty = Math.sin(tanAngle);
  
  const lastOut = ptsOuter[numSegments];
  const lastIn = ptsInner[numSegments];
  const lastC = ptsCenter[numSegments];
  
  const endOut = { x: lastOut.x + T * tx, y: lastOut.y + T * ty };
  const endIn = { x: lastIn.x + T * tx, y: lastIn.y + T * ty };
  const endC = { x: lastC.x + T * tx, y: lastC.y + T * ty };

  // Build Paths
  let dOuter = `M${x0},${y0} L${ptsOuter[0].x},${ptsOuter[0].y}`;
  for (let i = 1; i <= numSegments; i++) dOuter += ` L${ptsOuter[i].x},${ptsOuter[i].y}`;
  dOuter += ` L${endOut.x},${endOut.y}`;

  let dInner = `M${x0},${y0 + V_D} L${ptsInner[0].x},${ptsInner[0].y}`;
  for (let i = 1; i <= numSegments; i++) dInner += ` L${ptsInner[i].x},${ptsInner[i].y}`;
  dInner += ` L${endIn.x},${endIn.y}`;

  // Visual Centerline
  let dCenter = `M${x0 + V_D/2},${y0}`; 
  for (let i = 0; i <= numSegments; i++) dCenter += ` L${ptsCenter[i].x},${ptsCenter[i].y}`;
  dCenter += ` L${endC.x},${endC.y}`;
  const centerLinePath = `<path d="${dCenter}" class="phantom-line" />`;

  // Seams
  let seams = "";
  for (let i = 0; i <= numSegments; i++) {
    seams += `<line x1="${ptsInner[i].x}" y1="${ptsInner[i].y}" x2="${ptsOuter[i].x}" y2="${ptsOuter[i].y}" class="line" stroke-width="0.5" />`;
  }

  // Flanges
  // Start Flange (Vertical)
  const f1 = drawFlange(x0, y0 + V_D/2, V_D, true);
  
  // End Flange (Rotated)
  const endDeg = tanAngle * 180 / Math.PI;
  const f2 = drawRotatedFlange(endC.x, endC.y, V_D, endDeg);
  
  // Remarks
  let remark1 = "";
  if (params.flangeRemark1) {
      // Point to top of start flange (x0, y0)
      // Style: Up, Left, Shortened Leader (60), Text Above Line
      remark1 = drawAnnotation(x0, y0, params.flangeRemark1, true, false, 60, false).svg;
  }
  
  let remark2 = "";
  if (params.flangeRemark2) {
      // Point to outer edge of end flange
      // End flange center: endC
      // Tangent Angle (Direction of flow): tanAngle
      // Flange direction: tanAngle + 90 deg
      // We want to point to the "Outer" side relative to the bend
      
      const fRad = V_D/2; 
      // Perpendicular vector for flange direction
      // CHANGED: Use -PI/2 to get Outer normal vector instead of Inner
      const px = Math.cos(tanAngle - Math.PI/2);
      const py = Math.sin(tanAngle - Math.PI/2);
      
      const fx = endC.x + fRad * px; 
      const fy = endC.y + fRad * py;
      
      // Style: Down (relative to end), Right, Shortened Leader (60), Text Above Line
      remark2 = drawAnnotation(fx, fy, params.flangeRemark2, false, true, 60, false).svg;
  }

  // Dimensions
  const dimD = drawDim(x0, y0, x0, y0 + V_D, `D=${D_real}`, 'left');
  
  // Radius R (Pointing to Inner Radius)
  const midAngle = startRad + sweepRad / 2;
  const ix = cx + V_R_Inner * Math.cos(midAngle);
  const iy = cy + V_R_Inner * Math.sin(midAngle);
  
  // Label Position (Inward from inner arc)
  const labelDist = Math.max(V_R_Inner - 40, 10);
  const lx = cx + labelDist * Math.cos(midAngle);
  const ly = cy + labelDist * Math.sin(midAngle);
  
  // Arrow pointing FROM label TO inner arc
  const arrow = drawArrow(ix, iy, midAngle * 180 / Math.PI);
  const rLine = `<line x1="${lx}" y1="${ly}" x2="${ix}" y2="${iy}" class="dim-line" />`;
  const rText = `<text x="${lx}" y="${ly}" class="dim-text" text-anchor="middle" dominant-baseline="middle" dy="20">R=${Number(valInnerR).toFixed(0)}</text>`;

  const body = `<path d="${dOuter}" class="line" /><path d="${dInner}" class="line" />`;
  
  return createSvg(body + centerLinePath + seams + f1 + f2 + dimD + rLine + arrow + rText + remark1 + remark2);
};