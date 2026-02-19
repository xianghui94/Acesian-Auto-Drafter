
import { ComponentType, DuctParams } from '../types';
import { getFlangeParams } from './flangeStandards';

// --- Default Parameter Values ---
export const getDefaultParams = (type: ComponentType): DuctParams => {
    switch (type) {
      case ComponentType.ELBOW: return { d1: 500, angle: 90, radius: 250, extension1: 0, extension2: 0 };
      case ComponentType.REDUCER: return { d1: 500, d2: 300, length: 300, extension1: 50, extension2: 50, reducerType: "Concentric" };
      case ComponentType.STRAIGHT: return { d1: 300, length: 1200 };
      case ComponentType.TEE: return { main_d: 500, tap_d: 300, length: 500, branch_l: 100 };
      case ComponentType.CROSS_TEE: return { main_d: 500, tap_d: 300, length: 500, branch_l: 100 };
      case ComponentType.LATERAL_TEE: {
          const d2 = 300;
          const gap = d2 * 1.4142;
          return { d1: 500, d2: d2, length: Math.round(gap + 200), a_len: 100, b_len: 100, branch_len: Math.round(gap + 200) }; 
      }
      case ComponentType.BOOT_TEE: return { d1: 500, d2: 300, length: 600, a_len: 100, b_len: 100, branch_len: 175 };
      case ComponentType.TRANSFORMATION: return { d1: 500, width: 500, height: 500, length: 300, offset: 0 };
      case ComponentType.VOLUME_DAMPER: return { d1: 200, length: 150, actuation: "Handle" };
      case ComponentType.MULTIBLADE_DAMPER: return { d1: 700, length: 400, bladeType: "Parallel" };
      case ComponentType.STRAIGHT_WITH_TAPS: return { d1: 500, length: 1200, tapQty: 1, nptQty: 0, seamAngle: 0, taps: [{ dist: 600, diameter: 150, angle: 0 }], nptPorts: [] };
      case ComponentType.BLIND_PLATE: {
          const f = getFlangeParams(200);
          return { d1: 200, pcd: f.bcd, holeCount: f.holeCount };
      }
      case ComponentType.BLAST_GATE_DAMPER: return { d1: 200, length: 200 };
      case ComponentType.ANGLE_FLANGE: {
          const f = getFlangeParams(800);
          return { d1: 800, pcd: f.bcd, holeCount: f.holeCount };
      }
      case ComponentType.OFFSET: return { d1: 500, d2: 500, length: 800, offset: 200 };
      case ComponentType.SADDLE: return { d1: 1000, d2: 450, length: 100 };
      case ComponentType.MANUAL: return { userDescription: "" };
      default: return {};
    }
};

// --- Engineering Rules Hydration ---
// Applies rules like "Radius = 0.5 * D" if D changes but R is not explicitly set by user/AI
export const hydrateItemParams = (type: ComponentType, partialParams: DuctParams): DuctParams => {
    // 1. Start with defaults
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
