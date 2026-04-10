import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import IORedis from 'ioredis';

// Instantiate Redis connection
const redis = new IORedis(process.env.REDIS_URL || '');

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const userId = (session.user as any).id;
    const cacheKey = `cache:chats_list:${userId}`;

    try {
        // 1. The Check: Try to get from Redis
        const cachedChats = await redis.get(cacheKey);

        // 2. Cache Hit
        if (cachedChats) {
            console.log(`[Cache Hit] Serving chats list for ${userId} from Redis.`);
            return NextResponse.json({ chats: JSON.parse(cachedChats) });
        }

        // 3. Cache Miss: Execute complex Supabase queries
        console.log(`[Cache Miss] Fetching chats list for ${userId} from Supabase.`);

        // Claims where this user is the claimer (approved only)
        const { data: asClaimerClaims } = await supabase
            .from('claims')
            .select(`
                id,
                status,
                ai_confidence_score,
                created_at,
                item_id,
                items(id, category, subcategory, location_found, image_url, finder_id)
            `)
            .eq('claimer_id', userId)
            .eq('status', 'approved');

        // Claims on items that this user found (as finder)
        const { data: finderItems } = await supabase
            .from('items')
            .select('id')
            .eq('finder_id', userId);

        const finderItemIds = (finderItems || []).map((i: any) => i.id);

        let asFinderClaims: any[] = [];
        if (finderItemIds.length > 0) {
            const { data } = await supabase
                .from('claims')
                .select(`
                    id,
                    status,
                    ai_confidence_score,
                    created_at,
                    item_id,
                    claimer_id,
                    items(id, category, subcategory, location_found, image_url, finder_id)
                `)
                .in('item_id', finderItemIds)
                .eq('status', 'approved');
            asFinderClaims = data || [];
        }

        // Merge and tag which role the user plays
        const allClaims = [
            ...(asClaimerClaims || []).map((c: any) => ({ ...c, myRole: 'claimer' })),
            ...asFinderClaims.map((c: any) => ({ ...c, myRole: 'finder' })),
        ];

        // Get last message for each claim
        const results = await Promise.all(
            allClaims.map(async (claim) => {
                const { data: lastMsg } = await supabase
                    .from('chat_messages')
                    .select('message_text, created_at')
                    .eq('claim_id', claim.id)
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .single();

                return { ...claim, lastMessage: lastMsg || null };
            })
        );

        // 4. The Update: Save to Redis with a 60-second TTL
        await redis.setex(cacheKey, 60, JSON.stringify(results));

        // 5. The Return
        return NextResponse.json({ chats: results });
    } catch (error) {
        console.error("Error fetching chats list:", error);
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}
