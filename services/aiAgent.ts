import { GoogleGenAI } from "@google/generative-ai";
import readXlsxFile from 'read-excel-file';
import { ComponentType, OrderItem } from "../types";

// Schema definition for the AI to understand our data structure
const SYSTEM_INSTRUCTION = `
You are an expert HVAC CAD Detailer. Your task is to extract ductwork components from raw Excel/BOM data and structure them for a drafting program.

Available Component Types (Use EXACT Enum String):
${Object.values(ComponentType).map(t => `- "${t}"`).join('\n')}

Rules:
1. Analyze the description and dimensions in the input rows.
2. Infer the 'componentType' based on keywords (e.g., "Bend" -> ELBOW, "Taper" -> REDUCER, "VCD" -> VOLUME_DAMPER).
3. Extract dimensions into a 'params' object. Common keys: d1, d2, length, angle, radius, width, height, offset.
   - For TEE/CROSS: 'main_d', 'tap_d', 'length', 'branch_l'.
   - For ELBOW: 'd1', 'angle', 'radius'.
   - For REDUCER: 'd1', 'd2', 'length'.
4. Extract quantity, thickness, material, and tagNo.
5. If a row is header or junk, ignore it.
6. Return a JSON object with a key "items" containing the array of extracted items.
7. Ensure all numeric dimensions are numbers, not strings.

Example Output Format:
{
  "items": [
    {
      "componentType": "Elbow (弯头)",
      "qty": 2,
      "material": "SS304",
      "thickness": "0.8",
      "tagNo": "EF-01",
      "params": { "d1": 500, "angle": 90, "radius": 250 }
    }
  ]
}
`;

export const parseExcelWithGemini = async (file: File): Promise<Partial<OrderItem>[]> => {
    try {
        // 1. Read Excel File
        const rows = await readXlsxFile(file);
        
        // Convert to simple CSV-like string for token efficiency
        const csvContent = rows.map(row => row.join(" | ")).join("\n");

        // 2. Initialize Gemini with Environment Variable
        const model = genAI.getGenerativeModel({;
        
        // 3. Call API with 3-flash-preview (recommended for text tasks)
        const prompt = `Here is the BOM data:\n${csvContent}`;
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: prompt,
            config: {
                systemInstruction: SYSTEM_INSTRUCTION,
                responseMimeType: "application/json"
            }
        });

        // 4. Parse Response
        const responseText = response.text;
        if (!responseText) throw new Error("Empty response from AI");

        const parsed = JSON.parse(responseText);
        
        if (!parsed.items || !Array.isArray(parsed.items)) {
             throw new Error("AI returned invalid JSON structure");
        }

        return parsed.items;

    } catch (error) {
        console.error("AI Agent Error:", error);
        throw error;
    }
};