import { DuctParams } from "../../types";
import { createSvg, drawDim, drawFlange, drawRotatedFlange, drawArrow, VIEW_BOX_SIZE, V_CONSTANTS } from "../svgUtils";

const { LEN: V_LEN, DIAM: V_DIAM, DIAM_LG: V_DIAM_LG, DIAM_SM: V_DIAM_SM, REDUCER_STRAIGHT: V_REDUCER_STRAIGHT, BRANCH_W: V_BRANCH_W, BRANCH_H: V_BRANCH_H, TRANS_LEN: V_TRANS_LEN, TRANS_TAN: V_TRANS_TAN } = V_CONSTANTS;

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
  
  const dimL = drawDim(x1, yBot, x2, yBot, `L=${params.length || 1000}`, 'bottom');
  const dimD = drawDim(x2, yTop, x2, yBot, `D=${params.d1 || 300}`, 'right');

  return createSvg(path + f1 + f2 + dimL + dimD);
};

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
  const f1 = drawFlange(xLeft, cy, D1, true);
  const f2 = drawFlange(xRight, cy, D2, true);
  
  const dimL = drawDim(xLeft, y1Bot, xRight, y2Bot, `L=${params.length || 500}`, 'bottom');
  const dimD1 = drawDim(xLeft, y1Top, xLeft, y1Bot, `D1=${params.d1 || 500}`, 'left'); 
  const dimD2 = drawDim(xRight, y2Top, xRight, y2Bot, `D2=${params.d2 || 300}`, 'right');

  return createSvg(path + markers + dash + f1 + f2 + dimL + dimD1 + dimD2);
};

export const generateElbow = (params: DuctParams) => {
  const angle = params.angle || 90;
  const D_real = params.d1 || 500;
  
  let numSegments = 3;
  let rMult = 1.0; 
  if (D_real < 200) { rMult = 1.5; } else { rMult = 1.0; }
  if (angle === 90) { numSegments = (D_real < 450) ? 4 : 5; } 
  else if (angle === 60) { numSegments = (D_real < 250) ? 2 : 4; } 
  else if (angle === 45) { numSegments = (D_real < 250) ? 2 : 3; } 
  else if (angle === 30) { numSegments = (D_real < 600) ? 2 : 3; } 
  else { if (angle > 60) numSegments = 4; else numSegments = 2; }

  const V_D = V_CONSTANTS.DIAM;
  const V_R_visual = V_D * rMult;
  const T = 0; 
  const x0 = 60; 
  const y0 = 120;
  const rCenter = V_R_visual;
  const rOuter = rCenter + V_D/2;
  const rInner = rCenter - V_D/2;
  const cx = x0 + T;
  const cy = y0 + rOuter;
  const startRad = -Math.PI / 2;
  const sweepRad = (angle * Math.PI) / 180;
  const endRad = startRad + sweepRad;

  const verticesOuter = [];
  const verticesInner = [];

  for (let i = 0; i <= numSegments; i++) {
    const frac = i / numSegments;
    const theta = startRad + (sweepRad * frac);
    verticesOuter.push({ x: cx + rOuter * Math.cos(theta), y: cy + rOuter * Math.sin(theta) });
    verticesInner.push({ x: cx + rInner * Math.cos(theta), y: cy + rInner * Math.sin(theta) });
  }

  const lastOut = verticesOuter[numSegments];
  const lastIn = verticesInner[numSegments];
  const tanAngle = endRad + Math.PI / 2;
  const tx = Math.cos(tanAngle);
  const ty = Math.sin(tanAngle);
  const endOut = { x: lastOut.x + T * tx, y: lastOut.y + T * ty };
  const endIn = { x: lastIn.x + T * tx, y: lastIn.y + T * ty };

  let dOuter = `M${x0},${y0} L${verticesOuter[0].x},${verticesOuter[0].y}`;
  for (let i = 1; i <= numSegments; i++) { dOuter += ` L${verticesOuter[i].x},${verticesOuter[i].y}`; }
  dOuter += ` L${endOut.x},${endOut.y}`;

  let dInner = `M${x0},${y0 + V_D} L${verticesInner[0].x},${verticesInner[0].y}`;
  for (let i = 1; i <= numSegments; i++) { dInner += ` L${verticesInner[i].x},${verticesInner[i].y}`; }
  dInner += ` L${endIn.x},${endIn.y}`;

  let seams = "";
  for (let i = 0; i <= numSegments; i++) {
    seams += `<line x1="${verticesInner[i].x}" y1="${verticesInner[i].y}" x2="${verticesOuter[i].x}" y2="${verticesOuter[i].y}" class="line" stroke-width="0.5" />`;
  }

  const f1 = drawFlange(x0, y0 + V_D/2, V_D, true);
  const endCx = (endOut.x + endIn.x) / 2;
  const endCy = (endOut.y + endIn.y) / 2;
  const endDeg = tanAngle * 180 / Math.PI;
  const f2 = drawRotatedFlange(endCx, endCy, V_D, endDeg);
  const dimD = drawDim(x0, y0, x0, y0 + V_D, `D=${D_real}`, 'left');
  const valCenterR = D_real * rMult;
  const valNeckR = valCenterR - 0.5 * D_real;
  const midAngle = startRad + sweepRad / 2;
  const ix = cx + rInner * Math.cos(midAngle);
  const iy = cy + rInner * Math.sin(midAngle);
  const labelDist = rInner - 50;
  const lx = cx + labelDist * Math.cos(midAngle);
  const ly = cy + labelDist * Math.sin(midAngle);
  const arrow = drawArrow(ix, iy, midAngle * 180 / Math.PI);
  const rLine = `<line x1="${lx}" y1="${ly}" x2="${ix}" y2="${iy}" class="dim-line" />`;
  const rText = `<text x="${lx}" y="${ly}" class="dim-text" text-anchor="middle" dominant-baseline="middle" dy="20">R=${valNeckR.toFixed(0)}</text>`;

  const path = `<path d="${dOuter}" class="line" /><path d="${dInner}" class="line" />`;
  return createSvg(path + seams + f1 + f2 + dimD + rLine + arrow + rText);
};

