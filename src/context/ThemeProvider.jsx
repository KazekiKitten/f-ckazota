import { useEffect, useState } from "react";
import ThemeContext from "./themeContext";
import { ACCENT_IDS, getAccent } from "../lib/accents";
import { markPrefsChanged } from "../lib/prefs";

const applyAccent = (accentId, theme) => {
  const accent = getAccent(accentId);
  const [main, hover] = theme === "dark" ? accent.dark : accent.light;
  const root = document.documentElement;
  root.style.setProperty("--accent", main);
  root.style.setProperty("--accent-hover", hover);
};

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

export const ThemeProvider = ({ children }) => {
  const [themeId, setThemeId] = useState(() => {
    const saved = localStorage.getItem("azota-theme-id");
    if (saved && ["slate", "xp"].includes(saved)) {
      document.documentElement.classList.toggle("xp", saved === "xp");
      return saved;
    }
    return "slate";
  });

  const [dark, setDark] = useState(() => {
    const saved = localStorage.getItem("azota-theme");
    if (saved && ["light", "dark"].includes(saved)) {
      document.documentElement.classList.toggle("dark", saved === "dark");
      return saved === "dark";
    }
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    document.documentElement.classList.toggle("dark", prefersDark);
    return prefersDark;
  });

  const [accent, setAccent] = useState(() => {
    const saved = localStorage.getItem("azota-accent");
    return saved && ACCENT_IDS.includes(saved) ? saved : "red";
  });

  const [ambientAnimation, setAmbientAnimation] = useState(() => {
    const saved = localStorage.getItem("azota-ambient");
    return saved !== null ? saved === "true" : !prefersReducedMotion();
  });

  const toggleThemeId = () => {
    const next = themeId === "slate" ? "xp" : "slate";
    setThemeId(next);
    markPrefsChanged();
  };

  const toggleDark = () => {
    setDark(!dark);
    markPrefsChanged();
  };

  const changeAccent = (accentId) => {
    if (!ACCENT_IDS.includes(accentId)) return;
    setAccent(accentId);
    markPrefsChanged();
  };

  useEffect(() => {
    document.documentElement.classList.toggle("xp", themeId === "xp");
    if (themeId === "slate") {
      document.documentElement.classList.toggle("dark", dark);
    } else {
      document.documentElement.classList.remove("dark");
    }
    if (themeId === "slate") {
      applyAccent(accent, dark ? "dark" : "light");
    }
    localStorage.setItem("azota-theme-id", themeId);
    localStorage.setItem("azota-theme", dark ? "dark" : "light");
    localStorage.setItem("azota-accent", accent);
  }, [themeId, dark, accent]);

  const toggleAmbientAnimation = () => {
    setAmbientAnimation((prev) => {
      const next = !prev;
      localStorage.setItem("azota-ambient", String(next));
      markPrefsChanged();
      return next;
    });
  };

  return (
    <ThemeContext.Provider
      value={{
        themeId,
        dark,
        toggleThemeId,
        toggleDark,
        accent,
        changeAccent,
        ambientAnimation,
        toggleAmbientAnimation,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};
