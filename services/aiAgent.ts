
import { GoogleGenerativeAI } from "@google/generative-ai";
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
5. Capture the 'originalDescription' - the raw text description from the row that you used to make the decision.
6. **CONFIDENCE SCORE:** Assign a 'confidence' score (0.0 to 1.0).
   - 1.0: Exact match, all dimensions found.
   - 0.8: Type clear, but calculated/inferred some dimensions (e.g. inferred Radius from Diameter).
   - 0.5: Ambiguous description or missing critical dimensions.
7. **REASONING:** Briefly explain why confidence is low if < 1.0 (e.g., "Missing radius, assumed 1.0D").
8. Return a JSON object with a key "items" containing the array of extracted items.
9. Ensure all numeric dimensions are numbers, not strings.
10. **CRITICAL ELBOW RADIUS RULE (Throat Radius):**
    When processing elbows with notations like "R 1D" or "R 1.5D", the 'radius' parameter must represent the INNER throat/neck radius, not the centerline radius! 
    - If text says "R 1D", calculate radius = d1 * 0.5. (Example: d1=800 and R 1D -> radius=400).
    - If text says "R 1.5D", calculate radius = d1 * 1.0. (Example: d1=800 and R 1.5D -> radius=800).
    Do not blindly copy the "1D" multiplier. Always apply this math.

Example Output Format:
{
  "items": [
    {
      "componentType": "Elbow (弯头)",
      "qty": 2,
      "material": "SS304",
      "thickness": "0.8",
      "tagNo": "EF-01",
      "originalDescription": "ELBOW 90DEG 500DIA R=1.0D",
      "params": { "d1": 500, "angle": 90, "radius": 250 },
      "confidence": 1.0,
      "reasoning": "Exact match"
    }
  ]
}
`;

export const parseExcelWithGemini = async (file: File, apiKey: string): Promise<(Partial<OrderItem> & { originalDescription?: string, confidence?: number, reasoning?: string })[]> => {
    try {
        // 1. Read Excel File
        const rows = await readXlsxFile(file);
        
        // Convert to simple CSV-like string for token efficiency
        const csvContent = rows.map(row => row.join(" | ")).join("\n");

        // 2. Initialize Gemini
        if (!apiKey) throw new Error("API Key is required");
        const genAI = new GoogleGenerativeAI(apiKey);
        
        // 3. Configure Model
        const model = genAI.getGenerativeModel({ 
            model: "gemini-2.5-flash", 
            systemInstruction: SYSTEM_INSTRUCTION,
            generationConfig: {
                responseMimeType: "application/json"
            }
        });

        // 4. Call API
        const prompt = `Here is the BOM data:\n${csvContent}`;
        const result = await model.generateContent(prompt);

        // 5. Parse Response
        let responseText = result.response.text();
        if (!responseText) throw new Error("Empty response from AI");

        // CLEANING STEP: Remove markdown code blocks if present
        responseText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();

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
