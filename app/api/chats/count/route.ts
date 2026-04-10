import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import IORedis from 'ioredis';

// Instantiate Redis connection
const redis = new IORedis(process.env.REDIS_URL || '');

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ count: 0 }, { status: 401 });

    const userId = (session.user as any).id;
    const cacheKey = `cache:chat_count:${userId}`;

    try {
        // 1. The Check: Try to get from Redis
        const cachedCount = await redis.get(cacheKey);

        // 2. Cache Hit
        if (cachedCount !== null) {
            console.log(`[Cache Hit] Serving chat count for ${userId} from Redis.`);
            return NextResponse.json({ count: parseInt(cachedCount, 10) });
        }

        // 3. Cache Miss: Execute Supabase queries
        console.log(`[Cache Miss] Fetching chat count for ${userId} from Supabase.`);

        // Claims where this user is the claimer (approved only)
        const { data: asClaimerClaims } = await supabase
            .from('claims')
            .select('id')
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
                .select('id')
                .in('item_id', finderItemIds)
                .eq('status', 'approved');
            asFinderClaims = data || [];
        }

        const totalChats = (asClaimerClaims?.length || 0) + asFinderClaims.length;

        // 4. The Update: Save to Redis with a 60-second TTL
        await redis.setex(cacheKey, 60, totalChats.toString());

        // 5. The Return
        return NextResponse.json({ count: totalChats });
    } catch (error) {
        console.error("Error fetching chat count:", error);
        // Fallback or error handling
        return NextResponse.json({ count: 0 }, { status: 500 });
    }
}
