
import { ComponentType, DuctParams } from "../types";
import { 
    generateElbow, 
    generateReducer, 
    generateStraight, 
    generateTee, 
    generateCrossTee,
    generateLateralTee,
    generateBootTee,
    generateTransformation, 
    generateVolumeDamper, 
    generateMultibladeDamper, 
    generateStraightWithTaps,
    generateBlindPlate,
    generateBlastGateDamper,
    generateAngleFlange,
    generateOffset,
    generateSaddle
} from "./ductGenerators";

/**
 * Local Parametric SVG Generator Service
 * Dispatches drawing generation to specific component modules.
 * Now supports activeField for interactive highlighting.
 */

export const generateDuctDrawing = (type: ComponentType, params: DuctParams, activeField: string | null = null): string => {
    switch (type) {
        case ComponentType.ELBOW: return generateElbow(params, activeField);
        case ComponentType.REDUCER: return generateReducer(params, activeField);
        case ComponentType.STRAIGHT: return generateStraight(params, activeField);
        case ComponentType.TEE: return generateTee(params, activeField);
        case ComponentType.CROSS_TEE: return generateCrossTee(params, activeField);
        case ComponentType.LATERAL_TEE: return generateLateralTee(params, activeField);
        case ComponentType.BOOT_TEE: return generateBootTee(params, activeField);
        case ComponentType.TRANSFORMATION: return generateTransformation(params, activeField);
        case ComponentType.VOLUME_DAMPER: return generateVolumeDamper(params, activeField);
        case ComponentType.MULTIBLADE_DAMPER: return generateMultibladeDamper(params, activeField);
        case ComponentType.STRAIGHT_WITH_TAPS: return generateStraightWithTaps(params, activeField);
        case ComponentType.BLIND_PLATE: return generateBlindPlate(params, activeField);
        case ComponentType.BLAST_GATE_DAMPER: return generateBlastGateDamper(params, activeField);
        case ComponentType.ANGLE_FLANGE: return generateAngleFlange(params, activeField);
        case ComponentType.OFFSET: return generateOffset(params, activeField);
        case ComponentType.SADDLE: return generateSaddle(params, activeField);
        case ComponentType.MANUAL: return "";
        default: return "";
    }
};
