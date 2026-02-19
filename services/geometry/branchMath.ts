
/**
 * GEOMETRY ENGINE
 * Handles calculations for ductwork intersections and projections.
 */

interface Point {
    x: number;
    y: number;
}

/**
 * Calculates the SVG path for a branch pipe intersecting a main pipe (Radial connection).
 * Used for Side Views of Tees and Taps.
 * 
 * @param cx Center X of the Main Pipe (Circle)
 * @param cy Center Y of the Main Pipe (Circle)
 * @param mainR Radius of the Main Pipe
 * @param branchR Radius of the Branch Pipe
 * @param angleDeg Angle of the branch (0 = Top/12 o'clock, 90 = Right/3 o'clock)
 * @param stickOut Length of branch from the Main Surface
 * @returns SVG Path Data string
 */
export const calculateRadialBranchPath = (
    cx: number, 
    cy: number, 
    mainR: number, 
    branchR: number, 
    angleDeg: number, 
    stickOut: number,
    isTap: boolean = false
): { path: string, flangePath: string, labelPoint: Point, endPoint: Point } => {
    
    // 1. Convert geometric angle (0=Top) to Math angle (0=Right, -90=Top)
    // Input 0 -> -90 (Math)
    // Input 90 -> 0 (Math)
    const mathRad = (angleDeg - 90) * Math.PI / 180;

    // 2. Geometry Validation
    // Branch radius cannot exceed Main radius physically, but visually we clamp it slightly less
    // to ensure the math (sqrt) doesn't fail.
    const safeBranchR = Math.min(branchR, mainR - 0.5);

    // 3. Calculate "Chord Distance" (rIntersect)
    // This is the distance from center [0,0] to the flat chord line if we looked perpendicular to the branch.
    // However, for a radial projection, we need the intersection points of the branch walls with the circle.
    // Intersection circle: x^2 + y^2 = mainR^2
    // Branch walls are parallel lines at distance +/- branchR from the branch centerline.
    
    // Vector components for the Branch Centerline
    const cos = Math.cos(mathRad);
    const sin = Math.sin(mathRad);
    
    // Perpendicular Vector (90 deg to centerline)
    const pCos = Math.cos(mathRad + Math.PI/2);
    const pSin = Math.sin(mathRad + Math.PI/2);

    // 4. Calculate the 4 corners relative to (cx, cy)
    // Inner points (Base) lie on the Main Circle.
    // The distance from center to the wall intersection is NOT mainR.
    // The intersection point lies on the circle.
    // The wall is offset by branchR from the center ray.
    // Geometry: A right triangle formed by (0,0), the wall projection, and the intersection point.
    // Hypotenuse = mainR. One leg = safeBranchR.
    // Adjacent leg (distance along centerline) = sqrt(mainR^2 - safeBranchR^2).
    
    const distToBaseCenter = Math.sqrt(mainR*mainR - safeBranchR*safeBranchR);
    const distToEndCenter = mainR + stickOut;

    // Point calculations
    // Base is the chord line inside the circle
    const baseCenter = { x: cx + distToBaseCenter * cos, y: cy + distToBaseCenter * sin };
    const endCenter = { x: cx + distToEndCenter * cos, y: cy + distToEndCenter * sin };

    // Corners
    const p1 = { x: baseCenter.x + safeBranchR * pCos, y: baseCenter.y + safeBranchR * pSin }; // Base Left
    const p2 = { x: endCenter.x + safeBranchR * pCos, y: endCenter.y + safeBranchR * pSin };   // Top Left
    const p3 = { x: endCenter.x - safeBranchR * pCos, y: endCenter.y - safeBranchR * pSin };   // Top Right
    const p4 = { x: baseCenter.x - safeBranchR * pCos, y: baseCenter.y - safeBranchR * pSin }; // Base Right

    // 5. Construct Path
    // We draw the rectangular neck, then an Arc for the base to conform to the circle.
    // Arc logic:
    // Start at p4 (Base Right), Arc to p1 (Base Left).
    // Radius is mainR.
    // Sweep flag depends on direction.
    // We assume "Left" and "Right" relative to the branch vector.
    // If we trace p1 -> p2 -> p3 -> p4, we are going Clockwise relative to the branch body?
    // Let's trace: BaseLeft -> TopLeft -> TopRight -> BaseRight.
    // To close BaseRight -> BaseLeft, we follow the main circle.
    // Since p1 and p4 are on the circle, we use an Arc command.
    
    // Determine Sweep Flag:
    // If the branch is pointing OUT, the circle arc connecting the base points usually bows "inward" relative to the branch (convex main pipe).
    // Actually, visually in 2D section, the connection is the chord line (p1 to p4) if it's a straight cut, 
    // but represented as a curve matching the pipe surface.
    // Correct SVG Arc: A rx ry rot large_arc sweep endX endY
    // We want the arc to bow *away* from the center of the main pipe.
    // From p4 to p1.
    const sweep = 1; 

    const path = `M${p1.x},${p1.y} L${p2.x},${p2.y} L${p3.x},${p3.y} L${p4.x},${p4.y} A${mainR},${mainR} 0 0,${sweep} ${p1.x},${p1.y} Z`;

    // 6. Flange Path (at the end face)
    let flangePath = "";
    if (isTap) {
        const fh = 5;
        const fw = (branchR * 2) + 8; // Flange width relative to diameter
        const hfw = fw/2;
        
        // Back of flange (where it touches pipe neck)
        const fBackCenter = { x: cx + (distToEndCenter - fh) * cos, y: cy + (distToEndCenter - fh) * sin };
        
        const f1 = { x: endCenter.x + hfw*pCos, y: endCenter.y + hfw*pSin }; // Face Top Left
        const f2 = { x: fBackCenter.x + hfw*pCos, y: fBackCenter.y + hfw*pSin }; // Back Top Left
        const f3 = { x: fBackCenter.x - hfw*pCos, y: fBackCenter.y - hfw*pSin }; // Back Top Right
        const f4 = { x: endCenter.x - hfw*pCos, y: endCenter.y - hfw*pSin }; // Face Top Right
        
        flangePath = `M${f1.x},${f1.y} L${f2.x},${f2.y} L${f3.x},${f3.y} L${f4.x},${f4.y} Z`;
    }

    return {
        path,
        flangePath,
        labelPoint: { x: cx + (distToEndCenter + 40) * cos, y: cy + (distToEndCenter + 40) * sin },
        endPoint: endCenter
    };
};
