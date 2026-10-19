import { Moon, Sun, Globe, Volume2, VolumeX, Settings, User, Monitor } from "lucide-react";
import { useTheme } from "../context/themeContext";
import { useLanguage } from "../context/languageContext";
import { useSound } from "../context/soundContext";
import { useAppUI } from "../context/appUI";
import { useAuth } from "../context/authContext";

const Header = () => {
  const { themeId, dark, toggleThemeId, toggleDark } = useTheme();
  const { language, toggleLanguage } = useLanguage();
  const { soundEnabled, toggleSound } = useSound();
  const { currentPage, setCurrentPage, openSettings } = useAppUI();
  const { user } = useAuth();

  return (
    <header
      className="sticky top-0 z-50 border-b"
      style={{
        background: "color-mix(in srgb, var(--bg) 85%, transparent)",
        borderColor: "var(--border)",
        backdropFilter: "blur(8px)",
      }}
    >
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 sm:px-6">
        <button
          onClick={() => setCurrentPage("home")}
          className="flex flex-shrink-0 items-center"
        >
          <span className="text-[15px] font-semibold tracking-tight">
            F*ck<span style={{ color: "var(--accent)" }}>Azota</span>
          </span>
        </button>

        <div className="flex items-center gap-1">
          <button
            onClick={toggleLanguage}
            className="btn btn-ghost btn-sm gap-1.5"
            title={language === "vi" ? "Switch to English" : "Chuyển sang Tiếng Việt"}
          >
            <Globe className="h-4 w-4" />
            <span className="hidden text-xs font-semibold uppercase sm:block">
              {language}
            </span>
          </button>
          <button
            onClick={toggleSound}
            className="icon-btn"
            data-active={soundEnabled ? "true" : "false"}
            title={soundEnabled ? "Sound on" : "Sound off"}
          >
            {soundEnabled ? (
              <Volume2 className="h-4 w-4" />
            ) : (
              <VolumeX className="h-4 w-4" />
            )}
          </button>
          <button
            onClick={() =>
              setCurrentPage(currentPage === "settings" ? "home" : "settings")
            }
            className="icon-btn"
            data-active={currentPage === "settings" ? "true" : "false"}
            title="Settings"
          >
            <Settings className="h-4 w-4" />
          </button>
          {user && (
            <button
              onClick={() => openSettings("account")}
              className="ml-1 flex h-8 w-8 flex-shrink-0 items-center justify-center overflow-hidden border"
              style={{ borderColor: "var(--border-strong)" }}
              title={user.email || "Account"}
            >
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt=""
                  className="h-full w-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <User
                  className="h-4 w-4"
                  style={{ color: "var(--text-muted)" }}
                />
              )}
            </button>
          )}
          <button
            onClick={() => {
              if (themeId === "slate") toggleDark();
              else toggleThemeId();
            }}
            className="icon-btn"
            title={
              themeId === "slate"
                ? (dark ? "Dark mode" : "Light mode")
                : themeId === "xp"
                  ? "Switch to Slate"
                  : "Switch to Windows XP"
            }
          >
            {themeId === "xp" ? (
              <Monitor className="h-4 w-4" />
            ) : dark ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
