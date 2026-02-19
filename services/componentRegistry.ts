
import React from 'react';
import { ComponentType, DuctParams } from "../types";
import * as Inputs from "../components/DuctInputs";
import * as Generators from "./ductGenerators";
import { getFlangeParams } from "./flangeStandards";

export interface RegistryItem {
    inputs: React.FC<any>;
    generator: (params: DuctParams, activeField: string | null) => string;
    defaultParams: DuctParams;
    getDescription: (params: DuctParams) => string;
}

export const COMPONENT_REGISTRY: Record<ComponentType, RegistryItem> = {
    [ComponentType.ELBOW]: {
        inputs: Inputs.ElbowInputs,
        generator: Generators.generateElbow,
        defaultParams: { d1: 500, angle: 90, radius: 250, extension1: 0, extension2: 0 },
        getDescription: (p) => {
            let desc = `Elbow Ø${p.d1} / ${p.angle}° / R${p.radius}`;
            if ((p.extension1 || 0) > 0 || (p.extension2 || 0) > 0) {
                desc += ` / Ext:${p.extension1 || 0}+${p.extension2 || 0}`;
            }
            return desc;
        }
    },
    [ComponentType.REDUCER]: {
        inputs: Inputs.ReducerInputs,
        generator: Generators.generateReducer,
        defaultParams: { d1: 500, d2: 300, length: 300, extension1: 50, extension2: 50, reducerType: "Concentric" },
        getDescription: (p) => {
            const typeStr = p.reducerType === "Eccentric" ? "Eccentric Reducer" : "Reducer";
            let desc = `${typeStr} Ø${p.d1} / Ø${p.d2} / L${p.length}`;
            if ((p.extension1 !== undefined && p.extension1 !== 50) || (p.extension2 !== undefined && p.extension2 !== 50)) {
                desc += ` / RC:${p.extension1 || 50}-${p.extension2 || 50}`;
            }
            return desc;
        }
    },
    [ComponentType.STRAIGHT]: {
        inputs: Inputs.StraightInputs,
        generator: Generators.generateStraight,
        defaultParams: { d1: 300, length: 1200 },
        getDescription: (p) => "Straight Duct"
    },
    [ComponentType.TEE]: {
        inputs: Inputs.TeeInputs,
        generator: Generators.generateTee,
        defaultParams: { main_d: 500, tap_d: 300, length: 500, branch_l: 100 },
        getDescription: (p) => `Tee Ø${p.main_d} / Ø${p.tap_d}`
    },
    [ComponentType.CROSS_TEE]: {
        inputs: Inputs.CrossTeeInputs,
        generator: Generators.generateCrossTee,
        defaultParams: { main_d: 500, tap_d: 300, length: 500, branch_l: 100 },
        getDescription: (p) => `Cross Tee Ø${p.main_d} / Ø${p.tap_d}`
    },
    [ComponentType.LATERAL_TEE]: {
        inputs: Inputs.LateralTeeInputs,
        generator: Generators.generateLateralTee,
        defaultParams: { d1: 500, d2: 300, length: 624, a_len: 100, b_len: 100, branch_len: 624 }, // 300*1.414 + 200 = ~624
        getDescription: (p) => `Lateral Tee (45°) Ø${p.d1} / Ø${p.d2}`
    },
    [ComponentType.BOOT_TEE]: {
        inputs: Inputs.BootTeeInputs,
        generator: Generators.generateBootTee,
        defaultParams: { d1: 500, d2: 300, length: 600, a_len: 100, b_len: 100, branch_len: 175 },
        getDescription: (p) => `Boot Tee Ø${p.d1} / Ø${p.d2}`
    },
    [ComponentType.TRANSFORMATION]: {
        inputs: Inputs.TransformationInputs,
        generator: Generators.generateTransformation,
        defaultParams: { d1: 500, width: 500, height: 500, length: 300, offset: 0 },
        getDescription: (p) => {
            let desc = "Transformation Sq-Rd";
            if (p.offset && p.offset !== 0) desc += ` (Offset H=${p.offset})`;
            return desc;
        }
    },
    [ComponentType.VOLUME_DAMPER]: {
        inputs: Inputs.VolumeDamperInputs,
        generator: Generators.generateVolumeDamper,
        defaultParams: { d1: 200, length: 150, actuation: "Handle" },
        getDescription: (p) => `VCD (${p.actuation || 'Handle'})`
    },
    [ComponentType.MULTIBLADE_DAMPER]: {
        inputs: Inputs.MultibladeDamperInputs,
        generator: Generators.generateMultibladeDamper,
        defaultParams: { d1: 700, length: 400, bladeType: "Parallel" },
        getDescription: (p) => `${p.bladeType || 'Parallel'} Multiblade Damper`
    },
    [ComponentType.STRAIGHT_WITH_TAPS]: {
        inputs: Inputs.StraightWithTapsInputs,
        generator: Generators.generateStraightWithTaps,
        defaultParams: { d1: 500, length: 1200, tapQty: 1, nptQty: 0, seamAngle: 0, taps: [{ dist: 600, diameter: 150, angle: 0 }], nptPorts: [] },
        getDescription: (p) => {
            let desc = "Straight";
            if ((p.tapQty || 0) > 0) desc += ` w/ ${p.tapQty} Taps`;
            if ((p.nptQty || 0) > 0) desc += ` & ${p.nptQty} NPT`;
            return desc;
        }
    },
    [ComponentType.BLIND_PLATE]: {
        inputs: Inputs.BlindPlateInputs,
        generator: Generators.generateBlindPlate,
        defaultParams: { d1: 200, pcd: 233, holeCount: 8 }, // Will be hydrated dynamically
        getDescription: (p) => `Blind Plate Ø${p.d1}`
    },
    [ComponentType.BLAST_GATE_DAMPER]: {
        inputs: Inputs.BlastGateDamperInputs,
        generator: Generators.generateBlastGateDamper,
        defaultParams: { d1: 200, length: 200 },
        getDescription: (p) => `Blast Gate Damper Ø${p.d1}`
    },
    [ComponentType.ANGLE_FLANGE]: {
        inputs: Inputs.AngleFlangeInputs,
        generator: Generators.generateAngleFlange,
        defaultParams: { d1: 800, pcd: 844, holeCount: 28 }, // Will be hydrated
        getDescription: (p) => `Angle Flange Ø${p.d1}`
    },
    [ComponentType.OFFSET]: {
        inputs: Inputs.OffsetInputs,
        generator: Generators.generateOffset,
        defaultParams: { d1: 500, d2: 500, length: 800, offset: 200 },
        getDescription: (p) => {
            if (p.d1 !== p.d2) {
                 return `Reducing Offset Ø${p.d1}-Ø${p.d2} / L=${p.length} / H=${p.offset}`;
            } else {
                 return `Offset Ø${p.d1} / L=${p.length} / H=${p.offset}`;
            }
        }
    },
    [ComponentType.SADDLE]: {
        inputs: Inputs.SaddleInputs,
        generator: Generators.generateSaddle,
        defaultParams: { d1: 1000, d2: 450, length: 100 },
        getDescription: (p) => `Saddle Tap Ø${p.d1} on Ø${p.d2} / L=${p.length}`
    },
    [ComponentType.MANUAL]: {
        inputs: Inputs.ManualInputs,
        generator: (p) => "",
        defaultParams: { userDescription: "" },
        getDescription: (p) => p.userDescription || "Manual Item"
    }
};
