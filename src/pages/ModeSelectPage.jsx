import { useEffect, useRef, useState } from "react";
import { Zap, Edit3, Brain, Check, ChevronLeft, ChevronDown, Terminal, Sparkles } from "lucide-react";
import PageWrapper from "../components/PageWrapper";
import Card from "../components/ui/Card";
import Modal from "../components/ui/Modal";
import { loadExtraRequest, saveExtraRequest } from "../lib/aiSettings";
import Button from "../components/ui/Button";
import { useLanguage } from "../context/languageContext";
import { useSound } from "../context/soundContext";

const OPTION_ICONS = {
  autoDetect: Zap,
  manualCrop: Edit3,
  aiExtract: Brain,
};

const OPTION_LABEL_KEYS = {
  autoDetect: ["autoDetect", "autoDetectDesc"],
  manualCrop: ["manualCrop", "manualCropDesc"],
  aiExtract: ["aiExtract", "aiExtractDesc"],
};

const OPTION_BULLETS = {
  pdf: {
    autoDetect: ["Nhanh & tự động", "Tốt nhất cho đề giãn cách đều"],
    manualCrop: ["Chuẩn xác 100%", "Kiểm soát hoàn toàn"],
    aiExtract: ["Trích xuất thông minh", "Trích xuất đáp án"],
  },
  image: {
    manualCrop: (language) =>
      language === "vi"
        ? ["Chuẩn xác 100%", "Kiểm soát hoàn toàn"]
        : ["100% accurate", "Full control"],
    aiExtract: (language) =>
      language === "vi"
        ? ["Trích xuất thông minh", "Trích xuất đáp án"]
        : ["Smart extraction", "Extract answers"],
  },
};

const MODE_OPTIONS = {
  pdf: ["autoDetect", "manualCrop", "aiExtract"],
  image: ["manualCrop", "aiExtract"],
};

