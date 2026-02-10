import { ComponentType, DuctParams } from "../types";
import { 
    generateElbow, 
    generateReducer, 
    generateStraight, 
    generateTee, 
    generateTransformation, 
    generateVolumeDamper, 
    generateMultibladeDamper, 
    generateStraightWithTaps,
    generateBlindPlate,
    generateBlastGateDamper,
    generateAngleFlange,
    generateOffset
} from "./ductGenerators";

/**
 * Local Parametric SVG Generator Service
 * Dispatches drawing generation to specific component modules.
 */

export const generateDuctDrawing = (type: ComponentType, params: DuctParams): string => {
    switch (type) {
        case ComponentType.ELBOW: return generateElbow(params);
        case ComponentType.REDUCER: return generateReducer(params);
        case ComponentType.STRAIGHT: return generateStraight(params);
        case ComponentType.TEE: return generateTee(params);
        case ComponentType.TRANSFORMATION: return generateTransformation(params);
        case ComponentType.VOLUME_DAMPER: return generateVolumeDamper(params);
        case ComponentType.MULTIBLADE_DAMPER: return generateMultibladeDamper(params);
        case ComponentType.STRAIGHT_WITH_TAPS: return generateStraightWithTaps(params);
        case ComponentType.BLIND_PLATE: return generateBlindPlate(params);
        case ComponentType.BLAST_GATE_DAMPER: return generateBlastGateDamper(params);
        case ComponentType.ANGLE_FLANGE: return generateAngleFlange(params);
        case ComponentType.OFFSET: return generateOffset(params);
        default: return "";
    }
};