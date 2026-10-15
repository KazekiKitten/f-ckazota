import {
  FileText,
  Image as ImageIcon,
  FileJson,
  Globe,
  Plus,
  Play,
  Zap,
  Pencil,
  Download,
  Share2,
  Trash2,
} from "lucide-react";
import PageWrapper from "../components/PageWrapper";
import { useLanguage } from "../context/languageContext";
import { useSound } from "../context/soundContext";

const typeBadge = (test) => {
  if (test.pages?.length) return "PDF / IMG";
  if (test.type === "text") return "TXT / DOCX";
  if (test.type === "blank") return "BLANK";
  return "JSON";
};

const HomePage = ({
  tests,
  isProcessing,
  processingLabel,
  onPdfUpload,
  onImageUpload,
  onTestUpload,
  onTextUpload,
  onDocxUpload,
  onImportByCode,
  onCreateBlankTest,
  onEditTest,
  onStartTest,
  onStartRapidTest,
  onDownloadTest,
  onShareTest,
  onDeleteTest,
}) => {
  const { t, language } = useLanguage();
  const { playClickSound } = useSound();

  const sources = [
    {
      id: "pdf-input",
      label: t("uploadPdf"),
      icon: FileText,
      handler: onPdfUpload,
      accept: ".pdf",
    },
    {
      id: "image-input",
      label: t("uploadImages"),
      icon: ImageIcon,
      handler: onImageUpload,
      accept: "image/*",
      multi: true,
    },
    {
      id: "text-input",
      label: t("uploadText"),
      icon: FileText,
      handler: onTextUpload,
      accept: ".txt",
    },
    {
      id: "docx-input",
      label: t("uploadDocx"),
      icon: FileText,
      handler: onDocxUpload,
      accept: ".docx",
    },
    {
      id: "test-input",
      label: t("importTest"),
      icon: FileJson,
      handler: onTestUpload,
      accept: ".json",
    },
  ];

  return (
    <PageWrapper>
      {/* Hero */}
      <div className="mb-10 max-w-xl">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          {language === "vi"
            ? "Tạo đề thông minh, "
            : "Create smart tests, "}
          <span style={{ color: "var(--accent)" }}>
            {language === "vi" ? "nhanh chóng." : "in seconds."}
          </span>
        </h1>
        <p className="mt-2 text-sm" style={{ color: "var(--text-muted)" }}>
          {t("appDescription")}
        </p>
      </div>

      {isProcessing && (
        <div
          className="mb-8 flex items-center gap-3 border px-4 py-3 text-sm font-medium"
          style={{
            background: "var(--accent-soft)",
            borderColor: "var(--accent-soft-border)",
            color: "var(--accent)",
          }}
        >
          <Zap className="h-4 w-4" />
          {processingLabel || t("converting")}
        </div>
      )}

      {/* Sources */}
      <section className="mb-12">
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-faint)" }}>
            {t("addContent")}
          </h2>
        </div>
        <div className="flex flex-wrap gap-2">
          {sources.map((s) => {
            const Icon = s.icon;
            return (
              <label key={s.id} htmlFor={s.id} className="chip">
                <Icon className="h-4 w-4" />
                {s.label}
                <input
                  type="file"
                  id={s.id}
                  accept={s.accept}
                  multiple={s.multi}
                  onChange={s.handler}
                  className="hidden"
                  disabled={isProcessing}
                />
              </label>
            );
          })}
          <button
            onClick={() => {
              playClickSound();
              onImportByCode();
            }}
            disabled={isProcessing}
            className="chip"
          >
            <Globe className="h-4 w-4" />
            {t("importByCode")}
          </button>
          <button
            onClick={() => {
              playClickSound();
              onCreateBlankTest();
            }}
            disabled={isProcessing}
            className="chip"
          >
            <Plus className="h-4 w-4" />
            {t("blankTest")}
          </button>
        </div>
      </section>

      {/* Test library */}
      <section>
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="text-lg font-semibold tracking-tight">
            {t("yourTests")}
          </h2>
          {tests.length > 0 && (
            <span className="text-xs" style={{ color: "var(--text-faint)" }}>
              {tests.length}
            </span>
          )}
        </div>

        {tests.length === 0 ? (
          <div
            className=" border border-dashed px-6 py-16 text-center"
            style={{ borderColor: "var(--border-strong)" }}
          >
            <FileText
              className="mx-auto mb-3 h-6 w-6"
              style={{ color: "var(--text-faint)" }}
            />
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              {t("noTests")}
            </p>
          </div>
        ) : (
          <div className="card divide-y" style={{ borderColor: "var(--border)" }}>
            {tests.map((test) => (
              <div
                key={test.id}
                className="flex flex-col gap-3 p-4 transition-colors sm:flex-row sm:items-center"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="truncate text-sm font-semibold">
                      {test.name}
                    </h3>
                    <span className="badge">{typeBadge(test)}</span>
                  </div>
                  <p className="mt-1 text-xs" style={{ color: "var(--text-faint)" }}>
                    {t("questionsCount", { count: test.questions.length })} ·{" "}
                    {t("createdOn", { date: test.createdAt })}
                  </p>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => {
                      playClickSound();
                      onStartTest(test);
                    }}
                    className="btn btn-primary btn-sm"
                  >
                    <Play className="h-3.5 w-3.5" fill="currentColor" />
                    {t("take")}
                  </button>
                  <button
                    onClick={() => {
                      playClickSound();
                      onStartRapidTest(test);
                    }}
                    className="btn btn-ghost btn-sm btn-icon"
                    title={t("rapidTest")}
                  >
                    <Zap className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => {
                      playClickSound();
                      onEditTest(test);
                    }}
                    className="btn btn-ghost btn-sm btn-icon"
                    title={t("edit")}
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => {
                      playClickSound();
                      onDownloadTest(test);
                    }}
                    className="btn btn-ghost btn-sm btn-icon"
                    title={t("export")}
                  >
                    <Download className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => {
                      playClickSound();
                      onShareTest(test);
                    }}
                    className="btn btn-ghost btn-sm btn-icon"
                    title={t("shareTest")}
                  >
                    <Share2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => {
                      playClickSound();
                      onDeleteTest(test);
                    }}
                    className="btn btn-ghost btn-sm btn-icon hover:text-red-500!"
                    title={t("delete")}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </PageWrapper>
  );
};

export default HomePage;
