import { Worker, Job } from 'bullmq';
import IORedis from 'ioredis';
import { supabase } from '../../lib/supabase';
import { gemini, getVisionModel } from '../../lib/ai/gemini';
import { generateEmbedding } from '../../lib/ai/langchain';
import { extractLocationNodes } from '../../lib/ai/locationExtractor';
import { findPath } from '../../lib/utils/campusGraph';
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { PromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";

const connection: any = new IORedis(process.env.REDIS_URL!, {
    maxRetriesPerRequest: null,
});

export const claimWorker = new Worker('claim_verification', async (job: Job) => {
    const {
        claimId,
        claimerId,
        itemId,
        answers,
        claimerDate,
        claimerTime,
        claimerLocation,
        claimerContext,
        claimerDescription,
        claimerImage
    } = job.data;
    console.log(`[Claim Worker] Processing claim ${claimId} for item ${itemId}`);

    try {
        await supabase.from('claims').update({ status: 'analyzing' }).eq('id', claimId);

        // Fetch original item details
        const { data: item, error } = await supabase.from('items').select('*').eq('id', itemId).single();
        if (error || !item) throw new Error("Item not found");

        console.log(`[Claim Worker] Running Layer 1: Semantic Embeddings match`);
        // Layer 1 (Semantic Similarity) - Vectorize the Claimer's answers/context
        const claimerText = `Answers: ${JSON.stringify(answers)}. Context: ${claimerContext}.`;
        const claimerEmbedding = await generateEmbedding(claimerText);

        // In a real pgvector query, we would run a cosine similarity match here.
        // For security, if this distance > threshold, we instantly reject them.

        console.log(`[Claim Worker] Running Layer 2 & 3: Detailed AI Matching`);
        // Layers 2 & 3 (Attribute Matching & Context Plausibility)

        let truthSource = "";
        if (item.finder_answers && item.finder_answers.length > 0) {
            truthSource = `Finder's Answers to Security Questions:\n${JSON.stringify(item.finder_answers, null, 2)}`;
        } else {
            truthSource = `Finder's Hidden Details (AI Extracted): ${JSON.stringify(item.hidden_attributes)}`;
        }

        console.log(`[Claim Worker] Running Spatial Graph Analysis...`);
        let spatialProofString = "GRAPH SYSTEM BYPASS: The mathematical map could not parse these exact raw locations into strict graph coordinates. You must now use your own semantic geographical reasoning to determine if the Claimer's Raw Location matches the Finder's Raw Location. If they refer to the same building/zone, DO NOT penalize.";

        try {
            const extractedNodes = await extractLocationNodes(
                item.location_found || "Unknown",
                claimerLocation || "Unknown",
                claimerContext || "None"
            );

            if (extractedNodes && extractedNodes.founderLocationNode && extractedNodes.claimerStartNode) {
                if (extractedNodes.claimerEndNode && extractedNodes.claimerStartNode !== extractedNodes.claimerEndNode) {
                    const result = findPath(extractedNodes.claimerStartNode, extractedNodes.claimerEndNode);
                    if (result) {
                        const { path } = result;
                        const isFoundOnPath = path.includes(extractedNodes.founderLocationNode);
                        if (isFoundOnPath) {
                            spatialProofString = `MATHEMATICAL PROOF: The Campus Topology Graph actively PROVES the Founder's exact location (${extractedNodes.founderLocationNode}) sits physically upon the Claimer's stated walking route (${path.join(' -> ')}). Factor this high spatial probability positively into your Location score.`;
                        } else {
                            const distResult = findPath(extractedNodes.founderLocationNode, extractedNodes.claimerStartNode);
                            if (distResult) {
                                spatialProofString = `MATHEMATICAL DISCREPANCY: The Campus Topology Graph shows the Founder's exact location (${extractedNodes.founderLocationNode}) is NOT on the Claimer's stated walking route (${path.join(' -> ')}). It is exactly ${distResult.distance} meters away from the start of their route. Factor this geographic inconsistency heavily into your Location score.`;
                            } else {
                                spatialProofString = `MATHEMATICAL DISCREPANCY: The Campus Topology Graph shows the Founder's exact location (${extractedNodes.founderLocationNode}) is NOT on the Claimer's stated walking route (${path.join(' -> ')}). Factor this geographic inconsistency heavily into your Location score.`;
                            }
                        }
                    } else {
                        spatialProofString = `GRAPH ERROR: The Claimer's stated route (${extractedNodes.claimerStartNode} to ${extractedNodes.claimerEndNode}) does not physically exist or connect on the campus map.`;
                    }
                } else {
                    const result = findPath(extractedNodes.founderLocationNode, extractedNodes.claimerStartNode);
                    if (result) {
                        const { distance } = result;
                        if (distance === 0) {
                            spatialProofString = `MATHEMATICAL PROOF: The Graph PROVES both parties were at the exact same building/node (${extractedNodes.founderLocationNode}). HOWEVER, you must now check their exact raw text for specific room numbers (e.g., "PRP 233" vs "PRP 711"). If they specified different rooms inside this building, penalize the score. If they explicitly specify the SAME exact room, award MAXIMUM confidence. If no rooms were specified, award high confidence.`;
                        } else if (distance <= 300) {
                            spatialProofString = `MATHEMATICAL PROOF: The Campus Topology Graph shows the Founder's location (${extractedNodes.founderLocationNode}) is very close (${distance} meters walking distance) to the Claimer's location (${extractedNodes.claimerStartNode}). This proximity makes the claim highly plausible. Factor it positively.`;
                        } else {
                            spatialProofString = `MATHEMATICAL DISCREPANCY: The Campus Topology Graph PROVES the Founder's location (${extractedNodes.founderLocationNode}) is significantly far away (${distance} meters walking distance) from the Claimer's location (${extractedNodes.claimerStartNode}). Factor this geographic inconsistency heavily into your Location score.`;
                        }
                    } else {
                        spatialProofString = `GRAPH ERROR: Could not calculate a path between ${extractedNodes.founderLocationNode} and ${extractedNodes.claimerStartNode}.`;
                    }
                }
            }
        } catch (e) {
            console.error("Spatial analysis non-fatal failure:", e);
        }

        const matchPromptTemplate = `
You are an expert fraud-prevention arbitrator for a lost-and-found platform.
Your task is to compare the "Claimer's" submitted details against the "Finder's" Truth to determine if the Claimer is the true owner of the item.

GRADING RUBRIC & RULES (Read Carefully):

1. LOCATION CONSTRAINTS (CRITICAL - 35% Weight):
   - FOUND INFO: The item was found at "{itemLocationFound}".
   - CLAIMER INFO: The Claimer states they lost it at "{claimerLocation}". Context: "{claimerContext}".
   - SPATIAL TRUTH: {spatialProofString}
   - SCORING ACTION: If the Spatial Truth proves geographic incompatibility or a significant distance (>400m) without plausible context, SCORE VERY LOW (0-10 on this section). If the Spatial Truth invokes a 'GRAPH SYSTEM BYPASS', purely use your semantic text matching: If they perfectly match the exact room (e.g., 'PRP 233' vs 'PRP 233'), SCORE MAXIMUM. If they only match the building but miss the room (e.g., 'PRP' vs 'PRP 233'), give a GOOD score but NOT maximum. If perfectly matched by a mathematically proven walking route, SCORE MAXIMUM.

2. TIME & DATE PLAUSIBILITY (CRITICAL - 20% Weight):
   - FOUND INFO: Date: "{itemDateFound}", Time: "{itemTimeFound}".
   - CLAIMER INFO: Date: "{claimerDate}", Time: "{claimerTime}".
   - CRITICAL FAILURE: If the Claimer states they lost it AFTER the exact date/time it was already found by the Finder, you MUST FAIL the claim immediately (<40 overall score).
   - VARIANCE PENALTY: If the Claimer lost the item more than 2-3 days before it was found, penalize the score slightly. If they claim they lost it A MONTH before it was found, penalize heavily (it is highly unlikely to sit untouched for a month).

3. SECURITY QUESTION ANSWERS (Crucial for Ownership - 45% Weight):
   - The Claimer does not know what the Finder originally wrote.
   - CATEGORY STRICTNESS RATING: Pay extreme attention to the Item Category: {itemCategory}.
      * ELECTRONICS (Highest Strictness): If the Bluetooth name or exact model is wrong, PENALIZE HEAVILY. Missing a minor scratch is okay, but core electronic identity must match.
      * IDS / CARDS (Highest Strictness): Name and details must be an EXACT match.
      * ITEMS / KEYS / UMBRELLAS (Lower Strictness): People rarely remember the exact keychain or scratch on a generic item. Be lenient if the location and time are perfect.
   - SCORING ACTION: If answers provide highly specific, verifiable details (unique marks, distinct contents) that perfectly match the Truth, SCORE MAXIMUM on this section. ONLY FAIL if answers directly and provably CONTRADICT the Truth. Ignorance ("I don't know") is acceptable if location/time strongly align.

Evaluate them out of 100 based on those weighted sections. Return ONLY a valid JSON object matching this schema:
{{
  "confidenceScore": 85,
  "reasoning": "Explain your location/time plausibility assessment first, then explain the category strictness applied to the security answers.",
  "isApproved": true
}}

--- SOURCE OF TRUTH (FINDER'S DATA) ---
Category/Subcategory: {itemCategory} | {itemSubcategory}
Finder's Registered Date/Time/Location: {itemDateFound} | {itemTimeFound} | {itemLocationFound}
{truthSource}
---------------------------------------

--- CLAIMER'S SUBMITTED DATA ---
Claimer's Date/Time/Location Lost: {claimerDate} | {claimerTime} | {claimerLocation}
Claimer's Additional Context: {claimerContext}
Claimer's Security Question Answers:
{claimerAnswersJson}
--------------------------------
`;

        console.log(`\n\n[Claim Worker - ${claimId}] ==================== SENDING PROMPT TO GEMINI ====================`);
        console.log("Model: gemini-2.5-flash (via LangChain)");

        console.log("### DIAGNOSTICS: WHAT GEMINI SEES ###");
        console.log("TRUTH:", truthSource);
        console.log("CLAIMER (Answers):", JSON.stringify(answers));
        console.log("-------------------------------------");

        const prompt = PromptTemplate.fromTemplate(matchPromptTemplate);

        const model = new ChatGoogleGenerativeAI({
            model: 'gemini-2.5-flash',
            temperature: 0.2,
            apiKey: process.env.GEMINI_API_KEY || ""
        });

        const chain = prompt.pipe(model).pipe(new StringOutputParser());

        const rawText = await chain.invoke({
            itemLocationFound: item.location_found || 'Unknown',
            claimerLocation: claimerLocation || 'Unknown',
            claimerContext: claimerContext || 'None',
            spatialProofString: spatialProofString,
            itemDateFound: item.date_found || 'Unknown',
            itemTimeFound: item.time_found || 'Unknown',
            claimerDate: claimerDate || 'Unknown',
            claimerTime: claimerTime || 'Unknown',
            itemCategory: item.category || 'Unknown',
            itemSubcategory: item.subcategory || 'Unknown',
            truthSource: truthSource,
            claimerAnswersJson: JSON.stringify(answers, null, 2)
        });

        if (!rawText) throw new Error("No response from AI match engine");

        const cleanedText = rawText.replace(/```json/g, '').replace(/```/g, '');
        const decision = JSON.parse(cleanedText);
        console.log(`[Claim Worker] AI Decision: ${decision.confidenceScore}% match. Approved: ${decision.isApproved}`);

        const finalStatus = decision.confidenceScore >= 70 ? 'approved' : 'rejected';
        await supabase.from('claims').update({
            ai_confidence_score: decision.confidenceScore,
            status: finalStatus
        }).eq('id', claimId);

        if (decision.isApproved) {
            await supabase.from('items').update({ status: 'claimed' }).eq('id', itemId);
        }

        return { success: true, decision };

    } catch (error: any) {
        console.error(`\n\n[Claim Worker - ${claimId}] ==================== ERROR DETECTED ====================`);
        console.error(`[Claim Worker] Error processing claim ${claimId}:`, error);
        if (error.status) console.error("HTTP Status:", error.status);
        if (error.response) console.error("Response:", JSON.stringify(error.response, null, 2));
        console.error(`======================================================================================\n\n`);

        await supabase.from('claims').update({ status: 'failed' }).eq('id', claimId);
        throw error;
    }
}, { connection });

claimWorker.on('active', job => {
    console.log(`[BullMQ] Claim Job ${job.id} is now ACTIVE and processing!`);
});

claimWorker.on('completed', job => {
    console.log(`[BullMQ] Claim Job ${job.id} has COMPLETED successfully!`);
});

claimWorker.on('failed', (job, err) => {
    console.log(`[BullMQ] Claim Job ${job?.id} has FAILED with error: ${err.message}`);
});
