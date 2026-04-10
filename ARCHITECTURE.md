ClaimConnect — AI-Driven Lost & Found Platform
1. What ClaimConnect Actually Is:
ClaimConnect is not a “lost & found website.” It’s a trust-based recovery system that reduces
fraud using AI similarity and verification.
Traditional systems fail because:
 Anyone can claim anything
 Search is manual & keyword-based
 No proof of ownership enforcement
 Human admins become bottlenecks
ClaimConnect fixes this by automating trust.
1. The ClaimConnect Tech Stack:
 Frontend: Next.js (App Router) and Tailwind CSS for a fast, responsive UI.
 Authentication: NextAuth (configured for JWT and RBAC to separate Admins, Finders, and
Claimers).
 Backend & API: Node.js with Next API Routes to handle requests.
 Database: PostgreSQL (via Supabase) to store user data, item metadata, and chat logs.
 Vector Database: pgvector (PostgreSQL extension) to store Gemini embeddings and run
cosine similarity searches.
 AI Orchestration: LangChain.js to wire up the RAG pipeline and agentic workflows.
 AI Model: Gemini Multimodal API to extract features from images, generate vector
embeddings, and mediate chat.
 Job Queue & Background Processing: BullMQ to handle heavy AI tasks asynchronously
without blocking the main thread.
 Caching & State: Redis to back BullMQ, manage rate limits, and hold temporary processing
states.
 Real-Time Communication: WebSockets (Socket.IO) for live chat between the finder and
claimer, with the AI listening silently.
2. Everyday Lost & Found Categories
 Electronics & Tech:
Earphones/Earbuds, Headphones, Smartphones, Laptops, Tablets, Chargers/Cables
(USB-C, Lightning, HDMI), Power Banks, Smartwatches/Fitness Bands, Stylus Pens
(Apple Pencil, etc.), Portable Bluetooth Speakers, USB Flash Drives, External Hard
Drives, Wireless Mouse, Adapters/Dongles.
 Personal Accessories:
Wallets, Purses, Sunglasses, Prescription Glasses, Wristwatches, Umbrellas, Jewelry
(rings, necklaces, bracelets), Belts.
 Identification & Keys:
Room/Hostel Keys, Car Keys, Bike Keys, EV Scooter Keys, Student ID Cards, Driver’s
Licenses, Metro Cards, Parking Access Cards, Room Access Cards.
 Bags & Luggage:
Backpacks, Tote Bags, Gym Bags, Laptop Bags, Laptop Sleeves, Travel Luggage, Small
Pouches.
 Stationery & Academics:
Scientific Calculators (e.g., Casio), Notebooks/Planners, Textbooks, Project Files, Printed
Assignments, Hall Tickets, Pencil Pouches.
 Clothing & Wearables:
Jackets/Hoodies, Caps/Hats, Scarves, Gloves, Sports Jerseys.
 Drinkware & Containers:
Reusable Water Bottles (Hydro Flask, Stanley, etc.), Thermoses, Coffee Tumblers, Tiffin
Boxes.
 Sports & Fitness Items:
Gym Gloves, Yoga Mats, Badminton Rackets, Cricket Equipment, Helmets.
 Hostel & Daily Living:
Extension Boards/Power Strips, Electric Kettles, Laundry Tokens/Cards.
 Important Documents (Non-ID):
Passport, Bank Passbooks, Admission Letters, Certificates, Official Envelopes.
 Personal Care & Grooming:
Makeup Pouches, Perfume Bottles, Hair Straighteners, Trimmers, Contact Lens Cases.
 Miscellaneous / Event Items:
Event Badges, Musical Instruments (ukulele, flute), Art Kits, Drawing Tablets, Gaming
Controllers.
Product independent Questions:
Finder:
1)Exact location precise, even where like near dustbin or in 3rd bench
2) Exact Time
Claimer:
Location and Time
if exact location or time not known:
Loss context: where were u coming from and where were u going
Timeline context: when did u last use it
Product-Specific Questions (Dynamic based on Category):
Gemini should dynamically generate these questions based on the subcategory it detects.
Finder or claimer:
Don't just say "iPhone". Say "Black iPhone 13 Pro with a cracked screen protector and a blue
Otterbox case".
WE ALSO GIVE THE AI (GEMINI, THE COLLEGE LOCATION CONTEXT IN DB USING
RAG SO IT CAN UNDERSTAND LOCATIONS OF VIT)


