
import { ComponentType, DuctParams } from '../types';
import { getFlangeParams } from './flangeStandards';
import { COMPONENT_REGISTRY } from './componentRegistry';

// --- Default Parameter Values ---
export const getDefaultParams = (type: ComponentType): DuctParams => {
    const entry = COMPONENT_REGISTRY[type];
    if (!entry) return {};
    
    // Create a copy to prevent mutation of the registry
    const params = JSON.parse(JSON.stringify(entry.defaultParams));
    
    // Dynamic defaults for Standard items that depend on lookup
    if (type === ComponentType.BLIND_PLATE || type === ComponentType.ANGLE_FLANGE) {
        // Hydrate default params based on the standard table for the default diameter
        // This ensures the "default" object is valid engineering-wise right away
        const d = params.d1 || 200;
        const f = getFlangeParams(d);
        params.pcd = f.bcd;
        params.holeCount = f.holeCount;
    }
    
    return params;
};

// --- Engineering Rules Hydration ---
// Applies rules like "Radius = 0.5 * D" if D changes but R is not explicitly set by user/AI
export const hydrateItemParams = (type: ComponentType, partialParams: DuctParams): DuctParams => {
    // 1. Start with defaults from Registry
    const defaults = getDefaultParams(type);
    
    // 2. Merge partial inputs (from AI)
    // We filter out undefined/null from partialParams to not overwrite defaults with nothing
    const merged = { ...defaults };
    Object.keys(partialParams).forEach(k => {
        if (partialParams[k] !== undefined && partialParams[k] !== null && partialParams[k] !== "") {
            merged[k] = partialParams[k];
        }
    });

    // 3. Apply Engineering Calculations based on the MERGED values
    // This fixes the issue where AI gives D=1000 but we kept Default R=250.
    
    if (type === ComponentType.ELBOW) {
        // If Radius matches the default (250) but D1 changed, recalculate Radius
        const d1 = Number(merged.d1);
        if (merged.radius === 250 && d1 !== 500) {
            merged.radius = (d1 < 200) ? d1 * 1.0 : d1 * 0.5;
        }
    }

    if (type === ComponentType.TEE || type === ComponentType.CROSS_TEE) {
        // Recalc length if Tap D changed but Length is still default
        const tapD = Number(merged.tap_d);
        if (merged.length === 500 && tapD !== 300) {
            merged.length = tapD + 200;
        }
    }

    if (type === ComponentType.OFFSET) {
        // If D2 missing, sync with D1
        if (!partialParams.d2) {
            merged.d2 = merged.d1;
        }
    }

    if (type === ComponentType.BLIND_PLATE || type === ComponentType.ANGLE_FLANGE) {
        // Update Flange standards
        const d = Number(merged.d1);
        const std = getFlangeParams(d);
        // Only override if they match old defaults or are missing
        if (merged.pcd === defaults.pcd || !merged.pcd) merged.pcd = std.bcd;
        if (merged.holeCount === defaults.holeCount || !merged.holeCount) merged.holeCount = std.holeCount;
    }

    return merged;
};
