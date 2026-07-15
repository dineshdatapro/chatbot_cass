import { apiClient } from "@/api/client";

export type ApiKeyRecord = {
  id: string;
  name: string;
  key_prefix: string;
  is_active: boolean;
  last_used_at: string | null;
  created_at: string;
};

export type ApiKeyListResponse = {
  items: ApiKeyRecord[];
  total: number;
};

export type ApiKeyCreatedResponse = {
  id: string;
  name: string;
  key_prefix: string;
  api_key: string;
  created_at: string;
};

export async function listApiKeys(): Promise<ApiKeyListResponse> {
  const { data } = await apiClient.get<ApiKeyListResponse>("/api-keys");
  return data;
}

export async function createApiKey(name: string): Promise<ApiKeyCreatedResponse> {
  const { data } = await apiClient.post<ApiKeyCreatedResponse>("/api-keys", { name });
  return data;
}

export async function revokeApiKey(keyId: string): Promise<void> {
  await apiClient.delete(`/api-keys/${keyId}`);
}
