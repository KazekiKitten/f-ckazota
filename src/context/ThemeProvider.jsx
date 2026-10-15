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
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem("azota-theme");
    if (saved && ["light", "dark"].includes(saved)) {
      document.documentElement.classList.toggle("dark", saved === "dark");
      return saved;
    } else {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      document.documentElement.classList.toggle("dark", prefersDark);
      return prefersDark ? "dark" : "light";
    }
  });

  const [accent, setAccent] = useState(() => {
    const saved = localStorage.getItem("azota-accent");
    return saved && ACCENT_IDS.includes(saved) ? saved : "red";
  });

  // Off by default when the OS asks for reduced motion
  const [ambientAnimation, setAmbientAnimation] = useState(() => {
    const saved = localStorage.getItem("azota-ambient");
    return saved !== null ? saved === "true" : !prefersReducedMotion();
  });

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    markPrefsChanged();
  };

  const changeAccent = (accentId) => {
    if (!ACCENT_IDS.includes(accentId)) return;
    setAccent(accentId);
    markPrefsChanged();
  };

  // Single source of truth: any theme/accent state change is applied to the
  // document and persisted here, so every code path saves correctly.
  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    applyAccent(accent, theme);
    localStorage.setItem("azota-theme", theme);
    localStorage.setItem("azota-accent", accent);
  }, [theme, accent]);

  const toggleAmbientAnimation = () => {
    setAmbientAnimation((prev) => {
      const next = !prev;
      localStorage.setItem("azota-ambient", String(next));
      return next;
    });
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        toggleTheme,
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