// Collapsible log of what the model returns during extraction. Collapsed by
// default unless the "always show" preference is enabled in Settings. The
// box unmounts when a run resets the logs, so each run re-reads the setting.
const AILogBox = ({ logs, alwaysVisible, processing }) => {
  const { t } = useLanguage();
  const [expanded, setExpanded] = useState(Boolean(alwaysVisible));
  const logRef = useRef(null);

  useEffect(() => {
    if (!expanded || !logRef.current) return;
    logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [logs.length, expanded]);

  if (logs.length === 0) return null;

  return (
    <div
      className="mt-4 border-t"
      style={{ borderColor: "var(--border)" }}
    >
      <button
        onClick={() => setExpanded((prev) => !prev)}
        aria-expanded={expanded}
        className="flex w-full items-center gap-1.5 py-1.5 text-[11px]"
      >
        <Terminal className="h-3 w-3" style={{ color: "var(--text-faint)" }} />
        <span className="font-medium" style={{ color: "var(--text-faint)" }}>
          {t("aiLog")} ({logs.length})
        </span>
        {processing && (
          <span
            className="ml-1 h-1.5 w-1.5 animate-pulse"
            style={{ background: "var(--accent)" }}
            title={t("live")}
          />
        )}
        <ChevronDown
          className="ml-auto h-3 w-3 transition-transform"
          style={{
            color: "var(--text-faint)",
            transform: expanded ? "rotate(180deg)" : "none",
          }}
        />
      </button>

      {expanded && (
        <div
          ref={logRef}
          className="max-h-56 space-y-1.5 overflow-y-auto border-t py-2 font-mono text-[11px] leading-relaxed"
          style={{ borderColor: "var(--border)" }}
        >
          {logs.map((entry, index) => {
            if (entry.kind === "request") {
              return (
                <p key={index} style={{ color: "var(--text-faint)" }}>
                  → {t("page")} {entry.page}/{entry.total} · {entry.text}
                </p>
              );
            }
            if (entry.kind === "result") {
              return (
                <p key={index} className="font-medium" style={{ color: "var(--success)" }}>
                  ✓ {t("aiLogParsed", { count: entry.text })}
                </p>
              );
            }
            if (entry.kind === "error") {
              return (
                <p key={index} className="font-medium" style={{ color: "var(--danger)" }}>
                  ✗ {t("page")} {entry.page}: {entry.text}
                </p>
              );
            }
            return (
              <pre
                key={index}
                className="border-l-2 pl-2 whitespace-pre-wrap break-all"
                style={{
                  borderColor: "var(--border-strong)",
                  color: "var(--text-muted)",
                }}
              >
                {entry.text}
              </pre>
            );
          })}
        </div>
      )}
    </div>
  );
};

const ModeSelectPage = ({
  mode,
  pageCount,
  isProcessing,
  aiProgress,
  aiLogs = [],
  aiLogAlwaysVisible = false,
  onAutoDetect,
  onManualCrop,
  onAiExtract,
  onCancel,
}) => {
  const { t, language } = useLanguage();
  const { playClickSound, playPageTransitionSound } = useSound();
  const [showExtraRequest, setShowExtraRequest] = useState(false);
  const [extraRequest, setExtraRequest] = useState(loadExtraRequest);

  const handlers = {
    autoDetect: onAutoDetect,
    manualCrop: onManualCrop,
    aiExtract: () => setShowExtraRequest(true),
  };

  const EXTRA_PRESETS = [
    language === "vi"
      ? "Giải toàn bộ câu hỏi và điền đáp án đúng"
      : "Solve everything and fill in the correct answers",
    language === "vi"
      ? "Không cần giải, chỉ trích xuất câu hỏi và để đáp án trống"
      : "Don't solve anything at all, just extract the questions with no answers",
    language === "vi"
      ? "Giải thích ngắn gọn cho từng đáp án đúng"
      : "Add a short explanation for each correct answer",
    language === "vi"
      ? "Giữ nguyên ngôn ngữ gốc của đề"
      : "Keep the original language of the exam",
  ];

  const startAiExtract = () => {
    setShowExtraRequest(false);
    saveExtraRequest(extraRequest);
    onAiExtract(extraRequest);
  };

  return (
    <PageWrapper>
      <div className="mx-auto max-w-2xl">
        <button
          onClick={() => {
            playClickSound();
            playPageTransitionSound();
            onCancel();
          }}
          className="btn btn-ghost btn-sm mb-6 -ml-2"
        >
          <ChevronLeft className="h-4 w-4" />
          {t("back")}
        </button>

        <h1 className="text-xl font-semibold tracking-tight">
          {t("howToExtract")}
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
          {t("extractDescription")}
        </p>

        {isProcessing ? (
          <Card className="mt-8 p-6">
            <div className="mb-3 flex items-center justify-between text-sm">
              <span className="font-medium">
                {aiProgress.status || t("aiProcessing")}
              </span>
              <span style={{ color: "var(--text-muted)" }}>
                {aiProgress.current} / {aiProgress.total}
              </span>
            </div>
            <div className="progress-track">
              <div
                className="progress-fill"
                style={{
                  width:
                    aiProgress.total > 0
                      ? `${(aiProgress.current / aiProgress.total) * 100}%`
                      : "0%",
                }}
              />
            </div>
            <p className="mt-2 text-xs" style={{ color: "var(--text-faint)" }}>
              {t("pagesProcessed")}
            </p>
          </Card>
        ) : (          <div className="mt-6 space-y-2">
            {MODE_OPTIONS[mode].map((optionId) => {
              const Icon = OPTION_ICONS[optionId];
              const [labelKey, descKey] = OPTION_LABEL_KEYS[optionId];
              const bullets =
                typeof OPTION_BULLETS[mode][optionId] === "function"
                  ? OPTION_BULLETS[mode][optionId](language)
                  : OPTION_BULLETS[mode][optionId];
              return (
                <button
                  key={optionId}
                  onClick={() => {
                    playClickSound();
                    if (optionId === "manualCrop") playPageTransitionSound();
                    handlers[optionId]();
                  }}
                  className="card flex w-full items-start gap-4 p-4 text-left transition-colors hover:border-[color:var(--border-strong)]"
                >
                  <span
                    className="flex h-10 w-10 flex-shrink-0 items-center justify-center"
                    style={{
                      background: "var(--surface-2)",
                      color: "var(--text-muted)",
                    }}
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <h2 className="text-sm font-semibold">{t(labelKey)}</h2>
                    <p
                      className="mt-0.5 text-sm"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {t(descKey)}
                    </p>
                    <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
                      {bullets.map((bullet) => (
                        <li
                          key={bullet}
                          className="flex items-center gap-1.5 text-xs"
                          style={{ color: "var(--text-faint)" }}
                        >
                          <Check
                            className="h-3.5 w-3.5"
                            style={{ color: "var(--success)" }}
                          />
                          {bullet}
                        </li>
                      ))}
                    </ul>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        <AILogBox
          logs={aiLogs}
          alwaysVisible={aiLogAlwaysVisible}
          processing={isProcessing}
        />

        {showExtraRequest && (
          <Modal
            title={t("aiExtraction")}
            onClose={() => setShowExtraRequest(false)}
          >
            <p className="mb-4 text-sm" style={{ color: "var(--text-muted)" }}>
              {t("extraRequestDesc")}
            </p>

            <div className="mb-4 flex flex-wrap gap-2">
              {EXTRA_PRESETS.map((preset) => (
                <button
                  key={preset}
                  onClick={() => setExtraRequest(preset)}
                  className="chip"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  {preset.length > 42 ? `${preset.slice(0, 42)}…` : preset}
                </button>
              ))}
            </div>

            <label className="label">{t("extraRequest")}</label>
            <textarea
              value={extraRequest}
              onChange={(e) => setExtraRequest(e.target.value)}
              placeholder={t("extraRequestPlaceholder")}
              rows={4}
              className="input mb-5 resize-none"
            />

            <div className="flex gap-2">
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => setShowExtraRequest(false)}
              >
                {t("cancel")}
              </Button>
              <Button className="flex-1" onClick={startAiExtract}>
                <Brain className="h-4 w-4" />
                {t("startExtraction")}
              </Button>
            </div>
          </Modal>
        )}

        <p className="mt-6 text-sm" style={{ color: "var(--text-muted)" }}>
          <span className="font-semibold" style={{ color: "var(--text)" }}>
            {pageCount}
          </span>{" "}
          {mode === "pdf"
            ? language === "vi"
              ? "trang"
              : "pages"
            : language === "vi"
              ? "hình ảnh"
              : "images"}
        </p>

        <Button variant="secondary" onClick={onCancel} className="mt-6">
          {t("cancel")}
        </Button>
      </div>
    </PageWrapper>
  );
};

export default ModeSelectPage;
