import { Zap, Home, RotateCcw } from "lucide-react";
import PageWrapper from "../components/PageWrapper";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import { useLanguage } from "../context/languageContext";
import { useSound } from "../context/soundContext";

const RapidResultsPage = ({ score, totalQuestions, onRestart, onExit }) => {
  const { t } = useLanguage();
  const { playClickSound } = useSound();

  const percentage =
    totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;

  return (
    <PageWrapper>
      <Card className="mx-auto max-w-md p-8 text-center">
        <span
          className="mx-auto mb-6 flex h-12 w-12 items-center justify-center"
          style={{ background: "var(--accent-soft)", color: "var(--accent)" }}
        >
          <Zap className="h-6 w-6" fill="currentColor" />
        </span>

        <p
          className="mb-6 text-xs font-semibold uppercase tracking-wider"
          style={{ color: "var(--text-faint)" }}
        >
          {t("rapidCompleted")}
        </p>

        <div className="text-6xl font-semibold tracking-tight">
          {score}
          <span
            className="text-2xl font-normal"
            style={{ color: "var(--text-faint)" }}
          >
            /{totalQuestions}
          </span>
        </div>

        <div className="progress-track mx-auto mt-6 max-w-[240px]">
          <div className="progress-fill" style={{ width: `${percentage}%` }} />
        </div>

        <p className="mt-4 text-sm" style={{ color: "var(--text-muted)" }}>
          {percentage}% {t("correct")}
        </p>

        <div className="mt-8 flex flex-col gap-2">
          <Button
            size="lg"
            onClick={() => {
              playClickSound();
              onRestart();
            }}
          >
            <RotateCcw className="h-4 w-4" />
            {t("restartRapid")}
          </Button>
          <Button
            variant="ghost"
            onClick={() => {
              playClickSound();
              onExit();
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

export default RapidResultsPage;
