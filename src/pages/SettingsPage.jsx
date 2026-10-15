import { useEffect, useState } from "react";
import {
  Sun,
  Moon,
  Check,
  ExternalLink,
  KeyRound,
  Sparkles,
  Palette,
  User,
  LogOut,
  RefreshCw,
  Upload,
  Download,
  ShieldCheck,
  AlertTriangle,
  Cloud,
  CloudOff,
  FlaskConical,
  Loader2,
} from "lucide-react";
import PageWrapper from "../components/PageWrapper";
import Card from "../components/ui/Card";
import { useLanguage } from "../context/languageContext";
import { useTheme } from "../context/themeContext";
import { useAuth } from "../context/authContext";
import { ACCENTS } from "../lib/accents";
import {
  PROVIDERS,
  getProvider,
  getModel,
  isFreeModel,
  providerFreeLabel,
  isCustomProvider,
} from "../lib/aiProviders";
import {
  loadAISettings,
  saveAISettings,
  mergeSyncedSettings,
  loadLogExpanded,
  saveLogExpanded,
  getActiveModel,
} from "../lib/aiSettings";
import { testApiKey } from "../lib/ai";
import {
  uploadSecrets,
  downloadSecrets,
  uploadPrefs,
  downloadPrefs,
  clearSyncSession,
} from "../lib/secureSync";
import { getPrefsTimestamp, markPrefsChanged } from "../lib/prefs";

const FreeTag = () => <span className="badge badge-success">FREE</span>;

const GoogleIcon = ({ className = "h-4 w-4" }) => (
  <svg className={className} viewBox="0 0 48 48" aria-hidden="true">
    <path
      fill="#EA4335"
      d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
    />
    <path
      fill="#4285F4"
      d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
    />
    <path
      fill="#FBBC05"
      d="M10.53 28.59A14.5 14.5 0 0 1 9.77 24c0-1.59.28-3.14.76-4.59l-7.98-6.19A23.94 23.94 0 0 0 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
    />
    <path
      fill="#34A853"
      d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.46-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
    />
  </svg>
);

const ToggleRow = ({ label, description, checked, onChange }) => (
  <label className="setting-row" data-checked={checked ? "true" : "false"}>
    <input
      type="checkbox"
      className="hidden"
      checked={checked}
      onChange={onChange}
    />
    <span className="checkbox" data-checked={checked ? "true" : "false"}>
      {checked && <Check className="h-3 w-3 text-white" />}
    </span>
    <span className="min-w-0 flex-1">
      <span className="block text-sm font-medium">{label}</span>
      {description && (
        <span className="block text-xs" style={{ color: "var(--text-muted)" }}>
          {description}
        </span>
      )}
    </span>
  </label>
);

const StatusNote = ({ status }) => {
  if (!status) return null;
  const color =
    status.kind === "ok"
      ? "var(--success)"
      : status.kind === "err"
        ? "var(--danger)"
        : "var(--text-muted)";
  const Icon =
    status.kind === "err" ? AlertTriangle : status.kind === "ok" ? Check : Cloud;
  return (
    <p className="flex items-center gap-1.5 text-xs" style={{ color }}>
      <Icon className="h-3.5 w-3.5" />
      {status.text}
    </p>
  );
};

// ── Account tab ─────────────────────────────────────────────────────────────

const collectSecrets = (settings) => ({
  provider: settings.provider,
  models: settings.models,
  customModels: settings.customModels,
  customBaseUrl: settings.customBaseUrl,
  apiKeys: settings.apiKeys,
});

