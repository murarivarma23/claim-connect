# ClaimConnect

ClaimConnect is an AI-powered, privacy-first, agentic lost-and-found recovery platform. It replaces the traditional concept of a "public feed" or "bulletin board" with a highly secure matching engine fueled by Gemini AI, Supabase pgvector, and Upstash Redis.

## 🚀 Core Architecture & Technologies
- **Framework**: Next.js 15 (App Router)
- **Database**: Supabase (PostgreSQL with `pgvector` for semantic similarity search)
- **Authentication**: NextAuth.js (Custom Credentials Provider)
- **AI Engine**: Google Gemini (Vision & Text Models via `@google/genai`)
- **Background Jobs**: BullMQ
- **Message Broker & Caching**: Upstash Redis
- **Real-Time Communication**: Socket.io

---

## 🗺️ The Complete User Journey & Workflows

### 1. Authentication Flow
When a user visits the platform, most routes (like `/found`, `/lost`, `/profile`) are protected by `getServerSession` in Next.js Server Components or Middleware.
- **Login/Signup**: If unauthenticated, they are redirected to `/login`.
- **NextAuth (`lib/auth.ts`)**: On submission, NextAuth verifies the credentials against the `users` table in Supabase. Upon success, a JWT session is stored securely in the browser, allowing the user access to protected routes.

### 2. The "I Found Something" Flow (`/found`)
1. **User Action**: The finder fills out a form, uploading an image, a generic name, a time, and location.
2. **API Hand-off**: The client posts this FormData to `/api/upload`.
3. **Database Shell**: The server inserts a "processing" shell record into the `items` table in Supabase and saves the image as a Data URL to bypass external storage limits.
4. **Queueing (The magic)**: The server pushes an ingestion job to BullMQ via Upstash Redis. This frees the Next.js server to respond to the client immediately (`200 OK`) and unlock the UI, while the heavy AI lifting happens in the background.
5. **Ingestion Worker (`server/workers/ingestionWorker.ts`)**:
   - The worker pulls the job from Redis.
   - It sends the image and metadata to **Gemini Vision** using a strict prompt.
   - **Visual Priority AI**: Gemini ignores generic user text ("black earphones") and precisely analyzes the photo to generate a specific `ai_item_description` (e.g., "Black OnePlus Buds 3 Pro").
   - It generates exactly 3 highly-targeted hidden security questions.
   - The final `ai_item_description` is then converted into a 768-dimensional math vector using Gemini's text embedding model.
   - The worker updates the `items` row in Supabase with these attributes and changes the status to `active`.

### 3. The "I Lost Something" Flow (`/lost`)
*Note: Due to our zero-trust security model, there is no public feed to freely browse items.*
1. **User Search**: The user enters what they lost in the search bar (e.g., "I lost my OnePlus earbuds").
2. **URL Search Params**: The client uses `useRouter` to push the user to `/lost/results?q=...`. No `sessionStorage` or intermediate server calls are used, keeping the URL easily shareable.
3. **Semantic Matching (`/api/search`)**: 
   - The results page hits the Search API.
   - The API converts the user's natural language string into a query embedding vector.
   - It performs a **Cosine Similarity Match** using a `pgvector` RPC function (`match_items`) inside Supabase, comparing the search vector against all active `items.embedding` vectors in the database.
   - The user is presented with blurred cards representing matches.

### 4. The Claiming & Verification Flow (`/lost/claim/[id]`)
1. **Context Submission**: The user clicks a protected item and is forced to answer the 3 AI-generated security questions. They must also provide the time, date, and exact location they believe they lost it.
2. **API & Queue**: This hits `/api/claim`, which creates a `pending` row in the `claims` table, then offloads arbitration to BullMQ.
3. **Claim Worker (`server/workers/claimWorker.ts`)**:
   - **Spatial Graph Logic**: First, mathematical shortest-path logic (`campusGraph.ts`) determines if the Finder's location and the Claimer's location intersect plausibly.
   - **Arbitration Engine**: Gemini acts as a fraud judge. It injects the Spatial Proof, compares the strictness of the category (Electronics vs Keys), and compares the Answers against the Truth.
   - If Gemini awards a confidence score `>85`, the claim is marked `approved` and the item is functionally locked to that claimer.

### 5. Secure Handover & Notifications (Caching)
1. **Notification Badge**: Every page load checks `/api/chats/count` to see if there are any active `approved` claims. 
   - **Redis Cache-Aside**: This endpoint aggregates data across 3 tables. To prevent dropping the database, it checks Upstash Redis first (`cache:chat_count:{userId}`). If missing, it runs the query and caches it for 60 seconds (`SETEX 60`).
