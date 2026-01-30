import { ComponentType, DuctParams } from "../types";

/**
 * Local Parametric SVG Generator
 * "Illustration Mode": Generates standardized, schematic symbols for parts.
 * The geometry is fixed (clean 1-size-fits-all), but labels reflect actual params.
 */

// --- Constants for Illustration Geometry ---

const VIEW_BOX_SIZE = 350; // Increased from 300 to allow more separation

// Fixed visual constants (abstract units)
const V_LEN = 180;        // Standard visual length
const V_DIAM = 80;        // Standard visual diameter
const V_DIAM_LG = 100;    // Large diameter (Reducer D1)
const V_DIAM_SM = 60;     // Small diameter (Reducer D2)
const V_TAN = 30;         // Elbow Tangent (Unused for Gore Elbows)
const V_BRANCH_H = 50;    // Tee Branch Height
const V_BRANCH_W = 60;    // Tee Branch Width (Diameter)
const V_REDUCER_STRAIGHT = 30; // Straight section length for Reducer

// For Transformation
const V_TRANS_LEN = 160;
const V_TRANS_TAN = 25; // Visual for 75mm
// V_TRANS_RECT removed, calculated dynamically

// Drawing Style Config (Constant now, since geometry is fixed)
const CFG = {
  strokeBody: 2,
  strokeFlange: 1.5,
  strokeDim: 1,
  textSize: 12, // Reduced slightly for better fit
  arrowSize: 6, // Reduced slightly
  dimOffset: 35, // Distance of dimension line from object
  textOffset: 3  // Distance of text from dimension line
};

// --- Helpers ---

const createSvg = (content: string) => {
  // Center (0,0) to (350,350) roughly
  const viewBox = `0 0 ${VIEW_BOX_SIZE} ${VIEW_BOX_SIZE}`;
  
  return `<svg viewBox="${viewBox}" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet">
    <style>
      .line { fill: none; stroke: black; stroke-width: ${CFG.strokeBody}; stroke-linecap: round; stroke-linejoin: round; }
      .flange { fill: white; stroke: black; stroke-width: ${CFG.strokeFlange}; }
      .dim-line { stroke: red; stroke-width: ${CFG.strokeDim}; }
      .dim-arrow { fill: red; stroke: none; }
      .dim-text { fill: red; font-family: sans-serif; font-size: ${CFG.textSize}px; font-weight: bold; text-anchor: middle; paint-order: stroke fill; stroke: white; stroke-width: 4px; stroke-linejoin: round; }
      .center-line { stroke: #999; stroke-width: 1; stroke-dasharray: 5,3; }
      .hidden-line { fill: none; stroke: black; stroke-width: 1; stroke-dasharray: 3,3; }
      .phantom-line { fill: none; stroke: #999; stroke-width: 0.5; stroke-dasharray: 10,2,2,2; }
    </style>
    ${content}
  </svg>`;
};

const drawArrow = (x: number, y: number, angleDeg: number) => {
    const size = CFG.arrowSize;
    const rad = angleDeg * Math.PI / 180;
    const x1 = x - size * Math.cos(rad - Math.PI / 6);
    const y1 = y - size * Math.sin(rad - Math.PI / 6);
    const x2 = x - size * Math.cos(rad + Math.PI / 6);
    const y2 = y - size * Math.sin(rad + Math.PI / 6);
    return `<polygon points="${x},${y} ${x1},${y1} ${x2},${y2}" class="dim-arrow" />`;
};

