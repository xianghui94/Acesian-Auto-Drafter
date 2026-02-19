
import { GoogleGenAI } from "@google/genai";
import { OrderItem, ComponentType } from "../types";
import { generateDuctDrawing } from "./geminiService";

// Helper to get key from storage
const getApiKey = () => sessionStorage.getItem('acesian_api_key') || "";

export const parseExcelDataWithAI = async (rawRows: any[]): Promise<OrderItem[]> => {
    const apiKey = getApiKey();
    if (!apiKey) throw new Error("API Key missing. Please unlock with a valid Google API Key.");

    // We process in chunks to avoid token limits if the excel is huge
    // For now, let's grab the first 50 rows.
    const subset = rawRows.slice(0, 50); 
    
    // Construct the Prompt
    const prompt = `
    You are an expert HVAC Estimation Engineer. 
    I will provide raw data from an Excel file representing a Duct Order.
    Your job is to interpret the messy descriptions and convert them into structured JSON.

    Input Data (JSON):
    ${JSON.stringify(subset)}

    Target JSON Schema (Array of Objects):
    {
      "description": "Clean Description string",
      "material": "SS304/SS316/GI",
      "thickness": "0.8/1.0/1.2/etc",
      "qty": Number,
      "tagNo": "String",
      "coating": "Yes/No/N/A",
      "componentType": "One exact string from this list: ELBOW, REDUCER, STRAIGHT, TEE, CROSS_TEE, LATERAL_TEE, BOOT_TEE, TRANSFORMATION, VOLUME_DAMPER, MULTIBLADE_DAMPER, STRAIGHT_WITH_TAPS, BLIND_PLATE, BLAST_GATE_DAMPER, ANGLE_FLANGE, OFFSET, SADDLE",
      "params": { 
         // Extract ALL dimensions found. Use standard names: 
         // d1, d2, length, width, height, angle, radius, offset, tap_d, main_d, etc.
         // If a dimension is missing, deduce a standard default (e.g. Elbow radius = 0.5*d1).
         // Convert all units to mm (numbers only).
      }
    }

    Rules:
    1. Ignore header rows or empty rows.
    2. If description mentions "SQ to RD" or "Transformation", use TRANSFORMATION.
    3. If description mentions "VCD", use VOLUME_DAMPER.
    4. If description mentions "MBD", use MULTIBLADE_DAMPER.
    5. Be intelligent about text like "500x300 L500". This is Rect Duct or Transformation.
    6. Return ONLY the valid JSON array. No markdown formatting.
    `;

    try {
        const ai = new GoogleGenAI({ apiKey });
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.0-flash',
            contents: prompt,
            config: {
                responseMimeType: 'application/json'
            }
        });

        const text = response.text || "[]";
        const parsed = JSON.parse(text);

        // Post-processing: Generate SVGs and IDs
        const finalItems: OrderItem[] = parsed.map((p: any, idx: number) => {
            // Map the AI's string component type back to the Enum
            const typeKey = p.componentType as keyof typeof ComponentType;
            const compType = ComponentType[typeKey] || ComponentType.MANUAL;
            
            // Generate the drawing based on the extracted params
            const sketch = generateDuctDrawing(compType, p.params);

            return {
                id: `ai-${Date.now()}-${idx}`,
                itemNo: 0,
                description: p.description,
                material: p.material || "SS304 2B",
                thickness: p.thickness || "0.8",
                qty: p.qty || 1,
                coating: p.coating || "No",
                tagNo: p.tagNo || "",
                notes: "AI Generated",
                componentType: compType,
                params: p.params || {},
                sketchSvg: sketch
            };
        });

        return finalItems;

    } catch (error) {
        console.error("AI Parsing failed:", error);
        throw error;
    }
};
