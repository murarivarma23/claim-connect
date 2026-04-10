-- Run this entire script in your Supabase SQL Editor to set up the database for ClaimConnect

-- 1. Enable pgvector for AI Similarity Search
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Create Users Table (Custom users for our NextAuth Credentials Provider)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT DEFAULT 'student',
    trust_score INTEGER DEFAULT 100,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Create Items Table
CREATE TABLE IF NOT EXISTS items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    finder_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name TEXT,
    description TEXT,
    ai_item_description TEXT,
    category TEXT,
    subcategory TEXT,
    location_found TEXT,
    date_found TEXT,
    time_found TEXT, -- Changing this simply to TEXT (or keeping as is, but we add date_found explicitly)
    image_url TEXT,
    additional_images JSONB DEFAULT '[]'::jsonb,
    hidden_attributes JSONB,
    security_questions JSONB,
    finder_answers JSONB,
    status TEXT DEFAULT 'processing', -- processing, active, claimed, resolved
    embedding vector(768), -- Gemini generally uses 768 dimensions for embeddings
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Create Claims Table
CREATE TABLE IF NOT EXISTS claims (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_id UUID REFERENCES items(id) ON DELETE CASCADE,
    claimer_id UUID REFERENCES users(id) ON DELETE CASCADE,
    claimer_answers JSONB,
    date_lost TEXT,
    time_lost TEXT,
    location_lost TEXT,
    context_provided TEXT,
    item_description TEXT,
    image_url TEXT,
    ai_confidence_score FLOAT,
    status TEXT DEFAULT 'pending', -- pending, approved, rejected
    -- Note: Claims do NOT need embeddings because the similarity search happens BEFORE the claim is created. Once claimed, AI directly compares the specific claim vs the specific item.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Create Chat Messages Table
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    claim_id UUID REFERENCES claims(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES users(id) ON DELETE CASCADE,
    message_text TEXT NOT NULL,
    is_system_message BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Create the pgvector search function
create or replace function match_items (
  query_embedding vector(768),
  match_threshold float,
  match_count int
)
returns table (
  id uuid,
  category text,
  subcategory text,
  similarity float
)
language sql stable
as $$
  select
    items.id,
    items.category,
    items.subcategory,
    1 - (items.embedding <=> query_embedding) as similarity
  from items
  where 1 - (items.embedding <=> query_embedding) > match_threshold
  order by items.embedding <=> query_embedding
  limit match_count;
$$;

-- 7. (Patch) Ensure datetime formats are strictly TEXT for newly migrated instances
ALTER TABLE items ALTER COLUMN time_found TYPE TEXT;
ALTER TABLE items ALTER COLUMN date_found TYPE TEXT;
ALTER TABLE claims ALTER COLUMN time_lost TYPE TEXT;
ALTER TABLE claims ALTER COLUMN date_lost TYPE TEXT;
