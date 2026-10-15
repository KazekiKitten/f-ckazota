const TIMESTAMP_KEY = "azota-prefs-at";

// Local clock for appearance preferences (theme/accent/language). Cloud sync
// compares it against the server timestamp so a stale cloud copy can never
// overwrite a newer local choice (last-write-wins).
export const markPrefsChanged = () => {
  try {
    localStorage.setItem(TIMESTAMP_KEY, String(Date.now()));
  } catch {
    // storage unavailable (private mode): sync simply stays disabled
  }
};

export const getPrefsTimestamp = () => {
  const value = Number(localStorage.getItem(TIMESTAMP_KEY));
  return Number.isFinite(value) ? value : 0;
};
