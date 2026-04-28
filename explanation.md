# 🚀 ClaimConnect: Comprehensive System Explanation

Welcome to the technical deep-dive into **ClaimConnect**. This document provides an end-to-end, detailed look at the architecture, workflows, and core functionality of the platform.

> [!NOTE]
> **What is ClaimConnect?**
> At a high level, ClaimConnect is a zero-trust, privacy-first, agentic lost-and-found recovery platform. It replaces traditional public bulletin boards with a secure matching engine fueled by Google Gemini AI, PostgreSQL vector similarity search, mathematical spatial graphing, and real-time background processing.

---

## 🛠️ The Technology Stack

Before diving into the workflows, it is crucial to understand the tools powering the system:
- **Frontend & Framework**: **Next.js 15 (App Router)** and **Tailwind CSS**.
- **Backend Infrastructure**: A hybrid approach. Next.js serverless API routes handle quick requests, while a standalone, always-on **Node.js** server (`server/index.ts`) handles WebSockets and heavy background jobs.
- **Database**: **Supabase (PostgreSQL)**. We leverage the `pgvector` extension heavily.
- **Message Broker & Job Queue**: **Upstash Redis** combined with **BullMQ**.
- **AI Orchestration**: **LangChain.js** orchestrates the workflows, utilizing the **Google Gemini SDK** (`@google/genai` and `@langchain/google-genai`).
- **Real-time Communication**: **Socket.io**.
- **Authentication**: **NextAuth.js** with a custom credentials provider and Bcrypt hashing.

---

## 🗺️ The Complete End-to-End Workflows

Here is the step-by-step technical breakdown of exactly what happens when users interact with ClaimConnect, mapping actions to the specific files and code blocks that run.

### 1. Authentication Flow 🔐

**What the user does:** The user signs up or logs into the platform. Most routes are protected.
**What happens technically:**
- **Files involved:** `app/(auth)/login/page.tsx`, `app/api/auth/[...nextauth]/route.ts`, `lib/auth.ts`
- The user submits credentials. The request hits Next.js API route `app/api/auth/[...nextauth]/route.ts`.
- Inside `lib/auth.ts`, a custom Credentials Provider hashes the password (using `bcryptjs`) and compares it against the `users` table in Supabase.
- Upon success, a JWT session is stored in the browser. Next.js Server Components (`getServerSession`) and Middleware block unauthenticated access to `/found`, `/lost`, and `/chats`.

---

### 2. The Finder's Journey: Item Ingestion & Processing 📦

**What the user does:** A Finder goes to `/found`, fills out a form indicating they found an item (e.g., "earphones"), uploads a photo, and specifies the time and location. They hit submit.

**What happens technically (End-to-End):**

1. **API Hand-off (`app/api/upload/route.ts`)**
   - The frontend pushes the data to the Upload API.
   - **Database Shell creation**: The API inserts a "processing" shell record into the Supabase `items` table. The image is saved as a base64 Data URL.
   - **Queueing (The Magic)**: Instead of making the user wait for heavy AI processing, the API creates a job named `process_image` and pushes it into **BullMQ** (backed by Upstash Redis, configured in `lib/queue.ts`).
   - The server immediately responds with a `202 Accepted`, allowing the UI to instantly show a "Processing" state to the Finder.

2. **The Ingestion Worker (`server/workers/ingestionWorker.ts`)**
   - A standalone Node process pulls the job from the Redis queue.
   - **Gemini Vision Extraction**: The worker calls the Google Gemini API (`@google/genai`) using a complex, strict system prompt from `lib/ai/langchain.ts` (`INGESTION_SYSTEM_PROMPT`). 
   - *Visual Priority*: Gemini analyzes the base64 image and ignores vague user descriptions. It extracts precise details (e.g., "Black OnePlus Buds 3 Pro").
   - **Dynamic Question Generation**: Gemini dynamically generates exactly 3 highly targeted, hidden security questions based on the visual attributes (e.g., "What is the serial number on the back of the case?").
   - **Vectorization**: The final detailed description (`ai_item_description`) is sent to the LangChain wrapper function (`generateEmbedding` in `lib/ai/langchain.ts`), which calls Gemini's embedding model to generate a **768-dimensional mathematical vector**.
   - **Database Commit**: The worker updates the `items` row in Supabase, saving the category, the hidden security questions, and crucially, inserting the 768d vector into the `pgvector` column (`embedding`). The status changes to `active`.

