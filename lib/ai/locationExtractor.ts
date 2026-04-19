import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { PromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";


// Extractor prompt to normalize user locations
const LOCATION_EXTRACTION_PROMPT = `
You are a precise geographic entity extractor for a university campus.
Your job is to read raw, unstructured text describing where an item was lost or found, 
and map those locations EXACTLY to our defined topological graph nodes.

THE VALID GRAPH NODES ARE:
- Gate 2
- Main Canteen
- Hospital
- CDMM Block
- GDN Block
- Anna Audi
- Library
- MGR Block (MB)
- Main Gate
- KC Lawn
- SMV Block
- Foodys
- Circle
- Main Subway
- LH-A-Block
- LH-B-Block
- LH-G-Block
- LH-H-Block
- Gate 3
- TT (Technology Tower)
- Stationary
- TT Subway
- TT Subway Mens Side
- LH-C-Block
- LH-D-Block
- LH-E-Block
- LH-F-Block
- SJT (Silver Jubilee Tower)
- SJT Ground
- PRP Subway
- PRP (Pearl Research Park)
- MGB (Mahatma Gandhi Block)
- MH-M-Block
- MH-L-Block
- MH-K-Block
- MH-E-Block
- MH-D-Block
- MH-C-Block
- MH-F-Block
- MH-G-Block
- Outdoor Stadium
- MH-A-Block
- MH-H-Block
- MH-J-Block

RULES:
1. You MUST pick the closest matching valid node STRICTLY from the list above. Do not invent names or append any free text.
2. STRIP ALL ROOM NUMBERS, FLOORS, OR DESCRIPTORS (e.g., "PRP 233" -> "PRP (Pearl Research Park)").
3. STRIP RELATIVE QUALIFIERS (e.g., "Near Main Building", "Outside MB", "By the cafe" -> "MGR Block (MB)").
4. If the user context says "I was walking from X to Y", extract X as startNode and Y as endNode.
5. If they just say "I lost it at X", extract X as both startNode AND endNode.
6. If the location is completely ambiguous or not on campus, return null for that field.

Return a STRICT JSON object in this exact schema:
{{
  "founderLocationNode": "Node Name or null",
  "claimerStartNode": "Node Name or null",
  "claimerEndNode": "Node Name or null"
}}

raw input data:
Founder reported finding it at: "{founderLocationRaw}"
Claimer reported losing it at: "{claimerLocationRaw}"
Claimer additional context: "{claimerContextRaw}"
`;

export async function extractLocationNodes(
    founderLocationRaw: string,
    claimerLocationRaw: string,
    claimerContextRaw: string
): Promise<{ founderLocationNode: string | null, claimerStartNode: string | null, claimerEndNode: string | null } | null> {
    try {
        const model = new ChatGoogleGenerativeAI({
            model: 'gemini-2.5-flash',
            temperature: 0,
            apiKey: process.env.GEMINI_API_KEY || ""
        });

        const prompt = PromptTemplate.fromTemplate(LOCATION_EXTRACTION_PROMPT);
        const chain = prompt.pipe(model).pipe(new StringOutputParser());

        const rawText = await chain.invoke({
            founderLocationRaw,
            claimerLocationRaw,
            claimerContextRaw
        });

        if (!rawText) return null;

        const cleanedText = rawText.replace(/```json/g, '').replace(/```/g, '');
        return JSON.parse(cleanedText);
    } catch (error) {
        console.error("Failed to parse locations with LangChain AI:", error);
        return null;
    }
}
