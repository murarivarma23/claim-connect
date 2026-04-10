import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { redirect } from 'next/navigation';
import { MessageSquare, ShieldCheck, MapPin, ChevronRight, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

async function getChats(userId: string) {
    // As claimer
    const { data: asClaimerClaims } = await supabase
        .from('claims')
        .select(`id, status, ai_confidence_score, created_at, item_id, items(id, category, subcategory, location_found, image_url, finder_id)`)
        .eq('claimer_id', userId)
        .eq('status', 'approved');

    // As finder
    const { data: finderItems } = await supabase.from('items').select('id').eq('finder_id', userId);
    const finderItemIds = (finderItems || []).map((i: any) => i.id);

    let asFinderClaims: any[] = [];
    if (finderItemIds.length > 0) {
        const { data } = await supabase
            .from('claims')
            .select(`id, status, ai_confidence_score, created_at, item_id, claimer_id, items(id, category, subcategory, location_found, image_url, finder_id)`)
            .in('item_id', finderItemIds)
            .eq('status', 'approved');
        asFinderClaims = data || [];
    }

    const allClaims = [
        ...(asClaimerClaims || []).map((c: any) => ({ ...c, myRole: 'claimer' })),
        ...asFinderClaims.map((c: any) => ({ ...c, myRole: 'finder' })),
    ];

    // Fetch last message and other party for each claim
    const results = await Promise.all(
        allClaims.map(async (claim) => {
            const [{ data: lastMsg }, { data: otherUser }] = await Promise.all([
                supabase.from('chat_messages').select('message_text, created_at').eq('claim_id', claim.id).order('created_at', { ascending: false }).limit(1).maybeSingle(),
                claim.myRole === 'claimer'
                    ? supabase.from('users').select('id, name, trust_score').eq('id', (claim.items as any)?.finder_id).maybeSingle()
                    : supabase.from('users').select('id, name, trust_score').eq('id', claim.claimer_id).maybeSingle(),
            ]);
            return { ...claim, lastMessage: lastMsg || null, otherUser: otherUser || null };
        })
    );

    return results.sort((a, b) => {
        const aTime = a.lastMessage?.created_at || a.created_at;
        const bTime = b.lastMessage?.created_at || b.created_at;
        return new Date(bTime).getTime() - new Date(aTime).getTime();
    });
}

export default async function ChatsPage() {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
        redirect('/login?callbackUrl=/chats');
    }

    const userId = (session.user as any).id;
    const chats = await getChats(userId);

    const formatTime = (iso: string) => {
        const d = new Date(iso);
        const today = new Date();
        if (d.toDateString() === today.toDateString()) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
    };

    return (
        <div className="max-w-2xl mx-auto px-4 py-10 w-full flex-1">
            {/* Page header */}
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                        <MessageSquare className="w-5 h-5 text-blue-500" />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900">My Chats</h1>
                </div>
                <p className="text-slate-500 text-sm">Secure conversations with finders and claimers for verified items.</p>
            </div>

            {chats.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-center">
                    <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-5">
                        <MessageSquare className="w-8 h-8 text-slate-400" />
                    </div>
                    <h2 className="font-bold text-slate-800 text-lg mb-2">No active chats yet</h2>
                    <p className="text-slate-500 text-sm max-w-xs">
                        Once a claim is verified and approved, a secure chat room opens between you and the finder.
                    </p>
                    <Link href="/lost" className="mt-6 inline-flex items-center gap-2 text-blue-500 hover:text-blue-600 font-medium text-sm transition-colors">
                        Search for lost items
                        <ChevronRight className="w-4 h-4" />
                    </Link>
                </div>
            ) : (
                <div className="space-y-3">
                    {chats.map((chat) => {
                        const item = chat.items as any;
                        const initials = chat.otherUser?.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || '??';

                        return (
                            <Link key={chat.id} href={`/chat/${chat.id}`}>
                                <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-4 hover:border-blue-300 hover:shadow-md transition-all group cursor-pointer">
                                    {/* Avatar */}
                                    <div className="w-12 h-12 rounded-full bg-blue-50 border-2 border-blue-100 flex items-center justify-center font-bold text-blue-600 text-sm shrink-0 group-hover:border-blue-300 transition-colors">
                                        {initials}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-0.5">
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-semibold text-slate-900 text-[15px] truncate">
                                                    {chat.otherUser?.name || 'Anonymous'}
                                                </h3>
                                                <Badge className={`text-[10px] px-1.5 py-0 border-none hidden sm:inline-flex ${chat.myRole === 'claimer' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'}`}>
                                                    {chat.myRole === 'claimer' ? 'Claimer' : 'Finder'}
                                                </Badge>
                                            </div>
                                            {chat.lastMessage && (
                                                <span className="text-xs text-slate-400 shrink-0 ml-2">{formatTime(chat.lastMessage.created_at)}</span>
                                            )}
                                        </div>

                                        <p className="text-sm text-slate-500 truncate">
                                            {chat.lastMessage?.message_text || (
                                                <span className="italic text-slate-400">No messages yet — start the conversation</span>
                                            )}
                                        </p>

                                        <div className="flex items-center gap-3 mt-1.5">
                                            <div className="flex items-center gap-1 text-xs text-slate-400">
                                                <MapPin className="w-3 h-3 text-slate-300" />
                                                {item?.location_found || 'Unknown location'}
                                            </div>
                                            <div className="flex items-center gap-1 text-xs text-green-600">
                                                <ShieldCheck className="w-3 h-3" />
                                                {chat.ai_confidence_score}% match
                                            </div>
                                        </div>
                                    </div>

                                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 shrink-0 transition-colors" />
                                </div>
                            </Link>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
