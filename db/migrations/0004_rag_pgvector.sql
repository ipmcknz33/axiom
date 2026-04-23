create extension if not exists vector;

create table if not exists public.rag_documents (
  id text primary key,
  title text not null,
  content text not null,
  source text,
  metadata jsonb not null default '{}'::jsonb,
  embedding vector(24) not null,
  updated_at timestamptz not null default now()
);

create index if not exists rag_documents_embedding_ivfflat
  on public.rag_documents
  using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);

create index if not exists rag_documents_metadata_gin
  on public.rag_documents
  using gin (metadata);

create or replace function public.match_rag_documents(
  query_embedding vector(24),
  match_count int default 4,
  metadata_filter jsonb default '{}'::jsonb
)
returns table (
  id text,
  title text,
  source text,
  content text,
  metadata jsonb,
  score float8
)
language sql
stable
as $$
  select
    d.id,
    d.title,
    d.source,
    d.content,
    d.metadata,
    1 - (d.embedding <=> query_embedding) as score
  from public.rag_documents d
  where (metadata_filter = '{}'::jsonb or d.metadata @> metadata_filter)
  order by d.embedding <=> query_embedding
  limit greatest(match_count, 1);
$$;
