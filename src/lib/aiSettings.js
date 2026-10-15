import { PROVIDERS, getProvider } from "./aiProviders";

const STORAGE_KEY = "azota-ai-settings";
const LEGACY_GEMINI_KEY = "azota-gemini-api-key";
const LOG_EXPANDED_KEY = "azota-ai-log-expanded";

// Kept under its own key so it can be read without parsing the settings blob
export const loadLogExpanded = () =>
  localStorage.getItem(LOG_EXPANDED_KEY) === "true";

export const saveLogExpanded = (value) => {
  localStorage.setItem(LOG_EXPANDED_KEY, String(value === true));
};

const defaultSettings = () => ({
  provider: "gemini",
  models: Object.fromEntries(
    PROVIDERS.map((provider) => [provider.id, provider.models[0]?.id || ""]),
  ),
  // Free-form model ids that override the preset list, keyed per provider
  customModels: {},
  // Base URL for the custom provider (OpenAI-compatible)
  customBaseUrl: "",
  // Extra instructions appended to the extraction prompt
  extraRequest: "",
  apiKeys: {},
});

export const loadAISettings = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    const settings = saved
      ? { ...defaultSettings(), ...JSON.parse(saved) }
      : defaultSettings();
    // Migrate the legacy single Gemini key into the per-provider map
    const legacyKey = localStorage.getItem(LEGACY_GEMINI_KEY);
    if (legacyKey && !settings.apiKeys.gemini) {
      settings.apiKeys.gemini = legacyKey;
    }
    return settings;
  } catch {
    return defaultSettings();
  }
};

export const saveAISettings = (settings) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
};

export const loadExtraRequest = () => {
  try {
    const settings = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    return typeof settings.extraRequest === "string" ? settings.extraRequest : "";
  } catch {
    return "";
  }
};

export const saveExtraRequest = (value) => {
  try {
    const settings = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    settings.extraRequest = typeof value === "string" ? value : "";
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // storage unavailable: the request simply won't persist
  }
};

export const getActiveApiKey = (settings) =>
  settings.apiKeys[settings.provider] || "";

export const getActiveModel = (settings) => {
  const provider = getProvider(settings.provider);
  const custom = settings.customModels?.[provider.id];
  if (typeof custom === "string" && custom.trim()) return custom.trim();
  return settings.models?.[provider.id] || provider.models[0]?.id || "";
};

export const getCustomBaseUrl = (settings) => {
  const url = settings.customBaseUrl;
  if (typeof url !== "string" || !/^https?:\/\//.test(url.trim())) return "";
  return url.trim().replace(/\/+$/, "");
};

/**
 * Merges a decrypted cloud copy into local AI settings, keeping only known
 * providers/models and string API keys. Unknown or malformed values from the
 * cloud payload are dropped instead of trusted.
 */
export const mergeSyncedSettings = (data, current) => {
  const providerIds = new Set(PROVIDERS.map((p) => p.id));
  const provider =
    typeof data?.provider === "string" && providerIds.has(data.provider)
      ? data.provider
      : current.provider;

  const models = { ...current.models };
  const apiKeys = { ...current.apiKeys };

  PROVIDERS.forEach((p) => {
    if (!models[p.id]) models[p.id] = p.models[0]?.id || "";
  });

  Object.entries(data?.models || {}).forEach(([providerId, modelId]) => {
    if (!providerIds.has(providerId)) return;
    const known = getProvider(providerId);
    if (known.models.some((m) => m.id === modelId)) {
      models[providerId] = modelId;
    }
  });

  Object.entries(data?.apiKeys || {}).forEach(([providerId, key]) => {
    if (providerIds.has(providerId) && typeof key === "string" && key) {
      apiKeys[providerId] = key;
    }
  });

  // Custom model ids and a custom base URL are free-form, so only accept
  // non-empty strings (and an http(s) base URL).
  const customModels = { ...current.customModels };
  Object.entries(data?.customModels || {}).forEach(([providerId, modelId]) => {
    if (providerIds.has(providerId) && typeof modelId === "string" && modelId.trim()) {
      customModels[providerId] = modelId.trim();
    }
  });

  const customBaseUrl =
    typeof data?.customBaseUrl === "string" &&
    /^https?:\/\//.test(data.customBaseUrl.trim())
      ? data.customBaseUrl.trim().replace(/\/+$/, "")
      : current.customBaseUrl;

  return { provider, models, apiKeys, customModels, customBaseUrl };
};