2. **Socket.io Chat**: Claimers and Finders communicate in an arbitrary room created in `/chats/[id]`. Socket server (`server/socket.ts`) handles real-time bidirectional message emitting, completely shielding both users' personal contact info.

---

## 📂 Codebase & Directory Breakdown

### `app/` (Next.js Application Router)
- **`page.tsx`**: The main public landing page and hero section. (No authentication strictly required here until action taken).
- **`(auth)/`**: Contains `login/page.tsx` and `signup/page.tsx` interfaces targeting the custom credentials API.
- **`found/page.tsx`**: Front-end form for Finders to upload images.
- **`lost/page.tsx`**: The main Search interface for Claimers.
- **`lost/results/page.tsx`**: Handles reading the `q` URL param and fetching blurred match results from the Search API.
- **`lost/claim/[id]/page.tsx`**: Renders the dynamic security questions for a specific item id before submitting the claim.
- **`profile/page.tsx`**: The user's private dashboard to view items they've found or claimed. Added a delete action here to prune bad found items.
- **`chats/page.tsx`**: The dashboard listing all active chat rooms a user is a part of.
- **`chat/[id]/page.tsx`**: The real-time chat interface connected to `Socket.io`.

### `app/api/` (Next.js Serverless Endpoints)
- **`auth/[...nextauth]/route.ts`**: The core NextAuth handler using the credentials provider from `lib/auth.ts`.
- **`upload/route.ts`**: Primary ingestion API for `found/page.tsx`. Stashes to DB and kicks off the background Upstash queue.
- **`search/route.ts`**: Converts query to vector and triggers the Supabase `pgvector` RPC match.
- **`item/[id]/route.ts`**: Standard GET for item details, and a heavily verified DELETE endpoint allowing a finder to remove their own record.
- **`item/[id]/answers/route.ts`**: Securely fetches the isolated security questions specifically for the claim form.
- **`claim/route.ts`**: Receives claim contexts and answers, kicking off the Claim Arbitration Worker queue.
- **`chats/route.ts`**: Retrieves all active chats for a user. Implements sub-millisecond **Redis Caching**.
- **`chats/count/route.ts`**: Polls the unread notification counts. Implements **Redis Caching**.

### `server/` (Standalone Node Backend)
*Because Next.js Vercel environments kill long-running connections, we run a parallel constant-on Node process here for queues and sockets.*
- **`index.ts`**: Boots up the Express server, mounts the Express/Socket.io adapter, and binds the BullMQ worker event listeners.
- **`socket.ts`**: Defines the `io.on('connection')` logic, room joining (`join_claim_room`), and message broadcasting (`send_message`).
- **`workers/ingestionWorker.ts`**: The background process that handles Gemini Vision parsing and vector creation.
- **`workers/claimWorker.ts`**: The background process that acts as the fraud arbitration judge and parses the campus graphs.

### `lib/` (Core Utilities)
- **`auth.ts`**: Defines NextAuth configuration (Bcrypt for password hashing).
- **`supabase.ts`**: Singleton export for the Supabase SQL client.
- **`ai/gemini.ts`**: Singleton instantiation for the official `@google/genai` client.
- **`ai/langchain.ts`**: Houses the massive `INGESTION_SYSTEM_PROMPT` containing complex formatting and "Visual Priority" routing instructions for the AI, as well as the embedding wrapper function.
- **`utils/campusGraph.ts`**: Hardcoded adjacency matrix describing walking distance math (e.g., node "SJT" is connected to node "PRP" by 250m) to enforce location claims mathematically before AI arbitration.
- **`utils.ts`**: Standard Tailwind class merging tools (clsx, twMerge).

### `components/` (React Components)
- **`delete-item-button.tsx`**: An interactive UI for confirming and deleting a found item via HTTP DELETE inside the profile view.
- **`user-nav.tsx` / `nav-links.tsx`**: Top navigation header components, handling auth state UI and the cached Chat badge.
- **`chat-badge.tsx`**: Client hook that polls `/api/chats/count` to render red notification dots over the chat icon.

### Root Configs
- **`database_schema.sql`**: The single source of truth for generating the exact Supabase tables, types, and the `match_items` pgvector RPC function required to stand up a new instance.
- **`next.config.ts`**: Configured to increase the payload size limit (for those base64 image strings) and suppresses annoying internal API terminal logging during development (`logging: false`).
