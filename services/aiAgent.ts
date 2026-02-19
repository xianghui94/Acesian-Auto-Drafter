
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

export const parseExcelWithGemini = async (file: File, apiKey: string): Promise<Partial<OrderItem>[]> => {
    try {
        // 1. 读取 Excel 文件
        const rows = await readXlsxFile(file);
        
        // 转换为类似 CSV 的简单字符串，省 Token
        const csvContent = rows.map(row => row.join(" | ")).join("\n");

        // 2. 初始化 Gemini (使用正确的实例名称)
        // 建议优先使用传入的 apiKey，如果没有再用环境变量的
        const key = apiKey || import.meta.env.VITE_GEMINI_API_KEY || "";
        const genAI = new GoogleGenerativeAI(key);
        
        // 🚨 重点修复：在这里配置模型、系统指令和强制 JSON 输出
        const model = genAI.getGenerativeModel({ 
            model: 'gemini-2.5-flash'，
            systemInstruction: SYSTEM_INSTRUCTION,
            generationConfig: {
                responseMimeType: "application/json" // 逼迫 AI 只输出纯 JSON，不加 Markdown
            }
        });

        // 3. 调用 API (官方标准写法)
        const prompt = `Here is the BOM data:\n${csvContent}`;
        const result = await model.generateContent(prompt);

        // 4. 解析返回值 (官方提取 text 的标准写法)
        const responseText = result.response.text();
        
        if (!responseText) throw new Error("Empty response from AI");

        // 解析 JSON
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
