import { NextResponse } from 'next/server';
import { itemIngestionQueue } from '@/lib/queue';
import { supabase } from '@/lib/supabase';

// In a real app, this route would handle multi-part form data containing the actual image file.
// For this tutorial, we assume the frontend uploaded the image to a bucket directly
// and is sending us the public `imageUrl` alongside the context.

export const maxDuration = 60; // Allow more time for AI processing if needed

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { title, description, imageUrls, location, date, time, finderId } = body;

        const actualFinderId = finderId === 'dummy_finder_uuid' ? null : finderId;

        // 1. Initial Database Insert (State: Processing)
        const { data: item, error } = await supabase
            .from('items')
            .insert([
                {
                    finder_id: actualFinderId,
                    name: title,
                    description: description || null,
                    image_url: imageUrls?.[0] || null,
                    additional_images: imageUrls?.length > 1 ? imageUrls.slice(1) : [],
                    location_found: location,
                    date_found: date,
                    time_found: time,
                    status: 'processing'
                }
            ])
            .select('id')
            .single();

        if (error || !item) {
            console.error('Supabase Insert Raw Error:', error);
            if (error?.message === 'fetch failed') {
                console.error('Fetch failed cause:', (error as any).cause);
            }
            throw new Error(`Database Error: ${error?.message || 'Failed to create initial item record'}`);
        }

        // 2. Add job to BullMQ for background AI processing
        // We do NOT pass the large base64 imageUrl in the queue payload to avoid Upstash Redis size limits (1MB).
        // The worker will fetch it directly from the database using the itemId.
        await itemIngestionQueue.add('process_image', {
            itemId: item.id,
            title,
            description,
            location,
            date,
            time
        });

        // 3. Immediately return success to the frontend so the user isn't waiting
        return NextResponse.json(
            { message: 'Item upload accepted. AI processing started.', itemId: item.id },
            { status: 202 }
        );

    } catch (error) {
        console.error('Upload Error:', error);
        // Return the actual error message to the frontend so we don't just see a generic 500
        const errorMessage = error instanceof Error ? error.message : 'Internal Server Error';
        return NextResponse.json({ message: errorMessage }, { status: 500 });
    }
}
