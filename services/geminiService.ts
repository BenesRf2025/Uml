import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

const SYSTEM_INSTRUCTION = `
You are an expert UML Architect and Software Designer. Your task is to generate valid Mermaid.js syntax based on the user's natural language request.

Rules:
1. Output ONLY the Mermaid code. Do not include markdown code fences (like \`\`\`mermaid or \`\`\`).
2. Do not include any explanation or conversational text.
3. If the user asks for a specific type of diagram (Sequence, Class, etc.), use the appropriate Mermaid syntax.
4. If the user provides a vague request, infer the most suitable diagram type (usually Flowchart or Class diagram).
5. Ensure the syntax is valid and will render correctly. Use standard direction (TD or LR) for graphs unless specified.
6. Use clear, descriptive labels for nodes and relationships.
7. Support French language in labels if the user prompt is in French.
`;

export const generateUML = async (prompt: string, currentCode?: string): Promise<string> => {
  try {
    const model = 'gemini-3-flash-preview';
    
    let fullPrompt = prompt;
    if (currentCode) {
      fullPrompt = `Original Code:\n${currentCode}\n\nModification Request: ${prompt}\n\nOutput the full updated Mermaid code only.`;
    }

    const response = await ai.models.generateContent({
      model,
      contents: fullPrompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.2, // Low temperature for consistent code generation
      }
    });

    let text = response.text || '';
    
    // Cleanup any accidental markdown fences if the model disobeys
    text = text.replace(/^```mermaid\n/, '').replace(/^```\n/, '').replace(/\n```$/, '');

    return text.trim();
  } catch (error) {
    console.error("Error generating UML:", error);
    throw new Error("Impossible de générer le diagramme. Veuillez vérifier votre clé API ou réessayer.");
  }
};
