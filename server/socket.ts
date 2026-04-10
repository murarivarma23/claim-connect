import { Server } from 'socket.io';
import { supabase } from '../lib/supabase';
import http from 'http';

export function initializeSocket(server: http.Server) {
    const io = new Server(server, {
        cors: {
            origin: process.env.NEXTAUTH_URL || "http://localhost:3000",
            methods: ["GET", "POST"]
        }
    });

    io.on('connection', (socket) => {
        console.log(`[Socket] User connected: ${socket.id}`);

        // Join a specific claim room
        socket.on('join_claim', (claimId: string) => {
            socket.join(claimId);
            console.log(`[Socket] user joined claim room: ${claimId}`);
        });

        // Handle sending messages
        socket.on('send_message', async (data: { claimId: string, senderId: string, text: string }) => {
            const { claimId, senderId, text } = data;

            try {
                // 1. Save to Supabase
                const { error, data: message } = await supabase
                    .from('chat_messages')
                    .insert([{
                        claim_id: claimId,
                        sender_id: senderId,
                        message_text: text,
                        is_system_message: false
                    }])
                    .select()
                    .single();

                if (error) throw error;

                // 2. Broadcast to everyone in the room
                io.to(claimId).emit('receive_message', message);

                // 3. Simple AI Mediation (If text contains sensitive words, send a system warning)
                const sensitiveWords = ['phone number', 'address', 'password', 'meet alone'];
                const containsSensitive = sensitiveWords.some(word => text.toLowerCase().includes(word));

                if (containsSensitive) {
                    const { data: sysMessage } = await supabase
                        .from('chat_messages')
                        .insert([{
                            claim_id: claimId,
                            sender_id: senderId, // Technically system, but tracking who triggered it
                            message_text: "System Warning: Please avoid sharing sensitive personal information securely. We recommend meeting in a public campus location for handovers.",
                            is_system_message: true
                        }])
                        .select()
                        .single();

                    io.to(claimId).emit('receive_message', sysMessage);
                }

            } catch (err) {
                console.error("[Socket] Error sending message:", err);
            }
        });

        socket.on('disconnect', () => {
            console.log(`[Socket] User disconnected: ${socket.id}`);
        });
    });

    return io;
}
