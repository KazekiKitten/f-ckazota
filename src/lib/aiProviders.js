export const CUSTOM_PROVIDER_ID = "custom";

export const PROVIDERS = [
  {
    id: "gemini",
    name: "Google Gemini",
    docsUrl: "https://aistudio.google.com/apikey",
    keyPrefix: "AIza",
    models: [
      { id: "gemini-2.5-flash", name: "Gemini 2.5 Flash" },
      { id: "gemini-2.0-flash", name: "Gemini 2.0 Flash" },
    ],
  },
  {
    id: "openai",
    name: "ChatGPT (OpenAI)",
    docsUrl: "https://platform.openai.com/api-keys",
    keyPrefix: "sk-",
    models: [
      { id: "gpt-4o-mini", name: "GPT-4o mini" },
      { id: "gpt-4o", name: "GPT-4o" },
      { id: "gpt-4.1-mini", name: "GPT-4.1 mini" },
      { id: "gpt-4.1", name: "GPT-4.1" },
      { id: "o4-mini", name: "o4-mini" },
    ],
  },
  {
    id: "openrouter",
    name: "OpenRouter",
    docsUrl: "https://openrouter.ai/keys",
    keyPrefix: "sk-or-",
    models: [
      { id: "deepseek/deepseek-chat-v3-0324:free", name: "DeepSeek V3", free: true },
      { id: "meta-llama/llama-3.3-70b-instruct:free", name: "Llama 3.3 70B", free: true },
      { id: "qwen/qwen-2.5-72b-instruct:free", name: "Qwen 2.5 72B", free: true },
      { id: "google/gemma-3-27b-it:free", name: "Gemma 3 27B", free: true },
      { id: "mistralai/mistral-small-3.2-24b-instruct:free", name: "Mistral Small 3.2", free: true },
      { id: "openai/gpt-4o-mini", name: "GPT-4o mini" },
      { id: "google/gemini-2.5-flash-preview", name: "Gemini 2.5 Flash" },
    ],
  },
  {
    id: "groq",
    name: "Groq",
    docsUrl: "https://console.groq.com/keys",
    keyPrefix: "gsk_",
    models: [
      { id: "llama-3.3-70b-versatile", name: "Llama 3.3 70B", free: true },
      { id: "llama-3.1-8b-instant", name: "Llama 3.1 8B", free: true },
      { id: "gemma2-9b-it", name: "Gemma2 9B", free: true },
      { id: "deepseek-r1-distill-llama-70b", name: "DeepSeek R1 Distill 70B", free: true },
      { id: "qwen-2.5-32b", name: "Qwen 2.5 32B", free: true },
    ],
  },
  {
    id: "nvidia",
    name: "NVIDIA NIM",
    docsUrl: "https://build.nvidia.com/",
    keyPrefix: "nvapi-",
    models: [
      { id: "meta/llama-3.3-70b-instruct", name: "Llama 3.3 70B", free: true },
      { id: "meta/llama-3.1-405b-instruct", name: "Llama 3.1 405B", free: true },
      { id: "mistralai/mistral-nemo-12b-instruct", name: "Mistral Nemo 12B", free: true },
      { id: "qwen/qwen2.5-coder-32b-instruct", name: "Qwen 2.5 Coder 32B", free: true },
      { id: "nvidia/nemotron-4-340b-instruct", name: "Nemotron 4 340B", free: true },
    ],
  },
  {
    // OpenAI-compatible endpoint you configure yourself
    id: CUSTOM_PROVIDER_ID,
    name: "Custom provider",
    docsUrl: null,
    keyPrefix: "",
    models: [],
  },
];

const PROVIDER_BY_ID = Object.fromEntries(
  PROVIDERS.map((provider) => [provider.id, provider]),
);

export const getProvider = (id) => PROVIDER_BY_ID[id] || PROVIDERS[0];

// Unknown/custom model ids resolve to a pass-through descriptor so callers
// can display and use them without assuming a preset entry exists.
export const getModel = (providerId, modelId) => {
  const provider = getProvider(providerId);
  return (
    provider.models.find((m) => m.id === modelId) || {
      id: modelId || "",
      name: modelId || "",
      custom: true,
      free: false,
    }
  );
};

export const isCustomProvider = (providerId) =>
  providerId === CUSTOM_PROVIDER_ID;

export const isFreeModel = (providerId, modelId) =>
  Boolean(getModel(providerId, modelId).free);

export const providerHasFreeModels = (providerId) =>
  getProvider(providerId).models.some((m) => m.free);

export const providerFreeLabel = (providerId, language) => {
  const hasFree = providerHasFreeModels(providerId);
  if (!hasFree) return null;
  const onlyFree = getProvider(providerId).models.every((m) => m.free);
  return language === "vi"
    ? onlyFree
      ? "Miễn phí"
      : "Có model miễn phí"
    : onlyFree
      ? "Free"
      : "Has free models";
};
