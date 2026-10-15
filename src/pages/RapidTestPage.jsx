import { Check, ChevronLeft, X, Zap } from "lucide-react";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import { useLanguage } from "../context/languageContext";
import { useSound } from "../context/soundContext";
import { isAnswerCorrect } from "../lib/questions";

const RapidTestPage = ({
  question,
  answer,
  onAnswerChange,
  showResult,
  score,
  totalQuestions,
  onConfirm,
  onNext,
  onExit,
}) => {
  const { t, language } = useLanguage();
  const { playClickSound } = useSound();

  if (!question) return null;

  const answeredCorrectly = isAnswerCorrect(question, answer);
  const selected = answer || [];

  return (
    <div className="min-h-screen">
      <header
        className="sticky top-0 z-50 border-b"
        style={{
          background: "color-mix(in srgb, var(--bg) 85%, transparent)",
          borderColor: "var(--border)",
          backdropFilter: "blur(8px)",
        }}
      >
        <div className="mx-auto flex h-14 max-w-2xl items-center justify-between gap-3 px-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                if (confirm(t("exitTest"))) onExit();
              }}
              className="icon-btn"
              aria-label={t("exit")}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="flex items-center gap-2 text-sm font-semibold">
              <Zap
                className="h-4 w-4"
                style={{ color: "var(--accent)" }}
                fill="currentColor"
              />
              {t("rapidTestMode")}
            </span>
          </div>
          <span className="badge badge-accent">
            {t("rapidScore")}: {score}/{totalQuestions}
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-8 sm:py-12">
        {!showResult ? (
          <Card className="p-6 sm:p-8">
            {question.image && (
              <div
                className="mb-6 overflow-hidden border"
                style={{ borderColor: "var(--border)" }}
              >
                <img
                  src={question.image}
                  alt="Question"
                  className="block w-full"
                />
              </div>
            )}
            {question.text && (
              <p className="mb-6 text-lg leading-relaxed">{question.text}</p>
            )}

            {question.type === "multiple_choice" && (
              <div className="space-y-2">
                {question.options.map((option) => (
                  <button
                    key={option.letter}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onAnswerChange([option.letter]);
                    }}
                    className="opt"
                    data-selected={
                      selected.includes(option.letter) ? "true" : "false"
                    }
                  >
                    <span className="opt-letter">{option.letter}</span>
                    <span className="flex-1 text-sm leading-snug">
                      {option.text}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {question.type === "true_false" && (
              <div className="space-y-2">
                {question.options.map((option) => {
                  const isSelected = selected.includes(option.letter);
                  return (
                    <div
                      key={option.letter}
                      className="opt opt-static"
                      data-selected={isSelected ? "true" : "false"}
                    >
                      <span className="opt-letter">{option.letter}</span>
                      <span className="flex-1 text-sm leading-snug">
                        {option.text}
                      </span>
                      <div className="flex flex-shrink-0 gap-1">
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onAnswerChange([
                              ...selected.filter((a) => a !== option.letter),
                              option.letter,
                            ]);
                          }}
                          className={`btn btn-sm ${
                            isSelected ? "btn-primary" : "btn-secondary"
                          }`}
                        >
                          {t(
                            language === "vi" ? "trueLabelVi" : "trueLabel",
                          )}
                        </button>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onAnswerChange(
                              selected.filter((a) => a !== option.letter),
                            );
                          }}
                          className="btn btn-sm btn-ghost"
                        >
                          {t(language === "vi" ? "falseLabelVi" : "falseLabel")}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {question.type === "text_input" && (
              <input
                type="text"
                value={answer || ""}
                onChange={(e) => onAnswerChange(e.target.value)}
                placeholder={t(
                  language === "vi" ? "typeAnswerHereVi" : "typeAnswerHere",
                )}
                className="input"
              />
            )}

            <Button
              size="lg"
              onClick={() => {
                playClickSound();
                onConfirm();
              }}
              disabled={!answer || selected.length === 0}
              className="mt-8 w-full max-w-xs"
            >
              {t("confirmAnswer")}
            </Button>
          </Card>
        ) : (
          <Card className="p-6 text-center sm:p-8">
            <span
              className="mx-auto mb-5 flex h-12 w-12 items-center justify-center"
              style={{
                background: answeredCorrectly
                  ? "var(--success-soft)"
                  : "var(--danger-soft)",
                color: answeredCorrectly
                  ? "var(--success)"
                  : "var(--danger)",
              }}
            >
              {answeredCorrectly ? (
                <Check className="h-6 w-6" />
              ) : (
                <X className="h-6 w-6" />
              )}
            </span>
            <h2 className="text-lg font-semibold">
              {answeredCorrectly
                ? t("correctAnswerRapid")
                : t("incorrectAnswerRapid")}
            </h2>
            {!answeredCorrectly && (
              <p
                className="mt-2 text-sm"
                style={{ color: "var(--text-muted)" }}
              >
                {t("correctAnswer")}{" "}
                <span className="font-semibold" style={{ color: "var(--success)" }}>
                  {question.correctAnswer.join(", ")}
                </span>
              </p>
            )}
            <Button
              size="lg"
              onClick={() => {
                playClickSound();
                onNext();
              }}
              className="mt-8 w-full max-w-xs"
            >
              {t("nextQuestion")}
            </Button>
          </Card>
        )}
      </main>
    </div>
  );
};

export default RapidTestPage;
