import express from 'express';
import http from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from Next.js .env.local
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

import { initializeSocket } from './socket';

// Import our BullMQ workers so they spin up and stay alive when this server runs
import './workers/ingestionWorker';
import './workers/claimWorker';

const app = express();
app.use(cors());

const server = http.createServer(app);

// Initialize Socket.IO
initializeSocket(server);

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
    console.log(`=================================`);
    console.log(`🚀 ClaimConnect Backend Server`);
    console.log(`📡 Socket.IO running on port ${PORT}`);
    console.log(`⚙️ BullMQ Workers (Ingestion & Claim) are monitoring...`);
    console.log(`=================================`);
});
