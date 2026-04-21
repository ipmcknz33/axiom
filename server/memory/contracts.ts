export type MemorySearchQuery = {
  userId: string;
  projectId?: string;
  query: string;
  limit?: number;
};

export type MemorySearchResult = {
  id: string;
  content: string;
  score: number;
  sourceType: "conversation" | "document" | "profile";
};