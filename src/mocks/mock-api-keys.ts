import { MOCK_API_KEYS } from "./data/user-data";

const delay = (ms = 600) => new Promise((res) => setTimeout(res, ms));

// mutable state
let mockKeys = [...MOCK_API_KEYS];
let nextKeyId = 100;

function generateMockKey(): string {
  const chars = "abcdef0123456789";
  let key = "lim_";
  for (let i = 0; i < 32; i++) {
    key += chars[Math.floor(Math.random() * chars.length)];
  }
  return key;
}

function maskKey(key: string): string {
  return key.slice(0, 8) + "****..." + key.slice(-4);
}

export const mockApiKeys = {
  listApiKeys: async () => {
    await delay();
    return {
      data: mockKeys,
      statusCode: 200,
      success: true,
      message: "OK",
    };
  },

  createApiKey: async (data: { label: string; permissions: string[] }) => {
    await delay(800);
    const fullKey = generateMockKey();
    const id = `key_${++nextKeyId}`;
    const newKey = {
      id,
      label: data.label,
      key: maskKey(fullKey),
      permissions: data.permissions,
      createdAt: new Date().toISOString(),
      lastUsed: "",
    };
    mockKeys.push(newKey);
    return {
      data: { ...newKey, fullKey },
      statusCode: 200,
      success: true,
      message: "API key created",
    };
  },

  deleteApiKey: async (keyId: string) => {
    await delay(800);
    mockKeys = mockKeys.filter((k) => k.id !== keyId);
    return {
      data: { keyId, deleted: true },
      statusCode: 200,
      success: true,
      message: "API key deleted",
    };
  },
};