const drawDim = (x1: number, y1: number, x2: number, y2: number, text: string, offsetDir: 'top' | 'bottom' | 'left' | 'right' = 'bottom', customOffset: number | null = null) => {
  const isVert = Math.abs(x1 - x2) < 1;
  const off = customOffset !== null ? customOffset : CFG.dimOffset;
  const txtOff = CFG.textOffset;

  let dPath = "";
  let tx = 0, ty = 0;
  let arrows = "";
  let rotate = 0;
  let dy = "0";

  if (isVert) {
    // Vertical Dimension
    const lx = (offsetDir === 'right') ? x1 + off : x1 - off;
    
    // Draw extension lines and main line
    dPath = `M${x1},${y1} L${lx},${y1} M${x2},${y2} L${lx},${y2} M${lx},${y1} L${lx},${y2}`;
    
    arrows += drawArrow(lx, y1, -90); // Up
    arrows += drawArrow(lx, y2, 90);  // Down
    
    // Text Position: Center of line
    tx = lx;
    ty = (y1 + y2) / 2;
    rotate = -90; 
    // Push text away from line. If right offset, text is on right. If left, text is on left.
    // Standard: Text sits "above" the line (visually left).
    dy = "-0.4em"; // Moves text 'up' (left) relative to rotated baseline

  } else {
    // Horizontal Dimension
    const ly = (offsetDir === 'bottom') ? y1 + off : y1 - off;
    
    dPath = `M${x1},${y1} L${x1},${ly} M${x2},${y2} L${x2},${ly} M${x1},${ly} L${x2},${ly}`;
    
    arrows += drawArrow(x1, ly, 180); // Left
    arrows += drawArrow(x2, ly, 0);   // Right
    
    tx = (x1 + x2) / 2;
    ty = ly; // Text on line Y
    rotate = 0;
    
    // Text above line to avoid overlap
    dy = "-0.4em"; 
  }

  return `
    <path d="${dPath}" class="dim-line" />
    <text x="${tx}" y="${ty}" class="dim-text" transform="rotate(${rotate}, ${tx}, ${ty})" dy="${dy}">${text}</text>
    ${arrows}
  `;
};

const drawFlange = (x: number, y: number, length: number, isVertical: boolean) => {
  const ext = 6; // Flange extension beyond pipe
  const thk = 4; // Flange thickness
  
  if (isVertical) {
    // Pipe runs horizontal, flange is vertical line
    return `<rect x="${x - thk/2}" y="${y - length/2 - ext}" width="${thk}" height="${length + ext*2}" class="flange" />`;
  } else {
    // Pipe runs vertical, flange is horizontal line
    return `<rect x="${x - length/2 - ext}" y="${y - thk/2}" width="${length + ext*2}" height="${thk}" class="flange" />`;
  }
};

const drawRotatedFlange = (cx: number, cy: number, length: number, angleDeg: number) => {
    // AngleDeg: Direction of pipe. Flange is perpendicular.
    // Flange angle = angleDeg
    const ext = 6;
    const thk = 4;
    const h = length + ext * 2;
    
    // Rectangle points relative to center (cx, cy) before rotation
    const rot = angleDeg + 90;
    
    return `<rect x="${cx - h/2}" y="${cy - thk/2}" width="${h}" height="${thk}" class="flange" transform="rotate(${rot}, ${cx}, ${cy})" />`;
};

// --- Generators (Illustration Mode) ---

