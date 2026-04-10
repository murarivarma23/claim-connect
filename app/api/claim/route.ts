import { NextResponse } from 'next/server';
import { claimVerificationQueue } from '@/lib/queue';
import { supabase } from '@/lib/supabase';
import { sendClaimNotificationEmail } from '@/lib/email';

export async function POST(req: Request) {
    try {
        const { itemId, claimerId, answers, claimerContext, claimerLocation, claimerDate, claimerTime } = await req.json();

        const actualClaimerId = claimerId === 'dummy_claimer_uuid' ? null : claimerId;

        // 1. Initial Database Insert (State: Pending)
        const { data: claim, error } = await supabase
            .from('claims')
            .insert([
                {
                    item_id: itemId,
                    claimer_id: actualClaimerId,
                    claimer_answers: answers,
                    context_provided: claimerContext,
                    location_lost: claimerLocation,
                    date_lost: claimerDate,
                    time_lost: claimerTime,
                    status: 'pending'
                }
            ])
            .select('id')
            .single();

        if (error || !claim) {
            throw new Error('Failed to create initial claim record');
        }

        // 2. Add job to BullMQ for the multi-layer AI verification engine
        await claimVerificationQueue.add('verify_claim', {
            claimId: claim.id,
            itemId,
            claimerId,
            answers,
            claimerContext,
            claimerLocation,
            claimerDate,
            claimerTime
        });

        // 3. Dispatch Email Notification to Finder
        // We shouldn't await this to keep the UX fast, but handle errors silently
        supabase
            .from('items')
            .select('name, category, subcategory, finders:finder_id(name, email)')
            .eq('id', itemId)
            .single()
            .then(({ data: itemData }) => {
                if (itemData && itemData.finders) {
                    const finder = itemData.finders as any;
                    const itemName = itemData.name || itemData.subcategory || itemData.category || 'Item';
                    sendClaimNotificationEmail(
                        finder.email,
                        finder.name,
                        itemName,
                        claim.id
                    ).catch(console.error);
                }
            });

        // 4. Keep UX fast: Tell frontend the AI is analyzing
        return NextResponse.json(
            { message: 'Claim submitted. AI verification started.', claimId: claim.id },
            { status: 202 }
        );

    } catch (error) {
        console.error('Claim Submission Error:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
