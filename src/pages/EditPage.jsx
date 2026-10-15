import { useCallback } from "react";
import { ChevronLeft, Plus, Check } from "lucide-react";
import PageWrapper from "../components/PageWrapper";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import QuestionEditor from "../components/QuestionEditor";
import { useLanguage } from "../context/languageContext";
import { useSound } from "../context/soundContext";
import { emptyOptions } from "../lib/questions";

const SettingToggle = ({ label, description, checked, onChange }) => (
  <label className="setting-row" data-checked={checked ? "true" : "false"}>
    <input
      type="checkbox"
      className="hidden"
      checked={checked}
      onChange={onChange}
    />
    <span className="checkbox" data-checked={checked ? "true" : "false"}>
      {checked && <Check className="h-3 w-3 text-white" />}
    </span>
    <span className="min-w-0">
      <span className="block text-sm font-medium">{label}</span>
      <span
        className="block text-xs"
        style={{ color: "var(--text-muted)" }}
      >
        {description}
      </span>
    </span>
  </label>
);

const EditPage = ({ test, onChangeTest, onSave, onExit }) => {
  const { t } = useLanguage();
  const { playClickSound, playPageTransitionSound } = useSound();

  // Stable callbacks keep the memoized question editors from re-rendering
  // when unrelated state (e.g. the test name) changes.
  const updateQuestion = useCallback(
    (questionId, updates) =>
      onChangeTest((prev) => ({
        ...prev,
        questions: prev.questions.map((q) =>
          q.id === questionId ? { ...q, ...updates } : q,
        ),
      })),
    [onChangeTest],
  );

  const deleteQuestion = useCallback(
    (questionId) =>
      onChangeTest((prev) => ({
        ...prev,
        questions: prev.questions
          .filter((q) => q.id !== questionId)
          .map((q, idx) => ({ ...q, number: idx + 1 })),
      })),
    [onChangeTest],
  );

  const addImageQuestion = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        onChangeTest({
          ...test,
          questions: [
            ...test.questions,
            {
              id: Date.now(),
              number: test.questions.length + 1,
              image: ev.target.result,
              correctAnswer: [],
              type: "none",
              options: emptyOptions(),
            },
          ],
        });
      };
      reader.readAsDataURL(file);
    };
    input.click();
  };

  const addTextQuestion = () =>
    onChangeTest({
      ...test,
      questions: [
        ...test.questions,
        {
          id: Date.now(),
          number: test.questions.length + 1,
          text: "",
          correctAnswer: [],
          type: "multiple_choice",
          options: emptyOptions(),
        },
      ],
    });

  return (
    <PageWrapper>
      {/* Toolbar */}
      <div className="mb-6 flex flex-col gap-3 sm:mb-8 sm:flex-row sm:items-center sm:gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <button
            onClick={() => {
              playClickSound();
              playPageTransitionSound();
              onExit();
            }}
            className="icon-btn flex-shrink-0"
            aria-label={t("back")}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <input
            type="text"
            value={test.name}
            onChange={(e) => onChangeTest({ ...test, name: e.target.value })}
            className="input input-plain min-w-0 flex-1 text-lg font-semibold tracking-tight"
          />
        </div>
        <div className="flex flex-shrink-0 gap-2">
          <Button
            variant="secondary"
            size="sm"
            title={t("addQuestion")}
            onClick={() => {
              playClickSound();
              addImageQuestion();
            }}
            icon={<Plus className="h-3.5 w-3.5" />}
          >
            <span className="hidden sm:inline">{t("addQuestion")}</span>
          </Button>
          <Button
            variant="secondary"
            size="sm"
            title={t("addTextQuestion")}
            onClick={() => {
              playClickSound();
              addTextQuestion();
            }}
            icon={<Plus className="h-3.5 w-3.5" />}
          >
            <span className="hidden sm:inline">{t("addTextQuestion")}</span>
          </Button>
          <Button
            size="sm"
            onClick={() => {
              playClickSound();
              onSave();
            }}
            icon={<Check className="h-3.5 w-3.5" />}
          >
            {t("save")}
          </Button>
        </div>
      </div>

      {/* Settings */}
      <Card className="mb-8 p-5">
        <h2 className="mb-4 text-sm font-semibold">{t("setAnswers")}</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <SettingToggle
            label={t("immediateFeedback")}
            description={t("immediateFeedbackDesc")}
            checked={test.settings?.immediateFeedback || false}
            onChange={(e) =>
              onChangeTest({
                ...test,
                settings: {
                  ...test.settings,
                  immediateFeedback: e.target.checked,
                },
              })
            }
          />
          <SettingToggle
            label={t("scrambleOptions")}
            description={t("scrambleOptionsDesc")}
            checked={test.settings?.scrambleOptions || false}
            onChange={(e) =>
              onChangeTest({
                ...test,
                settings: {
                  ...test.settings,
                  scrambleOptions: e.target.checked,
                },
              })
            }
          />
        </div>
      </Card>

      {/* Questions */}
      {test.questions.length === 0 ? (
        <div
          className=" border border-dashed px-6 py-16 text-center text-sm"
          style={{
            borderColor: "var(--border-strong)",
            color: "var(--text-muted)",
          }}
        >
          {t("noQuestions")}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {test.questions.map((question) => (
            <QuestionEditor
              key={question.id}
              question={question}
              onUpdate={updateQuestion}
              onDelete={deleteQuestion}
            />
          ))}
        </div>
      )}
    </PageWrapper>
  );
};

export default EditPage;
