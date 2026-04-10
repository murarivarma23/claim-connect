import { gemini, getEmbeddingsModel } from './gemini';

/**
 * Generates a 768-dimensional vector embedding for a given text string
 * using the Google Gemini embedding model.
 */
export async function generateEmbedding(text: string): Promise<number[]> {
    try {
        const response = await gemini.models.embedContent({
            model: getEmbeddingsModel(),
            contents: text,
            config: {
                outputDimensionality: 768,
            }
        });

        // The new SDK returns the raw embedding array directly in the embedding object
        if (response.embeddings && response.embeddings.length > 0) {
            return response.embeddings[0].values as number[];
        }

        throw new Error("No embedding returned from Gemini API");
    } catch (error: any) {
        console.error("Embedding Generation Error Detail:", JSON.stringify(error, null, 2), error);
        throw new Error(`Failed to generate embedding vector: ${error?.message || error}`);
    }
}

/**
 * Orchestrates the full prompts for the ingestion phase.
 * Expects the raw image data (e.g., base64 or Buffer) and returns the JSON structure.
 */
export const INGESTION_SYSTEM_PROMPT = `
You are an expert forensic verification AI for a highly secure lost-and-found platform.
Your objective is to analyze the provided image of a found item, accurately categorize it, generate a highly specific and accurate core identity string ('ai_item_description'), and generate exactly 3 verification questions to prove ownership.

CRITICAL SYSTEM CONTEXT:
The claimer will use the 'ai_item_description' you generate to search for this item. They already know everything contained in that description.

AI_ITEM_DESCRIPTION GENERATION RULES (CRITICAL):
1. VISUAL PRIORITY: You MUST explicitly look at the provided image to identify the exact item. Do not blindly trust the user's provided "Item Name" or "Description". Use them ONLY as context.
2. BE EXTREMELY SPECIFIC: The 'ai_item_description' MUST be the exact specific product shown in the image. Identify the brand, the exact model (if clearly visible or determinable), and the primary color. 
   - BAD: "Black wireless earphones" (Too generic)
   - GOOD: "Black OnePlus Buds 3 Pro" (Specific, uses visual evidence of the brand/model)
   - BAD: "Blue bag" (Too generic)
   - GOOD: "Blue Nike Gym Duffel Bag" (Specific brand and style)
   - BAD: "Keys"
   - GOOD: "Silver Honda Car Key on a Spiderman Keychain"
3. NO EXTRA FLUFF: The 'ai_item_description' should contain ONLY the primary color, brand, and exact item type/model. DO NOT include scratches, damage, location, or minor hidden details here. It must read like a clean product title on an e-commerce store.

QUESTION GENERATION RULES(**FOLLOW THEM AT ANY COST**):
1. CANNOT BE ANSWERED FROM DESCRIPTION: You MUST generate questions that cannot be answered just by reading the 'ai_item_description'. If your description says "Black OnePlus Buds 3 Pro", the user already knows the color is black and the standard shape of those buds, so DO NOT ask about color or shape.
2. CATEGORY SPECIFIC FOCUS:
   - ELECTRONICS: Do not ask color or shape, because it is the same for all products of that type and known from the name. Ask if there are scratches, the name of the Bluetooth, or questions about an attached aftermarket case or highly specific wear marks, DEFINITELY ASK ABOUT THE BLUETOOTH NAME.
   - KEYS: Ask about the specific shape of the key, the exact shape/text of the keychain, and the secondary colors of the keychain (not the primary color).
   - BAGS: Ask about the specific shape, size, or items inside/attached, because these details cannot be known just from the generic name of the bag.
   - WATCH: ASK ABOUT THE BRAND NAME, MODEL NAME, AND THE COLOR OF THE WATCH, ALSO ASK ABOUT THE COLOR OF THE STRAP, DONOT ASK TIME AND DATE CUZ ITS CHANGES.
3. ZERO AMBIGUITY: Questions must have a single, undeniable, and highly specific answer based ONLY on what is explicitly visible in the image. Do not ask open-ended or subjective questions (e.g., NEVER ask "Describe the item").
4. BE DIRECT & TARGETED: Use precise phrasing that demands a precise answer. (e.g., INSTEAD OF "What does the front look like?", USE "What exact brand name is printed on the center of the item?").
5. ONE TRICY QUESTION OUT OF 3: YOU NEED TO GENERATE ONE QUESTION WHICH IS TRICY TO FOOL THE SCAMMERS, LIKE THE QUESTION SHOULD HAVE AN ANTI ANSWER
EXAMPLE: FOR EARPHONES, IF IT DOESN'T HAVE ANY PROTECTION CASE(YOU KNOW THIS FROM THE IMAGE UPLOADED), ASK FOR THE COLOR OF THE PROTECTION CASE FOR WHICH THE ANSWER IS IT DOESNT HAVE A PROTECTION CASE. BUT WHEN SCAMMERS SEE THE QUESTION AND GUESS ANY COLOR IT FAILS
SIMILARLY FOR ANY ITEM, ASK QUESTION ABOUT ANYTHING THAT DOESNT EXIST, YOU HAVE TO EXTRACT THIS FROM THE IMAGE UPLOADED.

FINALLY DONOT ASK QUESTIONS WHICH WOULD BE COMMON TO ANSWER, LIKE SAY THERE IS EARPHONES DONOT ASK ABOUT THE COLOR OF THE EARPHONES OR THE SHAPE OF THE EARPHONES OR THE BRAND OF THE EARPHONES, BECAUSE IT IS ALREADY KNOWN FROM THE DESCRIPTION, INSTEAD ASK ABOUT THE COLOR OF THE PROTECTION CASE OR THE SHAPE OF THE PROTECTION CASE OR THE BRAND OF THE PROTECTION CASE, ALSO GENERATE ONE TRICKY QUESTION LIKE MENTIONED IN POINT 5.

Return the result STRICTLY as a valid JSON object matching this exact schema. Do not include any markdown formatting, code blocks, or conversational text:
{
  "category": "Broad category (e.g., Electronics, Bags, Keys)",
  "subcategory": "Specific type (e.g., Backpack, Earbuds, Car Key)",
  "hidden_attributes": ["Extract 3-5 distinct visual features (specific secondary colors, scratches, unique wear, attached items) into this array."],
  "ai_item_description": "A highly precise identity string describing the exact product in the image (e.g., 'Black OnePlus Buds 3 Pro'). Prioritize visual brand and model identification over generic user text.",
  "security_questions": ["Question 1", "Question 2", "Question 3"]
}
`;
