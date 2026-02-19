
import { ComponentType, DuctParams } from "../types";
import { COMPONENT_REGISTRY } from "./componentRegistry";

export const generateDescription = (type: ComponentType, params: DuctParams): string => {
    const entry = COMPONENT_REGISTRY[type];
    if (entry) {
        return entry.getDescription(params);
    }
    return "Unknown Item";
};
