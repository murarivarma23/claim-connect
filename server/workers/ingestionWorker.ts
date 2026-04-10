import { Worker, Job } from 'bullmq';
import IORedis from 'ioredis';
import { supabase } from '../../lib/supabase';
import { gemini, getVisionModel } from '../../lib/ai/gemini';
import { generateEmbedding, INGESTION_SYSTEM_PROMPT } from '../../lib/ai/langchain';

const connection: any = new IORedis(process.env.REDIS_URL!, {
    maxRetriesPerRequest: null,
});

export const ingestionWorker = new Worker('item_ingestion', async (job: Job) => {
    const { itemId, location, time, title, description } = job.data;
    console.log(`[Ingestion Worker] Starting job for item: ${itemId}`);

    try {
        // Fetch the full image_url from the DB (we didn't send it in Redis to save space)
        const { data: itemData, error: fetchError } = await supabase
            .from('items')
            .select('image_url, additional_images')
            .eq('id', itemId)
            .single();

        if (fetchError || !itemData) throw new Error("Could not find item image for processing");
        const imageUrl = itemData.image_url;
        const additionalImages = itemData.additional_images || [];
        const allImages = [imageUrl, ...additionalImages].filter(Boolean);

        // Update status in Supabase so frontend knows it's analyzing
        await supabase.from('items').update({ status: 'analyzing_image' }).eq('id', itemId);

        // 1. Call Gemini Vision to extract features
        let parts: any[] = [];
        parts.push(INGESTION_SYSTEM_PROMPT);

        allImages.forEach((imgUrl: string, idx: number) => {
            if (imgUrl && imgUrl.startsWith('data:')) {
                const base64Data = imgUrl.split(',')[1];
                const mimeType = imgUrl.split(';')[0].split(':')[1];
                parts.push({
                    inlineData: {
                        data: base64Data,
                        mimeType: mimeType
                    }
                });
            } else if (imgUrl) {
                parts.push(`Image ${idx + 1}: ${imgUrl} (simulated data)`);
            }
        });

        parts.push(`Please analyze the attached image(s). Check them from multiple angles if provided. Name/Title: ${title}. ${description ? `User Description: ${description}. ` : ''}`);

        console.log(`\n\n[Ingestion Worker - ${itemId}] ==================== SENDING PROMPT TO GEMINI ====================`);
        console.log(JSON.stringify(parts, null, 2)); // Logs the exact prompt parts
        console.log(`=================================================================================\n\n`);

        const response = await gemini.models.generateContent({
            model: getVisionModel(),
            contents: parts, // Pass the parts array
            config: {
                responseMimeType: "application/json",
            }
        });

        const rawText = response.text;
        if (!rawText) throw new Error("No text returned from Gemini");
        const aiData = JSON.parse(rawText);

        console.log(`[Ingestion Worker] Gemini Extracted:`, aiData.subcategory);

        // 2. Vectorize the item (Convert the natural language description into a vector)
        const aiItemDescription = aiData.ai_item_description || `A ${aiData.category} ${aiData.subcategory}. ${description || 'No description provided.'}`;

        console.log(`\n\n[📦 INGESTION] Converting Item to Vector (Semantic Text):\n"${aiItemDescription}"\n\n`);

        const embedding = await generateEmbedding(aiItemDescription);

        // 3. Save to Supabase (Database Commit)
        const { error } = await supabase
            .from('items')
            .update({
                category: aiData.category,
                subcategory: aiData.subcategory,
                hidden_attributes: aiData.hidden_attributes,
                security_questions: aiData.security_questions,
                ai_item_description: aiItemDescription,
                embedding: embedding, // Saving the 768d vector into pgvector
                status: 'active'
            })
            .eq('id', itemId);

        if (error) throw error;

        console.log(`[Ingestion Worker] Successfully generated questions and vector for item: ${itemId}`);
        return { success: true, aiData };

    } catch (error: any) {
        console.error(`\n\n[Ingestion Worker - ${itemId}] ==================== ERROR DETECTED ====================`);
        console.error(`[Ingestion Worker] Error processing item ${itemId}:`, error);
        if (error.status) console.error("HTTP Status:", error.status);
        if (error.response) console.error("Response:", JSON.stringify(error.response, null, 2));
        console.error(`=========================================================================================\n\n`);

        await supabase.from('items').update({ status: 'failed' }).eq('id', itemId);
        throw error;
    }
}, { connection });

ingestionWorker.on('active', job => {
    console.log(`[BullMQ] Ingestion Job ${job.id} is now ACTIVE and processing!`);
});

ingestionWorker.on('completed', job => {
    console.log(`[BullMQ] Ingestion Job ${job.id} has COMPLETED successfully!`);
});

ingestionWorker.on('failed', (job, err) => {
    console.log(`[BullMQ] Ingestion Job ${job?.id} has FAILED with error: ${err.message}`);
});
