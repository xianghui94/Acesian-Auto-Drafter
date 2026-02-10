
export enum ComponentType {
  ELBOW = "Elbow (弯头)",
  REDUCER = "Reducer (变径)",
  STRAIGHT = "Straight (直管)",
  TEE = "Tee (三通)",
  TRANSFORMATION = "Transformation (Square to Round)",
  VOLUME_DAMPER = "Volume Control Damper (风阀)",
  MULTIBLADE_DAMPER = "Multiblade Damper (多叶风阀)",
  STRAIGHT_WITH_TAPS = "Straight Duct w/ Taps (直管带支管)",
  BLIND_PLATE = "Blind Plate (盲板)",
  BLAST_GATE_DAMPER = "Blast Gate Damper (插板阀)",
  ANGLE_FLANGE = "Angle Flange (角铁法兰)",
  OFFSET = "Offset (S-Bend)"
}

export type DuctParams = {
  [key: string]: any;
};

export interface OrderHeader {
  company: string;
  from: string;
  project: string;
  date: string;
  lateralNo: string;
  requiredDate: string;
  osNo: string;
  poNo: string;
  preparedBy: string;
  personInCharge: string;
  customerRef: string;
  deliveryAddress: string;
  afType: string;
  pressureRating: string;
}

export interface OrderItem {
  id: string;
  itemNo: number;
  description: string; // Auto-generated from params
  material: string;
  thickness: string;
  qty: number;
  coating: string;
  tagNo: string;
  notes: string;
  sketchSvg?: string | null; // The Gemini generated SVG
  componentType: ComponentType;
  params: DuctParams;
}

// Ensure process.env.API_KEY is typed
declare global {
  interface Window {
    showSaveFilePicker?: (options?: any) => Promise<any>;
  }
}
