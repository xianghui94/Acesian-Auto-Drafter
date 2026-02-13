
export interface FlangeStd {
    d: number;
    id: number;
    od: number;
    thickness: number;
    width: number;
    height: number;
    bcd: number; // Bolt Circle Diameter (PCD)
    holeSize: number;
    boltSize: string;
    holeCount: number;
}

// Data transcribed from the provided Angle Flange table
const FLANGE_DATA: FlangeStd[] = [
    {d: 100, id: 103, od: 156, thickness: 3.0, width: 25.4, height: 17, bcd: 133, holeSize: 8.5, boltSize: "1/4", holeCount: 6},
    {d: 150, id: 153, od: 206, thickness: 3.0, width: 25.4, height: 17, bcd: 183, holeSize: 8.5, boltSize: "1/4", holeCount: 6},
    {d: 200, id: 203, od: 260, thickness: 3.0, width: 27, height: 18, bcd: 233, holeSize: 8.5, boltSize: "1/4", holeCount: 8},
    {d: 250, id: 253, od: 310, thickness: 3.0, width: 27, height: 18, bcd: 283, holeSize: 8.5, boltSize: "1/4", holeCount: 10},
    {d: 300, id: 303, od: 366, thickness: 3.0, width: 32, height: 20, bcd: 338, holeSize: 11, boltSize: "3/8", holeCount: 12},
    {d: 350, id: 353, od: 416, thickness: 3.0, width: 32, height: 20, bcd: 388, holeSize: 11, boltSize: "3/8", holeCount: 12},
    {d: 400, id: 403, od: 466, thickness: 3.0, width: 32, height: 20, bcd: 438, holeSize: 11, boltSize: "3/8", holeCount: 16},
    {d: 450, id: 453, od: 528, thickness: 3.0, width: 38, height: 20, bcd: 488, holeSize: 11, boltSize: "3/8", holeCount: 16},
    {d: 500, id: 503, od: 578, thickness: 3.0, width: 38, height: 20, bcd: 544, holeSize: 11, boltSize: "3/8", holeCount: 20},
    {d: 550, id: 553, od: 628, thickness: 3.0, width: 38, height: 20, bcd: 594, holeSize: 11, boltSize: "3/8", holeCount: 20},
    {d: 600, id: 603, od: 678, thickness: 3.0, width: 38, height: 20, bcd: 644, holeSize: 11, boltSize: "3/8", holeCount: 20},
    {d: 650, id: 653, od: 728, thickness: 3.0, width: 38, height: 20, bcd: 694, holeSize: 11, boltSize: "3/8", holeCount: 24},
    {d: 700, id: 703, od: 778, thickness: 3.0, width: 38, height: 20, bcd: 744, holeSize: 11, boltSize: "3/8", holeCount: 24},
    {d: 750, id: 753, od: 828, thickness: 3.0, width: 38, height: 20, bcd: 794, holeSize: 11, boltSize: "3/8", holeCount: 28},
    {d: 800, id: 803, od: 878, thickness: 3.0, width: 38, height: 20, bcd: 844, holeSize: 11, boltSize: "3/8", holeCount: 28},
    {d: 850, id: 853, od: 928, thickness: 3.0, width: 38, height: 20, bcd: 894, holeSize: 11, boltSize: "3/8", holeCount: 32},
    {d: 900, id: 903, od: 978, thickness: 3.0, width: 38, height: 20, bcd: 944, holeSize: 11, boltSize: "3/8", holeCount: 32},
    {d: 950, id: 953, od: 1028, thickness: 3.0, width: 38, height: 20, bcd: 994, holeSize: 11, boltSize: "3/8", holeCount: 36},
    {d: 1000, id: 1003, od: 1078, thickness: 4.0, width: 38, height: 38, bcd: 1044, holeSize: 13.5, boltSize: "1/2", holeCount: 36},
    {d: 1050, id: 1053, od: 1128, thickness: 4.0, width: 38, height: 38, bcd: 1094, holeSize: 13.5, boltSize: "1/2", holeCount: 40},
    {d: 1100, id: 1103, od: 1178, thickness: 4.0, width: 38, height: 38, bcd: 1144, holeSize: 13.5, boltSize: "1/2", holeCount: 40},
    {d: 1150, id: 1153, od: 1228, thickness: 4.0, width: 38, height: 38, bcd: 1194, holeSize: 13.5, boltSize: "1/2", holeCount: 44},
    {d: 1200, id: 1203, od: 1278, thickness: 4.0, width: 38, height: 38, bcd: 1244, holeSize: 13.5, boltSize: "1/2", holeCount: 44},
    {d: 1250, id: 1253, od: 1328, thickness: 4.0, width: 38, height: 38, bcd: 1294, holeSize: 13.5, boltSize: "1/2", holeCount: 48},
    {d: 1300, id: 1303, od: 1378, thickness: 4.0, width: 38, height: 38, bcd: 1344, holeSize: 13.5, boltSize: "1/2", holeCount: 48},
    {d: 1350, id: 1353, od: 1428, thickness: 4.0, width: 38, height: 38, bcd: 1394, holeSize: 13.5, boltSize: "1/2", holeCount: 52},
    {d: 1400, id: 1403, od: 1478, thickness: 4.0, width: 38, height: 38, bcd: 1444, holeSize: 13.5, boltSize: "1/2", holeCount: 52},
    {d: 1450, id: 1453, od: 1528, thickness: 4.0, width: 38, height: 38, bcd: 1494, holeSize: 13.5, boltSize: "1/2", holeCount: 56},
    {d: 1500, id: 1503, od: 1578, thickness: 4.0, width: 38, height: 38, bcd: 1544, holeSize: 13.5, boltSize: "1/2", holeCount: 56},
    {d: 1550, id: 1553, od: 1628, thickness: 4.0, width: 38, height: 38, bcd: 1594, holeSize: 13.5, boltSize: "1/2", holeCount: 60},
    {d: 1600, id: 1603, od: 1703, thickness: 5.0, width: 50, height: 50, bcd: 1660, holeSize: 13.5, boltSize: "1/2", holeCount: 60},
    {d: 1700, id: 1703, od: 1803, thickness: 5.0, width: 50, height: 50, bcd: 1760, holeSize: 13.5, boltSize: "1/2", holeCount: 64},
    {d: 1800, id: 1803, od: 1903, thickness: 5.0, width: 50, height: 50, bcd: 1860, holeSize: 13.5, boltSize: "1/2", holeCount: 68},
    {d: 1900, id: 1903, od: 2003, thickness: 5.0, width: 50, height: 50, bcd: 1960, holeSize: 13.5, boltSize: "1/2", holeCount: 72},
    {d: 2000, id: 2002, od: 2102, thickness: 5.0, width: 50, height: 50, bcd: 2060, holeSize: 13.5, boltSize: "1/2", holeCount: 74},
    {d: 2100, id: 2102, od: 2202, thickness: 5.0, width: 50, height: 50, bcd: 2160, holeSize: 13.5, boltSize: "1/2", holeCount: 78},
    {d: 2200, id: 2202, od: 2302, thickness: 5.0, width: 50, height: 50, bcd: 2260, holeSize: 13.5, boltSize: "1/2", holeCount: 80},
    {d: 2300, id: 2302, od: 2402, thickness: 5.0, width: 50, height: 50, bcd: 2360, holeSize: 13.5, boltSize: "1/2", holeCount: 88},
    {d: 2400, id: 2402, od: 2502, thickness: 5.0, width: 50, height: 50, bcd: 2460, holeSize: 13.5, boltSize: "1/2", holeCount: 92},
    {d: 2500, id: 2502, od: 2602, thickness: 5.0, width: 50, height: 50, bcd: 2560, holeSize: 13.5, boltSize: "1/2", holeCount: 96},
    {d: 2600, id: 2602, od: 2702, thickness: 5.0, width: 50, height: 50, bcd: 2660, holeSize: 13.5, boltSize: "1/2", holeCount: 100},
    {d: 2700, id: 2702, od: 2802, thickness: 5.0, width: 50, height: 50, bcd: 2760, holeSize: 13.5, boltSize: "1/2", holeCount: 100},
    {d: 2800, id: 2802, od: 2902, thickness: 5.0, width: 50, height: 50, bcd: 2860, holeSize: 13.5, boltSize: "1/2", holeCount: 100},
    {d: 2900, id: 2902, od: 3002, thickness: 5.0, width: 50, height: 50, bcd: 2960, holeSize: 13.5, boltSize: "1/2", holeCount: 102},
    {d: 3000, id: 3002, od: 3102, thickness: 5.0, width: 50, height: 50, bcd: 3060, holeSize: 13.5, boltSize: "1/2", holeCount: 104},
];

export const getFlangeParams = (d1: number) => {
    // Find closest match or interpolate? The table uses discrete steps.
    // We will find the exact match or the next largest step.
    
    // Sort just in case
    const sorted = FLANGE_DATA.sort((a,b) => a.d - b.d);
    
    // Find exact or closest upper bound
    let match = sorted.find(f => f.d >= d1);
    
    // If d1 is larger than max in table, we extrapolate or just use the largest (3000)
    if (!match) {
        match = sorted[sorted.length - 1];
        // simple extrapolation logic for large custom sizes if needed, 
        // but for now return largest standard
        return {
            ...match,
            // Adjust BCD and OD relative to the custom D1 if it's way off
            bcd: d1 + (match.bcd - match.d),
            od: d1 + (match.od - match.d)
        };
    }
    
    return match;
};