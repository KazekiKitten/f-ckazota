import { memo } from "react";
import { Trash2, Check, Plus } from "lucide-react";
import Card from "./ui/Card";
import { useLanguage } from "../context/languageContext";
import { emptyOptions } from "../lib/questions";

const TYPE_OPTIONS = [
  ["multiple_choice", "multipleChoice"],
  ["true_false", "trueFalse"],
  ["text_input", "textInput"],
  ["none", "none"],
];

const QuestionEditor = ({ question, onUpdate, onDelete }) => {
  const { t, language } = useLanguage();

  return (
    <Card className="flex flex-col">
      <div
        className="flex items-center justify-between border-b px-4 py-2.5"
        style={{ borderColor: "var(--border)" }}
      >
        <span className="text-xs font-semibold" style={{ color: "var(--text-muted)" }}>
          {t("question")} {question.number}
        </span>
        <button
          onClick={() => onDelete(question.id)}
          className="icon-btn icon-btn-sm"
          aria-label={t("delete")}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="flex-1 space-y-4 p-4">
        <div>
          <label className="label">{t("questionText")}</label>
          <textarea
            value={question.text || ""}
            onChange={(e) => onUpdate(question.id, { text: e.target.value })}
            placeholder={t("typeAnswerHere")}
            className="input resize-none"
            rows={3}
          />
        </div>

        {question.image && (
          <div
            className=" border p-2"
            style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}
          >
            <img
              src={question.image}
              alt={`Q${question.number}`}
              className="w-fullborder"
              style={{ borderColor: "var(--border)" }}
            />
          </div>
        )}

        <div>
          <label className="label">{t("questionType")}</label>
          <select
            value={question.type || "multiple_choice"}
            onChange={(e) => {
              const newType = e.target.value;
              let updates = { type: newType };
              if (newType === "true_false") {
                if (question.options?.length >= 4) {
                  updates.options = question.options
                    .slice(0, 4)
                    .map((opt, idx) => ({
                      letter: String.fromCharCode(65 + idx),
                      text: opt.text || "",
                    }));
                } else {
                  updates.options = emptyOptions();
                }
                updates.correctAnswer = [];
              } else if (newType === "text_input") {
                updates.options = [];
                updates.correctAnswer = [];
              } else if (newType === "multiple_choice") {
                if (!question.options?.length) updates.options = emptyOptions();
              } else if (newType === "none") {
                updates.options = [];
                updates.correctAnswer = [];
              }
              onUpdate(question.id, updates);
            }}
            className="input"
          >
            {TYPE_OPTIONS.map(([value, key]) => (
              <option key={value} value={value}>
                {t(key)}
              </option>
            ))}
          </select>
        </div>

        {question.type !== "none" && (
          <div>
            <label className="label">{t("correctAnswers")}</label>

            {question.type === "multiple_choice" && (
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <span className="label label-inline">{t("options")}</span>
                  <button
                    onClick={() => {
                      const newLetter = String.fromCharCode(
                        65 + question.options.length,
                      );
                      onUpdate(question.id, {
                        options: [
                          ...question.options,
                          { letter: newLetter, text: "" },
                        ],
                      });
                    }}
                    className="btn btn-ghost btn-sm"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    {t("addOption")}
                  </button>
                </div>
                <div className="space-y-2">
                  {question.options.map((option, idx) => {
                    const isCorrect = question.correctAnswer.includes(
                      option.letter,
                    );
                    return (
                      <div
                        key={option.letter}
                        className="opt opt-static"
                        data-selected={isCorrect ? "true" : "false"}
                      >
                        <label className="checkbox" data-checked={isCorrect ? "true" : "false"}>
                          <input
                            type="checkbox"
                            className="hidden"
                            checked={isCorrect}
                            onChange={(e) => {
                              const curr = question.correctAnswer;
                              const next = e.target.checked
                                ? [...curr, option.letter].sort()
                                : curr.filter((a) => a !== option.letter);
                              onUpdate(question.id, { correctAnswer: next });
                            }}
                          />
                          {isCorrect && (
                            <Check className="h-3 w-3 text-white" />
                          )}
                        </label>
                        <span className="opt-letter">{option.letter}</span>
                        <input
                          type="text"
                          value={option.text || ""}
                          onChange={(e) => {
                            const newOptions = [...question.options];
                            newOptions[idx] = {
                              ...newOptions[idx],
                              text: e.target.value,
                            };
                            onUpdate(question.id, { options: newOptions });
                          }}
                          placeholder={`${t("option")} ${option.letter}`}
                          className="min-w-[90px] flex-1 border-0 bg-transparent p-0 text-sm focus:outline-none"
                          style={{ color: "var(--text)" }}
                        />
                        {question.options.length > 2 && (
                          <button
                            onClick={() => {
                              const newOptions = question.options.filter(
                                (_, i) => i !== idx,
                              );
                              const newCorrectAnswer =
                                question.correctAnswer.filter(
                                  (a) => a !== option.letter,
                                );
                              onUpdate(question.id, {
                                options: newOptions,
                                correctAnswer: newCorrectAnswer,
                              });
                            }}
                            className="icon-btn icon-btn-sm"
                            aria-label={t("delete")}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {question.type === "true_false" && (
              <div className="space-y-2">
                <span className="label mb-2!">{t("options")}</span>
                {question.options.map((option, idx) => {
                  const isSelected = question.correctAnswer.includes(
                    option.letter,
                  );
                  return (
                    <div
                      key={option.letter}
                      className="opt opt-static opt-wrap"
                      data-selected={isSelected ? "true" : "false"}
                    >
                      <span className="opt-letter">{option.letter}</span>
                      <input
                        type="text"
                        value={option.text || ""}
                        onChange={(e) => {
                          const newOptions = [...question.options];
                          newOptions[idx] = {
                            ...newOptions[idx],
                            text: e.target.value,
                          };
                          onUpdate(question.id, { options: newOptions });
                        }}
                        placeholder={`${t("option")} ${option.letter}`}
                        className="min-w-[80px] flex-1 border-0 bg-transparent p-0 text-sm focus:outline-none"
                        style={{ color: "var(--text)" }}
                      />
                      <div className="ml-auto flex flex-shrink-0 gap-1">
                        <button
                          onClick={() =>
                            onUpdate(question.id, {
                              correctAnswer: [
                                ...(question.correctAnswer || []).filter(
                                  (a) => a !== option.letter,
                                ),
                                option.letter,
                              ],
                            })
                          }
                          className={`btn btn-sm ${
                            isSelected ? "btn-primary" : "btn-secondary"
                          }`}
                        >
                          {language === "vi" ? "Đúng" : "True"}
                        </button>
                        <button
                          onClick={() =>
                            onUpdate(question.id, {
                              correctAnswer: (
                                question.correctAnswer || []
                              ).filter((a) => a !== option.letter),
                            })
                          }
                          className="btn btn-sm btn-ghost"
                        >
                          {language === "vi" ? "Sai" : "False"}
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
                value={question.correctAnswer.join(", ")}
                onChange={(e) =>
                  onUpdate(question.id, {
                    correctAnswer: e.target.value
                      .split(",")
                      .map((a) => a.trim())
                      .filter((a) => a),
                  })
                }
                placeholder="Apple, Banana"
                className="input"
              />
            )}
          </div>
        )}
      </div>
    </Card>
  );
};

// Memoized: editing the test name or settings must not re-render every
// question card in a long test.
export default memo(QuestionEditor);
