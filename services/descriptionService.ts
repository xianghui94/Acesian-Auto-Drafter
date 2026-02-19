
import { ComponentType, DuctParams } from "../types";

export const generateDescription = (type: ComponentType, params: DuctParams): string => {
    if (type === ComponentType.MANUAL) {
        return params.userDescription || "Manual Item";
    } else if (type === ComponentType.STRAIGHT) {
        return "Straight Duct";
    } else if (type === ComponentType.TRANSFORMATION) {
        let desc = "Transformation Sq-Rd";
        if (params.offset && params.offset !== 0) desc += ` (Offset H=${params.offset})`;
        return desc;
    } else if (type === ComponentType.VOLUME_DAMPER) {
        return `VCD (${params.actuation || 'Handle'})`;
    } else if (type === ComponentType.MULTIBLADE_DAMPER) {
        return `${params.bladeType || 'Parallel'} Multiblade Damper`;
    } else if (type === ComponentType.STRAIGHT_WITH_TAPS) {
        let desc = "Straight";
        if ((params.tapQty || 0) > 0) desc += ` w/ ${params.tapQty} Taps`;
        if ((params.nptQty || 0) > 0) desc += ` & ${params.nptQty} NPT`;
        return desc;
    } else if (type === ComponentType.BLIND_PLATE) {
        return `Blind Plate Ø${params.d1}`;
    } else if (type === ComponentType.BLAST_GATE_DAMPER) {
        return `Blast Gate Damper Ø${params.d1}`;
    } else if (type === ComponentType.ANGLE_FLANGE) {
        return `Angle Flange Ø${params.d1}`;
    } else if (type === ComponentType.TEE) {
        return `Tee Ø${params.main_d} / Ø${params.tap_d}`;
    } else if (type === ComponentType.CROSS_TEE) {
        return `Cross Tee Ø${params.main_d} / Ø${params.tap_d}`;
    } else if (type === ComponentType.LATERAL_TEE) {
        return `Lateral Tee (45°) Ø${params.d1} / Ø${params.d2}`;
    } else if (type === ComponentType.BOOT_TEE) {
        return `Boot Tee Ø${params.d1} / Ø${params.d2}`;
    } else if (type === ComponentType.OFFSET) {
        if (params.d1 !== params.d2) {
             return `Reducing Offset Ø${params.d1}-Ø${params.d2} / L=${params.length} / H=${params.offset}`;
        } else {
             return `Offset Ø${params.d1} / L=${params.length} / H=${params.offset}`;
        }
    } else if (type === ComponentType.ELBOW) {
        let desc = `Elbow Ø${params.d1} / ${params.angle}° / R${params.radius}`;
        if ((params.extension1 || 0) > 0 || (params.extension2 || 0) > 0) {
            desc += ` / Ext:${params.extension1 || 0}+${params.extension2 || 0}`;
        }
        return desc;
    } else if (type === ComponentType.REDUCER) {
        const typeStr = params.reducerType === "Eccentric" ? "Eccentric Reducer" : "Reducer";
        let desc = `${typeStr} Ø${params.d1} / Ø${params.d2} / L${params.length}`;
        if ((params.extension1 !== undefined && params.extension1 !== 50) || (params.extension2 !== undefined && params.extension2 !== 50)) {
            desc += ` / RC:${params.extension1 || 50}-${params.extension2 || 50}`;
        }
        return desc;
    } else if (type === ComponentType.SADDLE) {
        return `Saddle Tap Ø${params.d1} on Ø${params.d2} / L${params.length}`;
    }
    
    // Fallback: Cast to string to avoid "never" type error since all cases are currently covered
    return (type as string).split('(')[0];
};