const generateStraight = (params: DuctParams) => {
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

const generateReducer = (params: DuctParams) => {
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

const generateElbow = (params: DuctParams) => {
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

  const V_D = V_DIAM;
  const V_R_visual = V_D * rMult;
  const T = 0; 
  const x0 = 50; 
  const y0 = 100;
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
  const labelDist = rInner - 35;
  const lx = cx + labelDist * Math.cos(midAngle);
  const ly = cy + labelDist * Math.sin(midAngle);
  const arrow = drawArrow(ix, iy, midAngle * 180 / Math.PI);
  const rLine = `<line x1="${lx}" y1="${ly}" x2="${ix}" y2="${iy}" class="dim-line" />`;
  const rText = `<text x="${lx}" y="${ly}" class="dim-text" text-anchor="middle" dominant-baseline="middle" dy="15">R=${valNeckR.toFixed(0)}</text>`;

  const path = `<path d="${dOuter}" class="line" /><path d="${dInner}" class="line" />`;
  return createSvg(path + seams + f1 + f2 + dimD + rLine + arrow + rText);
};

const generateTee = (params: DuctParams) => {
  const cx = VIEW_BOX_SIZE / 2;
  const cy = VIEW_BOX_SIZE / 2 + 30;
  const L = V_LEN + 40;
  const D_MAIN = V_DIAM;
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

const generateTransformation = (params: DuctParams) => {
    const cx = VIEW_BOX_SIZE / 2;
    const cy = VIEW_BOX_SIZE / 2;
    const realD = params.d1 || 500;
    const realS = params.height || 500; 
    const BASE_MAX = 110; 
    let D, S;
    if (realD >= realS) {
        D = BASE_MAX; S = BASE_MAX * (realS / realD);
    } else {
        S = BASE_MAX; D = BASE_MAX * (realD / realS);
    }
    D = Math.max(D, 40); S = Math.max(S, 40);
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

const generateVolumeDamper = (params: DuctParams) => {
    const cy = VIEW_BOX_SIZE / 2 + 20; 
    const D = V_DIAM + 20;
    const L = 80;
    const cxFront = 80;
    const cxSide = 220;
    const rOuter = (D/2) + 6;
    
    const frontFlange = `<circle cx="${cxFront}" cy="${cy}" r="${rOuter}" class="line" fill="none" />`;
    const frontInner = `<circle cx="${cxFront}" cy="${cy}" r="${D/2}" class="line" />`;
    const rBolt = rOuter - 3;
    const bolts = `
        <circle cx="${cxFront}" cy="${cy - rBolt}" r="1.5" fill="black" />
        <circle cx="${cxFront}" cy="${cy + rBolt}" r="1.5" fill="black" />
        <circle cx="${cxFront - rBolt}" cy="${cy}" r="1.5" fill="black" />
        <circle cx="${cxFront + rBolt}" cy="${cy}" r="1.5" fill="black" />
    `;
    const cLines = `
        <line x1="${cxFront - rOuter - 10}" y1="${cy}" x2="${cxFront + rOuter + 10}" y2="${cy}" class="center-line" />
        <line x1="${cxFront}" y1="${cy - rOuter - 10}" x2="${cxFront}" y2="${cy + rOuter + 10}" class="center-line" />
        <line x1="${cxSide - L/2 - 10}" y1="${cy}" x2="${cxSide + L/2 + 10}" y2="${cy}" class="center-line" />
    `;
    const blade = `<ellipse cx="${cxFront}" cy="${cy}" rx="${D/2}" ry="${D/2 * 0.3}" fill="none" stroke="black" stroke-width="1" />`;
    const dimD = drawDim(cxFront - rOuter, cy - rOuter, cxFront + rOuter, cy - rOuter, `Ø${params.d1}`, 'top');
    const xLeft = cxSide - L/2;
    const xRight = cxSide + L/2;
    const yTop = cy - D/2;
    const yBot = cy + D/2;
    const sideRect = `<rect x="${xLeft}" y="${yTop}" width="${L}" height="${D}" class="line" />`;
    const f1 = drawFlange(xLeft, cy, D, true);
    const f2 = drawFlange(xRight, cy, D, true);
    const dimL = drawDim(xLeft, yTop, xRight, yTop, `L=${params.length}`, 'top');
    
    let mechanism = "";
    const pSize = 30;
    mechanism += `<rect x="${cxSide - pSize/2}" y="${cy - pSize/2}" width="${pSize}" height="${pSize}" fill="white" stroke="black" stroke-width="1" />`;

    if (params.actuation === "Handle") {
        const qR = 10;
        const qPath = `M${cxSide - qR},${cy} A${qR},${qR} 0 0,1 ${cxSide},${cy - qR}`; 
        mechanism += `<path d="${qPath}" fill="none" stroke="black" stroke-width="1" />`;
        mechanism += `<line x1="${cxSide-qR}" y1="${cy}" x2="${cxSide+qR}" y2="${cy}" stroke="black" stroke-width="0.5" />`;
        const hW = 6;
        const hL = 45;
        mechanism += `<rect x="${cxSide - hW/2}" y="${cy - 5}" width="${hW}" height="${hL}" rx="${hW/2}" fill="white" stroke="black" stroke-width="1.5" />`;
        mechanism += `<circle cx="${cxSide}" cy="${cy}" r="2" fill="black" />`;
    } else {
        const gSize = 20;
        mechanism += `<rect x="${cxSide - gSize/2}" y="${cy - gSize/2}" width="${gSize}" height="${gSize}" fill="#ddd" stroke="black" stroke-width="1" />`;
        const wR = 12;
        mechanism += `<circle cx="${cxSide}" cy="${cy}" r="${wR}" fill="white" stroke="black" stroke-width="1.5" />`;
        mechanism += `<line x1="${cxSide - wR}" y1="${cy}" x2="${cxSide + wR}" y2="${cy}" stroke="black" stroke-width="1" />`;
        mechanism += `<line x1="${cxSide}" y1="${cy - wR}" x2="${cxSide}" y2="${cy + wR}" stroke="black" stroke-width="1" />`;
        mechanism += `<circle cx="${cxSide}" cy="${cy}" r="3" fill="black" />`;
        mechanism += `<line x1="${cxSide}" y1="${cy+wR}" x2="${cxSide}" y2="${cy+wR+10}" stroke="black" stroke-width="2" />`;
        mechanism += `<line x1="${cxSide-10}" y1="${cy+wR+10}" x2="${cxSide+10}" y2="${cy+wR+10}" stroke="black" stroke-width="2" />`;
    }
    return createSvg(frontFlange + frontInner + bolts + blade + cLines + dimD + sideRect + f1 + f2 + dimL + mechanism);
};

const generateMultibladeDamper = (params: DuctParams) => {
    const cxLeft = 80;
    const cxRight = 220;
    const cy = VIEW_BOX_SIZE / 2 + 20;
    const realL = params.length || 400; 
    const V_HEIGHT = 120; 
    const V_WIDTH = 60;   
    const seg1 = V_WIDTH * 0.25;
    const seg2 = V_WIDTH * 0.50;
    const seg3 = V_WIDTH * 0.25;
    const xL = cxLeft - V_WIDTH/2;
    const xR = cxLeft + V_WIDTH/2;
    const yT = cy - V_HEIGHT/2;
    const yB = cy + V_HEIGHT/2;
    const xM1 = xL + seg1;
    const xM2 = xM1 + seg2;

    const rect = `<rect x="${xL}" y="${yT}" width="${V_WIDTH}" height="${V_HEIGHT}" class="line" />`;
    const dividers = `
        <line x1="${xM1}" y1="${yT}" x2="${xM1}" y2="${yB}" class="line" stroke-width="1" />
        <line x1="${xM2}" y1="${yT}" x2="${xM2}" y2="${yB}" class="line" stroke-width="1" />
    `;
    const flanges = drawFlange(xL, cy, V_HEIGHT, true) + drawFlange(xR, cy, V_HEIGHT, true);
    const actuatorSide = `
        <rect x="${cxLeft - 5}" y="${cy - 5}" width="${10}" height="${10}" fill="#ddd" stroke="black" />
        <line x1="${cxLeft}" y1="${cy}" x2="${cxLeft + 20}" y2="${cy + 5}" stroke="black" stroke-width="2" />
        <circle cx="${cxLeft + 20}" cy="${cy + 5}" r="3" fill="black" />
    `;
    const dimL = drawDim(xL, yT, xR, yT, `L=${realL}`, 'top');
    const dim100a = `<text x="${xL + seg1/2}" y="${yT - 10}" class="dim-text" font-size="10">100</text>`;
    const dim200 = `<text x="${cxLeft}" y="${yT - 10}" class="dim-text" font-size="10">200</text>`;
    const dim100b = `<text x="${xR - seg3/2}" y="${yT - 10}" class="dim-text" font-size="10">100</text>`;
    
    const rOuter = (V_HEIGHT/2) + 6;
    const boxSize = V_HEIGHT + 20;
    const dashedBox = `<rect x="${cxRight - boxSize/2}" y="${cy - boxSize/2}" width="${boxSize}" height="${boxSize}" class="hidden-line" />`;
    const circle = `<circle cx="${cxRight}" cy="${cy}" r="${V_HEIGHT/2}" class="line" />`;
    const cFlange = `<circle cx="${cxRight}" cy="${cy}" r="${rOuter}" class="flange" fill="none" />`;
    const rBolt = rOuter - 3;
    const bolts = `
        <circle cx="${cxRight}" cy="${cy - rBolt}" r="1.5" fill="black" />
        <circle cx="${cxRight}" cy="${cy + rBolt}" r="1.5" fill="black" />
        <circle cx="${cxRight - rBolt}" cy="${cy}" r="1.5" fill="black" />
        <circle cx="${cxRight + rBolt}" cy="${cy}" r="1.5" fill="black" />
    `;
    const numBlades = 6;
    let blades = "";
    const step = V_HEIGHT / numBlades;
    for(let i=1; i<numBlades; i++) {
        const y = (cy - V_HEIGHT/2) + i*step;
        const dy = Math.abs(y - cy);
        const R = V_HEIGHT/2;
        const dx = Math.sqrt(R*R - dy*dy);
        blades += `<line x1="${cxRight - dx}" y1="${y}" x2="${cxRight + dx}" y2="${y}" class="line" stroke-width="1" />`;
    }
    const actX = cxRight + boxSize/2; 
    const actuatorFront = `
        <rect x="${actX}" y="${cy - 10}" width="${15}" height="${20}" fill="#ddd" stroke="black" />
        <line x1="${actX + 15}" y1="${cy}" x2="${actX + 25}" y2="${cy}" stroke="black" stroke-width="2" />
        <line x1="${actX + 20}" y1="${cy}" x2="${actX + 30}" y2="${cy}" stroke="black" stroke-width="2" /> 
        <rect x="${actX+20}" y="${cy-10}" width="2" height="20" fill="black" /> 
    `;
    const dimD = drawDim(cxRight + boxSize/2 + 5, cy - V_HEIGHT/2, cxRight + boxSize/2 + 5, cy + V_HEIGHT/2, `Ø${params.d1}`, 'right');

    return createSvg(dashedBox + cFlange + circle + bolts + blades + actuatorFront + dimD + rect + dividers + flanges + actuatorSide + dimL + dim100a + dim200 + dim100b);
};

const generateStraightWithTaps = (params: DuctParams) => {
    // Layout: Left = Top View (Plan), Right = Cross-section (Side View)
    const cy = VIEW_BOX_SIZE / 2;

    const d1 = params.d1 || 500;
    const len = params.length || 1000;
    const taps = params.taps || [];

    // Scale Logic
    const V_D = 80; // Fixed visual diameter for main duct
    const V_L = 140; // Visual length
    const scale = V_D / d1; // Ratio of Visual / Real
    
    // View positions
    const cxLeft = 80; // Left View Center
    const cxRight = 270; // Right View Center

    // --- Top View (Left) ---
    const xL = cxLeft - V_L/2;
    const xR = cxLeft + V_L/2;
    const yT = cy - V_D/2;
    const yB = cy + V_D/2;

    // Drawing Layers
    let bottomLayer = ""; // Hidden lines (180deg taps)
    let pipeLayer = "";   // Main Pipe
    let topLayer = "";    // Visible Taps (0, 90, 270)
    
    // 1. Draw Bottom Taps (180, 135, 225) - Hidden/Dashed
    // 2. Draw Main Pipe
    // 3. Draw Side/Top Taps (90, 270, 0, 45, 315) - Solid
    
    pipeLayer += `<rect x="${xL}" y="${yT}" width="${V_L}" height="${V_D}" class="line" fill="white" />`; // Fill white to hide bottom taps
    pipeLayer += drawFlange(xL, cy, V_D, true) + drawFlange(xR, cy, V_D, true);
    pipeLayer += `<line x1="${xL-5}" y1="${cy}" x2="${xR+5}" y2="${cy}" class="center-line" />`;
    
    const sortedTaps = [...taps].sort((a: any, b: any) => a.dist - b.dist);
    
    let tapDims = "";
    
    // Loop through taps and assign to layers
    sortedTaps.forEach((tap, index) => {
        const ang = (tap.angle || 0) % 360;
        const normAngle = (ang + 360) % 360; // 0-360
        
        // Ratio along length
        const ratio = Math.max(0, Math.min(1, tap.dist / len));
        const tx = xL + (ratio * V_L);
        
        // Visual Size proportional to main duct
        const vTapDiam = (tap.diameter * scale);
        const vTapRad = vTapDiam / 2;
        const vTapStickOut = 20; 
        const vFlangeW = vTapDiam + 6;
        const vFlangeThk = 3;
        
        // Categorize Orientation Bucket (Approx 22.5 deg padding)
        let orientation = 'TOP';
        if (normAngle >= 22.5 && normAngle < 67.5) orientation = 'TOP_RIGHT';      // 45
        else if (normAngle >= 67.5 && normAngle < 112.5) orientation = 'RIGHT';   // 90
        else if (normAngle >= 112.5 && normAngle < 157.5) orientation = 'BOT_RIGHT'; // 135
        else if (normAngle >= 157.5 && normAngle < 202.5) orientation = 'BOT';     // 180
        else if (normAngle >= 202.5 && normAngle < 247.5) orientation = 'BOT_LEFT'; // 225
        else if (normAngle >= 247.5 && normAngle < 292.5) orientation = 'LEFT';    // 270
        else if (normAngle >= 292.5 && normAngle < 337.5) orientation = 'TOP_LEFT'; // 315
        else orientation = 'TOP'; // 0 / 360

        // Render based on Orientation
        switch (orientation) {
            case 'BOT': // 180 deg
                bottomLayer += `<circle cx="${tx}" cy="${cy}" r="${vTapRad}" class="hidden-line" fill="none" />`;
                bottomLayer += `<circle cx="${tx}" cy="${cy}" r="${vTapRad + 3}" class="hidden-line" stroke-width="0.5" fill="none" />`;
                break;
                
            case 'TOP': // 0 deg
                topLayer += `<circle cx="${tx}" cy="${cy}" r="${vTapRad}" class="line" fill="white" />`;
                topLayer += `<circle cx="${tx}" cy="${cy}" r="${vTapRad + 3}" class="line" stroke-width="0.5" stroke-dasharray="2,2" fill="none" />`;
                topLayer += `<text x="${tx}" y="${cy - vTapRad - 5}" class="dim-text" font-size="8">Ø${tap.diameter}</text>`;
                break;

            case 'LEFT': // 270 deg (Sticks UP in Plan)
                bottomLayer += `<rect x="${tx - vTapDiam/2}" y="${yT - vTapStickOut}" width="${vTapDiam}" height="${vTapStickOut}" class="line" fill="white" />`; 
                bottomLayer += `<rect x="${tx - vFlangeW/2}" y="${yT - vTapStickOut}" width="${vFlangeW}" height="${vFlangeThk}" class="flange" />`; 
                topLayer += `<text x="${tx}" y="${yT - vTapStickOut - 8}" class="dim-text" font-size="8">Ø${tap.diameter}</text>`;
                break;

            case 'RIGHT': // 90 deg (Sticks DOWN in Plan)
                bottomLayer += `<rect x="${tx - vTapDiam/2}" y="${yB}" width="${vTapDiam}" height="${vTapStickOut}" class="line" fill="white" />`; 
                bottomLayer += `<rect x="${tx - vFlangeW/2}" y="${yB + vTapStickOut - vFlangeThk}" width="${vFlangeW}" height="${vFlangeThk}" class="flange" />`; 
                topLayer += `<text x="${tx}" y="${yB + vTapStickOut + 12}" class="dim-text" font-size="8">Ø${tap.diameter}</text>`;
                break;

            case 'TOP_RIGHT': // 45 deg (Sticks DOWN-RIGHT in Plan, Visible)
            case 'TOP_LEFT': // 315 deg (Sticks UP-LEFT in Plan, Visible)
                {
                    const isUp = (orientation === 'TOP_LEFT');
                    const ySurf = isUp ? cy - 0.7 * (V_D/2) : cy + 0.7 * (V_D/2);
                    const yTip = isUp ? cy - 0.7 * (V_D/2 + vTapStickOut) : cy + 0.7 * (V_D/2 + vTapStickOut);
                    const labelY = isUp ? yTip - 8 : yTip + 12;
                    
                    // Draw Neck (Rect)
                    // Note: Ideally curved connection, but rect for schematic is fine
                    topLayer += `<path d="M${tx - vTapDiam/2},${ySurf} L${tx + vTapDiam/2},${ySurf} L${tx + vTapDiam/2},${yTip} L${tx - vTapDiam/2},${yTip} Z" class="line" fill="white" />`;
                    
                    // Draw Face (Ellipse)
                    const ry = vTapDiam/2 * 0.7; // Foreshortened circle
                    topLayer += `<ellipse cx="${tx}" cy="${yTip}" rx="${vTapDiam/2}" ry="${ry}" class="flange" />`;
                    topLayer += `<text x="${tx}" y="${labelY}" class="dim-text" font-size="8">Ø${tap.diameter}</text>`;
                }
                break;
                
            case 'BOT_RIGHT': // 135 deg (Sticks DOWN-RIGHT in Plan, Hidden)
            case 'BOT_LEFT': // 225 deg (Sticks UP-LEFT in Plan, Hidden)
                {
                    const isUp = (orientation === 'BOT_LEFT');
                    const ySurf = isUp ? cy - 0.7 * (V_D/2) : cy + 0.7 * (V_D/2);
                    const yTip = isUp ? cy - 0.7 * (V_D/2 + vTapStickOut) : cy + 0.7 * (V_D/2 + vTapStickOut);
                    
                    // Dashed lines for hidden tap
                    bottomLayer += `<path d="M${tx - vTapDiam/2},${ySurf} L${tx - vTapDiam/2},${yTip}" class="hidden-line" />`;
                    bottomLayer += `<path d="M${tx + vTapDiam/2},${ySurf} L${tx + vTapDiam/2},${yTip}" class="hidden-line" />`;
                    
                    // Ellipse at tip (dashed)
                    const ry = vTapDiam/2 * 0.7; 
                    bottomLayer += `<ellipse cx="${tx}" cy="${yTip}" rx="${vTapDiam/2}" ry="${ry}" class="hidden-line" fill="none" />`;
                }
                break;
        }
        
        // --- Dimensions ---
        // Stagger levels based on index to avoid overlap
        // Push dimensions further down to clear any "Down" taps (approx 20 + 12 = 32 units)
        const dimBaseY = yB + 35; // Moved down
        const dimLevel = index % 3; 
        const dimY = dimBaseY + (dimLevel * 12); 
        
        tapDims += `<line x1="${tx}" y1="${cy}" x2="${tx}" y2="${dimY}" class="phantom-line" stroke-width="0.5" />`;
        
        if (index === 0) {
            const maxDimY = dimBaseY + ((sortedTaps.length > 0 ? 2 : 0) * 12);
            tapDims += `<line x1="${xL}" y1="${yB}" x2="${xL}" y2="${maxDimY + 10}" class="line" stroke-width="0.5" />`;
        }
        
        tapDims += drawDim(xL, dimY, tx, dimY, `${tap.dist}`, 'bottom', 0);
    });

    // Main Diameter Dim
    const dimD = drawDim(xL - 10, yT, xL - 10, yB, `Ø${d1}`, 'left');
    
    // Main Length Dim
    const maxDimLevel = sortedTaps.length > 0 ? 2 : 0;
    const finalDimY = yB + 35 + (maxDimLevel * 12) + 15;
    const dimL = drawDim(xL, finalDimY, xR, finalDimY, `L=${len}`, 'bottom', 0);

    // Cutting Plane A-A
    const cutX = xL + 10;
    const cutTopY = yT - 25; // Extend further
    const cutBotY = yB + 25;
    const cutLine = `
        <line x1="${cutX}" y1="${cutTopY}" x2="${cutX}" y2="${cutBotY}" class="phantom-line" stroke-width="1.5" />
        <line x1="${cutX}" y1="${cutTopY}" x2="${cutX}" y2="${cutTopY+10}" stroke="black" stroke-width="2" />
        <line x1="${cutX}" y1="${cutBotY}" x2="${cutX}" y2="${cutBotY-10}" stroke="black" stroke-width="2" />
        <polyline points="${cutX-5},${cutTopY} ${cutX},${cutTopY} ${cutX},${cutTopY+5}" fill="none" stroke="black" stroke-width="2" />
        <polyline points="${cutX-5},${cutBotY} ${cutX},${cutBotY} ${cutX},${cutBotY-5}" fill="none" stroke="black" stroke-width="2" />
        <text x="${cutX}" y="${cutTopY-5}" font-weight="bold" text-anchor="middle" font-size="12">A</text>
        <text x="${cutX}" y="${cutBotY+15}" font-weight="bold" text-anchor="middle" font-size="12">A</text>
    `;

    // --- Right View Visuals (Cross Section A-A) ---
    // Remains largely the same logic, standard projection
    const circle = `<circle cx="${cxRight}" cy="${cy}" r="${V_D/2}" class="line" />`;
    const centerMark = `<line x1="${cxRight-5}" y1="${cy}" x2="${cxRight+5}" y2="${cy}" stroke="black" /><line x1="${cxRight}" y1="${cy-5}" x2="${cxRight}" y2="${cy+5}" stroke="black" />`;
    
    // Seam Dot
    const seamAngle = params.seamAngle !== undefined ? params.seamAngle : 0;
    const sRad = (seamAngle - 90) * Math.PI / 180;
    const sx = cxRight + (V_D/2) * Math.cos(sRad);
    const sy = cy + (V_D/2) * Math.sin(sRad);
    const seamDot = `<circle cx="${sx}" cy="${sy}" r="3" fill="black" />`;

    let tapVisualsRight = "";
    sortedTaps.forEach(tap => {
        const angle = tap.angle || 0;
        const rad = (angle - 90) * Math.PI / 180;
        const R = V_D/2;
        const stubLen = 20;
        
        // Scale width in this view too
        const vTapDiam = (tap.diameter * scale);
        
        const x1 = cxRight + R * Math.cos(rad);
        const y1 = cy + R * Math.sin(rad);
        const x2 = cxRight + (R + stubLen) * Math.cos(rad);
        const y2 = cy + (R + stubLen) * Math.sin(rad);
        
        const px = Math.cos(rad + Math.PI/2) * (vTapDiam/2);
        const py = Math.sin(rad + Math.PI/2) * (vTapDiam/2);
        const p1x = x1 + px, p1y = y1 + py;
        const p4x = x2 + px, p4y = y2 + py;
        const p2x = x1 - px, p2y = y1 - py;
        const p3x = x2 - px, p3y = y2 - py;
        
        tapVisualsRight += `<path d="M${p1x},${p1y} L${p4x},${p4y} M${p2x},${p2y} L${p3x},${p3y}" class="line" />`;
        
        // Flange
        const vFlangeW = vTapDiam + 6;
        const fx = Math.cos(rad + Math.PI/2) * (vFlangeW/2);
        const fy = Math.sin(rad + Math.PI/2) * (vFlangeW/2);
        const f1x = x2 - fx, f1y = y2 - fy;
        const f2x = x2 + fx, f2y = y2 + fy;
        
        tapVisualsRight += `<line x1="${f1x}" y1="${f1y}" x2="${f2x}" y2="${f2y}" class="flange" stroke-width="2" />`;
        
        // Angle Label
        const labelR = R + stubLen + 15;
        const lx = cxRight + labelR * Math.cos(rad);
        const ly = cy + labelR * Math.sin(rad);
        tapVisualsRight += `<text x="${lx}" y="${ly}" class="dim-text" font-size="9" dominant-baseline="middle">${angle}°</text>`;
        tapVisualsRight += `<line x1="${cxRight}" y1="${cy}" x2="${x1}" y2="${y1}" stroke="#999" stroke-dasharray="2,2" stroke-width="0.5" />`;
    });
    
    const degLabels = `
        <text x="${cxRight}" y="${cy - V_D/2 - 10}" font-size="8" text-anchor="middle">0°</text>
        <text x="${cxRight + V_D/2 + 10}" y="${cy}" font-size="8" dominant-baseline="middle">90°</text>
        <text x="${cxRight}" y="${cy + V_D/2 + 10}" font-size="8" text-anchor="middle">180°</text>
        <text x="${cxRight - V_D/2 - 10}" y="${cy}" font-size="8" text-anchor="end" dominant-baseline="middle">270°</text>
    `;

    // View Labels
    const viewLabels = `
        <text x="${cxLeft}" y="${cy + V_D/2 + 80}" font-weight="bold" text-anchor="middle" font-size="12" text-decoration="underline">TOP VIEW</text>
        <text x="${cxRight}" y="${cy + V_D/2 + 80}" font-weight="bold" text-anchor="middle" font-size="12" text-decoration="underline">SIDE VIEW</text>
    `;

    return createSvg(
        bottomLayer + 
        pipeLayer + 
        topLayer +
        
        dimD + cutLine + tapDims + dimL +
        circle + centerMark + seamDot + tapVisualsRight + degLabels + viewLabels
    );
};

export const generateDuctDrawing = async (type: ComponentType, params: DuctParams): Promise<string> => {
  switch (type) {
    case ComponentType.ELBOW:
      return generateElbow(params);
    case ComponentType.REDUCER:
      return generateReducer(params);
    case ComponentType.STRAIGHT:
      return generateStraight(params);
    case ComponentType.TEE:
      return generateTee(params);
    case ComponentType.TRANSFORMATION:
      return generateTransformation(params);
    case ComponentType.VOLUME_DAMPER:
      return generateVolumeDamper(params);
    case ComponentType.MULTIBLADE_DAMPER:
      return generateMultibladeDamper(params);
    case ComponentType.STRAIGHT_WITH_TAPS:
      return generateStraightWithTaps(params);
    default:
      return createSvg(`<text x="50%" y="50%" text-anchor="middle">No Sketch Available</text>`);
  }
};