ClaimConnect Workflow:
Phase 1: Item Ingestion & Dynamic Profiling (The Finder)
1. Initial Upload & Basic Context
The Finder clicks "I found an item" on the Next.js frontend, uploads one or more images, and
enters broad context (e.g., "Found at 2 PM near the main cafeteria").
2. API Ingestion & Redis Queueing
The Next.js backend receives the payload. To prevent API timeouts, it immediately creates an
item_ingestion job, pushes it to the Redis queue via BullMQ, and responds to the frontend
with a 202 Accepted status. The frontend shows a "Processing Item..." skeleton loader.
3. Worker Activation & Temporary State
A standalone Node.js background worker pulls the job from Redis. It sets a temporary processing
state in Redis (e.g., item:123:status = processing).
4. AI Feature Extraction (Gemini API)
The worker sends the image(s) to the Gemini Multimodal API. Gemini extracts the broad
category (e.g., Electronics), subcategory (e.g., Earbuds), and hidden visual attributes (e.g., brand,
scratches, case color).
5. Dynamic Question Generation
Based on the extracted subcategory, the Gemini API generates 2-3 targeted, product-specific
questions (e.g., "What color is the inside of the charging case?") meant to secure the item.
6. Finder Prompting via WebSockets/Polling
The worker updates the Redis state. The frontend (listening via WebSocket or polling) sees the
update and prompts the Finder with these dynamically generated questions. The Finder submits
their answers.
7. Vectorization (LangChain.js)
The worker takes the combined data (Finder's answers, extracted attributes, image data) and uses
LangChain.js to call the Gemini API to generate a dense vector embedding.
8. Database Commit
The metadata is saved to the PostgreSQL database (via Supabase) , and the generated
embedding is securely stored in the pgvector column. The job is marked complete in BullMQ.
9. Agentic Scanning (Background Automation)
A LangChain Agent scans the newly inserted vector against open claims. If there's a high match,
it places an email_notification job in BullMQ to proactively alert users.
Phase 2: Discovery & Similarity Search (The Claimer)
10. Claimer Query Initiation
The Claimer accesses the system and inputs a text description (e.g., "Lost my black earbuds")
and an image(optional).
11. Redis Rate Limiting
Before processing, the backend checks Redis to ensure the user isn't spamming requests
(preventing brute-force probing of the system).
12. Query Vectorization
The input is sent to the Gemini API to be converted into a query vector embedding.
13. Semantic Search (pgvector)
The backend executes a cosine similarity search query directly within PostgreSQL using
pgvector.
14. Secure Results Delivery
The database returns the top-K matches. The frontend renders these results defensively: images
are heavily blurred with CSS, and specific attributes (brand, unique marks) are hidden. Only the
confidence score, broad category, and general location are visible.
Phase 3: The Claim & Multi-Layer AI Verification
15. Claim Initiation
The Claimer selects a blurred item. The frontend fetches the exact dynamic questions generated
during Phase 1 (Step 5) and asks the Claimer to answer them, along with providing their own
context (time/location lost).
16. Claim Queueing
The backend pushes a claim_verification job to the Redis queue via BullMQ and
immediately returns a "Verifying..." state to the frontend to ensure a snappy user experience.
17. Multi-Layer AI Engine Execution
The BullMQ worker picks up the job and runs the verification engine:
 Layer 1 (Semantic Similarity): Compares the Claimer's generated vector against the
Finder's pgvector embedding. If it is below the defined threshold, it auto-rejects.
 Layer 2 (Attribute Matching): Uses Gemini to cross-reference the Claimer's answers
against the hidden details extracted in Phase 1.
 Layer 3 (Context Consistency): Evaluates the plausibility of the Claimer's time/location
vs. the Finder's time/location.
 Final Scoring: The worker calculates the aggregate confidence score.
18. Real-Time Resolution (Redis Pub/Sub)
The worker updates the PostgreSQL database with the result. Using Redis Pub/Sub, an event is
emitted. The WebSocket server catches this and pushes a real-time update to the frontend: the
item instantly unblurs for the Claimer, and the chat interface unlocks.
Phase 4: AI-Mediated Handover
19. WebSocket Chat Activation
The Finder and Claimer are placed into a secure Socket.IO chat room where the claimer can ask
the finder where to collect his/her item
20. Final Handover & Trust Metrics
Once the item is physically returned, the system marks the ticket as resolved. The backend
updates the automated Trust Scores for both users in PostgreSQL based on the successful
transaction.

Antigravity:
System
Component What Antigravity Does (Code) What You Must Do
(Infrastructure)
Frontend UI
Scaffolds the entire Next.js (App
Router) structure and styles
everything with Tailwind CSS.
Nothing. Just tell it how you
want it to look.
Database
(PostgreSQL)
Writes the queries to read/write
users, items, and claims to
PostgreSQL.
Create a free Supabase
account, create a new project,
and copy the Database URL
and API keys.
Vector DB
(pgvector)
Writes the SQL cosine similarity
search queries.
+1
Run a single command in the
Supabase SQL editor to enable
the pgvector extension.
AI Engine
(Gemini)
Implements LangChain.js,
handles the prompts, and parses
the Gemini Multimodal responses.
Go to Google AI Studio and
generate a free Gemini API
Key.
Job Queue
(BullMQ)
Writes the background worker
logic for item_ingestion and
claim_verification.
Nothing (runs locally on your
Node server for now).
Caching/State
(Redis)
Writes the code that connects
BullMQ to Redis and handles rate
limiting.
Create a free Upstash Redis
database and copy the
connection URL.
WebSockets
Sets up the Socket.IO server for
real-time chat and AI mediation.
+1
Nothing. Antigravity handles
the Node.js implementation.
Authentication Configures NextAuth for rolebased access control.
Generate a random text string
to act as your
NEXTAUTH_SECRET.



ClaimConnect File Structure:
claim-connect/
├── .env.local # Your API keys (Supabase, Gemini, Redis, NextAuth)
├── package.json # Project dependencies
├── tsconfig.json # TypeScript configuration
├── server/ # The Always-On Node.js Backend
│ ├── index.ts # Main entry point: runs WebSockets & Workers
│ ├── socket.ts # Manages Socket.IO chat & AI mediation
│ └── workers/
│ ├── ingestionWorker.ts # BullMQ worker: Gemini extraction & pgvector
│ └── claimWorker.ts # BullMQ worker: AI verification scoring
├── src/
│ ├── app/ # Next.js App Router
│ │ ├── (auth)/
│ │ │ ├── login/page.tsx
│ │ │ └── signup/page.tsx
│ │ ├── found/ # FOUNDER FLOW
│ │ │ └── page.tsx # Upload image -> AI Processing -> Dynamic Questions
│ │ ├── lost/ # CLAIMER FLOW
│ │ │ ├── page.tsx # Semantic search + Image upload
│ │ │ ├── results/page.tsx# Grid of top-k blurred results
│ │ │ └── claim/[id]/page.tsx # Answer questions -> Get Score -> Unlock
│ │ ├── chat/
│ │ │ └── [id]/page.tsx # WebSocket chat with AI system warnings
│ │ ├── profile/ # USER DASHBOARD
│ │ │ └── page.tsx # Tabs: My Found Items, My Claims, Fraud Prevented
│ │ ├── admin/ # INSTITUTION VIEW
│ │ │ └── page.tsx # Protected route: Trust scores, system analytics
│ │ ├── api/ # Next.js Serverless API Routes (Frontend to Backend)
│ │ │ ├── upload/route.ts # Accepts images, pushes job to BullMQ
│ │ │ ├── search/route.ts # Handles pgvector similarity queries via Supabase
│ │ │ └── claim/route.ts # Accepts claims, pushes verification to BullMQ
│ │ ├── layout.tsx # Global Navbar (Home, How it Works, etc.)
│ │ └── page.tsx # Main Home Page
│ ├── components/
│ │ ├── ui/ # Reusable buttons, inputs, loading skeletons
│ │ ├── cards/ # BlurredItemCard, FoundItemCard
│ │ ├── chat/ # ChatBox, SystemMessageBubble
│ │ └── forms/ # DynamicQuestionForm
│ ├── types/ # TypeScript Interfaces (Crucial for AI APIs)
│ │ ├── index.ts # Types for DB schema, Gemini responses, Job payloads
│ └── lib/ # The Engine Room
│ ├── supabase.ts # PostgreSQL & pgvector client configuration
│ ├── redis.ts # Upstash Redis client (Rate limiting & queues)
│ ├── queue.ts # BullMQ queue definitions
│ └── ai/
│ ├── gemini.ts # Gemini Multimodal API call configuration
│ └── langchain.ts # RAG pipeline & dynamic question logic