export const generateTee = (params: DuctParams) => {
  const cx = VIEW_BOX_SIZE / 2;
  const cy = VIEW_BOX_SIZE / 2 + 30;
  const L = V_LEN + 60;
  const D_MAIN = V_CONSTANTS.DIAM;
  const D_BRANCH = V_BRANCH_W;
  const H_BRANCH = V_BRANCH_H;
  const xLeft = cx - L/2;
  const xRight = cx + L/2;
  const yMainTop = cy - D_MAIN/2;
  const yMainBot = cy + D_MAIN/2;
  const xBranchLeft = cx - D_BRANCH/2;
  const xBranchRight = cx + D_BRANCH/2;
  const yBranchTop = yMainTop - H_BRANCH;
  
  const d = `
    M${xLeft},${yMainTop} L${xBranchLeft},${yMainTop} L${xBranchLeft},${yBranchTop} 
    M${xBranchRight},${yBranchTop} L${xBranchRight},${yMainTop} L${xRight},${yMainTop}
    M${xLeft},${yMainBot} L${xRight},${yMainBot}
  `;
  const path = `<path d="${d}" class="line" />`;
  const f1 = drawFlange(xLeft, cy, D_MAIN, true);
  const f2 = drawFlange(xRight, cy, D_MAIN, true);
  const f3 = drawFlange(cx, yBranchTop, D_BRANCH, false);
  const dimMd = drawDim(xLeft, yMainTop, xLeft, yMainBot, `Md=${params.main_d || 500}`, 'left');
  const dimBd = drawDim(xBranchLeft, yBranchTop, xBranchRight, yBranchTop, `Bd=${params.tap_d || 300}`, 'top');

  return createSvg(path + f1 + f2 + f3 + dimMd + dimBd);
};

export const generateTransformation = (params: DuctParams) => {
    const cx = VIEW_BOX_SIZE / 2;
    const cy = VIEW_BOX_SIZE / 2;
    const realD = params.d1 || 500;
    const realS = params.height || 500; 
    const BASE_MAX = 200; 
    let D, S;
    if (realD >= realS) {
        D = BASE_MAX; S = BASE_MAX * (realS / realD);
    } else {
        S = BASE_MAX; D = BASE_MAX * (realD / realS);
    }
    D = Math.max(D, 80); S = Math.max(S, 80);
    const L = V_TRANS_LEN;
    const T = V_TRANS_TAN;
    const xLeft = cx - L/2;
    const xRight = cx + L/2;
    const xT1 = xLeft + T;
    const xT2 = xRight - T;
    const yRoundTop = cy - D/2;
    const yRoundBot = cy + D/2;
    const yRectTop = cy - S/2;
    const yRectBot = cy + S/2;
    
    const contour = `
        M${xLeft},${yRoundTop} L${xT1},${yRoundTop} L${xT2},${yRectTop} L${xRight},${yRectTop}
        M${xRight},${yRectBot} L${xT2},${yRectBot} L${xT1},${yRoundBot} L${xLeft},${yRoundBot}
        M${xLeft},${yRoundTop} L${xLeft},${yRoundBot}
        M${xRight},${yRectTop} L${xRight},${yRectBot}
    `;
    const center = `<line x1="${xLeft}" y1="${cy}" x2="${xRight}" y2="${cy}" class="center-line" />`;
    const crease = `
        <line x1="${xT1}" y1="${cy}" x2="${xT2}" y2="${yRectTop}" stroke="black" stroke-width="1" />
        <line x1="${xT1}" y1="${cy}" x2="${xT2}" y2="${yRectBot}" stroke="black" stroke-width="1" />
    `;
    const path = `<path d="${contour}" class="line" />`;
    const f1 = drawFlange(xLeft, cy, D, true);
    const f2 = drawFlange(xRight, cy, S, true);
    const dimD = drawDim(xLeft, yRoundTop, xLeft, yRoundBot, `Ø${params.d1 || 500}`, 'left');
    const dimS = drawDim(xRight, yRectTop, xRight, yRectBot, `${params.width || 500}x${params.height || 500}`, 'right');
    const dimL = drawDim(xLeft, yRectBot, xRight, yRectBot, `L=${params.length || 300}`, 'bottom');
    
    return createSvg(path + center + crease + f1 + f2 + dimD + dimS + dimL);
};