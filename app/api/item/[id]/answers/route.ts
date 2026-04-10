import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: Request, context: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await context.params;
        const { answers } = await req.json();

        // Save the finder's answers to the database
        const { error } = await supabase
            .from('items')
            .update({ finder_answers: answers })
            .eq('id', id);

        if (error) {
            console.error("Failed to save finder answers:", error);
            throw new Error('Failed to save answers');
        }

        return NextResponse.json({ success: true, message: 'Answers saved securely.' });
    } catch (error) {
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}
