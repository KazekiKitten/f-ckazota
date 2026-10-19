import { Suspense, lazy, useState, useEffect, useRef } from "react";
import { X, ChevronLeft, ChevronRight, Plus, RotateCw } from "lucide-react";
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
import PageWrapper from "./components/PageWrapper";
import Button from "./components/ui/Button";
import {
  parseQuestionsFromText,
  parseQuestionsFromDocx,
  applyScrambledOptions,
  gradeTest,
  getIncorrectQuestions,
  isAnswerCorrect,
  renumberQuestions,
} from "./lib/questions";
import { detectQuestionsFromPages } from "./lib/autoDetect";
import { extractQuestions } from "./lib/ai";
import { downloadTest, uploadSharedTest, fetchSharedTest } from "./lib/testIO";

const USAGE_STORAGE_KEY = "azota-ai-usage";

const loadAiUsage = () => {
  try {
    const saved = JSON.parse(localStorage.getItem(USAGE_STORAGE_KEY) || "{}");
    return {
      requests: typeof saved.requests === "number" ? saved.requests : null,
      tokens: typeof saved.tokens === "number" ? saved.tokens : null,
      calls: typeof saved.calls === "number" ? saved.calls : 0,
      updatedAt: typeof saved.updatedAt === "number" ? saved.updatedAt : null,
    };
  } catch {
    return { requests: null, tokens: null, calls: 0, updatedAt: null };
  }
};

const saveAiUsage = (usage) => {
  try {
    localStorage.setItem(USAGE_STORAGE_KEY, JSON.stringify(usage));
  } catch {
    // storage unavailable: usage simply won't persist
  }
};

