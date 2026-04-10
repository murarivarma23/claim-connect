import { Queue } from 'bullmq';
import IORedis from 'ioredis';

// ioredis connection required for bullmq
const connection: any = new IORedis(process.env.REDIS_URL!, {
    maxRetriesPerRequest: null,
});

// Queue for processing uploaded item images and extracting AI context
export const itemIngestionQueue = new Queue('item_ingestion', { connection });

// Queue for verifying a claimer's answers against the item's hidden details
export const claimVerificationQueue = new Queue('claim_verification', { connection });