---

### 3. The Claimer's Journey: Semantic Search 🔍

**What the user does:** A Claimer lost their item. They go to `/lost`, type "I lost my black earbuds", and hit search.

**What happens technically:**

1. **Semantic Matching API (`app/api/search/route.ts`)**
   - The search string is sent to the Search API route.
   - **Vectorization**: The API takes the user's natural language query and uses `generateEmbedding` (via LangChain & Gemini) to convert their text into a search query vector.
   - **Cosine Similarity Search**: The API executes an RPC function inside Supabase called `match_items`.
   - The database (`pgvector`) performs heavy mathematical operations: it compares the query vector against all active `items.embedding` vectors using **Cosine Similarity** (`1 - (items.embedding <=> query_embedding)`).
   - Only results exceeding a specific threshold (e.g., 50% match) are returned.
   
2. **Defensive UI (`app/lost/results/page.tsx`)**
   - The API strictly returns *only* the matching score and generic categories. It hides the security questions and exact descriptions.
   - The frontend renders the matching items as heavily blurred cards, hiding specific visual markers from the Claimer to prevent fraud.

---

### 4. The Verification Engine: AI Fraud Arbitration ⚖️

**What the user does:** The Claimer sees a blurred image they think is theirs. They click it. They are forced to answer the 3 AI-generated security questions created in Phase 1, and provide their exact context (Time and Location they lost it).

**What happens technically:**

1. **Queueing the Claim (`app/api/claim/route.ts`)**
   - The answers are posted. A `pending` row is created in the `claims` table.
   - A `claim_verification` job is pushed to BullMQ/Redis. The frontend shows "Verifying...".

2. **The Claim Arbitration Worker (`server/workers/claimWorker.ts`)**
   - The worker pulls the job. This is the most complex layer of the platform.
   - **Spatial Graph Logic (`lib/utils/campusGraph.ts` & `lib/ai/locationExtractor.ts`)**: 
     - The worker extracts nodes from the provided text using LangChain (`extractLocationNodes`).
     - It runs a mathematical shortest-path algorithm (`findPath`) against a hardcoded adjacency matrix representing the campus graph. 
     - It calculates if the Finder's raw location physically intersects with the Claimer's stated route or node, proving proximity mathematically (e.g., distance in meters).
   - **AI Fraud Judge (LangChain & Gemini 2.5 Flash)**:
     - The worker compiles a massive prompt injecting: The Spatial Proof, The Finder's Hidden Truth, and The Claimer's Answers.
     - Using `@langchain/google-genai` (`ChatGoogleGenerativeAI`), Gemini acts as a judge. It compares the Strictness of the Category (e.g., Electronics require strict matching; Umbrellas are lenient) and grades the Claimer's answers.
     - Gemini returns a strictly structured JSON response containing a `confidenceScore` (0-100) and `reasoning`.
   - **Resolution**: If the score is `>= 70`, the claim status is set to `approved` in Supabase, and the item's status is locked to `claimed`.

---

### 5. Secure Handover & Caching 💬

**What the user does:** The claim is approved! The user gets a notification badge and can chat with the Finder.

**What happens technically:**

1. **Redis Caching (`app/api/chats/count/route.ts`)**
   - To prevent dropping the PostgreSQL database, every time a user loads a page, the Navigation bar checks for unread messages.
   - The system uses **Cache-Aside with Upstash Redis**: It checks Redis first (`cache:chat_count:{userId}`). If missing, it queries Supabase, then saves the result to Redis with a 60-second expiration (`SETEX 60`).

2. **Real-time WebSockets (`server/socket.ts` & `app/chat/[id]/page.tsx`)**
   - Once approved, both users are given access to a dynamic chat room.
   - They connect via **Socket.io**. The Node backend manages `join_claim_room` and broadcasts messages instantly without refreshing.
   - The users coordinate a safe handover without ever revealing personal phone numbers or emails.

---

> [!TIP]
> **Summary of Key Intelligence**: The magic of ClaimConnect isn't just the AI; it is how **BullMQ and Redis** completely unblock the Next.js frontend, creating a snappy user experience, while **pgvector** and **Graph Mathematics** do the heavy lifting asynchronously to prevent fraud.
