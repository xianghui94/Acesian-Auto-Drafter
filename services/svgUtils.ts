/**
 * Shared Utilities for SVG Generation
 */

export const VIEW_BOX_SIZE = 500; // Reduced from 600 for tighter crop (Zoom In)

// Fixed visual constants (abstract units) - Kept large for high resolution
export const V_CONSTANTS = {
  LEN: 330,
  DIAM: 150,
  DIAM_LG: 190,
  DIAM_SM: 115,
  TAN: 60,
  BRANCH_H: 95,
  BRANCH_W: 115,
  REDUCER_STRAIGHT: 60,
  TRANS_LEN: 300,
  TRANS_TAN: 50
};

// Drawing Style Config
export const CFG = {
  strokeBody: 3,
  strokeFlange: 2.5,
  strokeDim: 1.5,
  textSize: 24,
  arrowSize: 12,
  dimOffset: 65,      // Slightly reduced to fit tighter box
  textOffset: 6
};

export const createSvg = (content: string, width: number = VIEW_BOX_SIZE, height: number = VIEW_BOX_SIZE) => {
  const viewBox = `0 0 ${width} ${height}`;
  
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
      .npt-text { fill: #9333ea; font-family: sans-serif; font-size: 16px; font-weight: bold; text-anchor: middle; paint-order: stroke fill; stroke: white; stroke-width: 3px; }
    </style>
    ${content}
  </svg>`;
};

export const drawArrow = (x: number, y: number, angleDeg: number) => {
    const size = CFG.arrowSize;
    const rad = angleDeg * Math.PI / 180;
    const x1 = x - size * Math.cos(rad - Math.PI / 6);
    const y1 = y - size * Math.sin(rad - Math.PI / 6);
    const x2 = x - size * Math.cos(rad + Math.PI / 6);
    const y2 = y - size * Math.sin(rad + Math.PI / 6);
    return `<polygon points="${x},${y} ${x1},${y1} ${x2},${y2}" class="dim-arrow" />`;
};

export const drawDim = (x1: number, y1: number, x2: number, y2: number, text: string, offsetDir: 'top' | 'bottom' | 'left' | 'right' = 'bottom', customOffset: number | null = null) => {
  const isVert = Math.abs(x1 - x2) < 1;
  const off = customOffset !== null ? customOffset : CFG.dimOffset;
  
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
    dy = "-0.4em"; 
  }

  return `
    <path d="${dPath}" class="dim-line" />
    <text x="${tx}" y="${ty}" class="dim-text" transform="rotate(${rotate}, ${tx}, ${ty})" dy="${dy}">${text}</text>
    ${arrows}
  `;
};

export const drawFlange = (x: number, y: number, length: number, isVertical: boolean) => {
  const ext = 10; // Flange extension
  const thk = 6; // Flange thickness
  
  if (isVertical) {
    // Pipe runs horizontal, flange is vertical line
    return `<rect x="${x - thk/2}" y="${y - length/2 - ext}" width="${thk}" height="${length + ext*2}" class="flange" />`;
  } else {
    // Pipe runs vertical, flange is horizontal line
    return `<rect x="${x - length/2 - ext}" y="${y - thk/2}" width="${length + ext*2}" height="${thk}" class="flange" />`;
  }
};

export const drawRotatedFlange = (cx: number, cy: number, length: number, angleDeg: number) => {
    // AngleDeg: Direction of pipe. Flange is perpendicular.
    const ext = 10;
    const thk = 6;
    const h = length + ext * 2;
    const rot = angleDeg + 90;
    
    return `<rect x="${cx - h/2}" y="${cy - thk/2}" width="${h}" height="${thk}" class="flange" transform="rotate(${rot}, ${cx}, ${cy})" />`;
};