// Rotates an image data URL by the given degrees (multiples of 90) and
// returns a new JPEG data URL.
const rotateDataUrl = (src, degrees) =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const quarterTurn = Math.abs(degrees) % 180 === 90;
      const canvas = document.createElement("canvas");
      canvas.width = quarterTurn ? img.height : img.width;
      canvas.height = quarterTurn ? img.width : img.height;
      const ctx = canvas.getContext("2d");
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((degrees * Math.PI) / 180);
      ctx.drawImage(img, -img.width / 2, -img.height / 2);
      resolve(canvas.toDataURL("image/jpeg", 0.92));
    };
    img.onerror = () => reject(new Error("Could not rotate image"));
    img.src = src;
  });

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
  const [aiUsage, setAiUsage] = useState(loadAiUsage);
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

  // Image upload preview state
  const [imagePreviews, setImagePreviews] = useState([]);
  const [imageFileNames, setImageFileNames] = useState([]);
  const [enlargedIndex, setEnlargedIndex] = useState(null);
  const [removedImage, setRemovedImage] = useState(null);
  const undoTimerRef = useRef(null);

  useEffect(() => () => clearTimeout(undoTimerRef.current), []);

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
      setImagePreviews(images);
      setImageFileNames(files.map((f) => f.name));
      setCurrentPage("image-preview");
      triggerSimpleAnimation();
    } catch (error) {
      alert((language === "vi" ? "Lỗi: " : "Error: ") + error.message);
    } finally {
      setIsProcessing(false);
      setProcessingLabel(null);
    }
  };

  const handleReorderImages = (fromIndex, toIndex) => {
    if (fromIndex === toIndex) return;
    setImagePreviews((prev) => {
      const next = [...prev];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });
    setImageFileNames((prev) => {
      const next = [...prev];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });
  };

  const handleRemoveImage = (index) => {
    const src = imagePreviews[index];
    if (src === undefined) return;
    // Remember the last removed image so it can be restored with Undo
    setRemovedImage({ src, name: imageFileNames[index] || "", index });
    clearTimeout(undoTimerRef.current);
    undoTimerRef.current = setTimeout(() => setRemovedImage(null), 6000);
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
    setImageFileNames((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUndoRemove = () => {
    if (!removedImage) return;
    const { src, name, index } = removedImage;
    const insertAt = (list, value) => {
      const next = [...list];
      next.splice(Math.min(index, next.length), 0, value);
      return next;
    };
    setImagePreviews((prev) => insertAt(prev, src));
    setImageFileNames((prev) => insertAt(prev, name));
    clearTimeout(undoTimerRef.current);
    setRemovedImage(null);
  };

  const handleAddMoreImages = async (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    if (files.length === 0) return;
    setIsProcessing(true);
    try {
      const images = await readImagesAsDataUrls(files);
      setImagePreviews((prev) => [...prev, ...images]);
      setImageFileNames((prev) => [...prev, ...files.map((f) => f.name)]);
    } catch (error) {
      alert((language === "vi" ? "Lỗi: " : "Error: ") + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRotateImage = async (index, degrees = 90) => {
    const src = imagePreviews[index];
    if (!src) return;
    try {
      const rotated = await rotateDataUrl(src, degrees);
      setImagePreviews((prev) =>
        prev.map((img, i) => (i === index && img === src ? rotated : img)),
      );
    } catch (error) {
      alert((language === "vi" ? "Lỗi: " : "Error: ") + error.message);
    }
  };

  const handleConfirmImages = () => {
    if (imagePreviews.length === 0) return;
    const newTest = {
      id: Date.now(),
      name: `Test ${new Date().toLocaleString()}`,
      type: "visual",
      pages: imagePreviews,
      questions: [],
      settings: {
        immediateFeedback: false,
        scrambleOptions: false,
      },
      createdAt: new Date().toLocaleDateString(),
    };
    setTests([...tests, newTest]);
    setEditingTest(newTest);
    setImagePreviews([]);
    setImageFileNames([]);
    setRemovedImage(null);
    setEnlargedIndex(null);
    clearTimeout(undoTimerRef.current);
    setCurrentPage("image-mode-select");
    triggerSimpleAnimation();
  };

  const handleCancelImages = () => {
    setImagePreviews([]);
    setImageFileNames([]);
    setRemovedImage(null);
    setEnlargedIndex(null);
    clearTimeout(undoTimerRef.current);
    setCurrentPage("home");
    triggerSimpleAnimation();
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
      const numberedQuestions = renumberQuestions(questions);
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

  const handleAiUsage = (usage) => {
    if (!usage) return;
    setAiUsage((prev) => {
      const next = {
        requests: usage.requests !== null ? usage.requests : prev.requests,
        tokens: usage.tokens !== null ? usage.tokens : prev.tokens,
        calls: prev.calls + 1,
        updatedAt: Date.now(),
      };
      saveAiUsage(next);
      return next;
    });
  };

  const resetAiUsage = () => {
    const next = { requests: null, tokens: null, calls: 0, updatedAt: null };
    saveAiUsage(next);
    setAiUsage(next);
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
      const result = await extractQuestions({
        pages: editingTest.pages,
        providerId: settings.provider,
        model: getActiveModel(settings),
        apiKey,
        mode,
        extraRequest,
        baseUrl: getCustomBaseUrl(settings) || null,
        onUsage: handleAiUsage,
        onProgress: (current, total) =>
          setAiProgress({
            current,
            total,
            status: `${t("aiProcessingPage")} ${current}/${total}`,
          }),
        onLog: (entry) =>
          setAiLogs((prev) => [...prev, entry]),
      });
      if (result.questions.length === 0) {
        alert(t("noQuestions"));
        setCurrentPage("crop");
        triggerSimpleAnimation();
        return;
      }
      setEditingTest({
        ...editingTest,
        questions: renumberQuestions(result.questions),
      });
      setCurrentPage("edit");
      triggerSimpleAnimation();
      alert(t("questionsDetected").replace("{count}", result.questions.length));
      if (result.failedPages.length > 0) {
        alert(
          t("failedPagesAlert", {
            pages: result.failedPages.map((p) => p.page).join(", "),
          }),
        );
      }
    } catch (error) {
      alert((language === "vi" ? "Lỗi AI: " : "AI Error: ") + error.message);
    } finally {
      setIsProcessing(false);
      setAiProgress({ current: 0, total: 0, status: "" });
    }
  };

  // Permission failures almost always mean the Firestore security rules
  // haven't been published, so say that instead of the raw driver message.
  // Firebase reports this as a code ("permission-denied") on some SDK paths
  // and as a sentence ("Missing or insufficient permissions") on others.
  const isPermissionFailure = (error) => {
    const text = `${error?.code || ""} ${error?.message || ""}`.toLowerCase();
    return (
      text.includes("permission-denied") ||
      text.includes("permission_denied") ||
      text.includes("insufficient permissions") ||
      text.includes("missing or insufficient")
    );
  };

  const describeShareError = (error, language) => {
    if (isPermissionFailure(error)) {
      return language === "vi"
        ? "Bị từ chối quyền truy cập Firestore. Hãy publish Firestore security rules cho collection sharedTests (và userPrefs/userSecrets nếu dùng đồng bộ). Xem tab Tài khoản trong Cài đặt để lấy đoạn rules."
        : "Firestore permission denied. Publish the security rules for the sharedTests collection (plus userPrefs/userSecrets if you use sync). See the Account tab in Settings for the rules to paste.";
    }
    const code = error?.code || error?.message || "";
    if (code.includes("unavailable")) {
      return language === "vi"
        ? "Firestore không phản hồi. Kiểm tra kết nối mạng rồi thử lại."
        : "Firestore is unreachable. Check your connection and try again.";
    }
    return code.slice(0, 200) || "Unknown error";
  };

  const shareTest = async (test) => {
    const now = Date.now();
    const lastShare = localStorage.getItem("azota-last-share");
    if (lastShare && now - parseInt(lastShare) < 30000) { // 30 seconds
      alert("Please wait 30 seconds before sharing another test.");
      return;
    }
    try {
      const code = await uploadSharedTest(test);
      // Only rate-limit successful shares, so a failure can be retried at once
      localStorage.setItem("azota-last-share", now.toString());
      setShareCode(code);
      setShowShareModal(true);
    } catch (error) {
      alert(
        (language === "vi" ? "Chia sẻ thất bại: " : "Failed to share test: ") +
          describeShareError(error, language),
      );
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
      alert(
        (language === "vi" ? "Nhập thất bại: " : "Failed to import test: ") +
          describeShareError(error, language),
      );
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
          onUsage={handleAiUsage}
          onResetUsage={resetAiUsage}
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

    if (currentPage === "image-preview") {
      return (
        <ImagePreviewPage
          images={imagePreviews}
          fileNames={imageFileNames}
          onRemove={handleRemoveImage}
          onReorder={handleReorderImages}
          onRotate={handleRotateImage}
          onAddImages={handleAddMoreImages}
          onConfirm={handleConfirmImages}
          onCancel={handleCancelImages}
          onEnlarge={setEnlargedIndex}
          enlargedIndex={enlargedIndex}
          onCloseEnlarge={() => setEnlargedIndex(null)}
          removedImage={removedImage}
          onUndoRemove={handleUndoRemove}
          isProcessing={isProcessing}
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
      <AIChatAssistant onUsage={handleAiUsage} />
    </AppUIContext.Provider>
  );
};

export default VisualTestPlatform;

const ImagePreviewPage = ({
  images,
  fileNames,
  onRemove,
  onReorder,
  onRotate,
  onAddImages,
  onConfirm,
  onCancel,
  onEnlarge,
  enlargedIndex,
  onCloseEnlarge,
  removedImage,
  onUndoRemove,
  isProcessing,
}) => {
  const { t, language } = useLanguage();
  const { playClickSound } = useSound();
  const tr = (en, vi) => (language === "vi" ? vi : en);

  const [dragIndex, setDragIndex] = useState(null);
  const [hoverIndex, setHoverIndex] = useState(null);
  const addInputRef = useRef(null);
  const [isTouchOnly] = useState(
    () =>
      typeof window !== "undefined" &&
      !!window.matchMedia?.("(hover: none)").matches,
  );

  const resetDrag = () => {
    setDragIndex(null);
    setHoverIndex(null);
  };

  const handleDragStart = (e, index) => {
    setDragIndex(index);
    e.dataTransfer.setData("text/plain", String(index));
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (hoverIndex !== index) setHoverIndex(index);
  };

  const handleDrop = (e, targetIndex) => {
    e.preventDefault();
    if (dragIndex === null) return resetDrag();
    if (dragIndex !== targetIndex) onReorder(dragIndex, targetIndex);
    resetDrag();
  };

  const enlargedSrc = enlargedIndex !== null ? images[enlargedIndex] : null;

  // Escape closes the enlarged view, arrows move between images, and the
  // page behind it doesn't scroll while it is open.
  useEffect(() => {
    if (enlargedIndex === null) return;
    const goTo = (delta) => {
      const next = enlargedIndex + delta;
      if (next >= 0 && next < images.length) onEnlarge(next);
    };
    const handleKey = (e) => {
      if (e.key === "Escape") onCloseEnlarge();
      else if (e.key === "ArrowLeft") goTo(-1);
      else if (e.key === "ArrowRight") goTo(1);
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKey);
    return () => {
      window.removeEventListener("keydown", handleKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [enlargedIndex, images.length]);

  const countLabel =
    images.length === 1 && language !== "vi"
      ? "1 image uploaded"
      : t("imageUploaded", { count: images.length });

  const hint = isTouchOnly
    ? `${tr("Use the arrows to reorder", "Dùng mũi tên để sắp xếp")} · ${tr("Tap to enlarge", "Chạm để phóng to")}`
    : `${t("dragToReorder")} · ${t("clickToEnlarge")}`;

  const gridCols =
    images.length <= 1
      ? "grid-cols-1 sm:grid-cols-2"
      : "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4";

  const openAddDialog = () => addInputRef.current?.click();

  return (
    <PageWrapper>
      <div className="mb-6 flex items-center gap-3">
        <button
          onClick={onCancel}
          className="icon-btn"
          aria-label={t("back")}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div className="text-left">
          <h2 className="text-xl font-semibold tracking-tight">
            {t("imagePreview")}
          </h2>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            {countLabel}
          </p>
        </div>
      </div>

      <input
        ref={addInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={onAddImages}
      />

      {images.length === 0 ? (
        <div className="card flex flex-col items-center gap-3 px-6 py-16 text-center">
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            {tr(
              "No images left. Add some to continue.",
              "Không còn ảnh nào. Hãy thêm ảnh để tiếp tục.",
            )}
          </p>
          <Button size="sm" onClick={openAddDialog} disabled={isProcessing}>
            {tr("Add images", "Thêm ảnh")}
          </Button>
        </div>
      ) : (
        <div
          className={`grid gap-4 ${gridCols}`}
          role="list"
          aria-label={t("imagePreview")}
        >
          {images.map((img, index) => {
            const isDropTarget =
              dragIndex !== null &&
              hoverIndex === index &&
              dragIndex !== index;
            const name = fileNames[index] || "";
            return (
              <div
                key={index}
                role="listitem"
                data-image-index={index}
                className={`card relative overflow-hidden ${dragIndex === index ? "opacity-50" : ""}`}
                style={
                  isDropTarget
                    ? {
                        outline: "2px dashed var(--accent)",
                        outlineOffset: "-2px",
                        background: "var(--accent-soft)",
                      }
                    : undefined
                }
                draggable={true}
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDrop={(e) => handleDrop(e, index)}
                onDragEnd={resetDrag}
              >
                <div
                  className="relative"
                  style={{ background: "var(--surface-2)" }}
                >
                  <button
                    type="button"
                    className="block w-full"
                    onClick={() => {
                      playClickSound();
                      onEnlarge(index);
                    }}
                    aria-label={`${t("enlargeTitle")}: ${name || index + 1}`}
                  >
                    <img
                      src={img}
                      alt={name || `Image ${index + 1}`}
                      className="h-56 w-full object-contain"
                      draggable={false}
                    />
                  </button>
                  <div className="absolute top-2 left-2 right-2 flex justify-between pointer-events-none">
                    <span
                      className="badge badge-accent pointer-events-auto"
                      style={{
                        background: "var(--accent)",
                        color: "#fff",
                        boxShadow: "0 1px 4px rgba(0,0,0,0.5)",
                      }}
                    >
                      {index + 1}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemove(index);
                      }}
                      className="icon-btn pointer-events-auto"
                      style={{
                        color: "var(--danger)",
                        background: "rgba(0,0,0,0.65)",
                      }}
                      title={t("removeImage")}
                      aria-label={t("removeImage")}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                </div>

                <div
                  className="flex items-center gap-1 px-2 py-2"
                  style={{ borderTop: "1px solid var(--border)" }}
                >
                  <span
                    className="min-w-0 flex-1 truncate text-left text-xs"
                    style={{ color: "var(--text-muted)" }}
                    title={name}
                  >
                    {name}
                  </span>
                  <button
                    type="button"
                    className="icon-btn disabled:cursor-not-allowed disabled:opacity-30"
                    onClick={() => onReorder(index, index - 1)}
                    disabled={index === 0}
                    title={tr("Move left", "Di chuyển sang trái")}
                    aria-label={tr("Move left", "Di chuyển sang trái")}
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    className="icon-btn"
                    onClick={() => onRotate(index)}
                    title={tr("Rotate", "Xoay")}
                    aria-label={tr("Rotate", "Xoay")}
                  >
                    <RotateCw className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    className="icon-btn disabled:cursor-not-allowed disabled:opacity-30"
                    onClick={() => onReorder(index, index + 1)}
                    disabled={index === images.length - 1}
                    title={tr("Move right", "Di chuyển sang phải")}
                    aria-label={tr("Move right", "Di chuyển sang phải")}
                  >
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })}

          <button
            type="button"
            onClick={openAddDialog}
            disabled={isProcessing}
            className="flex min-h-[16rem] flex-col items-center justify-center gap-2 border-2 border-dashed text-sm transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-50"
            style={{
              borderColor: "var(--border)",
              color: "var(--text-muted)",
            }}
          >
            <Plus className="h-6 w-6" />
            {tr("Add more images", "Thêm ảnh")}
          </button>
        </div>
      )}

      {images.length > 0 && (
        <p
          className="mt-4 text-xs text-center"
          style={{ color: "var(--text-muted)" }}
        >
          {hint}
        </p>
      )}

      <div
        className="sticky bottom-0 z-20 mt-8 -mx-4 border-t border-[var(--border)] bg-[var(--surface-2)] px-4 py-3 sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:p-0"
      >
        <div className="flex flex-row gap-3 sm:justify-start [&>button]:h-10 [&>button]:flex-1 [&>button]:justify-center [&>button]:px-5 sm:[&>button]:min-w-[12rem] sm:[&>button]:flex-none">
          <Button
            variant="secondary"
            size="sm"
            onClick={onCancel}
            disabled={isProcessing}
          >
            {t("cancelUpload")}
          </Button>
          <Button
            size="sm"
            onClick={onConfirm}
            disabled={isProcessing || images.length === 0}
          >
            {t("confirmImages")}
          </Button>
        </div>
      </div>

      {removedImage && (
        <div
          className="card fixed bottom-24 left-1/2 z-40 flex -translate-x-1/2 items-center gap-4 px-4 py-2 text-sm animate-fade-in"
          style={{ boxShadow: "var(--shadow-lg)" }}
          role="status"
          aria-live="polite"
        >
          <span>{tr("Image removed", "Đã xóa ảnh")}</span>
          <button
            type="button"
            onClick={onUndoRemove}
            className="font-semibold"
            style={{ color: "var(--accent)" }}
          >
            {tr("Undo", "Hoàn tác")}
          </button>
        </div>
      )}

      {enlargedSrc && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fade-in"
          onClick={onCloseEnlarge}
          role="dialog"
          aria-modal="true"
          aria-label={t("enlargeTitle")}
        >
          <div
            className="card relative max-w-[90vw] max-h-[90vh] overflow-y-auto animate-dialog-in"
            style={{ boxShadow: "var(--shadow-lg)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3 border-b px-5 py-3">
              <h3
                className="text-sm font-semibold"
                style={{ color: "var(--text)" }}
              >
                {t("enlargeTitle")}{" "}
                <span
                  className="font-normal"
                  style={{ color: "var(--text-muted)" }}
                >
                  {enlargedIndex + 1} / {images.length}
                </span>
              </h3>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => onRotate(enlargedIndex)}
                  className="icon-btn"
                  title={tr("Rotate", "Xoay")}
                  aria-label={tr("Rotate", "Xoay")}
                >
                  <RotateCw className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={onCloseEnlarge}
                  className="icon-btn"
                  aria-label={t("back")}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="relative flex items-center justify-center p-5">
              <img
                src={enlargedSrc}
                alt={t("enlargeTitle")}
                className="max-w-[90vw] max-h-[75vh] object-contain"
              />
              {enlargedIndex > 0 && (
                <button
                  type="button"
                  onClick={() => onEnlarge(enlargedIndex - 1)}
                  className="icon-btn absolute left-2 top-1/2 -translate-y-1/2"
                  style={{ background: "rgba(0,0,0,0.65)", color: "#fff" }}
                  aria-label={tr("Previous image", "Ảnh trước")}
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
              )}
              {enlargedIndex < images.length - 1 && (
                <button
                  type="button"
                  onClick={() => onEnlarge(enlargedIndex + 1)}
                  className="icon-btn absolute right-2 top-1/2 -translate-y-1/2"
                  style={{ background: "rgba(0,0,0,0.65)", color: "#fff" }}
                  aria-label={tr("Next image", "Ảnh sau")}
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </PageWrapper>
  );
};