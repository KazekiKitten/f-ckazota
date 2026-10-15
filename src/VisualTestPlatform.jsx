import { Suspense, lazy, useState } from "react";
import AppUIContext from "./context/appUI";
import AmbientBackground from "./components/AmbientBackground";
import AIChatAssistant from "./components/AIChatAssistant";
import { useLanguage } from "./context/languageContext";
import { useSound } from "./context/soundContext";
import { useTheme } from "./context/themeContext";
import { usePageTransition } from "./hooks/usePageTransition";
import {
  loadAISettings,
  getActiveApiKey,
  getActiveModel,
  getCustomBaseUrl,
  loadLogExpanded,
} from "./lib/aiSettings";
import { pdfToImages } from "./lib/pdf";
import { readImagesAsDataUrls } from "./lib/images";
import {
  parseQuestionsFromText,
  parseQuestionsFromDocx,
  applyScrambledOptions,
  gradeTest,
  getIncorrectQuestions,
  isAnswerCorrect,
} from "./lib/questions";
import { detectQuestionsFromPages } from "./lib/autoDetect";
import { extractQuestions } from "./lib/ai";
import { downloadTest, uploadSharedTest, fetchSharedTest } from "./lib/testIO";

const HomePage = lazy(() => import("./pages/HomePage"));
const ModeSelectPage = lazy(() => import("./pages/ModeSelectPage"));
const CropPage = lazy(() => import("./pages/CropPage"));
const EditPage = lazy(() => import("./pages/EditPage"));
const TestPage = lazy(() => import("./pages/TestPage"));
const ResultsPage = lazy(() => import("./pages/ResultsPage"));
const RapidTestPage = lazy(() => import("./pages/RapidTestPage"));
const RapidResultsPage = lazy(() => import("./pages/RapidResultsPage"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));

const PageFallback = () => (
  <div className="flex min-h-screen items-center justify-center">
    <span
      className="h-6 w-6 animate-spin border-2"
      style={{
        borderColor: "var(--border)",
        borderTopColor: "var(--accent)",
      }}
    />
  </div>
);

