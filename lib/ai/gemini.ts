import { GoogleGenAI } from '@google/genai';

// Initialize the Gemini SDK
// We use the new @google/genai SDK as recommended for Node.js workflows.
if (!process.env.GEMINI_API_KEY) {
    console.warn("Missing GEMINI_API_KEY environment variable. AI features will fail.");
}

export const gemini = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY || "",
});

/**
 * Helper to get the correct multimodal model.
 * gemini-2.5-flash is best for general multimodal and fast inference.
 */
export const getVisionModel = () => {
    return 'gemini-2.5-flash';
}

/**
 * Helper to get the embeddings model.
 * text-embedding-004 is optimized for vector search operations.
 */
export const getEmbeddingsModel = () => {
    return 'gemini-embedding-001';
}
