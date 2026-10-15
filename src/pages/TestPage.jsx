import { useState } from "react";
import { Check, ChevronLeft, Minus, Plus, Send, X } from "lucide-react";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import { useLanguage } from "../context/languageContext";
import { useSound } from "../context/soundContext";

const TYPE_LABEL_KEYS = {
  multiple_choice: "multipleChoice",
  true_false: "trueFalse",
  text_input: "textInput",
};

const TestPage = ({ test, retakeMode, onSubmit, onExit }) => {
  const { t, language } = useLanguage();
  const { playSubmitSound, playPageTransitionSound } = useSound();

  const [userAnswers, setUserAnswers] = useState({});
  const [answeredQuestions, setAnsweredQuestions] = useState(new Set());
  const [imageZoomLevel, setImageZoomLevel] = useState(1);
  const [touchStartDistance, setTouchStartDistance] = useState(0);
  const [touchStartZoom, setTouchStartZoom] = useState(1);

  const answeredCount = answeredQuestions.size;
  const totalCount = test.questions.length;
  const progressPercentage =
    totalCount > 0 ? Math.round((answeredCount / totalCount) * 100) : 0;
  const hasImages = test.questions.some((q) => q.image);

  const handleAnswerSelect = (questionId, newAnswer) => {
    setUserAnswers((prev) => ({ ...prev, [questionId]: newAnswer }));
    setAnsweredQuestions((prev) => {
      if (prev.has(questionId)) return prev;
      const next = new Set(prev);
      next.add(questionId);
      return next;
    });
  };

  const increaseImageSize = () =>
    setImageZoomLevel((prev) => Math.min(prev + 0.25, 3));
  const decreaseImageSize = () =>
    setImageZoomLevel((prev) => Math.max(prev - 0.25, 0.5));

  const getTouchDistance = (touches) => {
    const t1 = touches[0];
    const t2 = touches[1];
    return Math.sqrt(
      Math.pow(t2.clientX - t1.clientX, 2) +
        Math.pow(t2.clientY - t1.clientY, 2),
    );
  };

  const handleTouchStart = (e) => {
    if (e.touches.length === 2) {
      setTouchStartDistance(getTouchDistance(e.touches));
      setTouchStartZoom(imageZoomLevel);
    }
  };

  const handleTouchMove = (e) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      const scale =
        getTouchDistance(e.touches) / Math.max(touchStartDistance, 1);
      setImageZoomLevel(Math.min(Math.max(touchStartZoom * scale, 0.5), 3));
    }
  };

  const submit = () => {
    playSubmitSound();
    playPageTransitionSound();
    onSubmit(userAnswers);
  };

  const zoom = (
    <div
      className="flex flex-shrink-0 items-center gap-0.5 border p-0.5"
      style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}
    >
      <button onClick={decreaseImageSize} className="icon-btn icon-btn-sm" aria-label="Zoom out">
        <Minus className="h-3.5 w-3.5" />
      </button>
      <span
        className="hidden w-9 text-center text-xs font-semibold sm:block"
        style={{ color: "var(--text-muted)" }}
      >
        {Math.round(imageZoomLevel * 100)}%
      </span>
      <button onClick={increaseImageSize} className="icon-btn icon-btn-sm" aria-label="Zoom in">
        <Plus className="h-3.5 w-3.5" />
      </button>
    </div>
  );

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header
        className="sticky top-0 z-50 border-b"
        style={{
          background: "color-mix(in srgb, var(--bg) 85%, transparent)",
          borderColor: "var(--border)",
          backdropFilter: "blur(8px)",
        }}
      >
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between gap-3 px-4">
          <div className="flex min-w-0 items-center gap-3">
            <button
              onClick={() => {
                if (confirm(t("exitTest"))) onExit();
              }}
              className="icon-btn"
              aria-label={t("exit")}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="min-w-0">
              <h1 className="truncate text-sm font-semibold">{test.name}</h1>
              <p className="text-xs" style={{ color: "var(--text-faint)" }}>
                {retakeMode === "incorrect"
                  ? t("retakeIncorrect")
                  : `${answeredCount}/${totalCount} ${t("answered")}`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {hasImages && zoom}
            <Button size="sm" onClick={submit}>
              <Send className="h-3.5 w-3.5" />
              {t("submit")}
            </Button>
          </div>
        </div>
        <div className="progress-track">
          <div
            className="progress-fill"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </header>

      {/* Questions */}
      <main className="mx-auto max-w-3xl space-y-4 px-4 py-6 sm:py-8">
        {test.questions.map((question, idx) => {
          const selected = userAnswers[question.id] || [];
          const isAnswered = answeredQuestions.has(question.id);
          return (
            <Card key={question.id} className="p-5 sm:p-6">
              <div className="mb-4 flex items-center gap-2">
                <span
                  className="flex h-6 w-6 items-center justify-center text-xs font-semibold"
                  style={{
                    background: isAnswered
                      ? "var(--accent-soft)"
                      : "var(--surface-2)",
                    color: isAnswered ? "var(--accent)" : "var(--text-muted)",
                  }}
                >
                  {idx + 1}
                </span>
                {question.type && question.type !== "none" && (
                  <span
                    className="text-xs"
                    style={{ color: "var(--text-faint)" }}
                  >
                    {t(TYPE_LABEL_KEYS[question.type])}
                  </span>
                )}
                {isAnswered && (
                  <Check
                    className="ml-auto h-4 w-4"
                    style={{ color: "var(--success)" }}
                  />
                )}
              </div>

              {question.text && (
                <p className="mb-4 text-[15px] leading-relaxed">
                  {question.text}
                </p>
              )}

              {question.image && (
                <div
                  className="mb-4 overflow-hidden border"
                  style={{ borderColor: "var(--border)" }}
                >
                  <img
                    src={question.image}
                    alt={`Question ${idx + 1}`}
                    className="block w-full"
                    style={{
                      transform: `scale(${imageZoomLevel})`,
                      transformOrigin: "top left",
                      maxWidth: imageZoomLevel > 1 ? "none" : "100%",
                    }}
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                  />
                </div>
              )}

              {question.type === "multiple_choice" && (
                <div className="space-y-2">
                  {(question.shuffledOptions || question.options).map(
                    (option) => {
                      const isSelected = selected.includes(option.letter);
                      const isCorrect =
                        question.correctAnswer.includes(option.letter);
                      const showFeedback =
                        test.settings?.immediateFeedback && isSelected;
                      return (
                        <button
                          key={option.letter}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            if (!test.settings?.immediateFeedback) {
                              const curr = userAnswers[question.id] || [];
                              handleAnswerSelect(
                                question.id,
                                isSelected
                                  ? curr.filter((a) => a !== option.letter)
                                  : [...curr, option.letter].sort(),
                              );
                            } else {
                              handleAnswerSelect(question.id, [option.letter]);
                            }
                          }}
                          className="opt"
                          data-selected={isSelected ? "true" : "false"}
                          data-state={
                            showFeedback
                              ? isCorrect
                                ? "correct"
                                : "wrong"
                              : undefined
                          }
                        >
                          <span className="opt-letter">{option.letter}</span>
                          <span className="flex-1 text-sm leading-snug">
                            {option.text || option.letter}
                          </span>
                          {showFeedback &&
                            (isCorrect ? (
                              <Check
                                className="h-4 w-4 flex-shrink-0"
                                style={{ color: "var(--success)" }}
                              />
                            ) : (
                              <X
                                className="h-4 w-4 flex-shrink-0"
                                style={{ color: "var(--danger)" }}
                              />
                            ))}
                        </button>
                      );
                    },
                  )}
                </div>
              )}

              {question.type === "true_false" && (
                <div className="space-y-2">
                  {(question.shuffledOptions || question.options).map(
                    (option) => {
                      const isSelected = selected.includes(option.letter);
                      const isCorrect =
                        question.correctAnswer.includes(option.letter);
                      const showFeedback =
                        test.settings?.immediateFeedback && isSelected;
                      return (
                        <div
                          key={option.letter}
                          className="opt opt-static"
                          data-selected={isSelected ? "true" : "false"}
                          data-state={
                            showFeedback
                              ? isCorrect
                                ? "correct"
                                : "wrong"
                              : undefined
                          }
                        >
                          <span className="opt-letter">{option.letter}</span>
                          <span className="flex-1 text-sm leading-snug">
                            {option.text || option.letter}
                          </span>
                          <div className="flex flex-shrink-0 gap-1">
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                const curr = userAnswers[question.id] || [];
                                handleAnswerSelect(question.id, [
                                  ...curr.filter((a) => a !== option.letter),
                                  option.letter,
                                ]);
                              }}
                              className={`btn btn-sm ${
                                isSelected
                                  ? showFeedback && !isCorrect
                                    ? "btn-danger"
                                    : "btn-primary"
                                  : "btn-secondary"
                              }`}
                            >
                              {t(language === "vi" ? "trueLabelVi" : "trueLabel")}
                            </button>
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleAnswerSelect(
                                  question.id,
                                  (userAnswers[question.id] || []).filter(
                                    (a) => a !== option.letter,
                                  ),
                                );
                              }}
                              className={`btn btn-sm ${
                                !isSelected && showFeedback
                                  ? "btn-secondary"
                                  : "btn-ghost"
                              }`}
                            >
                              {t(
                                language === "vi" ? "falseLabelVi" : "falseLabel",
                              )}
                            </button>
                          </div>
                        </div>
                      );
                    },
                  )}
                </div>
              )}

              {question.type === "text_input" && (
                <input
                  type="text"
                  value={userAnswers[question.id] || ""}
                  onChange={(e) =>
                    handleAnswerSelect(question.id, e.target.value)
                  }
                  placeholder={t(
                    language === "vi" ? "typeAnswerHereVi" : "typeAnswerHere",
                  )}
                  className="input"
                />
              )}
            </Card>
          );
        })}

        <div className="flex justify-center pt-2 pb-12">
          <Button size="lg" onClick={submit} className="w-full max-w-xs">
            <Send className="h-4 w-4" />
            {t("submit")}
          </Button>
        </div>
      </main>
    </div>
  );
};

export default TestPage;
