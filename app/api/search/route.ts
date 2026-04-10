import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { generateEmbedding } from '@/lib/ai/langchain';

export async function POST(req: Request) {
    try {
        const { query, locationContext, timeContext } = await req.json();

        if (!query) {
            return NextResponse.json({ message: 'Missing search query' }, { status: 400 });
        }

        // 1. Convert the user's natural language query into a vector embedding
        const searchSemanticText = `Search Query: ${query}.`;

        console.log(`\n\n[🔍 SEARCH] Converting to Vector (Semantic Text):\n"${searchSemanticText}"\n\n`);
        const searchVector = await generateEmbedding(searchSemanticText);

        // 2. Perform Cosine Similarity Search via Supabase pgvector
        // Note: You must create this `match_items` RPC function in your Supabase SQL editor.
        // It looks something like:
        /*
            create or replace function match_items (
            query_embedding vector(768),
            match_threshold float,
            match_count int
            )
            returns table (
            id uuid,
            category text,
            subcategory text,
            similarity float
            )
            language sql stable
            as $$
            select
                items.id,
                items.category,
                items.subcategory,
                1 - (items.embedding <=> query_embedding) as similarity
            from items
            where 1 - (items.embedding <=> query_embedding) > match_threshold
            order by items.embedding <=> query_embedding
            limit match_count;
            $$;
        */

        const { data: matches, error } = await supabase.rpc('match_items', {
            query_embedding: searchVector,
            match_threshold: 0.5, // Return anything above a 50% match
            match_count: 10
        });

        if (error) throw error;

        // Ensure we do NOT return the hidden security questions or attributes here!
        return NextResponse.json({ results: matches }, { status: 200 });

    } catch (error: any) {
        console.error('\n\n[Search API] ==================== ERROR DETECTED ====================');
        console.error('Search Route Error Detail:', error);
        console.error('Message:', error?.message);
        console.error('Hint:', error?.hint);
        if (error.status) console.error("HTTP Status:", error.status);
        console.error('=======================================================================\n\n');

        const errorMessage = error instanceof Error ? error.message : (error?.message || 'Internal Server Error');
        return NextResponse.json({ message: errorMessage, details: error }, { status: 500 });
    }
}
