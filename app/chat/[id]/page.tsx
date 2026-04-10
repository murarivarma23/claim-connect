"use client"

import { useState, useEffect, useRef } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Send, Shield, Info, ArrowLeft, Loader2, ShieldCheck, MapPin, Clock } from 'lucide-react'
import { io, Socket } from 'socket.io-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { useSession } from 'next-auth/react'

interface DBMessage {
    id: string;
    claim_id: string;
    sender_id: string;
    message_text: string;
    is_system_message: boolean;
    created_at: string;
}

interface UIMessage {
    id: string;
    senderId: string;
    text: string;
    isSystem: boolean;
    createdAt: string;
}

export default function ChatPage() {
    const { id: claimId } = useParams<{ id: string }>();
    const { data: session, status } = useSession();
    const myUserId = (session?.user as any)?.id;

    const [messages, setMessages] = useState<UIMessage[]>([]);
    const [claimData, setClaimData] = useState<any>(null);
    const [finderData, setFinderData] = useState<any>(null);
    const [newMessage, setNewMessage] = useState("");
    const [socket, setSocket] = useState<Socket | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const chatEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const scrollToBottom = () => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    // Load existing messages + claim details from DB
    useEffect(() => {
        if (!claimId || status !== 'authenticated') return;

        const loadChat = async () => {
            try {
                const res = await fetch(`/api/chat/${claimId}`);
                if (!res.ok) throw new Error('Failed to load chat');
                const data = await res.json();

                setClaimData(data.claim);
                setFinderData(data.finder);

                // Map DB messages to UI format
                const uiMsgs: UIMessage[] = (data.messages || []).map((m: DBMessage) => ({
                    id: m.id,
                    senderId: m.sender_id,
                    text: m.message_text,
                    isSystem: m.is_system_message,
                    createdAt: m.created_at,
                }));
                setMessages(uiMsgs);
            } catch (e) {
                console.error('Error loading chat:', e);
            } finally {
                setIsLoading(false);
            }
        };

        loadChat();
    }, [claimId, status]);

    // Auto-scroll when messages change
    useEffect(() => {
        setTimeout(scrollToBottom, 100);
    }, [messages]);

    // Connect to Socket.IO
    useEffect(() => {
        if (!claimId || !myUserId) return;

        const ioSocket = io('http://localhost:3001');

        ioSocket.on('connect', () => {
            console.log('[Chat] Connected to socket server');
            ioSocket.emit('join_claim', claimId);
        });

        ioSocket.on('receive_message', (msg: DBMessage) => {
            // Avoid duplicates (we already optimistically added our own message)
            setMessages(prev => {
                const alreadyExists = prev.some(m => m.id === msg.id);
                if (alreadyExists) return prev;
                return [...prev, {
                    id: msg.id,
                    senderId: msg.sender_id,
                    text: msg.message_text,
                    isSystem: msg.is_system_message,
                    createdAt: msg.created_at,
                }];
            });
        });

        setSocket(ioSocket);
        return () => { ioSocket.disconnect(); };
    }, [claimId, myUserId]);

    const handleSend = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !socket || !myUserId) return;

        socket.emit('send_message', {
            claimId,
            senderId: myUserId,
            text: newMessage.trim(),
        });

        setNewMessage("");
        inputRef.current?.focus();
    };

    const formatTime = (iso: string) => {
        return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const formatDate = (iso: string) => {
        const d = new Date(iso);
        const today = new Date();
        if (d.toDateString() === today.toDateString()) return 'Today';
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
        return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
    };

    // Determine the other party
    const item = claimData?.items;
    const isIFinder = item?.finder_id === myUserId;
    const otherParty = isIFinder ? claimData?.claimer : finderData;
    const otherPartyInitials = otherParty?.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || '??';

    if (status === 'loading' || isLoading) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
        );
    }

    return (
        <div className="w-full flex-1 flex flex-col" style={{ height: 'calc(100vh - 88px)' }}>
            <div className="max-w-3xl w-full mx-auto flex flex-col flex-1 px-4 py-4">

                {/* Header */}
                <div className="bg-white border border-slate-200 rounded-t-2xl px-5 py-4 flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" asChild className="text-slate-400 hover:text-slate-700 -ml-2">
                            <Link href="/chats"><ArrowLeft className="w-5 h-5" /></Link>
                        </Button>
                        <Avatar className="h-11 w-11 border-2 border-slate-100">
                            <AvatarFallback className="bg-blue-50 text-blue-600 font-bold text-sm">
                                {otherPartyInitials}
                            </AvatarFallback>
                        </Avatar>
                        <div>
                            <h2 className="font-bold text-slate-900 text-[15px]">
                                {isIFinder ? 'Claimer' : 'Finder'}: {otherParty?.name || 'Anonymous'}
                            </h2>
                            <div className="flex items-center gap-2 mt-0.5">
                                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                <span className="text-xs text-slate-500">
                                    {item?.subcategory || item?.category || 'Item'} · Trust {otherParty?.trust_score ?? 100}/100
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <Badge className="bg-green-50 text-green-700 border border-green-200 gap-1 hidden sm:flex">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            Verified
                        </Badge>
                        <Button variant="outline" size="sm" asChild className="text-slate-600 hidden sm:flex">
                            <Link href="/profile">
                                <Info className="w-4 h-4 mr-1.5" />
                                Details
                            </Link>
                        </Button>
                    </div>
                </div>

                {/* Item context bar */}
                {item && (
                    <div className="bg-blue-50 border-x border-blue-100 px-5 py-2.5 flex items-center gap-4 text-sm text-blue-800">
                        <MapPin className="w-4 h-4 shrink-0 text-blue-500" />
                        <span className="font-medium">{item.location_found}</span>
                        {item.time_found && (
                            <>
                                <span className="text-blue-300">·</span>
                                <Clock className="w-4 h-4 shrink-0 text-blue-500" />
                                <span>{new Date(item.time_found).toLocaleDateString()}</span>
                            </>
                        )}
                    </div>
                )}

                {/* Messages area */}
                <div className="flex-1 bg-slate-50 border-x border-slate-200 overflow-y-auto px-5 py-6 space-y-4 min-h-0">
                    {/* Claim confirmed pill */}
                    <div className="flex justify-center">
                        <div className="bg-white border border-slate-200 px-4 py-1.5 rounded-full text-xs text-slate-500 flex items-center gap-1.5 shadow-sm">
                            <ShieldCheck className="w-3.5 h-3.5 text-green-500" />
                            Claim #{claimId?.slice(0, 8)}... Verified · {claimData?.ai_confidence_score}% AI confidence
                        </div>
                    </div>

                    {messages.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                            <div className="w-14 h-14 bg-blue-50 rounded-full flex items-center justify-center mb-4">
                                <Send className="w-6 h-6 text-blue-400" />
                            </div>
                            <p className="text-slate-600 font-medium">Start the conversation!</p>
                            <p className="text-sm text-slate-400 mt-1">Arrange the handover with the {isIFinder ? 'claimer' : 'finder'}.</p>
                        </div>
                    )}

                    {/* Group messages by date */}
                    {messages.map((msg, i) => {
                        const prevMsg = messages[i - 1];
                        const showDate = !prevMsg || formatDate(msg.createdAt) !== formatDate(prevMsg.createdAt);
                        const isMe = msg.senderId === myUserId;

                        return (
                            <div key={msg.id}>
                                {showDate && (
                                    <div className="flex justify-center my-4">
                                        <span className="bg-slate-200/70 text-slate-500 text-xs px-3 py-1 rounded-full">
                                            {formatDate(msg.createdAt)}
                                        </span>
                                    </div>
                                )}

                                {msg.isSystem ? (
                                    <div className="flex justify-center">
                                        <div className="max-w-sm bg-amber-50 border border-amber-200 px-4 py-3 rounded-xl flex items-start gap-2.5">
                                            <Shield className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                                            <p className="text-xs text-amber-800 leading-snug">{msg.text}</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className={`flex ${isMe ? 'justify-end' : 'justify-start'} items-end gap-2`}>
                                        {!isMe && (
                                            <Avatar className="w-7 h-7 shrink-0 mb-1">
                                                <AvatarFallback className="bg-slate-200 text-slate-600 text-xs font-bold">
                                                    {otherPartyInitials}
                                                </AvatarFallback>
                                            </Avatar>
                                        )}
                                        <div className={`max-w-[72%] px-4 py-3 rounded-2xl ${isMe
                                            ? 'bg-[#1877F2] text-white rounded-br-sm shadow-sm'
                                            : 'bg-white text-slate-800 border border-slate-200 rounded-bl-sm shadow-sm'
                                            }`}>
                                            <p className="text-[15px] leading-relaxed">{msg.text}</p>
                                            <span className={`text-[10px] block mt-1.5 ${isMe ? 'text-blue-100 text-right' : 'text-slate-400'}`}>
                                                {formatTime(msg.createdAt)}
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                    <div ref={chatEndRef} />
                </div>

                {/* Input */}
                <div className="bg-white border border-slate-200 rounded-b-2xl px-4 py-3.5 shadow-sm">
                    <form onSubmit={handleSend} className="flex gap-3 items-center">
                        <Input
                            ref={inputRef}
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="Type a message..."
                            className="flex-1 bg-slate-50 border-slate-200 focus-visible:ring-blue-500 rounded-xl h-11"
                        />
                        <Button
                            type="submit"
                            size="icon"
                            className="shrink-0 bg-[#1877F2] hover:bg-[#1877F2]/90 text-white shadow-sm w-11 h-11 rounded-xl"
                            disabled={!newMessage.trim()}
                        >
                            <Send className="w-4 h-4 ml-0.5" />
                        </Button>
                    </form>
                    <p className="text-center text-[10px] text-slate-400 mt-2 flex items-center justify-center gap-1">
                        <Shield className="w-3 h-3" />
                        AI Trust Engine monitors all messages for safety
                    </p>
                </div>

            </div>
        </div>
    );
}
