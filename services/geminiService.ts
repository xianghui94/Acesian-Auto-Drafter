
import { ComponentType, DuctParams } from "../types";
import { COMPONENT_REGISTRY } from "./componentRegistry";

/**
 * Local Parametric SVG Generator Service
 * Dispatches drawing generation to specific component modules using the Registry.
 */

export const generateDuctDrawing = (type: ComponentType, params: DuctParams, activeField: string | null = null): string => {
    const entry = COMPONENT_REGISTRY[type];
    if (entry && entry.generator) {
        return entry.generator(params, activeField);
    }
    return "";
};
