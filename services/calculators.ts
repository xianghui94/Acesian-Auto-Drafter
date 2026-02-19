
import { OrderItem, ComponentType } from "../types";

// Constants
const DENSITY_SS304 = 7930; // kg/m^3
const DENSITY_SS316 = 7980; // kg/m^3

export interface ItemStats {
    area: number; // m2
    weight: number; // kg
}

const getThickness = (tStr: string): number => {
    const t = parseFloat(tStr);
    return isNaN(t) ? 0.8 : t; // Default to 0.8mm if parsing fails
};

// Helper: Surface Area of a Cylinder (ignoring ends)
const cylArea = (d: number, l: number) => Math.PI * (d / 1000) * (l / 1000);

export const calculateItemStats = (item: OrderItem): ItemStats => {
    const t = getThickness(item.thickness);
    let area = 0; // m2 (Surface Area for Painting/Coating)
    let weightMultiplier = 1.0; // Multiplier to account for hidden components (flanges, blades, mechanism)

    const p = item.params;

    switch (item.componentType) {
        case ComponentType.STRAIGHT:
        case ComponentType.STRAIGHT_WITH_TAPS:
            area = cylArea(p.d1 || 0, p.length || 0);
            break;

        case ComponentType.VOLUME_DAMPER:
            area = cylArea(p.d1 || 0, p.length || 0);
            // VCDs include heavy flanges, blade (often double skin), and mechanism.
            // Factor x4.0 accounts for these "hidden thicknesses".
            weightMultiplier = 4.0;
            break;

        case ComponentType.MULTIBLADE_DAMPER:
            area = cylArea(p.d1 || 0, p.length || 0);
            // Multiblade has complex linkage and multiple blades.
            weightMultiplier = 4.5;
            break;
            
        case ComponentType.BLAST_GATE_DAMPER:
            area = cylArea(p.d1 || 0, p.length || 0);
            // Gate housing and slide add significant weight.
            weightMultiplier = 3.5;
            break;

        case ComponentType.ELBOW: {
            // Approximate as a bent cylinder: Length = Arc Length at center
            // Arc = 2 * PI * R * (Angle/360)
            const angle = p.angle || 90;
            const r = p.radius || (p.d1 * 1.0);
            const arcLen = 2 * Math.PI * r * (angle / 360);
            // Add extensions
            const totalLen = arcLen + (p.extension1 || 0) + (p.extension2 || 0);
            area = cylArea(p.d1 || 0, totalLen);
            break;
        }

        case ComponentType.REDUCER:
        case ComponentType.OFFSET: {
            // Precise Frustum Area for Reducer: PI * (R1 + R2) * SlantHeight
            // SlantHeight = Sqrt(H^2 + (R1-R2)^2)
            const r1 = (p.d1 || 0) / 2;
            const r2 = (p.d2 || p.d1 || 0) / 2;
            const h = p.length || 0;
            const slantH = Math.sqrt(Math.pow(h, 2) + Math.pow(Math.abs(r1 - r2), 2));
            
            const frustumArea = Math.PI * ((r1 + r2)/1000) * (slantH/1000);
            
            // Add extensions (cylinders)
            const ext1Area = cylArea(p.d1 || 0, p.extension1 || 0);
            const ext2Area = cylArea(p.d2 || p.d1 || 0, p.extension2 || 0);
            
            area = frustumArea + ext1Area + ext2Area;
            break;
        }

        case ComponentType.TEE:
        case ComponentType.CROSS_TEE: {
            // Main Body + Branch(es)
            const mainA = cylArea(p.main_d || 0, p.length || 0);
            const branchA = cylArea(p.tap_d || 0, p.branch_l || 0);
            area = mainA + branchA;
            if (item.componentType === ComponentType.CROSS_TEE) {
                area += branchA; // Add second branch
            }
            break;
        }
        
        case ComponentType.LATERAL_TEE: {
            const latMain = cylArea(p.d1 || 0, p.length || 0);
            const latBranch = cylArea(p.d2 || 0, p.branch_len || 0);
            area = latMain + latBranch;
            break;
        }

        case ComponentType.BOOT_TEE: {
             // Main + Branch (simplified)
             const bootMain = cylArea(p.d1 || 0, p.length || 0);
             const bootBranch = cylArea(p.d2 || 0, p.branch_len || 0);
             area = bootMain + bootBranch + 0.2; 
             break;
        }

        case ComponentType.TRANSFORMATION: {
            // Approximation: Average perimeter * Length
            const circP = Math.PI * (p.d1 || 0);
            const rectP = 2 * ((p.width || 0) + (p.height || 0));
            const avgP = (circP + rectP) / 2;
            area = (avgP / 1000) * (p.length / 1000);
            break;
        }

        case ComponentType.BLIND_PLATE: {
            // Area of full circle (Plate)
            const r = (p.d1 || 0) / 2 / 1000;
            area = Math.PI * r * r;
            break;
        }

        case ComponentType.ANGLE_FLANGE: {
            // Approximate Angle Flange as a strip of material bent into a ring.
            // Developed width approx 80mm
            const circ = Math.PI * (p.d1 || 0) / 1000;
            area = circ * 0.08; 
            break;
        }
        
        case ComponentType.SADDLE: {
            area = cylArea(p.d2 || 0, p.length || 0);
            // Add skirt area approx (30% extra)
            area *= 1.3;
            break;
        }

        default:
            area = 0;
    }

    // Weight Calculation: Volume * Density
    // Volume = Area * Thickness
    // m3 = m2 * (mm / 1000)
    
    const mat = item.material ? item.material.toUpperCase() : "";
    const density = mat.includes("316") ? DENSITY_SS316 : DENSITY_SS304;

    // Apply multiplier only to weight, not surface area stats
    const weight = (area * weightMultiplier) * (t / 1000) * density * item.qty;
    
    // Total area for all qtys
    const totalArea = area * item.qty;

    return {
        area: parseFloat(totalArea.toFixed(2)),
        weight: parseFloat(weight.toFixed(2))
    };
};

export const calculateOrderTotals = (items: OrderItem[]) => {
    let totalArea = 0;
    let totalWeight = 0;

    const itemDetails = items.map(item => {
        const stats = calculateItemStats(item);
        totalArea += stats.area;
        totalWeight += stats.weight;
        return {
            ...item,
            stats
        };
    });

    return {
        totalArea: parseFloat(totalArea.toFixed(2)),
        totalWeight: parseFloat(totalWeight.toFixed(2)),
        itemDetails
    };
};
