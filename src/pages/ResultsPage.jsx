import { Home, RotateCcw, Target } from "lucide-react";
import PageWrapper from "../components/PageWrapper";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import { useLanguage } from "../context/languageContext";
import { useSound } from "../context/soundContext";

const ResultsPage = ({
  results,
  incorrectQuestions,
  onHome,
  onRetake,
  onRetakeIncorrect,
}) => {
  const { t, language } = useLanguage();
  const { playClickSound } = useSound();
  const isPassed = results.score >= 5;
  const correctCount = results.total - incorrectQuestions.length;

  return (
    <PageWrapper>
      <Card className="mx-auto max-w-md p-8 text-center">
        <p
          className="mb-6 text-xs font-semibold uppercase tracking-wider"
          style={{ color: "var(--text-faint)" }}
        >
          {t("testResults")}
        </p>

        <div
          className="text-6xl font-semibold tracking-tight"
          style={{ color: isPassed ? "var(--success)" : "var(--danger)" }}
        >
          {results.score}
          <span
            className="text-2xl font-normal"
            style={{ color: "var(--text-faint)" }}
          >
            /10
          </span>
        </div>

        <div className="progress-track mx-auto mt-6 max-w-[240px]">
          <div
            className="progress-fill"
            style={{
              width: `${results.score * 10}%`,
              background: isPassed ? "var(--success)" : "var(--danger)",
            }}
          />
        </div>

        <div className="mt-6 flex items-center justify-center gap-2">
          <span className={`badge ${isPassed ? "badge-success" : "badge-danger"}`}>
            {isPassed ? t("passed") : t("failed")}
          </span>
          <span className="text-sm" style={{ color: "var(--text-muted)" }}>
            {language === "vi"
              ? `${correctCount}/${results.total} câu đúng`
              : `${correctCount}/${results.total} correct`}
          </span>
        </div>

        <div className="mt-8 flex flex-col gap-2">
          <Button
            size="lg"
            onClick={() => {
              playClickSound();
              onRetake();
            }}
          >
            <RotateCcw className="h-4 w-4" />
            {t("retakeTest")}
          </Button>
          {incorrectQuestions.length > 0 && (
            <Button
              variant="dangerOutline"
              onClick={() => {
                playClickSound();
                onRetakeIncorrect();
              }}
            >
              <Target className="h-4 w-4" />
              {t("retakeIncorrect")} ({incorrectQuestions.length})
            </Button>
          )}
          <Button
            variant="ghost"
            onClick={() => {
              playClickSound();
              onHome();
            }}
          >
            <Home className="h-4 w-4" />
            {t("home")}
          </Button>
        </div>
      </Card>
    </PageWrapper>
  );
};

export default ResultsPage;
