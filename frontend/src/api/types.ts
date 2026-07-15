export type User = {
  id: string;
  email: string;
  full_name: string;
  tenant_id: string;
};

export type AuthResponse = {
  user: User;
  access_token: string;
  token_type: string;
  expires_in: number;
};

export type DocumentRecord = {
  id: string;
  file_name: string;
  original_name: string;
  mime_type: string;
  size_bytes: number;
  status: string;
  chunk_count: number;
  created_at: string;
  updated_at: string;
};

export type DocumentListResponse = {
  items: DocumentRecord[];
  total: number;
};

export type DocumentUploadResponse = {
  added: number;
  skipped: number;
  documents: DocumentRecord[];
};

export type ChatMessage = {
  role: string;
  content: string;
  metadata?: Record<string, unknown> | null;
  sources?: string[] | null;
};

export type ChatResponse = {
  session_id: string;
  thread_id: string;
  status: string;
  interrupted: boolean;
  messages: ChatMessage[];
  sources?: string[];
};

export type StoredChatMessage = {
  id: string;
  role: string;
  content: string;
  metadata?: Record<string, unknown> | null;
  sources?: string[] | null;
  created_at: string;
};

export type ChatSessionSummary = {
  id: string;
  thread_id: string;
  title: string | null;
  created_at: string;
  updated_at: string;
  last_message: string | null;
  message_count: number;
};

export type ChatSessionDetail = {
  id: string;
  thread_id: string;
  title: string | null;
  created_at: string;
  updated_at: string;
  messages: StoredChatMessage[];
};

export type ChatSessionListResponse = {
  items: ChatSessionSummary[];
  total: number;
};

export type HealthResponse = {
  status: string;
  rag_ready: boolean;
};

export type DashboardMetrics = {
  documentCount: number;
  indexedCount: number;
  ragReady: boolean;
  activeChatbots: number;
};