const AccountTab = ({ aiSettings, onAISettingsChange }) => {
  const { t, language, changeLanguage } = useLanguage();
  const { theme, toggleTheme, accent, changeAccent } = useTheme();
  const { user, authLoading, authError, signIn, signOut, configured } =
    useAuth();

  const [passphrase, setPassphrase] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState(null);
  const [lastSync, setLastSync] = useState(null);

  const syncErrorText = (error) => {
    const code = error?.code || error?.message || "";
    if (code.includes("INCORRECT_PASSPHRASE"))
      return t("wrongPassphrase");
    if (code.includes("PASSPHRASE_REQUIRED")) return t("passphraseRequired");
    if (code.includes("permission-denied")) return t("syncPermissionDenied");
    return code || t("syncFailed");
  };

  const runSync = async (direction) => {
    if (!user) return;
    if (!passphrase) {
      setStatus({ kind: "err", text: t("passphraseRequired") });
      return;
    }
    setBusy(true);
    setStatus(null);
    try {
      if (direction === "download") {
        const result = await downloadSecrets(user.uid, passphrase);
        if (!result) {
          setStatus({ kind: "info", text: t("noSyncedSecrets") });
        } else {
          const next = mergeSyncedSettings(result.data, aiSettings);
          onAISettingsChange(next);
          setStatus({ kind: "ok", text: t("secretsDownloaded") });
          setLastSync(result.updatedAt);
        }
      } else if (direction === "upload") {
        await uploadSecrets(user.uid, collectSecrets(aiSettings), passphrase);
        setStatus({ kind: "ok", text: t("secretsUploaded") });
        setLastSync(Date.now());
      } else {
        const result = await downloadSecrets(user.uid, passphrase);
        if (result) {
          const next = mergeSyncedSettings(result.data, aiSettings);
          onAISettingsChange(next);
          setStatus({ kind: "ok", text: t("secretsSyncedFromCloud") });
          setLastSync(result.updatedAt);
        } else {
          await uploadSecrets(user.uid, collectSecrets(aiSettings), passphrase);
          setStatus({ kind: "ok", text: t("secretsBackupCreated") });
          setLastSync(Date.now());
        }
      }
    } catch (error) {
      setStatus({ kind: "err", text: syncErrorText(error) });
    } finally {
      setBusy(false);
    }
  };

  // Preferences (theme/accent/language) sync automatically when signed in
  useEffect(() => {
    if (!user) return;
    const id = setTimeout(() => {
      uploadPrefs(user.uid, { theme, accent, language }).catch(() => {});
    }, 700);
    return () => clearTimeout(id);
  }, [user, theme, accent, language]);

  // Pull preferences from the cloud once on sign-in. Last write wins: the
  // cloud copy is only applied when it is newer than the local one, so a
  // stale copy can never revert a choice the user just made.
  useEffect(() => {
    if (!user) return;
    let active = true;
    downloadPrefs(user.uid)
      .then((result) => {
        if (!active || !result) return;
        const cloudIsNewer =
          (result.updatedAt || 0) > getPrefsTimestamp() + 1000;
        if (!cloudIsNewer) {
          // Local state is newer (or equal): push it up instead
          uploadPrefs(user.uid, { theme, accent, language }).catch(() => {});
          return;
        }
        if (result.prefs.accent) changeAccent(result.prefs.accent);
        if (result.prefs.language) changeLanguage(result.prefs.language);
        if (result.prefs.theme && result.prefs.theme !== theme)
          toggleTheme();
        // Local state now matches the cloud copy
        markPrefsChanged();
      })
      .catch(() => {});
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleSignOut = async () => {
    clearSyncSession();
    setPassphrase("");
    setStatus(null);
    setLastSync(null);
    await signOut();
  };

  if (!configured) {
    return (
      <Card className="max-w-xl p-5">
        <div className="flex items-start gap-3">
          <CloudOff
            className="mt-0.5 h-4 w-4 flex-shrink-0"
            style={{ color: "var(--text-faint)" }}
          />
          <div>
            <h2 className="text-sm font-semibold">{t("syncNotConfigured")}</h2>
            <p
              className="mt-1 text-xs"
              style={{ color: "var(--text-muted)" }}
            >
              {t("syncNotConfiguredDesc")}
            </p>
          </div>
        </div>
      </Card>
    );
  }

  if (authLoading) {
    return (
      <Card className="max-w-xl p-5">
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          {t("loading")}
        </p>
      </Card>
    );
  }

  if (!user) {
    return (
      <div className="max-w-xl space-y-4">
        <Card className="p-5">
          <h2 className="text-sm font-semibold">{t("account")}</h2>
          <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
            {t("accountSignInDesc")}
          </p>
          <button onClick={signIn} className="btn btn-primary mt-4">
            <GoogleIcon />
            {t("signInWithGoogle")}
          </button>
          {authError && (
            <p
              className="mt-3 flex items-center gap-1.5 text-xs"
              style={{ color: "var(--danger)" }}
            >
              <AlertTriangle className="h-3.5 w-3.5" />
              {authError}
            </p>
          )}
        </Card>

        <Card className="p-5">
          <div className="flex items-start gap-3">
            <ShieldCheck
              className="mt-0.5 h-4 w-4 flex-shrink-0"
              style={{ color: "var(--success)" }}
            />
            <div>
              <h2 className="text-sm font-semibold">{t("howSyncIsSecured")}</h2>
              <ul
                className="mt-2 space-y-1.5 text-xs"
                style={{ color: "var(--text-muted)" }}
              >
                <li>• {t("securityPoint1")}</li>
                <li>• {t("securityPoint2")}</li>
                <li>• {t("securityPoint3")}</li>
                <li>• {t("securityPoint4")}</li>
              </ul>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-xl space-y-4">
      {/* Profile */}
      <Card className="p-5">
        <div className="flex items-center gap-3">
          <span
            className="flex h-11 w-11 flex-shrink-0 items-center justify-center overflow-hidden border"
            style={{ borderColor: "var(--border-strong)" }}
          >
            {user.photoURL ? (
              <img
                src={user.photoURL}
                alt=""
                className="h-full w-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <User className="h-5 w-5" style={{ color: "var(--text-muted)" }} />
            )}
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-sm font-semibold">
              {user.displayName || t("account")}
            </h2>
            <p
              className="truncate text-xs"
              style={{ color: "var(--text-muted)" }}
            >
              {user.email}
            </p>
          </div>
          <button onClick={handleSignOut} className="btn btn-ghost btn-sm">
            <LogOut className="h-3.5 w-3.5" />
            {t("signOut")}
          </button>
        </div>
      </Card>

      {/* Preferences sync */}
      <Card className="p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">{t("preferencesSync")}</h2>
          <span className="badge badge-success">
            <Check className="h-3 w-3" />
            {t("autoSyncOn")}
          </span>
        </div>
        <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
          {t("preferencesSyncDesc")}
        </p>
      </Card>

      {/* Encrypted secrets sync */}
      <Card className="space-y-4 p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">{t("apiKeySync")}</h2>
          <span className="badge">
            <ShieldCheck className="h-3 w-3" />
            {t("encrypted")}
          </span>
        </div>
        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
          {t("apiKeySyncDesc")}
        </p>

        <div>
          <label className="label">{t("syncPassphrase")}</label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <KeyRound
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
                style={{ color: "var(--text-faint)" }}
              />
              <input
                type="password"
                className="input pl-9!"
                value={passphrase}
                onChange={(e) => setPassphrase(e.target.value)}
                placeholder={t("syncPassphrasePlaceholder")}
              />
            </div>
          </div>
          <p className="mt-2 text-xs" style={{ color: "var(--text-faint)" }}>
            {t("syncPassphraseHint")}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            disabled={busy}
            onClick={() => runSync("sync")}
            className="btn btn-primary btn-sm"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            {t("syncNow")}
          </button>
          <button
            disabled={busy}
            onClick={() => runSync("upload")}
            className="btn btn-secondary btn-sm"
          >
            <Upload className="h-3.5 w-3.5" />
            {t("uploadToCloud")}
          </button>
          <button
            disabled={busy}
            onClick={() => runSync("download")}
            className="btn btn-secondary btn-sm"
          >
            <Download className="h-3.5 w-3.5" />
            {t("downloadFromCloud")}
          </button>
        </div>

        <StatusNote status={status} />

        {lastSync && (
          <p className="text-xs" style={{ color: "var(--text-faint)" }}>
            {t("lastSynced")}: {new Date(lastSync).toLocaleString()}
          </p>
        )}
      </Card>
    </div>
  );
};

// ── Settings page ───────────────────────────────────────────────────────────

const SettingsPage = ({ initialTab = "ai", onTabChange, aiUsage = null, onUsage }) => {
  const { t, language } = useLanguage();
  const {
    theme,
    toggleTheme,
    accent,
    changeAccent,
    ambientAnimation,
    toggleAmbientAnimation,
  } = useTheme();
  const [tab, setTab] = useState(initialTab);
  const [settings, setSettings] = useState(loadAISettings);
  const [logExpanded, setLogExpanded] = useState(loadLogExpanded);
  const [keyTesting, setKeyTesting] = useState(false);
  const [keyTestResult, setKeyTestResult] = useState(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [savedAt, setSavedAt] = useState(0);

  const provider = getProvider(settings.provider);
  const model = getModel(settings.provider, getActiveModel(settings));
  const apiKey = settings.apiKeys[provider.id] || "";
  const customModel = settings.customModels?.[provider.id] || "";
  const customBaseUrl = settings.customBaseUrl || "";
  const isCustom = isCustomProvider(provider.id);

  const selectTab = (next) => {
    setTab(next);
    onTabChange?.(next);
  };

  const flashSaved = () => {
    setSavedAt(Date.now());
    setTimeout(() => setSavedAt(0), 1600);
  };

  const updateSettings = (patch) => {
    const next = { ...settings, ...patch };
    setSettings(next);
    saveAISettings(next);
    flashSaved();
  };

  const selectProvider = (providerId) => updateSettings({ provider: providerId });

  const selectModel = (modelId) =>
    updateSettings({ models: { ...settings.models, [provider.id]: modelId } });

  const setCustomModel = (modelId) => {
    updateSettings({
      customModels: { ...settings.customModels, [provider.id]: modelId },
    });
    setKeyTestResult(null);
  };

  const setCustomBaseUrl = (url) => {
    updateSettings({ customBaseUrl: url });
    setKeyTestResult(null);
  };

  const setApiKey = (key) => {
    updateSettings({ apiKeys: { ...settings.apiKeys, [provider.id]: key } });
    setKeyTestResult(null);
  };

  const handleTestKey = async () => {
    setKeyTesting(true);
    setKeyTestResult(null);
    try {
      await testApiKey({
        providerId: provider.id,
        model: getActiveModel(settings),
        apiKey,
        baseUrl: isCustom ? customBaseUrl : null,
        onUsage,
      });
      setKeyTestResult({ ok: true });
    } catch (error) {
      const code = error?.message || String(error);
      const text =
        code === "MISSING_KEY"
          ? t("enterApiKeyFirst")
          : code === "MISSING_MODEL"
            ? t("enterModelFirst")
            : code === "CUSTOM_BASE_URL_REQUIRED"
              ? t("customBaseUrlRequired")
              : code === "EMPTY_RESPONSE"
                ? t("testEmptyResponse")
                : code;
      setKeyTestResult({ ok: false, text });
    } finally {
      setKeyTesting(false);
    }
  };

  const replaceAISettings = (next) => {
    setSettings(next);
    saveAISettings(next);
    flashSaved();
  };

  return (
    <PageWrapper>
      <div className="mb-8 max-w-xl">
        <h1 className="text-2xl font-semibold tracking-tight">
          {t("settings")}
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
          {t("settingsDescription")}
        </p>
      </div>

      {/* Tabs */}
      <div
        className="mb-6 inline-flex border p-0.5"
        style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}
      >
        <button
          onClick={() => selectTab("ai")}
          className={`btn btn-sm ${tab === "ai" ? "btn-primary" : "btn-ghost"}`}
        >
          <Sparkles className="h-3.5 w-3.5" />
          {t("aiTab")}
        </button>
        <button
          onClick={() => selectTab("appearance")}
          className={`btn btn-sm ${tab === "appearance" ? "btn-primary" : "btn-ghost"}`}
        >
          <Palette className="h-3.5 w-3.5" />
          {t("appearanceTab")}
        </button>
        <button
          onClick={() => selectTab("account")}
          className={`btn btn-sm ${tab === "account" ? "btn-primary" : "btn-ghost"}`}
        >
          <User className="h-3.5 w-3.5" />
          {t("account")}
        </button>
      </div>

      {tab === "ai" && (
        <div className="max-w-xl space-y-4">
          {/* Active configuration */}
          <Card className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold">{provider.name}</h2>
                <p
                  className="mt-0.5 text-xs"
                  style={{ color: "var(--text-muted)" }}
                >
                  {model.name}
                </p>
              </div>
              <div className="flex flex-shrink-0 items-center gap-2">
                {isFreeModel(provider.id, model.id) && <FreeTag />}
                <span
                  className={`badge ${apiKey ? "badge-success" : "badge-danger"}`}
                >
                  {apiKey ? t("configured") : t("noApiKey")}
                </span>
              </div>
            </div>
            {aiUsage && (
              <p
                className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 border-t pt-3 text-xs"
                style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}
              >
                <span className="font-semibold">{t("usageLeft")}:</span>
                {aiUsage.requests !== null && (
                  <span>
                    {aiUsage.requests} {t("usageRequests")}
                  </span>
                )}
                {aiUsage.tokens !== null && (
                  <span>
                    {aiUsage.tokens} {t("usageTokens")}
                  </span>
                )}
                {aiUsage.requests === null && aiUsage.tokens === null && (
                  <span>{t("usageUnavailable")}</span>
                )}
              </p>
            )}
          </Card>

          {/* Advanced options */}
          <ToggleRow
            label={t("showAdvancedOptions")}
            description={t("showAdvancedOptionsDesc")}
            checked={showAdvanced}
            onChange={(e) => setShowAdvanced(e.target.checked)}
          />

          <ToggleRow
            label={t("aiLogSettings")}
            description={t("aiLogSettingsDesc")}
            checked={logExpanded}
            onChange={(e) => {
              const next = e.target.checked;
              setLogExpanded(next);
              saveLogExpanded(next);
              flashSaved();
            }}
          />

          {showAdvanced && (
            <Card className="space-y-5 p-5">
              <div>
                <label className="label">{t("provider")}</label>
                <select
                  className="input"
                  value={provider.id}
                  onChange={(e) => selectProvider(e.target.value)}
                >
                  {PROVIDERS.map((p) => {
                    const freeLabel = providerFreeLabel(p.id, language);
                    return (
                      <option key={p.id} value={p.id}>
                        {freeLabel ? `${p.name} — ${freeLabel}` : p.name}
                      </option>
                    );
                  })}
                </select>
              </div>

              {isCustom && (
                <div>
                  <label className="label">{t("customBaseUrl")}</label>
                  <input
                    type="url"
                    className="input"
                    value={customBaseUrl}
                    onChange={(e) => setCustomBaseUrl(e.target.value)}
                    placeholder="https://api.example.com/v1"
                  />
                  <p
                    className="mt-2 text-xs"
                    style={{ color: "var(--text-faint)" }}
                  >
                    {t("customBaseUrlHint")}
                  </p>
                </div>
              )}

              <div>
                <label className="label">{t("model")}</label>
                {provider.models.length > 0 && (
                  <select
                    className="input"
                    value={model.id}
                    onChange={(e) => selectModel(e.target.value)}
                  >
                    {provider.models.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.free ? `${m.name} — ${t("free")}` : m.name}
                      </option>
                    ))}
                  </select>
                )}
                <input
                  type="text"
                  className="input mt-2"
                  value={customModel}
                  onChange={(e) => setCustomModel(e.target.value)}
                  placeholder={t("customModelPlaceholder")}
                />
                <p
                  className="mt-2 text-xs"
                  style={{ color: "var(--text-faint)" }}
                >
                  {customModel.trim()
                    ? t("usingCustomModel", { model: customModel.trim() })
                    : t("customModelHint")}
                </p>
              </div>

              <div>
                <label className="label">{t("apiKey")}</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <KeyRound
                      className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
                      style={{ color: "var(--text-faint)" }}
                    />
                    <input
                      type="password"
                      className="input pl-9!"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder={`${provider.name} API key`}
                    />
                  </div>
                  {provider.docsUrl && (
                    <a
                      href={provider.docsUrl}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="btn btn-secondary btn-sm"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      {t("getApiKey")}
                    </a>
                  )}
                  <button
                    onClick={handleTestKey}
                    disabled={keyTesting || !apiKey || (isCustom && !customBaseUrl.trim())}
                    className="btn btn-secondary btn-sm"
                    title={t("testApiKey")}
                  >
                    {keyTesting ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <FlaskConical className="h-3.5 w-3.5" />
                    )}
                    {t("testApiKey")}
                  </button>
                </div>
                <p
                  className="mt-2 text-xs"
                  style={{ color: "var(--text-faint)" }}
                >
                  {t("apiKeyStoredLocally")}
                </p>
                {keyTestResult && (
                  <p
                    className="mt-1.5 flex items-center gap-1.5 text-xs"
                    style={{
                      color: keyTestResult.ok
                        ? "var(--success)"
                        : "var(--danger)",
                    }}
                  >
                    {keyTestResult.ok ? (
                      <>
                        <Check className="h-3.5 w-3.5" />
                        {t("testKeySuccess")}
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="h-3.5 w-3.5" />
                        {keyTestResult.text}
                      </>
                    )}
                  </p>
                )}
              </div>

              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                {t("providerKeysNote")}
              </p>
            </Card>
          )}
        </div>
      )}

      {tab === "appearance" && (
        <div className="max-w-xl space-y-4">
          <Card className="space-y-5 p-5">
            <div>
              <label className="label">{t("theme")}</label>
              <div
                className="inline-flex border p-0.5"
                style={{
                  borderColor: "var(--border)",
                  background: "var(--surface-2)",
                }}
              >
                <button
                  onClick={() => theme !== "light" && toggleTheme()}
                  className={`btn btn-sm ${theme === "light" ? "btn-primary" : "btn-ghost"}`}
                >
                  <Sun className="h-3.5 w-3.5" />
                  {t("light")}
                </button>
                <button
                  onClick={() => theme !== "dark" && toggleTheme()}
                  className={`btn btn-sm ${theme === "dark" ? "btn-primary" : "btn-ghost"}`}
                >
                  <Moon className="h-3.5 w-3.5" />
                  {t("dark")}
                </button>
              </div>
            </div>

            <div>
              <label className="label">{t("accentColor")}</label>
              <div className="flex flex-wrap gap-2">
                {ACCENTS.map((option) => {
                  const selected = accent === option.id;
                  const swatch =
                    theme === "dark" ? option.dark[0] : option.light[0];
                  return (
                    <button
                      key={option.id}
                      onClick={() => changeAccent(option.id)}
                      title={language === "vi" ? option.vi : option.en}
                      aria-label={language === "vi" ? option.vi : option.en}
                      aria-pressed={selected}
                      className="flex h-9 w-9 items-center justify-center border"
                      style={{
                        background: swatch,
                        borderColor: selected ? "var(--text)" : "var(--border)",
                        outline: selected ? `2px solid ${swatch}` : "none",
                        outlineOffset: "2px",
                      }}
                    >
                      {selected && <Check className="h-4 w-4 text-white" />}
                    </button>
                  );
                })}
              </div>
            </div>

            <ToggleRow
              label={t("backgroundAnimation")}
              description={t("backgroundAnimationDesc")}
              checked={ambientAnimation}
              onChange={toggleAmbientAnimation}
            />
          </Card>
        </div>
      )}

      {tab === "account" && (
        <AccountTab
          aiSettings={settings}
          onAISettingsChange={replaceAISettings}
        />
      )}

      {savedAt > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2">
          <span className="badge badge-success">
            <Check className="h-3 w-3" />
            {t("saved")}
          </span>
        </div>
      )}
    </PageWrapper>
  );
};

export default SettingsPage;