const VisualTestPlatform = () => {
  const { t, language } = useLanguage();
  const { ambientAnimation } = useTheme();
  const {
    playPageTransitionSound,
    playCorrectSound,
    playIncorrectSound,
    playTestCompleteSound,
    playQuestionAppearSound,
  } = useSound();
  const triggerSimpleAnimation = usePageTransition();

  const [currentPage, setCurrentPage] = useState("home");
  const [tests, setTests] = useState([]);
  const [currentTest, setCurrentTest] = useState(null);
  const [editingTest, setEditingTest] = useState(null);
  const [testResults, setTestResults] = useState(null);
  const [retakeMode, setRetakeMode] = useState("full");
  const [settingsTab, setSettingsTab] = useState("ai");
  const [aiLogs, setAiLogs] = useState([]);
  const [aiUsage, setAiUsage] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingLabel, setProcessingLabel] = useState(null);
  const [aiProgress, setAiProgress] = useState({
    current: 0,
    total: 0,
    status: "",
  });

  const [shareCode, setShareCode] = useState("");
  const [showShareModal, setShowShareModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importCode, setImportCode] = useState("");

  const [rapidCurrentQuestion, setRapidCurrentQuestion] = useState(null);
  const [rapidAnswer, setRapidAnswer] = useState(null);
  const [rapidShowResult, setRapidShowResult] = useState(false);
  const [rapidScore, setRapidScore] = useState(0);
  const [rapidAnsweredQuestions, setRapidAnsweredQuestions] = useState(
    new Set(),
  );
  const [rapidTotalQuestions, setRapidTotalQuestions] = useState(0);

  const handlePdfUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.includes("pdf"))
      return alert(
        language === "vi"
          ? "Vui lòng tải lên file PDF"
          : "Please upload a PDF file",
      );
    setIsProcessing(true);
    try {
      setProcessingLabel(t("converting"));
      const images = await pdfToImages(file, (current, total) =>
        setProcessingLabel(`${t("aiProcessingPage")} ${current}/${total}`),
      );
      const newTest = {
        id: Date.now(),
        name: file.name.replace(".pdf", ""),
        type: "visual",
        mode: "crop",
        pages: images.map((img) => img.dataUrl),
        questions: [],
        settings: {
          immediateFeedback: false,
          scrambleOptions: false,
        },
        createdAt: new Date().toLocaleDateString(),
      };
      setTests([...tests, newTest]);
      setEditingTest(newTest);
      setCurrentPage("pdf-mode-select");
      triggerSimpleAnimation();
    } catch (error) {
      alert(
        (language === "vi" ? "Lỗi xử lý PDF: " : "Error processing PDF: ") +
          error.message,
      );
    } finally {
      setIsProcessing(false);
      setProcessingLabel(null);
    }
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    setIsProcessing(true);
    try {
      const images = await readImagesAsDataUrls(files);
      const newTest = {
        id: Date.now(),
        name: `Test ${new Date().toLocaleString()}`,
        type: "visual",
        pages: images,
        questions: [],
        settings: {
          immediateFeedback: false,
          scrambleOptions: false,
        },
        createdAt: new Date().toLocaleDateString(),
      };
      setTests([...tests, newTest]);
      setEditingTest(newTest);
      setCurrentPage("image-mode-select");
      triggerSimpleAnimation();
    } catch (error) {
      alert((language === "vi" ? "Lỗi: " : "Error: ") + error.message);
    } finally {
      setIsProcessing(false);
      setProcessingLabel(null);
    }
  };

  const handleTestUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      if (!file.name.endsWith(".json"))
        return alert(
          language === "vi"
            ? "Vui lòng tải lên file .json."
            : "Please upload a .json file.",
        );
      const testData = JSON.parse(await file.text());
      if (
        !testData.name ||
        !testData.questions ||
        !Array.isArray(testData.questions)
      )
        return alert(
          language === "vi" ? "File không hợp lệ." : "Invalid format.",
        );
      const importedTest = {
        id: Date.now(),
        name: testData.name,
        type: testData.type || "visual",
        questions: testData.questions,
        settings: testData.settings || {
          immediateFeedback: false,
          scrambleOptions: false,
        },
        createdAt: new Date().toLocaleDateString(),
      };
      setTests([...tests, importedTest]);
      alert(t("testImported").replace("{name}", importedTest.name));
    } catch (error) {
      alert((language === "vi" ? "Lỗi: " : "Error: ") + error.message);
    }
  };

  const handleTextUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.name.endsWith(".txt"))
      return alert(
        language === "vi" ? "Vui lòng tải file .txt." : "Please upload .txt.",
      );
    try {
      const questions = await parseQuestionsFromText(file);
      if (questions.length === 0) return alert(t("noQuestions"));
      const newTest = {
        id: Date.now(),
        name: file.name.replace(".txt", ""),
        type: "text",
        questions: questions,
        settings: {
          immediateFeedback: false,
          scrambleOptions: false,
        },
        createdAt: new Date().toLocaleDateString(),
      };
      setTests([...tests, newTest]);
      setEditingTest(newTest);
      setCurrentPage("edit");
      triggerSimpleAnimation();
    } catch (error) {
      alert((language === "vi" ? "Lỗi: " : "Error: ") + error.message);
    }
  };

  const handleDocxUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.name.endsWith(".docx"))
      return alert(
        language === "vi" ? "Vui lòng tải file .docx." : "Please upload .docx.",
      );
    try {
      const questions = await parseQuestionsFromDocx(file);
      if (questions.length === 0) return alert(t("noQuestions"));
      const newTest = {
        id: Date.now(),
        name: file.name.replace(".docx", ""),
        type: "text",
        questions: questions,
        settings: {
          immediateFeedback: false,
          scrambleOptions: false,
        },
        createdAt: new Date().toLocaleDateString(),
      };
      setTests([...tests, newTest]);
      setEditingTest(newTest);
      setCurrentPage("edit");
      triggerSimpleAnimation();
    } catch (error) {
      alert((language === "vi" ? "Lỗi: " : "Error: ") + error.message);
    }
  };

  const autoDetectQuestions = async () => {
    setIsProcessing(true);
    try {
      setAiProgress({
        current: 0,
        total: editingTest.pages.length,
        status: t("autoDetecting"),
      });
      const questions = await detectQuestionsFromPages(
        editingTest.pages,
        (current, total) =>
          setAiProgress({
            current,
            total,
            status: `${t("autoDetecting")} ${current}/${total}`,
          }),
      );
      if (questions.length === 0) {
        alert(t("noQuestionsDetected"));
        setCurrentPage("crop");
        triggerSimpleAnimation();
        return;
      }
      const numberedQuestions = questions.map((q, idx) => ({
        ...q,
        number: idx + 1,
      }));
      setEditingTest({ ...editingTest, questions: numberedQuestions });
      setCurrentPage("edit");
      triggerSimpleAnimation();
      alert(t("questionsDetected").replace("{count}", numberedQuestions.length));
    } catch (error) {
      alert(
        (language === "vi"
          ? "Lỗi tự động phát hiện: "
          : "Error auto-detecting: ") + error.message,
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const runAiExtract = async (mode, extraRequest = "") => {
    const settings = loadAISettings();
    const apiKey = getActiveApiKey(settings);
    if (!apiKey) {
      alert(t("apiKeyMissing"));
      setCurrentPage("settings");
      return;
    }
    setIsProcessing(true);
    setAiLogs([]);
    try {
      setAiProgress({
        current: 0,
        total: editingTest.pages.length,
        status: t("aiProcessing"),
      });
      const questions = await extractQuestions({
        pages: editingTest.pages,
        providerId: settings.provider,
        model: getActiveModel(settings),
        apiKey,
        mode,
        extraRequest,
        baseUrl: getCustomBaseUrl(settings) || null,
        onUsage: setAiUsage,
        onProgress: (current, total) =>
          setAiProgress({
            current,
            total,
            status: `${t("aiProcessingPage")} ${current}/${total}`,
          }),
        onLog: (entry) =>
          setAiLogs((prev) => [...prev, entry]),
      });
      if (questions.length === 0) {
        alert(t("noQuestions"));
        setCurrentPage("crop");
        triggerSimpleAnimation();
        return;
      }
      setEditingTest({ ...editingTest, questions: questions });
      setCurrentPage("edit");
      triggerSimpleAnimation();
      alert(t("questionsDetected").replace("{count}", questions.length));
    } catch (error) {
      alert((language === "vi" ? "Lỗi AI: " : "AI Error: ") + error.message);
    } finally {
      setIsProcessing(false);
      setAiProgress({ current: 0, total: 0, status: "" });
    }
  };

  const shareTest = async (test) => {
    const now = Date.now();
    const lastShare = localStorage.getItem("azota-last-share");
    if (lastShare && now - parseInt(lastShare) < 30000) { // 30 seconds
      alert("Please wait 30 seconds before sharing another test.");
      return;
    }
    localStorage.setItem("azota-last-share", now.toString());
    try {
      const code = await uploadSharedTest(test);
      setShareCode(code);
      setShowShareModal(true);
    } catch (error) {
      alert("Failed to share test: " + error.message);
    }
  };

  const importByCode = async () => {
    const code = importCode.toUpperCase().trim();
    if (!code) return;
    try {
      const testData = await fetchSharedTest(code);
      const newTest = {
        ...testData,
        id: Date.now(),
        name: `${testData.name} (Imported)`,
        createdAt: new Date().toLocaleDateString(),
      };
      setTests([...tests, newTest]);
      setShowImportModal(false);
      setImportCode("");
      alert(`Test "${newTest.name}" imported successfully!`);
    } catch (error) {
      alert("Failed to import test: " + error.message);
    }
  };

  const createBlankTest = () => {
    const newTest = {
      id: Date.now(),
      name: `Blank Test ${new Date().toLocaleString()}`,
      type: "blank",
      questions: [],
      settings: {
        immediateFeedback: false,
        scrambleOptions: false,
      },
      createdAt: new Date().toLocaleDateString(),
    };
    setTests([...tests, newTest]);
    setEditingTest(newTest);
    setCurrentPage("edit");
    triggerSimpleAnimation();
  };

  const editTest = (test) => {
    setEditingTest(test);
    setCurrentPage("edit");
    playPageTransitionSound();
    triggerSimpleAnimation();
  };

  const exitEditing = () => {
    setEditingTest(null);
    setCurrentPage("home");
    triggerSimpleAnimation();
  };

  const deleteTest = (test) => {
    if (confirm(t("testDeleted")))
      setTests(tests.filter((item) => item.id !== test.id));
  };

  const saveTest = () => {
    if (
      editingTest.questions.some((q) => q.correctAnswer.length === 0) &&
      !confirm(t("noCorrectAnswers"))
    )
      return;
    setTests(
      tests.map((item) => (item.id === editingTest.id ? editingTest : item)),
    );
    setEditingTest(null);
    setCurrentPage("home");
    triggerSimpleAnimation();
    alert(t("saveSuccess"));
  };

  const handleFinishCropping = (questions) => {
    setEditingTest({ ...editingTest, questions });
    setCurrentPage("edit");
    triggerSimpleAnimation();
  };

  const startTestWithQuestions = (test, questions, mode = "full") => {
    // Handle scrambled options if enabled
    let processedQuestions = questions;
    if (test.settings?.scrambleOptions) {
      processedQuestions = applyScrambledOptions(questions);
    }

    setCurrentTest({ ...test, questions: processedQuestions });
    setTestResults(null);
    setRetakeMode(mode);
    setCurrentPage("test");
    playPageTransitionSound();
    triggerSimpleAnimation();
  };

  const startTest = (test) =>
    startTestWithQuestions(test, test.questions, "full");

  const submitTest = (answers) => {
    const { score } = gradeTest(currentTest.questions, answers);
    setTestResults({
      score,
      total: currentTest.questions.length,
      answers,
    });
    setCurrentPage("results");
    triggerSimpleAnimation();
  };

  const goHome = () => {
    setCurrentPage("home");
    setCurrentTest(null);
  };

  const retakeTest = () => {
    setTestResults(null);
    setCurrentPage("test");
  };

  const retakeIncorrect = () => {
    if (!testResults || !currentTest) return;
    startTestWithQuestions(
      currentTest,
      getIncorrectQuestions(currentTest, testResults.answers),
      "incorrect",
    );
  };

  const exitTest = () => {
    setCurrentTest(null);
    setCurrentPage("home");
  };

  const getRapidSourceTest = () =>
    tests.find((item) =>
      item.questions.some((q) => q.id === rapidCurrentQuestion?.id),
    ) || currentTest;

  const startRapidTest = (test) => {
    const questions = test.questions.filter((q) => q.type !== "none");
    setRapidCurrentQuestion(null);
    setRapidAnswer(null);
    setRapidShowResult(false);
    setRapidScore(0);
    setRapidAnsweredQuestions(new Set());
    setRapidTotalQuestions(questions.length);
    getRandomRapidQuestion(questions);
    setCurrentPage("rapid-test");
    playPageTransitionSound();
    triggerSimpleAnimation();
  };

  const getRandomRapidQuestion = (questions) => {
    const available = questions.filter(
      (q) => !rapidAnsweredQuestions.has(q.id),
    );
    if (available.length === 0) {
      setCurrentPage("rapid-results");
      playTestCompleteSound();
      triggerSimpleAnimation();
      return;
    }
    setRapidCurrentQuestion(
      available[Math.floor(Math.random() * available.length)],
    );
    setRapidAnswer(null);
    setRapidShowResult(false);
    playQuestionAppearSound();
  };

  const submitRapidAnswer = () => {
    if (!rapidCurrentQuestion || !rapidAnswer) return;
    const isCorrect = isAnswerCorrect(rapidCurrentQuestion, rapidAnswer);
    setRapidShowResult(true);
    if (isCorrect) {
      setRapidScore((p) => p + 1);
      playCorrectSound();
    } else playIncorrectSound();
    setRapidAnsweredQuestions((p) => new Set([...p, rapidCurrentQuestion.id]));
  };

  const nextRapidQuestion = () =>
    getRandomRapidQuestion(
      getRapidSourceTest().questions.filter((q) => q.type !== "none"),
    );

  const restartRapidTest = () => {
    setRapidScore(0);
    setRapidAnsweredQuestions(new Set());
    getRandomRapidQuestion(
      getRapidSourceTest().questions.filter((q) => q.type !== "none"),
    );
  };

  const exitRapidTest = () => {
    setCurrentPage("home");
    setRapidCurrentQuestion(null);
    setRapidAnswer(null);
    setRapidShowResult(false);
    triggerSimpleAnimation();
  };

  const appUI = {
    currentPage,
    setCurrentPage,
    openSettings: (tab = "ai") => {
      setSettingsTab(tab);
      setCurrentPage("settings");
    },
    shareCode,
    showShareModal,
    setShowShareModal,
    showImportModal,
    setShowImportModal,
    importCode,
    setImportCode,
    importByCode,
  };

  const renderCurrentPage = () => {
    if (currentPage === "settings") {
      return (
        <SettingsPage
          initialTab={settingsTab}
          onTabChange={setSettingsTab}
          aiUsage={aiUsage}
          onUsage={setAiUsage}
        />
      );
    }

    if (currentPage === "pdf-mode-select" && editingTest) {
      return (
        <ModeSelectPage
          mode="pdf"
          pageCount={editingTest.pages.length}
          isProcessing={isProcessing}
          aiProgress={aiProgress}
          aiLogs={aiLogs}
          aiLogAlwaysVisible={loadLogExpanded()}
          onAutoDetect={autoDetectQuestions}
          onManualCrop={() => {
            setCurrentPage("crop");
            triggerSimpleAnimation();
          }}
          onAiExtract={() => runAiExtract("page")}
          onCancel={exitEditing}
        />
      );
    }

    if (currentPage === "image-mode-select" && editingTest) {
      return (
        <ModeSelectPage
          mode="image"
          pageCount={editingTest.pages.length}
          isProcessing={isProcessing}
          aiProgress={aiProgress}
          aiLogs={aiLogs}
          aiLogAlwaysVisible={loadLogExpanded()}
          onManualCrop={() => {
            setCurrentPage("crop");
            triggerSimpleAnimation();
          }}
          onAiExtract={() => runAiExtract("image")}
          onCancel={exitEditing}
        />
      );
    }

    if (currentPage === "crop" && editingTest) {
      return (
        <CropPage
          test={editingTest}
          onFinish={handleFinishCropping}
          onCancel={exitEditing}
        />
      );
    }

    if (currentPage === "home") {
      return (
        <HomePage
          tests={tests}
          isProcessing={isProcessing}
          processingLabel={processingLabel}
          onPdfUpload={handlePdfUpload}
          onImageUpload={handleImageUpload}
          onTestUpload={handleTestUpload}
          onTextUpload={handleTextUpload}
          onDocxUpload={handleDocxUpload}
          onImportByCode={() => setShowImportModal(true)}
          onCreateBlankTest={createBlankTest}
          onEditTest={editTest}
          onStartTest={startTest}
          onStartRapidTest={startRapidTest}
          onDownloadTest={downloadTest}
          onShareTest={shareTest}
          onDeleteTest={deleteTest}
        />
      );
    }

    if (currentPage === "edit" && editingTest) {
      return (
        <EditPage
          test={editingTest}
          onChangeTest={setEditingTest}
          onSave={saveTest}
          onExit={exitEditing}
        />
      );
    }

    if (currentPage === "test" && currentTest) {
      return (
        <TestPage
          test={currentTest}
          retakeMode={retakeMode}
          onSubmit={submitTest}
          onExit={exitTest}
        />
      );
    }

    if (currentPage === "results" && testResults && currentTest) {
      const incorrectQuestions = getIncorrectQuestions(
        currentTest,
        testResults.answers,
      );
      return (
        <ResultsPage
          results={testResults}
          incorrectQuestions={incorrectQuestions}
          onHome={goHome}
          onRetake={retakeTest}
          onRetakeIncorrect={retakeIncorrect}
        />
      );
    }

    if (currentPage === "rapid-test") {
      return (
        <RapidTestPage
          question={rapidCurrentQuestion}
          answer={rapidAnswer}
          onAnswerChange={setRapidAnswer}
          showResult={rapidShowResult}
          score={rapidScore}
          totalQuestions={rapidTotalQuestions}
          onConfirm={submitRapidAnswer}
          onNext={nextRapidQuestion}
          onExit={exitRapidTest}
        />
      );
    }

    if (currentPage === "rapid-results") {
      return (
        <RapidResultsPage
          score={rapidScore}
          totalQuestions={rapidTotalQuestions}
          onRestart={restartRapidTest}
          onExit={exitRapidTest}
        />
      );
    }

    return null;
  };

  return (
    <AppUIContext.Provider value={appUI}>
      {ambientAnimation && <AmbientBackground />}
      <Suspense fallback={<PageFallback />}>
        {renderCurrentPage()}
      </Suspense>
      <AIChatAssistant onUsage={setAiUsage} />
    </AppUIContext.Provider>
  );
};

export default VisualTestPlatform;
