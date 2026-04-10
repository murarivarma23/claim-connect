import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ claimId: string }> }
) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { claimId } = await params;

    // Fetch claim + related item + both users
    const { data: claim, error: claimError } = await supabase
        .from('claims')
        .select(`
            *,
            items(id, category, subcategory, location_found, image_url, time_found, finder_id),
            claimer:claimer_id(id, name, trust_score)
        `)
        .eq('id', claimId)
        .single();

    if (claimError || !claim) {
        return NextResponse.json({ error: 'Claim not found' }, { status: 404 });
    }

    // Fetch finder details separately  
    const { data: finder } = await supabase
        .from('users')
        .select('id, name, trust_score')
        .eq('id', (claim.items as any)?.finder_id)
        .single();

    // Fetch all messages for this claim room
    const { data: messages } = await supabase
        .from('chat_messages')
        .select(`
            id,
            claim_id,
            sender_id,
            message_text,
            is_system_message,
            created_at
        `)
        .eq('claim_id', claimId)
        .order('created_at', { ascending: true });

    return NextResponse.json({
        claim,
        finder,
        messages: messages || []
    });
}
