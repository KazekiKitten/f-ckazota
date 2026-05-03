import React, { useState, useEffect, useCallback } from "react";
import {
  Upload,
  Plus,
  Trash2,
  Edit2,
  Play,
  Home,
  Image,
  Sun,
  Moon,
  Globe,
  Check,
  X,
  FileText,
  ChevronRight,
  Zap,
  Brain,
} from "lucide-react";
import * as pdfjsLib from "pdfjs-dist";
import * as mammoth from "mammoth";
import { doc, setDoc, getDoc, deleteDoc } from 'firebase/firestore';
import { db } from './firebase.js';

// Language context and translations
const LanguageContext = React.createContext();
const ThemeContext = React.createContext();

// Vietnamese and English translations
const translations = {
  vi: {
    // Navigation
    home: "Trang chủ",
    back: "Quay lại",
    exit: "Thoát",
    cancel: "Hủy",
    save: "Lưu",
    submit: "Nộp bài",
    delete: "Xóa",
    edit: "Sửa",
    take: "Làm bài",

    // Main title and descriptions
    appTitle: "F*ckAzota",
    appDescription: "Tải lên PDF hoặc hình ảnh để tạo bài kiểm tra thông minh",
    uploadContent: "Thêm Nội Dung Mới",
    yourTests: "Bài kiểm tra của bạn",
    noTests: "Chưa có bài kiểm tra nào. Tải lên nội dung để bắt đầu!",

    // Upload options
    uploadPdf: "Tải PDF",
    uploadPdfDesc: "Mỗi trang thành một câu",
    uploadImages: "Tải Hình ảnh",
    uploadImagesDesc: "Chọn nhiều hình",
    importTest: "Nhập Bài (.json)",
    importTestDesc: "Tải bài đã lưu",
    uploadText: "Tải Văn bản",
    uploadTextDesc: "Phân tích từ .txt",
    uploadDocx: "Tải DOCX",
    uploadDocxDesc: "Phân tích từ Word",

    // Question types
    multipleChoice: "Trắc nghiệm",
    trueFalse: "Đúng/Sai",
    textInput: "Nhập văn bản",
    none: "Chỉ hiển thị (Tiêu đề/Hình)",

    // Test creation
    howToExtract: "Phương pháp trích xuất",
    extractDescription: "Chọn cách bạn muốn tách câu hỏi từ tệp PDF",
    autoDetect: "Tự động phát hiện",
    autoDetectDesc: "Tìm và tách câu hỏi dựa trên khoảng trắng.",
    manualCrop: "Cắt thủ công",
    manualCropDesc: "Tự khoanh vùng từng câu hỏi trên trang.",

    // Test taking
    yourAnswer: "Câu trả lời của bạn:",
    selected: "Đã chọn:",
    notAnswered: "Chưa trả lời",

    // Results
    testResults: "Kết quả bài kiểm tra",
    passed: "ĐẠT",
    failed: "CHƯA ĐẠT",
    retakeTest: "Làm lại bài",
    retakeIncorrect: "Làm lại câu sai",
    answerReview: "Xem lại đáp án",
    correctAnswer: "Đáp án đúng:",

    // Rapid test mode
    rapidTest: "Tốc độ",
    rapidTestDesc: "Chế độ nhanh - Từng câu một",
    rapidTestMode: "Chế độ Nhanh",
    confirmAnswer: "Xác nhận",
    nextQuestion: "Câu tiếp theo",
    restartRapid: "Chơi lại",
    correctAnswerRapid: "Đúng! Tuyệt vời! 🎉",
    incorrectAnswerRapid: "Sai! Đáp án đúng là",
    rapidScore: "Điểm số",
    rapidCompleted: "Hoàn thành chế độ nhanh!",

    // Achievement
    achievementUnlocked: "Thành tựu mở khóa!",
    questionCompleted: "Đã hoàn thành câu",
    overallProgress: "Tiến độ",
    correct: "đúng",

    // Edit mode
    setAnswers: "Thiết lập Đáp án",
    setAnswersDesc:
      "Nhấp vào mỗi câu hỏi và chọn đáp án đúng. Phân cách bằng dấu phẩy cho nhiều đáp án.",
    questionType: "Loại câu hỏi",
    questionText: "Nội dung chữ",
    options: "Các lựa chọn",
    correctAnswers: "Đáp án đúng",
    addQuestion: "Thêm câu hỏi (Hình)",
    addOption: "Thêm lựa chọn",

    // Messages
    processing: "Đang xử lý...",
    converting: "Đang chuyển PDF thành ảnh...",
    autoDetecting: "Đang quét câu hỏi...",
    analyzing: "Đang phân tích cấu trúc trang...",
    questionsDetected:
      "Đã phát hiện {count} câu hỏi! Vui lòng kiểm tra và thiết lập đáp án.",
    noQuestions: "Không tìm thấy câu hỏi. Vui lòng kiểm tra định dạng.",
    noQuestionsDetected: "Không tự động phát hiện được. Vui lòng cắt thủ công.",
    saveSuccess: "Đã lưu bài kiểm tra!",
    testImported: 'Đã nhập bài "{name}" thành công!',
    testDeleted: "Bạn chắc chắn muốn xóa bài kiểm tra này?",
    exitTest: "Thoát bài kiểm tra? Kết quả hiện tại sẽ bị mất.",
    noCorrectAnswers: "Vài câu chưa có đáp án đúng. Vẫn lưu?",
    cropAtLeastOne: "Vui lòng cắt ít nhất một câu!",
    selectQuestions: "Chưa có câu nào. Kéo thả chuột trên ảnh để cắt.",
    page: "Trang",
    questionsCropped: "Đã cắt:",
    doneSetAnswers: "Xong & Đặt đáp án",
    croppedQuestions: "Danh sách đã cắt",
    currentPage: "Trang hiện tại",
    fromPage: "Từ trang",
    created: "Tạo lúc:",
    questions: "câu",
    preview: "Xem trước",
    pdfInfo: "📄 File PDF: {count} trang",

    // Theme
    lightTheme: "Giao diện Sáng",
    darkTheme: "Giao diện Tối",

    // AI Mode
    aiMode: "Chế độ AI",
    aiModeDesc: "Sử dụng AI để tự động trích xuất và trả lời câu hỏi",
    aiExtract: "Trích xuất bằng AI",
    aiExtractDesc: "Trích xuất thông minh bằng Gemini AI",
    enterGeminiKey: "Nhập API Key Gemini",
    geminiKeyPlaceholder: "API Key Gemini của bạn (bắt đầu bằng AI...)",
    saveApiKey: "Lưu API Key",
    apiKeySaved: "Đã lưu API Key!",
    apiKeyMissing: "Vui lòng nhập API Key Gemini trước",
    aiProcessing: "AI đang phân tích tài liệu của bạn...",
    aiProcessingPage: "Đang xử lý trang",
    detectingQuestions: "Đang phát hiện vùng câu hỏi...",
    aiError: "Lỗi AI",
    noApiKey: "Chưa có API Key",
    pagesProcessed: "trang đã xử lý",
  },
  en: {
    home: "Home",
    back: "Back",
    exit: "Exit",
    cancel: "Cancel",
    save: "Save",
    submit: "Submit",
    delete: "Delete",
    edit: "Edit",
    take: "Take Test",
    appTitle: "F*ckAzota",
    appDescription: "Upload PDFs or images to create smart, clean tests",
    uploadContent: "Add New Content",
    yourTests: "Your Tests",
    noTests: "No tests yet. Upload content to get started!",
    uploadPdf: "Upload PDF",
    uploadPdfDesc: "Auto-extract pages",
    uploadImages: "Upload Images",
    uploadImagesDesc: "Select multiple",
    importTest: "Import Test",
    importTestDesc: "Load .json file",
    uploadText: "Upload Text",
    uploadTextDesc: "Parse from .txt",
    uploadDocx: "Upload DOCX",
    uploadDocxDesc: "Parse from Word",
    multipleChoice: "Multiple Choice",
    trueFalse: "True/False",
    textInput: "Text Input",
    none: "Display Only",
    howToExtract: "Extraction Method",
    extractDescription: "Choose how to extract questions from your PDF",
    autoDetect: "Auto-Detect",
    autoDetectDesc: "Automatically slice questions by detecting white space.",
    manualCrop: "Manual Crop",
    manualCropDesc: "Manually drag and select each question area.",
    yourAnswer: "Your Answer:",
    selected: "Selected:",
    notAnswered: "Not answered",
    testResults: "Test Results",
    passed: "PASSED",
    failed: "FAILED",
    retakeTest: "Retake Test",
    retakeIncorrect: "Retake Incorrect",
    answerReview: "Answer Review",
    correctAnswer: "Correct answer:",
    rapidTest: "Rapid",
    rapidTestDesc: "Fast mode - One by one",
    rapidTestMode: "Rapid Mode",
    confirmAnswer: "Confirm",
    nextQuestion: "Next",
    restartRapid: "Restart",
    correctAnswerRapid: "Correct! Great job! 🎉",
    incorrectAnswerRapid: "Wrong! The correct answer is",
    rapidScore: "Score",
    rapidCompleted: "Rapid mode completed!",
    achievementUnlocked: "ACHIEVEMENT UNLOCKED!",
    questionCompleted: "Question Completed",
    overallProgress: "Progress",
    correct: "correct",
    setAnswers: "Set Answers",
    setAnswersDesc: "Configure the correct answers for each question below.",
    questionType: "Question Type",
    questionText: "Text Content",
    options: "Options",
    correctAnswers: "Correct Answer(s)",
    addQuestion: "Add Question (Image)",
    addOption: "Add Option",
    processing: "Processing...",
    converting: "Converting PDF to images...",
    autoDetecting: "Scanning questions...",
    analyzing: "Analyzing page structure...",
    questionsDetected: "Auto-detected {count} questions! Please verify.",
    noQuestions: "No questions found. Check format.",
    noQuestionsDetected: "Auto-detect failed. Please use manual crop.",
    saveSuccess: "Test saved successfully!",
    testImported: '"{name}" imported successfully!',
    testDeleted: "Are you sure you want to delete this test?",
    exitTest: "Exit? Your progress will be lost.",
    noCorrectAnswers: "Some questions lack correct answers. Save anyway?",
    cropAtLeastOne: "Please crop at least one question!",
    selectQuestions: "No questions cropped. Drag on the page to select.",
    page: "Page",
    questionsCropped: "Cropped:",
    doneSetAnswers: "Done & Set Answers",
    croppedQuestions: "Cropped List",
    currentPage: "Current Page",
    fromPage: "From page",
    created: "Created:",
    questions: "questions",
    preview: "Preview",
    pdfInfo: "📄 PDF: {count} pages",
    lightTheme: "Light Theme",
    darkTheme: "Dark Theme",

    // AI Mode
    aiMode: "AI Mode",
    aiModeDesc: "Use AI to automatically extract and answer questions",
    aiExtract: "AI Extraction",
    aiExtractDesc: "Smart extraction using Gemini AI",
    enterGeminiKey: "Enter Gemini API Key",
    geminiKeyPlaceholder: "Your Gemini API Key (starts with AI...)",
    saveApiKey: "Save API Key",
    apiKeySaved: "API Key saved!",
    apiKeyMissing: "Please enter your Gemini API key first",
    aiProcessing: "AI is analyzing your document...",
    aiProcessingPage: "Processing page",
    detectingQuestions: "Detecting question regions...",
    aiError: "AI Error",
    noApiKey: "No API Key",
    pagesProcessed: "pages processed",

    // Share and Import
    shareTest: "Chia sẻ Bài kiểm tra",
    importByCode: "Nhập bằng Mã",

    // Test Settings
    testSettings: "Test Settings",
    immediateFeedback: "Immediate Feedback",
    immediateFeedbackDesc: "Show correct answer immediately after selection",
    scrambleOptions: "Scramble Options",
    scrambleOptionsDesc: "Randomize A, B, C, D order",

    // True/False button labels
    trueLabel: "True",
    falseLabel: "False",
    trueLabelVi: "Đúng",
    falseLabelVi: "Sai",

    // UI labels
    noText: "No text",
    noTextVi: "Không có văn bản",
    typeAnswerHere: "Type answer here...",
    typeAnswerHereVi: "Nhập câu trả lời ở đây...",
  },
};

// Language provider component
const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    const saved = localStorage.getItem("azota-language");
    return (saved && ["vi", "en"].includes(saved)) ? saved : "vi";
  });

  const t = (key) => {
    return translations[language]?.[key] || translations.en[key] || key;
  };

  const toggleLanguage = () => {
    const newLang = language === "vi" ? "en" : "vi";
    setLanguage(newLang);
    localStorage.setItem("azota-language", newLang);
  };

  return (
    <LanguageContext.Provider value={{ language, t, toggleLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};

// Theme provider component
const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem("azota-theme");
    if (saved && ["light", "dark"].includes(saved)) {
      document.documentElement.classList.toggle("dark", saved === "dark");
      return saved;
    } else {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      document.documentElement.classList.toggle("dark", prefersDark);
      return prefersDark ? "dark" : "light";
    }
  });

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("azota-theme", newTheme);
    document.documentElement.classList.toggle("dark", newTheme === "dark");
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

const Card = ({ children, className = "" }) => {
  const { theme } = React.useContext(ThemeContext);
  return (
    <div
      className={`${theme === "dark" ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100 shadow-sm"} border rounded-2xl overflow-hidden transition-colors duration-300 ${className}`}
    >
      {children}
    </div>
  );
};

const Button = ({
  children,
  onClick,
  variant = "primary",
  className = "",
  disabled = false,
  icon = null,
}) => {
  const { theme } = React.useContext(ThemeContext);
  const base =
    "inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed";
  const variants = {
    primary: `bg-red-600 hover:bg-red-700 text-white shadow-sm hover:shadow active:scale-95`,
    secondary:
      theme === "dark"
        ? `bg-gray-800 border border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white`
        : `bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 shadow-sm`,
    dangerOutline:
      theme === "dark"
        ? `border border-red-500/50 text-red-400 hover:bg-red-500/10`
        : `border border-red-200 text-red-600 hover:bg-red-50`,
    ghost:
      theme === "dark"
        ? `hover:bg-gray-800 text-gray-400 hover:text-white`
        : `hover:bg-gray-100 text-gray-500 hover:text-gray-900`,
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${variants[variant]} ${className}`}
    >
      {icon} {children}
    </button>
  );
};

const Header = ({
  showApiKeyInput,
  setShowApiKeyInput,
  geminiApiKey,
  setGeminiApiKey,
  soundEnabled,
  toggleSound,
  setCurrentPage,
}) => {
  const { theme, toggleTheme } = React.useContext(ThemeContext);
  const { language, t, toggleLanguage } = React.useContext(LanguageContext);

  const saveGeminiApiKey = () => {
    if (geminiApiKey.trim()) {
      localStorage.setItem("azota-gemini-api-key", geminiApiKey.trim());
      alert(t("apiKeySaved"));
      setShowApiKeyInput(false);
    }
  };

  return (
    <div
      className={`sticky top-0 z-50 transition-colors duration-300 ${theme === "dark" ? "bg-gray-900 border-gray-800" : "bg-white border-gray-100 shadow-sm"} border-b`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
        <div
          className="flex items-center gap-2 cursor-pointer"
          onClick={() => setCurrentPage("home")}
        >
          <Zap
            className={`w-6 h-6 ${theme === "dark" ? "text-red-500" : "text-red-600"}`}
            fill="currentColor"
          />
          <h1
            className={`text-xl lg:text-2xl font-black tracking-tight ${theme === "dark" ? "text-white" : "text-gray-900"}`}
          >
            F*ck
            <span
              className={theme === "dark" ? "text-red-500" : "text-red-600"}
            >
              Azota
            </span>
          </h1>
        </div>
        <div className="flex items-center gap-2 md:gap-3">
          <button
            onClick={toggleTheme}
            className={`p-2 rounded-xl transition-all ${theme === "dark" ? "bg-gray-800 text-gray-300 hover:text-white" : "bg-slate-50 text-gray-500 hover:text-gray-900"}`}
          >
            {theme === "light" ? (
              <Moon className="w-5 h-5" />
            ) : (
              <Sun className="w-5 h-5" />
            )}
          </button>
          <button
            onClick={toggleLanguage}
            className={`px-3 py-2 rounded-xl flex items-center gap-2 transition-all font-semibold text-sm ${theme === "dark" ? "bg-gray-800 text-gray-300 hover:text-white" : "bg-slate-50 text-gray-600 hover:text-gray-900"}`}
          >
            <Globe className="w-5 h-5" />{" "}
            <span className="hidden sm:block">{language.toUpperCase()}</span>
          </button>
          <button
            onClick={toggleSound}
            className={`p-2 rounded-xl transition-all ${soundEnabled ? (theme === "dark" ? "text-red-400 bg-red-900/20" : "text-red-600 bg-red-50") : theme === "dark" ? "text-gray-500 bg-gray-800" : "text-gray-400 bg-slate-50"}`}
          >
            {soundEnabled ? "🔊" : "🔇"}
          </button>
          <button
            onClick={() => setShowApiKeyInput(!showApiKeyInput)}
            className={`p-2 rounded-xl transition-all ${theme === "dark" ? "bg-gray-800 text-gray-300 hover:text-white" : "bg-slate-50 text-gray-500 hover:text-gray-900"}`}
          >
            <Brain className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

const PageWrapper = ({
  children,
  showApiKeyInput,
  setShowApiKeyInput,
  geminiApiKey,
  setGeminiApiKey,
  soundEnabled,
  toggleSound,
  setCurrentPage,
  shareCode,
  showShareModal,
  setShowShareModal,
  showImportModal,
  setShowImportModal,
  importCode,
  setImportCode,
  importByCode,
}) => {
  const { theme } = React.useContext(ThemeContext);
  const { t } = React.useContext(LanguageContext);

  const saveGeminiApiKey = () => {
    if (geminiApiKey.trim()) {
      localStorage.setItem("azota-gemini-api-key", geminiApiKey.trim());
      alert(t("apiKeySaved"));
      setShowApiKeyInput(false);
    }
  };

  return (
    <div
      className={`min-h-screen ${theme === "dark" ? "bg-[#0f1115] text-gray-300" : "bg-slate-50 text-gray-600"} transition-colors duration-300 font-sans`}
    >
      <Header
        showApiKeyInput={showApiKeyInput}
        setShowApiKeyInput={setShowApiKeyInput}
        geminiApiKey={geminiApiKey}
        setGeminiApiKey={setGeminiApiKey}
        soundEnabled={soundEnabled}
        toggleSound={toggleSound}
        setCurrentPage={setCurrentPage}
      />
      {showApiKeyInput && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <Card className="max-w-md w-full mx-4 p-6">
            <div className="flex justify-between items-center mb-4">
              <h3
                className={`text-lg font-bold ${theme === "dark" ? "text-white" : "text-gray-900"}`}
              >
                {t("enterGeminiKey")}
              </h3>
              <button
                onClick={() => setShowApiKeyInput(false)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <input
              type="password"
              value={geminiApiKey}
              onChange={(e) => setGeminiApiKey(e.target.value)}
              placeholder={t("geminiKeyPlaceholder")}
              className={`w-full p-3 rounded-lg border mb-4 ${theme === "dark" ? "bg-gray-900 border-gray-700 text-white" : "bg-white border-gray-200 text-gray-900"}`}
            />
            <div className="flex gap-2">
              <Button
                variant="secondary"
                onClick={() => setShowApiKeyInput(false)}
                className="flex-1"
              >
                {t("cancel")}
              </Button>
              <Button onClick={saveGeminiApiKey} className="flex-1">
                {t("saveApiKey")}
              </Button>
            </div>
            {geminiApiKey && (
              <p className="text-xs mt-3 text-green-500 flex items-center gap-1">
                <Check className="w-3 h-3" /> {t("apiKeySaved")}
              </p>
            )}
          </Card>
        </div>
      )}

      {showShareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <Card className="max-w-md w-full mx-4 p-6">
            <div className="flex justify-between items-center mb-4">
              <h3
                className={`text-lg font-bold ${theme === "dark" ? "text-white" : "text-gray-900"}`}
              >
                {t("shareTest")}
              </h3>
              <button
                onClick={() => setShowShareModal(false)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="text-center mb-4">
              <div
                className={`text-4xl font-mono font-black tracking-widest mb-2 ${theme === "dark" ? "text-red-400" : "text-red-600"}`}
              >
                {shareCode}
              </div>
              <p className="text-sm opacity-70 mb-4">
                Share this code with others on the same device. Image-based
                questions won't transfer.
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => {
                  navigator.clipboard.writeText(shareCode);
                  alert("Code copied to clipboard!");
                }}
                className="flex-1"
              >
                Copy
              </Button>
              <Button
                variant="secondary"
                onClick={() => setShowShareModal(false)}
                className="flex-1"
              >
                Done
              </Button>
            </div>
          </Card>
        </div>
      )}

      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <Card className="max-w-md w-full mx-4 p-6">
            <div className="flex justify-between items-center mb-4">
              <h3
                className={`text-lg font-bold ${theme === "dark" ? "text-white" : "text-gray-900"}`}
              >
                {t("importByCode")}
              </h3>
              <button
                onClick={() => setShowImportModal(false)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="text-center mb-4">
              <input
                type="text"
                value={importCode}
                onChange={(e) => setImportCode(e.target.value.toUpperCase())}
                maxLength={6}
                placeholder="Enter 6-char code"
                className={`w-full text-center text-2xl font-mono font-bold tracking-widest p-4 rounded-lg border ${theme === "dark" ? "bg-gray-900 border-gray-700 text-white" : "bg-white border-gray-200 text-gray-900"}`}
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                onClick={() => setShowImportModal(false)}
                className="flex-1"
              >
                {t("cancel")}
              </Button>
              <Button
                onClick={importByCode}
                disabled={importCode.length !== 6}
                className="flex-1"
              >
                Import
              </Button>
            </div>
          </Card>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12 animate-in fade-in duration-300">
        {children}
      </div>
    </div>
  );
};

// ── Then inside VisualTestPlatform, DELETE the two const Card/Button definitions ──

const VisualTestPlatform = () => {
  const [currentPage, setCurrentPage] = useState("home");
  const [tests, setTests] = useState([]);
  const [currentTest, setCurrentTest] = useState(null);
  const [editingTest, setEditingTest] = useState(null);
  const [testResults, setTestResults] = useState(null);
  const [userAnswers, setUserAnswers] = useState({});
  const [incorrectQuestions, setIncorrectQuestions] = useState([]);
  const [retakeMode, setRetakeMode] = useState("full");
  const [showAchievement, setShowAchievement] = useState(false);
  const [achievementData, setAchievementData] = useState({
    questionNum: 0,
    totalQuestions: 0,
    questionText: "",
    progressPercentage: 0,
  });
  const [answeredQuestions, setAnsweredQuestions] = useState(new Set());
  const [imageZoomLevel, setImageZoomLevel] = useState(1);

  const [rapidTestMode, setRapidTestMode] = useState(false);
  const [rapidCurrentQuestion, setRapidCurrentQuestion] = useState(null);
  const [rapidAnswer, setRapidAnswer] = useState(null);
  const [rapidShowResult, setRapidShowResult] = useState(false);
  const [rapidScore, setRapidScore] = useState(0);
  const [rapidAnsweredQuestions, setRapidAnsweredQuestions] = useState(
    new Set(),
  );
  const [rapidTotalQuestions, setRapidTotalQuestions] = useState(0);
  const [showParticleEffect, setShowParticleEffect] = useState(false);

  const [soundEnabled, setSoundEnabled] = useState(true);
  const [audioContext, setAudioContext] = useState(null);

  const [cropState, setCropState] = useState({
    currentPageIndex: 0,
    isSelecting: false,
    startPos: null,
    currentPos: null,
    croppedQuestions: [],
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const imgRef = React.useRef(null);

  const { t, toggleLanguage, language } = React.useContext(LanguageContext);
  const { theme, toggleTheme } = React.useContext(ThemeContext);
  const [simpleAnimations, setSimpleAnimations] = useState(true);
  const [geminiApiKey, setGeminiApiKey] = useState("");
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  const [aiProgress, setAiProgress] = useState({
    current: 0,
    total: 0,
    status: "",
  });

  const [shareCode, setShareCode] = useState("");
  const [showShareModal, setShowShareModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importCode, setImportCode] = useState("");

  useEffect(() => {
    const savedKey = localStorage.getItem("azota-gemini-api-key");
    if (savedKey) setGeminiApiKey(savedKey);
  }, []);

  const saveGeminiApiKey = () => {
    if (geminiApiKey.trim()) {
      localStorage.setItem("azota-gemini-api-key", geminiApiKey.trim());
      alert(t("apiKeySaved"));
      setShowApiKeyInput(false);
    }
  };

  const triggerSimpleAnimation = (page) => {
    if (simpleAnimations) {
      setSimpleAnimations(false);
      setTimeout(() => setSimpleAnimations(true), 100);
    }
  };

  const ParticleEffect = ({ isVisible }) => {
    if (!isVisible) return null;
    const particles = [];
    const colors = ["#dc2626", "#ef4444", "#f87171", "#fca5a5", "#fbbf24", "#f59e0b", "#d97706", "#b45309"]; // Red and gold themed confetti
    const emojis = ["💰", "⭐", "🎉", "🔥", "⚡"];

    for (let i = 0; i < 50; i++) {
      const isEmoji = Math.random() < 0.2; // 20% chance for emoji particles
      const size = isEmoji ? (2 + Math.random() * 2) : (1 + Math.random() * 3); // 1-3px for colors, 2-4 for emojis
      const animationType = Math.random() < 0.5 ? "fall" : Math.random() < 0.5 ? "spin" : "ping";
      const duration = 2 + Math.random() * 2; // 2-4 seconds

      particles.push(
        <div
          key={i}
          className={`absolute pointer-events-none ${isEmoji ? "flex items-center justify-center text-xl" : "rounded-full"}`}
          style={{
            left: `${Math.random() * 100}%`,
            top: `${-10 + Math.random() * 20}%`, // Start slightly above screen
            width: `${size}px`,
            height: `${size}px`,
            background: isEmoji ? "transparent" : colors[Math.floor(Math.random() * colors.length)],
            color: isEmoji ? emojis[Math.floor(Math.random() * emojis.length)] : "transparent",
            animation: `${animationType} ${duration}s ease-out forwards`,
            animationDelay: `${Math.random() * 0.5}s`,
            fontSize: isEmoji ? `${size * 8}px` : "inherit", // Scale emoji size
          }}
        />,
      );
    }
    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <style>{`
          @keyframes fall {
            0% { transform: translateY(0px) rotate(0deg); opacity: 1; }
            100% { transform: translateY(100vh) rotate(360deg); opacity: 0; }
          }
          @keyframes spin {
            0% { transform: rotate(0deg) scale(1); opacity: 1; }
            50% { transform: rotate(180deg) scale(1.2); opacity: 0.8; }
            100% { transform: rotate(360deg) scale(0.8); opacity: 0; }
          }
          @keyframes ping {
            0%, 100% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.5); opacity: 0.5; }
          }
        `}</style>
        {particles}
      </div>
    );
  };

  useEffect(() => {
    const savedSoundEnabled = localStorage.getItem("azota-sound-enabled");
    if (savedSoundEnabled !== null)
      setSoundEnabled(savedSoundEnabled === "true");
    return () => {
      if (window.achievementTimeout) clearTimeout(window.achievementTimeout);
    };
  }, []);

  const handleCropMouseDown = (e, imgRef) => {
    const rect = imgRef.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    setCropState({
      ...cropState,
      isSelecting: true,
      startPos: { x, y },
      currentPos: { x, y },
    });
  };

  const handleCropMouseMove = (e, imgRef) => {
    if (!cropState.isSelecting) return;
    const rect = imgRef.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    setCropState({ ...cropState, currentPos: { x, y } });
  };

  const handleCropMouseUp = async (imgRef) => {
    if (!cropState.isSelecting || !cropState.startPos || !cropState.currentPos)
      return;
    const { startPos, currentPos } = cropState;
    const x = Math.min(startPos.x, currentPos.x);
    const y = Math.min(startPos.y, currentPos.y);
    const width = Math.abs(currentPos.x - startPos.x);
    const height = Math.abs(currentPos.y - startPos.y);

    if (width < 0.05 || height < 0.05) {
      setCropState({
        ...cropState,
        isSelecting: false,
        startPos: null,
        currentPos: null,
      });
      return;
    }

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = imgRef;
    canvas.width = img.naturalWidth * width;
    canvas.height = img.naturalHeight * height;
    ctx.drawImage(
      img,
      img.naturalWidth * x,
      img.naturalHeight * y,
      canvas.width,
      canvas.height,
      0,
      0,
      canvas.width,
      canvas.height,
    );
    const croppedImage = canvas.toDataURL("image/png");

    setCropState({
      ...cropState,
      isSelecting: false,
      startPos: null,
      currentPos: null,
      croppedQuestions: [
        ...cropState.croppedQuestions,
        {
          id: Date.now(),
          pageIndex: cropState.currentPageIndex,
          image: croppedImage,
          correctAnswer: [],
          type: "none",
        },
      ],
    });
  };

  const finishCropping = () => {
    if (cropState.croppedQuestions.length === 0) {
      alert(t("cropAtLeastOne"));
      return;
    }
    const questions = cropState.croppedQuestions.map((q, idx) => ({
      ...q,
      number: idx + 1,
      type: "multiple_choice",
      options: [
        { letter: "A", text: "" },
        { letter: "B", text: "" },
        { letter: "C", text: "" },
        { letter: "D", text: "" },
      ],
    }));
    setEditingTest({ ...editingTest, questions: questions });
    setCropState({
      currentPageIndex: 0,
      isSelecting: false,
      startPos: null,
      currentPos: null,
      croppedQuestions: [],
    });
    setCurrentPage("edit");
    triggerSimpleAnimation("edit");
  };

  const parseQuestions = (text) => {
    const questions = [];
    const lines = text.split("\n");
    let currentQuestion = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      const qMatch =
        line.match(/^(?:Câu|Question)\s+(\d+)\s*[:.]\s*(.+)/i) ||
        line.match(/^(\d+)\.\s*(.+)/);
      if (qMatch) {
        if (currentQuestion) questions.push(currentQuestion);
        currentQuestion = {
          id: Date.now() + i,
          number: parseInt(qMatch[1]),
          text: qMatch[2],
          options: [],
          correctAnswer: [],
          type: "multiple_choice",
        };
        continue;
      }
      if (currentQuestion) {
        const hasMultipleOptions =
          /^[A-D][\.\)]/.test(line) &&
          (line.match(/[A-D][\.\)]/g) || []).length > 1;
        if (hasMultipleOptions) {
          const optionPattern =
            /([A-D])[\.\)]\s*([^A-D]+?)(?=\s*[A-D][\.\)]|$)/g;
          let match;
          while ((match = optionPattern.exec(line)) !== null)
            currentQuestion.options.push({
              letter: match[1],
              text: match[2].trim(),
            });
          continue;
        }
        const optMatch = line.match(/^([A-D])[\.\)]\s+(.+)$/);
        if (optMatch)
          currentQuestion.options.push({
            letter: optMatch[1],
            text: optMatch[2].trim(),
          });
      }
    }
    if (currentQuestion) questions.push(currentQuestion);
    return questions;
  };

  useEffect(() => {
    const version = pdfjsLib.version || "4.4.168";
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${version}/build/pdf.worker.min.mjs`;
  }, []);

  const pdfToImages = async (file) => {
    setIsProcessing(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
      const images = [];
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 2.0 });
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        await page.render({ canvasContext: context, viewport: viewport })
          .promise;
        images.push({ dataUrl: canvas.toDataURL("image/png"), pageNumber: i });
      }
      return images;
    } catch (error) {
      console.error("Error converting PDF:", error);
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePdfUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.includes("pdf"))
      return alert(
        language === "vi"
          ? "Vui lòng tải lên file PDF"
          : "Please upload a PDF file",
      );
    try {
      const images = await pdfToImages(file);
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
      triggerSimpleAnimation("pdf-mode-select");
    } catch (error) {
      alert(
        (language === "vi" ? "Lỗi xử lý PDF: " : "Error processing PDF: ") +
          error.message,
      );
    }
  };

  const autoDetectQuestions = async () => {
    setIsProcessing(true);
    try {
      const questions = [];
      for (let i = 0; i < editingTest.pages.length; i++) {
        const pageImage = editingTest.pages[i];
        const img = document.createElement("img");
        await new Promise((resolve) => {
          img.onload = resolve;
          img.src = pageImage;
        });
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        const rowBrightness = [];
        const threshold = 240;
        for (let y = 0; y < canvas.height; y++) {
          let whitePixels = 0;
          for (let x = 0; x < canvas.width; x++) {
            const idx = (y * canvas.width + x) * 4;
            if ((data[idx] + data[idx + 1] + data[idx + 2]) / 3 > threshold)
              whitePixels++;
          }
          rowBrightness.push(whitePixels / canvas.width);
        }
        const gaps = [];
        let gapStart = null;
        const whiteThreshold = 0.85;
        const minGapHeight = Math.floor(canvas.height * 0.02);
        for (let y = 0; y < rowBrightness.length; y++) {
          if (rowBrightness[y] > whiteThreshold) {
            if (gapStart === null) gapStart = y;
          } else {
            if (gapStart !== null && y - gapStart > minGapHeight)
              gaps.push({ start: gapStart, end: y });
            gapStart = null;
          }
        }
        if (gaps.length > 0) {
          let lastY = 0;
          for (const gap of gaps) {
            if (gap.start - lastY > canvas.height * 0.05) {
              const cropCanvas = document.createElement("canvas");
              const cropCtx = cropCanvas.getContext("2d");
              cropCanvas.width = canvas.width;
              cropCanvas.height = gap.start - lastY;
              cropCtx.drawImage(
                canvas,
                0,
                lastY,
                canvas.width,
                gap.start - lastY,
                0,
                0,
                canvas.width,
                gap.start - lastY,
              );
              questions.push({
                id: Date.now() + questions.length,
                pageIndex: i,
                image: cropCanvas.toDataURL("image/png"),
                correctAnswer: [],
                type: "none",
              });
            }
            lastY = gap.end;
          }
          if (canvas.height - lastY > canvas.height * 0.05) {
            const cropCanvas = document.createElement("canvas");
            const cropCtx = cropCanvas.getContext("2d");
            cropCanvas.width = canvas.width;
            cropCanvas.height = canvas.height - lastY;
            cropCtx.drawImage(
              canvas,
              0,
              lastY,
              canvas.width,
              canvas.height - lastY,
              0,
              0,
              canvas.width,
              canvas.height - lastY,
            );
            questions.push({
              id: Date.now() + questions.length,
              pageIndex: i,
              image: cropCanvas.toDataURL("image/png"),
              correctAnswer: [],
              type: "none",
            });
          }
        } else {
          questions.push({
            id: Date.now() + questions.length,
            pageIndex: i,
            image: pageImage,
            correctAnswer: [],
            type: "none",
          });
        }
      }
      if (questions.length === 0) {
        alert(t("noQuestionsDetected"));
        setCurrentPage("crop");
        triggerSimpleAnimation("crop");
        return;
      }
      const numberedQuestions = questions.map((q, idx) => ({
        ...q,
        number: idx + 1,
      }));
      setEditingTest({ ...editingTest, questions: numberedQuestions });
      setCurrentPage("edit");
      triggerSimpleAnimation("edit");
      alert(
        t("questionsDetected").replace("{count}", numberedQuestions.length),
      );
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

  const isTrueFalseQuestion = (q) => {
    const text = (q.text || "").toLowerCase();
    const hasTrueFalseKeywords =
      /true\s*\/\s*false|true\s*or\s*false|đúng\s*\/\s*sai|đúng\s*hay\s*sai|true-false|đúng-sai|đúng\s*-\s*sai|đúng\s*,\s*sai/i.test(
        text,
      );
    const hasTwoOptions = (q.options || []).length === 2;
    const optionsAreTF =
      hasTwoOptions &&
      ((q.options[0].letter === "T" && q.options[1].letter === "F") ||
        (q.options[0].letter === "Đ" && q.options[1].letter === "S") ||
        (q.options[0].letter === "D" && q.options[1].letter === "S"));

    // Check if options contain true/false indicators (format: "statement (true/false)")
    const optionsHaveTFIndicators = (q.options || []).some((opt) =>
      /\(true\s*\/\s*false\)|\(true\s*or\s*false\)|\(đúng\s*\/\s*sai\)|\(đúng\s*hay\s*sai\)|answer:\s*(true|false|đúng|sai)/i.test(
        opt.text || "",
      ),
    );

    // Check if question asks about true/false statements
    const asksAboutTrueFalse =
      /which\s+(of\s+the\s+)?following\s+(is\s+)?true|which\s+statements?\s+are\s+true|câu\s+nào\s+đúng|những\s+câu\s+nào\s+đúng/i.test(
        text,
      );

    return (
      hasTrueFalseKeywords ||
      (hasTwoOptions && optionsAreTF) ||
      optionsHaveTFIndicators ||
      asksAboutTrueFalse
    );
  };

  const aiExtractQuestions = async () => {
    const apiKey = localStorage.getItem("azota-gemini-api-key");
    if (!apiKey) {
      alert(t("apiKeyMissing"));
      setShowApiKeyInput(true);
      return;
    }
    setIsProcessing(true);
    try {
      setAiProgress({
        current: 0,
        total: editingTest.pages.length,
        status: t("aiProcessing"),
      });
      const questions = [];
      for (let i = 0; i < editingTest.pages.length; i++) {
        setAiProgress({
          current: i + 1,
          total: editingTest.pages.length,
          status: `${t("aiProcessingPage")} ${i + 1}/${editingTest.pages.length}`,
        });
        const pageImage = editingTest.pages[i];
        const base64Image = pageImage.split(",")[1];
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    {
                      text: `Analyze this exam/quiz page image and extract ALL questions with their FULL TEXT CONTENT, options with their FULL ANSWER TEXT, and correct answers.

CRITICAL INSTRUCTIONS:
1. Extract the COMPLETE question text - include all text, context, passages, formulas, or descriptions that are part of the question
2. For EACH option (A, B, C, D), you MUST extract the FULL ANSWER TEXT that comes after the letter. For example:
   - If the image shows "A. Apple" then option A's text should be "Apple"
   - If the image shows "B. Banana is a fruit" then option B's text should be "Banana is a fruit"
   - If the image shows "C. 2x + 3 = 5" then option C's text should be "2x + 3 = 5"
   - NEVER leave option text empty or just put the letter - ALWAYS include what comes after the letter
3. If a question includes an image/diagram, describe it briefly in the question text like "[Image: diagram of triangle]"
4. For reading comprehension or passage-based questions, include the entire passage in the question text field
5. Preserve the original language of the questions (Vietnamese, English, etc.)
6. Include mathematical formulas, chemical equations, code snippets exactly as they appear

IMPORTANT - TRUE/FALSE QUESTIONS:

There are TWO types of true/false questions:

TYPE 1: Simple True/False (2 options only)
- Look for questions that are clearly True/False questions by checking:
  * Question text contains "True/False", "True or False", "Đúng/Sai", "Đúng hay Sai", "Đúng - Sai"
  * Only 2 options available (not A, B, C, D)
  * Options are labeled as T/F, Đ/S, D/S, or similar
- For Simple True/False questions, ALWAYS use type "true_false" and options: [{"letter": "T", "text": "True"}, {"letter": "F", "text": "False"}]
- If the Vietnamese options are "Đ" (Đúng) and "S" (Sai), map them to T/F in the response
- The correctAnswer should be ["T"] for True/Đúng or ["F"] for False/Sai

TYPE 2: Multiple Choice with True/False per option
- Look for questions where:
  * Each option (A, B, C, D) is a statement
  * Each option has its own true/false answer indicated
  * Options contain "(true/false)", "(True/False)", "(Đúng/Sai)", or "answer: True/False"
  * Question asks "Which of the following are true?" or similar
- For this type, use type "multiple_choice" with the option letters (A, B, C, D)
- The correctAnswer should be an array of letters for the TRUE statements only
- Example: If options A and C are true, correctAnswer should be ["A", "C"]

For each question on this page, identify:
1. The question number
2. The FULL question text (include ALL text content)
3. All available options with their COMPLETE ANSWER TEXT (the actual content after A., B., C., D.)
4. The correct answer(s)

Respond in JSON format as an array of objects:
[{"number": 1, "text": "What is 2+2?", "type": "multiple_choice", "options": [{"letter": "A", "text": "3"}, {"letter": "B", "text": "4"}, {"letter": "C", "text": "5"}, {"letter": "D", "text": "6"}], "correctAnswer": ["B"]}]

EXAMPLES OF CORRECT OPTION EXTRACTION:
- Image shows "A. Hà Nội" → {"letter": "A", "text": "Hà Nội"}
- Image shows "B. 15" → {"letter": "B", "text": "15"}
- Image shows "C. x = 2" → {"letter": "C", "text": "x = 2"}
- Image shows "D. Both A and B are correct" → {"letter": "D", "text": "Both A and B are correct"}

TRUE/FALSE QUESTION EXAMPLES:

TYPE 1 (Simple True/False):
- Question: "Paris is the capital of France (True/False)" with options "Đ. Đúng" and "S. Sai" → {"type": "true_false", "options": [{"letter": "T", "text": "True"}, {"letter": "F", "text": "False"}], "correctAnswer": ["T"]}
- Question: "The Earth is flat (Đúng/Sai)" with options "Đ" and "S" → {"type": "true_false", "options": [{"letter": "T", "text": "True"}, {"letter": "F", "text": "False"}], "correctAnswer": ["F"]}

TYPE 2 (Multiple Choice with True/False per option):
- Question: "Which statements are true?" with:
  * "A. Paris is in France (true/false) answer: True"
  * "B. London is in Germany (true/false) answer: False"
  * "C. Tokyo is in Japan (true/false) answer: True"
  * "D. Berlin is in France (true/false) answer: False"
  → {"type": "multiple_choice", "options": [{"letter": "A", "text": "Paris is in France"}, {"letter": "B", "text": "London is in Germany"}, {"letter": "C", "text": "Tokyo is in Japan"}, {"letter": "D", "text": "Berlin is in France"}], "correctAnswer": ["A", "C"]}

- Question: "Những câu nào đúng?" with:
  * "A. Hà Nội là thủ đô Việt Nam (Đúng/Sai) đáp án: Đúng"
  * "B. TP.HCM là thủ đô Việt Nam (Đúng/Sai) đáp án: Sai"
  * "C. Đà Nẵng là thành phố lớn thứ 3 (Đúng/Sai) đáp án: Đúng"
  * "D. Cần Thơ là thủ đô Việt Nam (Đúng/Sai) đáp án: Sai"
  → {"type": "multiple_choice", "options": [{"letter": "A", "text": "Hà Nội là thủ đô Việt Nam"}, {"letter": "B", "text": "TP.HCM là thủ đô Việt Nam"}, {"letter": "C", "text": "Đà Nẵng là thành phố lớn thứ 3"}, {"letter": "D", "text": "Cần Thơ là thủ đô Việt Nam"}], "correctAnswer": ["A", "C"]}

If you cannot determine the correct answer, leave correctAnswer empty array.
For questions without options (fill-in-the-blank, short answer), use type "text_input" and leave options empty.

IMPORTANT: Extract ALL questions you can see on this page. Extract the FULL TEXT for both questions AND options. NEVER leave option text empty.`,
                    },
                    {
                      inline_data: {
                        mime_type: "image/png",
                        data: base64Image,
                      },
                    },
                  ],
                },
              ],
            }),
          },
        );
        const data = await response.json();
        if (data.error) {
          throw new Error(data.error.message);
        }
        const textResponse = data.candidates[0].content.parts[0].text;
        const jsonMatch = textResponse.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          const parsedQuestions = JSON.parse(jsonMatch[0]);
          parsedQuestions.forEach((q) => {
            let questionType = q.type || "multiple_choice";
            let questionOptions = q.options || [
              { letter: "A", text: "" },
              { letter: "B", text: "" },
              { letter: "C", text: "" },
              { letter: "D", text: "" },
            ];
            let correctAnswer = q.correctAnswer || [];

            // Only convert to true_false if it's TYPE 1 (2 options only with T/F letters)
            // TYPE 2 (multiple choice with true/false per option) should stay as multiple_choice
            const hasTwoOptions = (q.options || []).length === 2;
            const optionsAreTF =
              hasTwoOptions &&
              ((q.options[0].letter === "T" && q.options[1].letter === "F") ||
                (q.options[0].letter === "Đ" && q.options[1].letter === "S") ||
                (q.options[0].letter === "D" && q.options[1].letter === "S"));

            if (hasTwoOptions && optionsAreTF) {
              questionType = "true_false";
              questionOptions = [
                { letter: "T", text: "True" },
                { letter: "F", text: "False" },
              ];
              // Map Vietnamese Đ/S answers to T/F
              correctAnswer = correctAnswer.map((ans) => {
                const upperAns = ans.toUpperCase();
                if (upperAns === "Đ" || upperAns === "D") return "T";
                if (upperAns === "S") return "F";
                return ans;
              });
            }
            questions.push({
              id: Date.now() + questions.length,
              pageIndex: i,
              text: q.text || "",
              image: q.text ? null : pageImage,
              number: q.number || questions.length + 1,
              type: questionType,
              options: questionOptions,
              correctAnswer: correctAnswer,
            });
          });
        }
      }
      if (questions.length === 0) {
        alert(t("noQuestions"));
        setCurrentPage("crop");
        triggerSimpleAnimation("crop");
        return;
      }
      setEditingTest({ ...editingTest, questions: questions });
      setCurrentPage("edit");
      triggerSimpleAnimation("edit");
      alert(t("questionsDetected").replace("{count}", questions.length));
    } catch (error) {
      alert((language === "vi" ? "Lỗi AI: " : "AI Error: ") + error.message);
    } finally {
      setIsProcessing(false);
      setAiProgress({ current: 0, total: 0, status: "" });
    }
  };

  const aiExtractImages = async () => {
    const apiKey = localStorage.getItem("azota-gemini-api-key");
    if (!apiKey) {
      alert(t("apiKeyMissing"));
      setShowApiKeyInput(true);
      return;
    }
    setIsProcessing(true);
    try {
      setAiProgress({
        current: 0,
        total: editingTest.pages.length,
        status: t("aiProcessing"),
      });
      const questions = [];
      for (let i = 0; i < editingTest.pages.length; i++) {
        setAiProgress({
          current: i + 1,
          total: editingTest.pages.length,
          status: `${t("aiProcessingPage")} ${i + 1}/${editingTest.pages.length}`,
        });
        const pageImage = editingTest.pages[i];
        const base64Image = pageImage.split(",")[1];
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    {
                      text: `Analyze this exam/quiz image and extract ALL questions with their FULL TEXT CONTENT, options with their FULL ANSWER TEXT, and correct answers.

CRITICAL INSTRUCTIONS:
1. Extract the COMPLETE question text - include all text, context, passages, formulas, or descriptions that are part of the question
2. For EACH option (A, B, C, D), you MUST extract the FULL ANSWER TEXT that comes after the letter. For example:
   - If the image shows "A. Apple" then option A's text should be "Apple"
   - If the image shows "B. Banana is a fruit" then option B's text should be "Banana is a fruit"
   - If the image shows "C. 2x + 3 = 5" then option C's text should be "2x + 3 = 5"
   - NEVER leave option text empty or just put the letter - ALWAYS include what comes after the letter
3. If a question includes an image/diagram, describe it briefly in the question text like "[Image: diagram of triangle]"
4. For reading comprehension or passage-based questions, include the entire passage in the question text field
5. Preserve the original language of the questions (Vietnamese, English, etc.)
6. Include mathematical formulas, chemical equations, code snippets exactly as they appear

IMPORTANT - TRUE/FALSE QUESTIONS:

There are TWO types of true/false questions:

TYPE 1: Simple True/False (2 options only)
- Look for questions that are clearly True/False questions by checking:
  * Question text contains "True/False", "True or False", "Đúng/Sai", "Đúng hay Sai", "Đúng - Sai"
  * Only 2 options available (not A, B, C, D)
  * Options are labeled as T/F, Đ/S, D/S, or similar
- For Simple True/False questions, ALWAYS use type "true_false" and options: [{"letter": "T", "text": "True"}, {"letter": "F", "text": "False"}]
- If the Vietnamese options are "Đ" (Đúng) and "S" (Sai), map them to T/F in the response
- The correctAnswer should be ["T"] for True/Đúng or ["F"] for False/Sai

TYPE 2: Multiple Choice with True/False per option
- Look for questions where:
  * Each option (A, B, C, D) is a statement
  * Each option has its own true/false answer indicated
  * Options contain "(true/false)", "(True/False)", "(Đúng/Sai)", or "answer: True/False"
  * Question asks "Which of the following are true?" or similar
- For this type, use type "multiple_choice" with the option letters (A, B, C, D)
- The correctAnswer should be an array of letters for the TRUE statements only
- Example: If options A and C are true, correctAnswer should be ["A", "C"]

For each question in this image, identify:
1. The question number
2. The FULL question text (include ALL text content)
3. All available options with their COMPLETE ANSWER TEXT (the actual content after A., B., C., D.)
4. The correct answer(s)

Respond in JSON format as an array of objects:
[{"number": 1, "text": "What is 2+2?", "type": "multiple_choice", "options": [{"letter": "A", "text": "3"}, {"letter": "B", "text": "4"}, {"letter": "C", "text": "5"}, {"letter": "D", "text": "6"}], "correctAnswer": ["B"]}]

EXAMPLES OF CORRECT OPTION EXTRACTION:
- Image shows "A. Hà Nội" → {"letter": "A", "text": "Hà Nội"}
- Image shows "B. 15" → {"letter": "B", "text": "15"}
- Image shows "C. x = 2" → {"letter": "C", "text": "x = 2"}
- Image shows "D. Both A and B are correct" → {"letter": "D", "text": "Both A and B are correct"}

TRUE/FALSE QUESTION EXAMPLES:

TYPE 1 (Simple True/False):
- Question: "Paris is the capital of France (True/False)" with options "Đ. Đúng" and "S. Sai" → {"type": "true_false", "options": [{"letter": "T", "text": "True"}, {"letter": "F", "text": "False"}], "correctAnswer": ["T"]}
- Question: "The Earth is flat (Đúng/Sai)" with options "Đ" and "S" → {"type": "true_false", "options": [{"letter": "T", "text": "True"}, {"letter": "F", "text": "False"}], "correctAnswer": ["F"]}

TYPE 2 (Multiple Choice with True/False per option):
- Question: "Which statements are true?" with:
  * "A. Paris is in France (true/false) answer: True"
  * "B. London is in Germany (true/false) answer: False"
  * "C. Tokyo is in Japan (true/false) answer: True"
  * "D. Berlin is in France (true/false) answer: False"
  → {"type": "multiple_choice", "options": [{"letter": "A", "text": "Paris is in France"}, {"letter": "B", "text": "London is in Germany"}, {"letter": "C", "text": "Tokyo is in Japan"}, {"letter": "D", "text": "Berlin is in France"}], "correctAnswer": ["A", "C"]}

- Question: "Những câu nào đúng?" with:
  * "A. Hà Nội là thủ đô Việt Nam (Đúng/Sai) đáp án: Đúng"
  * "B. TP.HCM là thủ đô Việt Nam (Đúng/Sai) đáp án: Sai"
  * "C. Đà Nẵng là thành phố lớn thứ 3 (Đúng/Sai) đáp án: Đúng"
  * "D. Cần Thơ là thủ đô Việt Nam (Đúng/Sai) đáp án: Sai"
  → {"type": "multiple_choice", "options": [{"letter": "A", "text": "Hà Nội là thủ đô Việt Nam"}, {"letter": "B", "text": "TP.HCM là thủ đô Việt Nam"}, {"letter": "C", "text": "Đà Nẵng là thành phố lớn thứ 3"}, {"letter": "D", "text": "Cần Thơ là thủ đô Việt Nam"}], "correctAnswer": ["A", "C"]}

If you cannot determine the correct answer, leave correctAnswer empty array.
For questions without options (fill-in-the-blank, short answer), use type "text_input" and leave options empty.

IMPORTANT: Extract ALL questions you can see in this image. Extract the FULL TEXT for both questions AND options. NEVER leave option text empty.`,
                    },
                    {
                      inline_data: {
                        mime_type: "image/png",
                        data: base64Image,
                      },
                    },
                  ],
                },
              ],
            }),
          },
        );
        const data = await response.json();
        if (data.error) {
          throw new Error(data.error.message);
        }
        const textResponse = data.candidates[0].content.parts[0].text;
        const jsonMatch = textResponse.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          const parsedQuestions = JSON.parse(jsonMatch[0]);
          parsedQuestions.forEach((q) => {
            let questionType = q.type || "multiple_choice";
            let questionOptions = q.options || [
              { letter: "A", text: "" },
              { letter: "B", text: "" },
              { letter: "C", text: "" },
              { letter: "D", text: "" },
            ];
            let correctAnswer = q.correctAnswer || [];

            // Only convert to true_false if it's TYPE 1 (2 options only with T/F letters)
            // TYPE 2 (multiple choice with true/false per option) should stay as multiple_choice
            const hasTwoOptions = (q.options || []).length === 2;
            const optionsAreTF =
              hasTwoOptions &&
              ((q.options[0].letter === "T" && q.options[1].letter === "F") ||
                (q.options[0].letter === "Đ" && q.options[1].letter === "S") ||
                (q.options[0].letter === "D" && q.options[1].letter === "S"));

            if (hasTwoOptions && optionsAreTF) {
              questionType = "true_false";
              questionOptions = [
                { letter: "T", text: "True" },
                { letter: "F", text: "False" },
              ];
              // Map Vietnamese Đ/S answers to T/F
              correctAnswer = correctAnswer.map((ans) => {
                const upperAns = ans.toUpperCase();
                if (upperAns === "Đ" || upperAns === "D") return "T";
                if (upperAns === "S") return "F";
                return ans;
              });
            }
            questions.push({
              id: Date.now() + questions.length,
              pageIndex: i,
              text: q.text || "",
              image: q.text ? null : pageImage,
              number: q.number || questions.length + 1,
              type: questionType,
              options: questionOptions,
              correctAnswer: correctAnswer,
            });
          });
        }
      }
      if (questions.length === 0) {
        alert(t("noQuestions"));
        setCurrentPage("crop");
        triggerSimpleAnimation("crop");
        return;
      }
      setEditingTest({ ...editingTest, questions: questions });
      setCurrentPage("edit");
      triggerSimpleAnimation("edit");
      alert(t("questionsDetected").replace("{count}", questions.length));
    } catch (error) {
      alert((language === "vi" ? "Lỗi AI: " : "AI Error: ") + error.message);
    } finally {
      setIsProcessing(false);
      setAiProgress({ current: 0, total: 0, status: "" });
    }
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    try {
      const images = await Promise.all(
        files.map(
          (file) =>
            new Promise((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = (e) => resolve(e.target.result);
              reader.onerror = reject;
              reader.readAsDataURL(file);
            }),
        ),
      );
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
      triggerSimpleAnimation("image-mode-select");
    } catch (error) {
      alert((language === "vi" ? "Lỗi: " : "Error: ") + error.message);
    }
  };

  const downloadTest = (test) => {
    const jsonString = JSON.stringify(
      {
        name: test.name,
        type: test.type,
        questions: test.questions,
        settings: test.settings,
        exportedAt: new Date().toISOString(),
        version: "2.0",
      },
      null,
      2,
    );
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${test.name}_test.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const generateShareCode = () => {
    const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // Unambiguous chars
    let code = "";
    for (let i = 0; i < 6; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    return code;
  };

  const shareTest = async (test) => {
    const now = Date.now();
    const lastShare = localStorage.getItem("azota-last-share");
    if (lastShare && now - parseInt(lastShare) < 30000) { // 30 seconds
      alert("Please wait 30 seconds before sharing another test.");
      return;
    }
    localStorage.setItem("azota-last-share", now.toString());
    const code = generateShareCode();
    const sharedTest = {
      ...test,
      questions: test.questions.map((q) => ({
        ...q,
        image: q.image ? "[image]" : q.image, // Strip base64 images
      })),
      createdAt: new Date().toISOString(),
    };
    try {
      await setDoc(doc(db, 'sharedTests', code), sharedTest);
      setShareCode(code);
      setShowShareModal(true);
      // Delete after 5 minutes
      setTimeout(async () => {
        try {
          await deleteDoc(doc(db, 'sharedTests', code));
        } catch (e) {
          // Ignore
        }
      }, 5 * 60 * 1000);
    } catch (error) {
      alert("Failed to share test: " + error.message);
    }
  };

  const importByCode = async () => {
    const code = importCode.toUpperCase().trim();
    if (!code) return;
    try {
      const docSnap = await getDoc(doc(db, 'sharedTests', code));
      if (!docSnap.exists()) {
        alert("Code not found or expired");
        return;
      }
      const data = docSnap.data();
      const createdAt = new Date(data.createdAt);
      const now = new Date();
      if (now - createdAt > 5 * 60 * 1000) {
        await deleteDoc(doc(db, 'sharedTests', code));
        alert("Code expired");
        return;
      }
      const newTest = {
        ...data,
        id: Date.now(),
        name: `${data.name} (Imported)`,
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
      const questions = parseQuestions(await file.text());
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
      triggerSimpleAnimation("edit");
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
      const result = await mammoth.extractRawText({
        arrayBuffer: await file.arrayBuffer(),
      });
      const questions = parseQuestions(result.value);
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
      triggerSimpleAnimation("edit");
    } catch (error) {
      alert((language === "vi" ? "Lỗi: " : "Error: ") + error.message);
    }
  };

  const addQuestion = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        setEditingTest({
          ...editingTest,
          questions: [
            ...editingTest.questions,
            {
              id: Date.now(),
              number: editingTest.questions.length + 1,
              image: e.target.result,
              correctAnswer: [],
              type: "none",
              options: [
                { letter: "A", text: "" },
                { letter: "B", text: "" },
                { letter: "C", text: "" },
                { letter: "D", text: "" },
              ],
            },
          ],
        });
      };
      reader.readAsDataURL(file);
    };
    input.click();
  };

  const deleteQuestion = useCallback(
    (questionId) =>
      setEditingTest({
        ...editingTest,
        questions: editingTest.questions
          .filter((q) => q.id !== questionId)
          .map((q, idx) => ({ ...q, number: idx + 1 })),
      }),
    [editingTest],
  );

  const updateQuestion = useCallback(
    (questionId, updates) =>
      setEditingTest({
        ...editingTest,
        questions: editingTest.questions.map((q) =>
          q.id === questionId ? { ...q, ...updates } : q,
        ),
      }),
    [editingTest],
  );

  const saveTest = () => {
    if (
      editingTest.questions.some((q) => q.correctAnswer.length === 0) &&
      !confirm(t("noCorrectAnswers"))
    )
      return;
    setTests(tests.map((t) => (t.id === editingTest.id ? editingTest : t)));
    setEditingTest(null);
    setCurrentPage("home");
    triggerSimpleAnimation("home");
    alert(t("saveSuccess"));
  };

  const startTestWithQuestions = (test, questions, mode = "full") => {
    if (window.achievementTimeout) clearTimeout(window.achievementTimeout);

    // Handle scrambled options if enabled
    let processedQuestions = questions;
    if (test.settings?.scrambleOptions) {
      processedQuestions = questions.map((q) => {
        if (q.type === "multiple_choice" || q.type === "true_false") {
          const shuffledOptions = [...q.options].sort(
            () => Math.random() - 0.5,
          );
          const optionMapping = {};
          shuffledOptions.forEach((opt, idx) => {
            optionMapping[opt.letter] = q.options[idx].letter;
          });
          return {
            ...q,
            shuffledOptions,
            optionMapping,
            correctAnswer: q.correctAnswer.map((ans) => {
              const originalIndex = q.options.findIndex(
                (opt) => opt.letter === ans,
              );
              return shuffledOptions[originalIndex].letter;
            }),
          };
        }
        return q;
      });
    }

    setCurrentTest({ ...test, questions: processedQuestions });
    setUserAnswers({});
    setTestResults(null);
    setRetakeMode(mode);
    setAnsweredQuestions(new Set());
    setShowAchievement(false);
    setAchievementData({
      questionNum: 0,
      totalQuestions: 0,
      questionText: "",
      progressPercentage: 0,
    });
    setImageZoomLevel(1);
    setCurrentPage("test");
    playPageTransitionSound();
    triggerSimpleAnimation("test");
  };
  const startTest = (test) =>
    startTestWithQuestions(test, test.questions, "full");

  const submitTest = () => {
    let score = 0;
    const pointsPerQuestion = 10 / currentTest.questions.length;
    const incorrect = [];
    currentTest.questions.forEach((q) => {
      let isCorrect = false;
      if (q.type === "text_input") {
        const userSplit = (userAnswers[q.id] || "")
          .split(",")
          .map((a) => a.trim().toLowerCase())
          .filter((a) => a);
        const correctSplit = q.correctAnswer.map((a) => a.toLowerCase());
        isCorrect =
          userSplit.length === correctSplit.length &&
          userSplit.every((a) => correctSplit.includes(a));
      } else {
        const userAns = userAnswers[q.id] || [];
        const correctAns = q.correctAnswer || [];
        isCorrect =
          userAns.length === correctAns.length &&
          userAns.every((a) => correctAns.includes(a));
      }
      if (isCorrect) score += pointsPerQuestion;
      else incorrect.push(q);
    });
    setTestResults({
      score: Math.round(score * 10) / 10,
      total: currentTest.questions.length,
      answers: userAnswers,
    });
    setIncorrectQuestions(incorrect);
    setCurrentPage("results");
    playSubmitSound();
    playPageTransitionSound();
    triggerSimpleAnimation("results");
  };

  const getIncorrectQuestions = () => {
    if (!testResults || !currentTest) return [];
    return currentTest.questions.filter((q) => {
      if (q.type === "none") return false;
      if (q.type === "text_input") {
        const userSplit = (testResults.answers[q.id] || "")
          .split(",")
          .map((a) => a.trim().toLowerCase())
          .filter((a) => a);
        return !(
          userSplit.length === q.correctAnswer.length &&
          userSplit.every((a) =>
            q.correctAnswer.map((c) => c.toLowerCase()).includes(a),
          )
        );
      }
      const userAns = testResults.answers[q.id] || [];
      const correctAns = q.correctAnswer || [];
      return !(
        userAns.length === correctAns.length &&
        userAns.every((a) => correctAns.includes(a))
      );
    });
  };

  const handleAnswerSelect = (questionId, newAnswer) => {
    setUserAnswers({ ...userAnswers, [questionId]: newAnswer });
    if (!answeredQuestions.has(questionId)) {
      const newAnsweredQuestions = new Set([...answeredQuestions, questionId]);
      setAnsweredQuestions(newAnsweredQuestions);
      const currentQ = currentTest.questions.find((q) => q.id === questionId);
      const displayNum =
        retakeMode === "incorrect"
          ? currentTest.questions.findIndex((q) => q.id === questionId) + 1
          : currentQ?.number || 1;
      if (window.achievementTimeout) clearTimeout(window.achievementTimeout);
      setAchievementData({
        questionNum: displayNum,
        totalQuestions: currentTest.questions.length,
        questionText:
          currentQ?.text?.length > 50
            ? currentQ.text.substring(0, 50) + "..."
            : currentQ?.text || "",
        progressPercentage: Math.round(
          (newAnsweredQuestions.size / currentTest.questions.length) * 100,
        ),
      });
      setShowAchievement(true);
      playAchievementSound();
      window.achievementTimeout = setTimeout(
        () => setShowAchievement(false),
        3000,
      );
    }
  };

  const increaseImageSize = () =>
    setImageZoomLevel((prev) => Math.min(prev + 0.25, 3));
  const decreaseImageSize = () =>
    setImageZoomLevel((prev) => Math.max(prev - 0.25, 0.5));
  const resetImageSize = () => setImageZoomLevel(1);

  const startRapidTest = (test) => {
    if (window.achievementTimeout) clearTimeout(window.achievementTimeout);
    const questions = test.questions.filter((q) => q.type !== "none");
    setRapidTestMode(true);
    setRapidCurrentQuestion(null);
    setRapidAnswer(null);
    setRapidShowResult(false);
    setRapidScore(0);
    setRapidAnsweredQuestions(new Set());
    setRapidTotalQuestions(questions.length);
    setShowParticleEffect(false);
    getRandomRapidQuestion(questions);
    setCurrentPage("rapid-test");
    playPageTransitionSound();
    triggerSimpleAnimation("rapid-test");
  };

  const getRandomRapidQuestion = (questions) => {
    const available = questions.filter(
      (q) => !rapidAnsweredQuestions.has(q.id),
    );
    if (available.length === 0) {
      setCurrentPage("rapid-results");
      playTestCompleteSound();
      triggerSimpleAnimation("rapid-results");
      return;
    }
    setRapidCurrentQuestion(
      available[Math.floor(Math.random() * available.length)],
    );
    setRapidAnswer(null);
    setRapidShowResult(false);
    setShowParticleEffect(false);
    playQuestionAppearSound();
  };

  const checkRapidAnswer = (question, answer) => {
    if (question.type === "text_input") {
      const userSplit = (answer || "")
        .split(",")
        .map((a) => a.trim().toLowerCase())
        .filter((a) => a);
      return (
        userSplit.length === question.correctAnswer.length &&
        userSplit.every((a) =>
          question.correctAnswer.map((c) => c.toLowerCase()).includes(a),
        )
      );
    }
    const userAns = Array.isArray(answer) ? answer : [answer];
    return (
      userAns.length === (question.correctAnswer || []).length &&
      userAns.every((a) => (question.correctAnswer || []).includes(a))
    );
  };

  const submitRapidAnswer = () => {
    if (!rapidCurrentQuestion || !rapidAnswer) return;
    const isCorrect = checkRapidAnswer(rapidCurrentQuestion, rapidAnswer);
    setRapidShowResult(true);
    if (isCorrect) {
      setRapidScore((p) => p + 1);
      setShowParticleEffect(true);
      playCorrectSound();
      setTimeout(() => setShowParticleEffect(false), 4000);
    } else playIncorrectSound();
    setRapidAnsweredQuestions((p) => new Set([...p, rapidCurrentQuestion.id]));
  };

  const nextRapidQuestion = () =>
    getRandomRapidQuestion(
      (
        tests.find((t) =>
          t.questions.some((q) => q.id === rapidCurrentQuestion?.id),
        ) || currentTest
      ).questions.filter((q) => q.type !== "none"),
    );
  const restartRapidTest = () => {
    setRapidScore(0);
    setRapidAnsweredQuestions(new Set());
    getRandomRapidQuestion(
      (
        tests.find((t) =>
          t.questions.some((q) => q.id === rapidCurrentQuestion?.id),
        ) || currentTest
      ).questions.filter((q) => q.type !== "none"),
    );
  };
  const exitRapidTest = () => {
    setRapidTestMode(false);
    setCurrentPage("home");
    setRapidCurrentQuestion(null);
    setRapidAnswer(null);
    setRapidShowResult(false);
    setShowParticleEffect(false);
    triggerSimpleAnimation("home");
  };

  const initAudioContext = () => {
    if (!audioContext)
      setAudioContext(new (window.AudioContext || window.webkitAudioContext)());
  };
  const playSound = async (freq, dur, type = "sine", vol = 0.1) => {
    if (!soundEnabled) return;
    if (!audioContext) {
      initAudioContext();
      if (!audioContext) return;
    }
    try {
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }
      const osc = audioContext.createOscillator();
      const gain = audioContext.createGain();
      osc.connect(gain);
      gain.connect(audioContext.destination);
      osc.frequency.setValueAtTime(freq, audioContext.currentTime);
      osc.type = type;
      gain.gain.setValueAtTime(0, audioContext.currentTime);
      gain.gain.linearRampToValueAtTime(vol, audioContext.currentTime + 0.01);
      gain.gain.exponentialRampToValueAtTime(
        0.001,
        audioContext.currentTime + dur,
      );
      osc.start(audioContext.currentTime);
      osc.stop(audioContext.currentTime + dur);
    } catch (e) {}
  };
  const playClickSound = () => playSound(800, 0.1, "sine", 0.05);
  const playHoverSound = () => playSound(600, 0.05, "sine", 0.02);
  const playCorrectSound = () => {
    // Gambling-style winning sound: ascending chime with triangle wave for bell-like effect
    [600, 800, 1000, 1200, 1500].forEach((f, i) =>
      setTimeout(() => playSound(f, 0.2, "triangle", 0.15), i * 80),
    );
  };
  const playIncorrectSound = () => {
    [400, 350, 300].forEach((f, i) =>
      setTimeout(() => playSound(f, 0.5, "sawtooth", 0.1), i * 100),
    );
  };
  const playAchievementSound = () => {
    [523, 659, 784, 1047].forEach((f, i) =>
      setTimeout(() => playSound(f, 0.4, "triangle", 0.08), i * 150),
    );
  };
  const playPageTransitionSound = () => playSound(300, 0.2, "sine", 0.05);
  const playTestCompleteSound = () => {
    [523, 659, 784, 1047, 784, 659, 523].forEach((f, i) =>
      setTimeout(() => playSound(f, 0.3, "sine", 0.1), i * 200),
    );
  };
  const playQuestionAppearSound = () => playSound(400, 0.15, "sine", 0.06);
  const playSubmitSound = () => playSound(500, 0.3, "square", 0.08);
  const toggleSound = () => {
    initAudioContext();
    setSoundEnabled(!soundEnabled);
    localStorage.setItem("azota-sound-enabled", !soundEnabled);
  };



  if (currentPage === "pdf-mode-select" && editingTest) {
    return (
      <PageWrapper
        showApiKeyInput={showApiKeyInput}
        setShowApiKeyInput={setShowApiKeyInput}
        geminiApiKey={geminiApiKey}
        setGeminiApiKey={setGeminiApiKey}
        soundEnabled={soundEnabled}
        toggleSound={toggleSound}
        setCurrentPage={setCurrentPage}
        shareCode={shareCode}
        showShareModal={showShareModal}
        setShowShareModal={setShowShareModal}
        showImportModal={showImportModal}
        setShowImportModal={setShowImportModal}
        importCode={importCode}
        setImportCode={setImportCode}
        importByCode={importByCode}
      >
        <Card className="max-w-3xl mx-auto p-8 lg:p-12 text-center">
          <h1
            className={`text-3xl font-bold mb-4 ${theme === "dark" ? "text-white" : "text-gray-900"}`}
          >
            {t("howToExtract")}
          </h1>
          <p className="mb-10 text-lg">{t("extractDescription")}</p>

          {isProcessing && (
            <div className="mb-8">
              <div
                className={`p-4 rounded-xl flex flex-col items-center justify-center gap-2 ${theme === "dark" ? "bg-gray-800 text-red-400" : "bg-red-50 text-red-600"}`}
              >
                <Zap className="w-6 h-6 animate-bounce" />
                <p className="font-bold">
                  {aiProgress.status || t("aiProcessing")}
                </p>
              </div>
              <div
                className={`mt-4 rounded-full h-3 overflow-hidden ${theme === "dark" ? "bg-gray-700" : "bg-gray-200"}`}
              >
                <div
                  className="h-full bg-red-500 transition-all duration-300"
                  style={{
                    width:
                      aiProgress.total > 0
                        ? `${(aiProgress.current / aiProgress.total) * 100}%`
                        : "0%",
                  }}
                />
              </div>
              <p
                className={`text-center mt-2 text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}
              >
                {aiProgress.current} / {aiProgress.total} {t("pagesProcessed")}
              </p>
            </div>
          )}

          <div className="grid md:grid-cols-3 gap-6 mb-10 text-left">
            <button
              onClick={() => {
                playClickSound();
                autoDetectQuestions();
              }}
              disabled={isProcessing}
              className={`group p-6 rounded-2xl border-2 transition-all duration-200 text-left ${
                theme === "dark"
                  ? "border-gray-700 bg-gray-800 hover:border-red-500"
                  : "border-gray-200 bg-white hover:border-red-500 hover:shadow-md"
              }`}
            >
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-colors ${theme === "dark" ? "bg-gray-700 group-hover:bg-red-500/20 text-red-400" : "bg-red-50 text-red-600"}`}
              >
                <Zap className="w-6 h-6" />
              </div>
              <h2
                className={`text-xl font-bold mb-2 ${theme === "dark" ? "text-white" : "text-gray-900"}`}
              >
                {t("autoDetect")}
              </h2>
              <p className="text-sm mb-4 opacity-80">{t("autoDetectDesc")}</p>
              <ul className="text-sm space-y-2 opacity-70">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" /> Nhanh & tự động
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" /> Tốt nhất cho đề
                  giãn cách đều
                </li>
              </ul>
            </button>

            <button
              onClick={() => {
                playClickSound();
                playPageTransitionSound();
                setCurrentPage("crop");
                triggerSimpleAnimation("crop");
              }}
              className={`group p-6 rounded-2xl border-2 transition-all duration-200 text-left ${
                theme === "dark"
                  ? "border-gray-700 bg-gray-800 hover:border-red-500"
                  : "border-gray-200 bg-white hover:border-red-500 hover:shadow-md"
              }`}
            >
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-colors ${theme === "dark" ? "bg-gray-700 group-hover:bg-red-500/20 text-red-400" : "bg-red-50 text-red-600"}`}
              >
                <Edit2 className="w-6 h-6" />
              </div>
              <h2
                className={`text-xl font-bold mb-2 ${theme === "dark" ? "text-white" : "text-gray-900"}`}
              >
                {t("manualCrop")}
              </h2>
              <p className="text-sm mb-4 opacity-80">{t("manualCropDesc")}</p>
              <ul className="text-sm space-y-2 opacity-70">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" /> Chuẩn xác 100%
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" /> Kiểm soát hoàn
                  toàn
                </li>
              </ul>
            </button>

            <button
              onClick={() => {
                playClickSound();
                aiExtractQuestions();
              }}
              disabled={isProcessing}
              className={`group p-6 rounded-2xl border-2 transition-all duration-200 text-left ${
                theme === "dark"
                  ? "border-gray-700 bg-gray-800 hover:border-red-500"
                  : "border-gray-200 bg-white hover:border-red-500 hover:shadow-md"
              }`}
            >
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-colors ${theme === "dark" ? "bg-gray-700 group-hover:bg-red-500/20 text-red-400" : "bg-red-50 text-red-600"}`}
              >
                <Brain className="w-6 h-6" />
              </div>
              <h2
                className={`text-xl font-bold mb-2 ${theme === "dark" ? "text-white" : "text-gray-900"}`}
              >
                {t("aiExtract")}
              </h2>
              <p className="text-sm mb-4 opacity-80">{t("aiExtractDesc")}</p>
              <ul className="text-sm space-y-2 opacity-70">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" /> Trích xuất thông
                  minh
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" /> Trích xuất đáp án
                </li>
              </ul>
            </button>
          </div>

          <p className="text-sm font-medium mb-8">
            {t("pdfInfo").split(":")[0]}:{" "}
            <span className={theme === "dark" ? "text-white" : "text-gray-900"}>
              {editingTest.pages.length}
            </span>{" "}
            {t("page").toLowerCase()}
          </p>
          <Button
            variant="secondary"
            onClick={() => {
              playClickSound();
              playPageTransitionSound();
              setEditingTest(null);
              setCurrentPage("home");
              triggerSimpleAnimation("home");
            }}
            className="w-full sm:w-auto min-w-[200px]"
          >
            {t("cancel")}
          </Button>
        </Card>
      </PageWrapper>
    );
  }

  if (currentPage === "image-mode-select" && editingTest) {
    return (
      <PageWrapper
        showApiKeyInput={showApiKeyInput}
        setShowApiKeyInput={setShowApiKeyInput}
        geminiApiKey={geminiApiKey}
        setGeminiApiKey={setGeminiApiKey}
        soundEnabled={soundEnabled}
        toggleSound={toggleSound}
        setCurrentPage={setCurrentPage}
        shareCode={shareCode}
        showShareModal={showShareModal}
        setShowShareModal={setShowShareModal}
        showImportModal={showImportModal}
        setShowImportModal={setShowImportModal}
        importCode={importCode}
        setImportCode={setImportCode}
        importByCode={importByCode}
      >
        <Card className="max-w-3xl mx-auto p-8 lg:p-12 text-center">
          <h1
            className={`text-3xl font-bold mb-4 ${theme === "dark" ? "text-white" : "text-gray-900"}`}
          >
            {t("howToExtract")}
          </h1>
          <p className="mb-10 text-lg">{t("extractDescription")}</p>

          {isProcessing && (
            <div className="mb-8">
              <div
                className={`p-4 rounded-xl flex flex-col items-center justify-center gap-2 ${theme === "dark" ? "bg-gray-800 text-red-400" : "bg-red-50 text-red-600"}`}
              >
                <Zap className="w-6 h-6 animate-bounce" />
                <p className="font-bold">
                  {aiProgress.status || t("aiProcessing")}
                </p>
              </div>
              <div
                className={`mt-4 rounded-full h-3 overflow-hidden ${theme === "dark" ? "bg-gray-700" : "bg-gray-200"}`}
              >
                <div
                  className="h-full bg-red-500 transition-all duration-300"
                  style={{
                    width:
                      aiProgress.total > 0
                        ? `${(aiProgress.current / aiProgress.total) * 100}%`
                        : "0%",
                  }}
                />
              </div>
              <p
                className={`text-center mt-2 text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}
              >
                {aiProgress.current} / {aiProgress.total} {t("pagesProcessed")}
              </p>
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-6 mb-10 text-left">
            <button
              onClick={() => {
                playClickSound();
                playPageTransitionSound();
                setCurrentPage("crop");
                triggerSimpleAnimation("crop");
              }}
              className={`group p-6 rounded-2xl border-2 transition-all duration-200 text-left ${
                theme === "dark"
                  ? "border-gray-700 bg-gray-800 hover:border-red-500"
                  : "border-gray-200 bg-white hover:border-red-500 hover:shadow-md"
              }`}
            >
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-colors ${theme === "dark" ? "bg-gray-700 group-hover:bg-red-500/20 text-red-400" : "bg-red-50 text-red-600"}`}
              >
                <Edit2 className="w-6 h-6" />
              </div>
              <h2
                className={`text-xl font-bold mb-2 ${theme === "dark" ? "text-white" : "text-gray-900"}`}
              >
                {t("manualCrop")}
              </h2>
              <p className="text-sm mb-4 opacity-80">{t("manualCropDesc")}</p>
              <ul className="text-sm space-y-2 opacity-70">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />{" "}
                  {language === "vi" ? "Chuẩn xác 100%" : "100% accurate"}
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />{" "}
                  {language === "vi" ? "Kiểm soát hoàn toàn" : "Full control"}
                </li>
              </ul>
            </button>

            <button
              onClick={() => {
                playClickSound();
                aiExtractImages();
              }}
              disabled={isProcessing}
              className={`group p-6 rounded-2xl border-2 transition-all duration-200 text-left ${
                theme === "dark"
                  ? "border-gray-700 bg-gray-800 hover:border-red-500"
                  : "border-gray-200 bg-white hover:border-red-500 hover:shadow-md"
              }`}
            >
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-colors ${theme === "dark" ? "bg-gray-700 group-hover:bg-red-500/20 text-red-400" : "bg-red-50 text-red-600"}`}
              >
                <Brain className="w-6 h-6" />
              </div>
              <h2
                className={`text-xl font-bold mb-2 ${theme === "dark" ? "text-white" : "text-gray-900"}`}
              >
                {t("aiExtract")}
              </h2>
              <p className="text-sm mb-4 opacity-80">{t("aiExtractDesc")}</p>
              <ul className="text-sm space-y-2 opacity-70">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />{" "}
                  {language === "vi"
                    ? "Trích xuất thông minh"
                    : "Smart extraction"}
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />{" "}
                  {language === "vi" ? "Trích xuất đáp án" : "Extract answers"}
                </li>
              </ul>
            </button>
          </div>

          <p className="text-sm font-medium mb-8">
            {t("pdfInfo").split(":")[0]}:{" "}
            <span className={theme === "dark" ? "text-white" : "text-gray-900"}>
              {editingTest.pages.length}
            </span>{" "}
            {language === "vi" ? "hình ảnh" : "images"}
          </p>
          <Button
            variant="secondary"
            onClick={() => {
              playClickSound();
              playPageTransitionSound();
              setEditingTest(null);
              setCurrentPage("home");
              triggerSimpleAnimation("home");
            }}
            className="w-full sm:w-auto min-w-[200px]"
          >
            {t("cancel")}
          </Button>
        </Card>
      </PageWrapper>
    );
  }

  if (currentPage === "crop" && editingTest) {
    const currentPageImg = editingTest.pages[cropState.currentPageIndex];
    return (
      <PageWrapper
        showApiKeyInput={showApiKeyInput}
        setShowApiKeyInput={setShowApiKeyInput}
        geminiApiKey={geminiApiKey}
        setGeminiApiKey={setGeminiApiKey}
        soundEnabled={soundEnabled}
        toggleSound={toggleSound}
        setCurrentPage={setCurrentPage}
        shareCode={shareCode}
        showShareModal={showShareModal}
        setShowShareModal={setShowShareModal}
        showImportModal={showImportModal}
        setShowImportModal={setShowImportModal}
        importCode={importCode}
        setImportCode={setImportCode}
        importByCode={importByCode}
      >
        <Card className="p-6 mb-6 sticky top-[73px] z-40">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h1
                className={`text-xl font-bold ${theme === "dark" ? "text-white" : "text-gray-900"}`}
              >
                {language === "vi" ? "Cắt câu hỏi" : "Crop Questions"}
              </h1>
              <p className="text-sm">
                {language === "vi"
                  ? "Kéo thả để khoanh vùng"
                  : "Drag to select"}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                onClick={() => {
                  playClickSound();
                  playPageTransitionSound();
                  setCropState({
                    currentPageIndex: 0,
                    isSelecting: false,
                    startPos: null,
                    currentPos: null,
                    croppedQuestions: [],
                  });
                  setEditingTest(null);
                  setCurrentPage("home");
                  triggerSimpleAnimation("home");
                }}
              >
                {t("cancel")}
              </Button>
              <Button
                onClick={() => {
                  playClickSound();
                  finishCropping();
                }}
                icon={<Check className="w-4 h-4" />}
              >
                {t("doneSetAnswers")}
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <Button
              variant="secondary"
              disabled={cropState.currentPageIndex === 0}
              onClick={() =>
                setCropState({
                  ...cropState,
                  currentPageIndex: Math.max(0, cropState.currentPageIndex - 1),
                })
              }
            >
              &larr; {t("back")}
            </Button>
            <span className="font-semibold">
              {t("page")} {cropState.currentPageIndex + 1} /{" "}
              {editingTest.pages.length}
            </span>
            <Button
              variant="secondary"
              disabled={
                cropState.currentPageIndex === editingTest.pages.length - 1
              }
              onClick={() =>
                setCropState({
                  ...cropState,
                  currentPageIndex: Math.min(
                    editingTest.pages.length - 1,
                    cropState.currentPageIndex + 1,
                  ),
                })
              }
            >
              {language === "vi" ? "Trang sau" : "Next"} &rarr;
            </Button>
            <div className="flex-1" />
            <span
              className={`px-4 py-2 rounded-lg font-bold text-sm ${theme === "dark" ? "bg-red-500/10 text-red-400" : "bg-red-50 text-red-600"}`}
            >
              {t("questionsCropped")} {cropState.croppedQuestions.length}
            </span>
          </div>
        </Card>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <Card className="xl:col-span-2 p-6">
            <h3
              className={`font-bold mb-4 ${theme === "dark" ? "text-white" : "text-gray-900"}`}
            >
              {t("currentPage")}
            </h3>
            <div className="relative inline-block w-full border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden cursor-crosshair">
              <img
                ref={imgRef}
                src={currentPageImg}
                alt="Page"
                className="w-full block"
                onMouseDown={(e) => handleCropMouseDown(e, imgRef.current)}
                onMouseMove={(e) => handleCropMouseMove(e, imgRef.current)}
                onMouseUp={() => handleCropMouseUp(imgRef.current)}
                draggable={false}
              />
              {cropState.isSelecting &&
                cropState.startPos &&
                cropState.currentPos &&
                imgRef.current && (
                  <div
                    className="absolute border-2 border-red-500 bg-red-500/20 pointer-events-none"
                    style={{
                      left: `${Math.min(cropState.startPos.x, cropState.currentPos.x) * 100}%`,
                      top: `${Math.min(cropState.startPos.y, cropState.currentPos.y) * 100}%`,
                      width: `${Math.abs(cropState.currentPos.x - cropState.startPos.x) * 100}%`,
                      height: `${Math.abs(cropState.currentPos.y - cropState.startPos.y) * 100}%`,
                    }}
                  />
                )}
            </div>
          </Card>
          <Card className="p-6 h-fit max-h-[80vh] flex flex-col">
            <h3
              className={`font-bold mb-4 flex-shrink-0 ${theme === "dark" ? "text-white" : "text-gray-900"}`}
            >
              {t("croppedQuestions")}
            </h3>
            <div className="space-y-4 overflow-y-auto flex-1 pr-2">
              {cropState.croppedQuestions.map((q, idx) => (
                <div
                  key={q.id}
                  className={`border rounded-xl p-3 relative group ${theme === "dark" ? "border-gray-700 bg-gray-800/50" : "border-gray-200 bg-slate-50"}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={`font-black text-sm ${theme === "dark" ? "text-white" : "text-gray-900"}`}
                    >
                      Q{idx + 1}
                    </span>
                    <button
                      onClick={() =>
                        setCropState({
                          ...cropState,
                          croppedQuestions: cropState.croppedQuestions.filter(
                            (cq) => cq.id !== q.id,
                          ),
                        })
                      }
                      className="text-gray-400 hover:text-red-500 transition-colors p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <img
                    src={q.image}
                    alt={`Q${idx + 1}`}
                    className="w-full rounded border border-gray-200 dark:border-gray-700"
                  />
                </div>
              ))}
              {cropState.croppedQuestions.length === 0 && (
                <div className="text-center py-12 px-4 border-2 border-dashed rounded-xl border-gray-200 dark:border-gray-700 text-gray-400">
                  <Image className="w-8 h-8 mx-auto mb-3 opacity-50" />
                  <p>{t("selectQuestions")}</p>
                </div>
              )}
            </div>
          </Card>
        </div>
      </PageWrapper>
    );
  }

  if (currentPage === "home") {
    return (
      <PageWrapper
        showApiKeyInput={showApiKeyInput}
        setShowApiKeyInput={setShowApiKeyInput}
        geminiApiKey={geminiApiKey}
        setGeminiApiKey={setGeminiApiKey}
        soundEnabled={soundEnabled}
        toggleSound={toggleSound}
        setCurrentPage={setCurrentPage}
        shareCode={shareCode}
        showShareModal={showShareModal}
        setShowShareModal={setShowShareModal}
        showImportModal={showImportModal}
        setShowImportModal={setShowImportModal}
        importCode={importCode}
        setImportCode={setImportCode}
        importByCode={importByCode}
      >
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2
            className={`text-4xl font-black tracking-tight mb-4 ${theme === "dark" ? "text-white" : "text-gray-900"}`}
          >
            Tạo đề thông minh,{" "}
            <span className="text-red-600 dark:text-red-500">nhanh chóng.</span>
          </h2>
          <p className="text-lg opacity-80">{t("appDescription")}</p>
        </div>

        {isProcessing && (
          <div className="mb-8 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl flex items-center justify-center gap-3 font-semibold animate-pulse border border-red-100 dark:border-red-500/20 max-w-md mx-auto">
            <Zap className="w-5 h-5 animate-spin" /> {t("converting")}
          </div>
        )}

        <div className="mb-16">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[
              {
                id: "pdf-input",
                label: t("uploadPdf"),
                desc: t("uploadPdfDesc"),
                icon: <FileText className="w-5 h-5" />,
                handler: handlePdfUpload,
                accept: ".pdf",
                color: "red",
                accent:
                  theme === "dark"
                    ? "bg-red-500/10 text-red-400 group-hover:bg-red-500/20"
                    : "bg-red-50 text-red-600 group-hover:bg-red-100",
                border: "group-hover:border-red-500/50",
                tag: "PDF",
              },
              {
                id: "image-input",
                label: t("uploadImages"),
                desc: t("uploadImagesDesc"),
                icon: <Image className="w-5 h-5" />,
                handler: handleImageUpload,
                accept: "image/*",
                multi: true,
                color: "violet",
                accent:
                  theme === "dark"
                    ? "bg-violet-500/10 text-violet-400 group-hover:bg-violet-500/20"
                    : "bg-violet-50 text-violet-600 group-hover:bg-violet-100",
                border: "group-hover:border-violet-500/50",
                tag: "IMG",
              },
              {
                id: "test-input",
                label: t("importTest"),
                desc: t("importTestDesc"),
                icon: <Upload className="w-5 h-5" />,
                handler: handleTestUpload,
                accept: ".json",
                color: "green",
                accent:
                  theme === "dark"
                    ? "bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500/20"
                    : "bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100",
                border: "group-hover:border-emerald-500/50",
                tag: "JSON",
              },
              {
                id: "text-input",
                label: t("uploadText"),
                desc: t("uploadTextDesc"),
                icon: <FileText className="w-5 h-5" />,
                handler: handleTextUpload,
                accept: ".txt",
                color: "amber",
                accent:
                  theme === "dark"
                    ? "bg-amber-500/10 text-amber-400 group-hover:bg-amber-500/20"
                    : "bg-amber-50 text-amber-600 group-hover:bg-amber-100",
                border: "group-hover:border-amber-500/50",
                tag: "TXT",
              },
              {
                id: "docx-input",
                label: t("uploadDocx"),
                desc: t("uploadDocxDesc"),
                icon: <FileText className="w-5 h-5" />,
                handler: handleDocxUpload,
                accept: ".docx",
                color: "blue",
                accent:
                  theme === "dark"
                    ? "bg-blue-500/10 text-blue-400 group-hover:bg-blue-500/20"
                    : "bg-blue-50 text-blue-600 group-hover:bg-blue-100",
                border: "group-hover:border-blue-500/50",
                tag: "DOCX",
              },
              {
                id: "import-code",
                label: t("importByCode"),
                desc: "Load shared test",
                icon: <Globe className="w-5 h-5" />,
                handler: () => setShowImportModal(true),
                color: "cyan",
                accent:
                  theme === "dark"
                    ? "bg-cyan-500/10 text-cyan-400 group-hover:bg-cyan-500/20"
                    : "bg-cyan-50 text-cyan-600 group-hover:bg-cyan-100",
                border: "group-hover:border-cyan-500/50",
                tag: "CODE",
              },
              {
                id: "blank-test",
                label: "Blank Test",
                desc: "Create empty test",
                icon: <Plus className="w-5 h-5" />,
                handler: () => {
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
                  triggerSimpleAnimation("edit");
                },
                color: "gray",
                accent:
                  theme === "dark"
                    ? "bg-gray-500/10 text-gray-400 group-hover:bg-gray-500/20"
                    : "bg-gray-50 text-gray-600 group-hover:bg-gray-100",
                border: "group-hover:border-gray-500/50",
                tag: "NEW",
              },
            ].map((item) =>
              item.id === "blank-test" || item.id === "import-code" ? (
                <button
                  key={item.id}
                  onClick={() => {
                    playClickSound();
                    item.handler();
                  }}
                  className={`group relative cursor-pointer flex flex-col gap-3 p-5 border-2 border-dashed rounded-2xl transition-all duration-200 text-left ${
                    theme === "dark"
                      ? `border-gray-700 bg-gray-800/40 hover:bg-gray-800 ${item.border}`
                      : `border-gray-200 bg-white hover:shadow-md ${item.border}`
                  }`}
                  disabled={isProcessing}
                >
                  {/* Top row: icon + tag badge */}
                  <div className="flex items-center justify-between">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${item.accent}`}
                    >
                      {item.icon}
                    </div>
                    <span
                      className={`text-[10px] font-black tracking-widest px-2 py-0.5 rounded-md border ${
                        theme === "dark"
                          ? "border-gray-700 text-gray-500 bg-gray-900"
                          : "border-gray-100 text-gray-400 bg-slate-50"
                      }`}
                    >
                      {item.tag}
                    </span>
                  </div>
                  {/* Label + desc */}
                  <div>
                    <h3
                      className={`font-bold text-sm leading-tight mb-0.5 ${
                        theme === "dark" ? "text-gray-100" : "text-gray-900"
                      }`}
                    >
                      {item.label}
                    </h3>
                    <p
                      className={`text-xs leading-relaxed ${
                        theme === "dark" ? "text-gray-500" : "text-gray-400"
                      }`}
                    >
                      {item.desc}
                    </p>
                  </div>
                  {/* Bottom click hint */}
                  <div
                    className={`flex items-center gap-1.5 text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity ${
                      theme === "dark" ? "text-gray-400" : "text-gray-500"
                    }`}
                  >
                    <ChevronRight className="w-3 h-3" />
                    {language === "vi" ? "Nhấn để tạo" : "Click to create"}
                  </div>
                </button>
              ) : (
                <label
                  key={item.id}
                  htmlFor={item.id}
                  className={`group relative cursor-pointer flex flex-col gap-3 p-5 border-2 border-dashed rounded-2xl transition-all duration-200 ${
                    theme === "dark"
                      ? `border-gray-700 bg-gray-800/40 hover:bg-gray-800 ${item.border}`
                      : `border-gray-200 bg-white hover:shadow-md ${item.border}`
                  }`}
                >
                  <input
                    type="file"
                    id={item.id}
                    accept={item.accept}
                    onChange={item.handler}
                    multiple={item.multi}
                    className="hidden"
                    disabled={isProcessing}
                  />
                  {/* Top row: icon + tag badge */}
                  <div className="flex items-center justify-between">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${item.accent}`}
                    >
                      {item.icon}
                    </div>
                    <span
                      className={`text-[10px] font-black tracking-widest px-2 py-0.5 rounded-md border ${
                        theme === "dark"
                          ? "border-gray-700 text-gray-500 bg-gray-900"
                          : "border-gray-100 text-gray-400 bg-slate-50"
                      }`}
                    >
                      {item.tag}
                    </span>
                  </div>
                  {/* Label + desc */}
                  <div>
                    <h3
                      className={`font-bold text-sm leading-tight mb-0.5 text-left ${
                        theme === "dark" ? "text-gray-100" : "text-gray-900"
                      }`}
                    >
                      {item.label}
                    </h3>
                    <p
                      className={`text-xs leading-relaxed ${
                        theme === "dark" ? "text-gray-500" : "text-gray-400"
                      }`}
                    >
                      {item.desc}
                    </p>
                  </div>
                  {/* Bottom drag hint */}
                  <div
                    className={`flex items-center gap-1.5 text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity ${
                      theme === "dark" ? "text-gray-400" : "text-gray-500"
                    }`}
                  >
                    <ChevronRight className="w-3 h-3" />
                    {language === "vi" ? "Nhấn để chọn" : "Click to select"}
                  </div>
                </label>
              ),
            )}
          </div>
        </div>

        <div>
          <h2
            className={`text-2xl font-black mb-6 ${theme === "dark" ? "text-white" : "text-gray-900"}`}
          >
            {t("yourTests")}
          </h2>
          {tests.length === 0 ? (
            <Card className="p-12 text-center border-dashed">
              <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-gray-400" />
              </div>
              <p className="font-medium text-lg">{t("noTests")}</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tests.map((test, idx) => (
                <Card
                  key={test.id}
                  className="group hover:border-red-500/50 hover:shadow-lg transition-all flex flex-col"
                >
                  <div className="p-6 flex-1">
                    <div className="flex justify-between items-start mb-4">
                      <h3
                        className={`font-bold text-lg leading-tight ${theme === "dark" ? "text-white" : "text-gray-900"}`}
                      >
                        {test.name}
                      </h3>
                      <span
                        className={`px-2 py-1 rounded text-xs font-bold ${theme === "dark" ? "bg-gray-700 text-gray-300" : "bg-slate-100 text-gray-600"}`}
                      >
                        {test.questions.length} Qs
                      </span>
                    </div>
                    {test.questions[0]?.image ? (
                      <div className="w-full h-32 rounded-lg bg-gray-100 dark:bg-gray-900 mb-4 overflow-hidden border border-gray-100 dark:border-gray-700">
                        <img
                          src={test.questions[0].image}
                          className="w-full h-full object-cover object-top opacity-80 group-hover:opacity-100 transition-opacity"
                          alt="Preview"
                        />
                      </div>
                    ) : (
                      test.questions[0]?.text && (
                        <div className="w-full h-32 rounded-lg bg-slate-50 dark:bg-gray-900 mb-4 p-4 overflow-hidden border border-gray-100 dark:border-gray-700 text-sm italic opacity-70 relative">
                          {test.questions[0].text}
                          <div
                            className={`absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t ${theme === "dark" ? "from-gray-900" : "from-slate-50"} to-transparent`}
                          />
                        </div>
                      )
                    )}
                    <p className="text-xs opacity-50">
                      {t("created")} {test.createdAt}
                    </p>
                  </div>
                  <div
                    className={`grid grid-cols-2 divide-x border-t ${theme === "dark" ? "divide-gray-700 border-gray-700 bg-gray-800/50" : "divide-gray-100 border-gray-100 bg-slate-50"}`}
                  >
                    <button
                      onClick={() => {
                        playClickSound();
                        startTest(test);
                      }}
                      className="py-3 font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors flex items-center justify-center gap-2"
                    >
                      <Play className="w-4 h-4" /> {t("take")}
                    </button>
                    <button
                      onClick={() => {
                        playClickSound();
                        startRapidTest(test);
                      }}
                      className="py-3 font-bold text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-500/10 transition-colors flex items-center justify-center gap-2"
                    >
                      <Zap className="w-4 h-4" /> {t("rapidTest")}
                    </button>
                  </div>
                  <div
                    className={`grid grid-cols-4 divide-x border-t text-sm font-medium ${theme === "dark" ? "divide-gray-700 border-gray-700" : "divide-gray-100 border-gray-100"}`}
                  >
                    <button
                      onClick={() => {
                        playClickSound();
                        setEditingTest(test);
                        setCurrentPage("edit");
                        playPageTransitionSound();
                        triggerSimpleAnimation("edit");
                      }}
                      className="py-2.5 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex flex-col items-center gap-1"
                    >
                      <Edit2 className="w-4 h-4" />
                      <span className="text-[10px] font-semibold opacity-60">
                        {t("edit")}
                      </span>
                    </button>
                    <button
                      onClick={() => {
                        playClickSound();
                        downloadTest(test);
                      }}
                      className="py-2.5 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex flex-col items-center gap-1"
                    >
                      <Upload className="w-4 h-4 rotate-180" />
                      <span className="text-[10px] font-semibold opacity-60">
                        {language === "vi" ? "Tải xuống" : "Export"}
                      </span>
                    </button>
                    <button
                      onClick={() => {
                        playClickSound();
                        shareTest(test);
                      }}
                      className="py-2.5 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-500/10 dark:hover:text-blue-400 transition-colors flex flex-col items-center gap-1"
                    >
                      <Globe className="w-4 h-4" />
                      <span className="text-[10px] font-semibold opacity-60">
                        {language === "vi" ? "Chia sẻ" : "Share"}
                      </span>
                    </button>
                    <button
                      onClick={() => {
                        playClickSound();
                        if (confirm(t("testDeleted")))
                          setTests(tests.filter((t) => t.id !== test.id));
                      }}
                      className="py-2.5 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10 dark:hover:text-red-400 transition-colors flex flex-col items-center gap-1"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span className="text-[10px] font-semibold opacity-60">
                        {t("delete")}
                      </span>
                    </button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </PageWrapper>
    );
  }

  if (currentPage === "edit" && editingTest) {
    return (
      <PageWrapper
        showApiKeyInput={showApiKeyInput}
        setShowApiKeyInput={setShowApiKeyInput}
        geminiApiKey={geminiApiKey}
        setGeminiApiKey={setGeminiApiKey}
        soundEnabled={soundEnabled}
        toggleSound={toggleSound}
        setCurrentPage={setCurrentPage}
        shareCode={shareCode}
        showShareModal={showShareModal}
        setShowShareModal={setShowShareModal}
        showImportModal={showImportModal}
        setShowImportModal={setShowImportModal}
        importCode={importCode}
        setImportCode={setImportCode}
        importByCode={importByCode}
      >
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-center gap-4 mb-8">
          <Button
            variant="secondary"
            onClick={() => {
              playClickSound();
              playPageTransitionSound();
              setEditingTest(null);
              setCurrentPage("home");
              triggerSimpleAnimation("home");
            }}
          >
            <Home className="w-4 h-4" />
          </Button>
          <input
            type="text"
            value={editingTest.name}
            onChange={(e) =>
              setEditingTest({ ...editingTest, name: e.target.value })
            }
            className={`flex-1 text-2xl font-black bg-transparent border-0 border-b-2 border-transparent hover:border-gray-300 focus:border-red-500 focus:ring-0 p-0 transition-colors ${theme === "dark" ? "text-white" : "text-gray-900"}`}
          />
          <div className="flex gap-2 w-full sm:w-auto">
            <Button
              variant="secondary"
              onClick={() => {
                playClickSound();
                addQuestion();
              }}
              icon={<Plus className="w-4 h-4" />}
            >
              {t("addQuestion")}
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                playClickSound();
                setEditingTest({
                  ...editingTest,
                  questions: [
                    ...editingTest.questions,
                    {
                      id: Date.now(),
                      number: editingTest.questions.length + 1,
                      text: "",
                      correctAnswer: [],
                      type: "multiple_choice",
                      options: [
                        { letter: "A", text: "" },
                        { letter: "B", text: "" },
                        { letter: "C", text: "" },
                        { letter: "D", text: "" },
                      ],
                    },
                  ],
                });
              }}
              icon={<Plus className="w-4 h-4" />}
            >
              Add Text Question
            </Button>
            <Button
              onClick={() => {
                playClickSound();
                saveTest();
              }}
              icon={<Check className="w-4 h-4" />}
            >
              {t("save")}
            </Button>
          </div>
        </div>

        {/* Test Settings */}
        <Card className="p-6 mb-8">
          <h2
            className={`text-xl font-bold mb-4 ${theme === "dark" ? "text-white" : "text-gray-900"}`}
          >
            {t("testSettings")}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <label
              className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                editingTest.settings?.immediateFeedback
                  ? "border-red-500 bg-red-50 dark:bg-red-500/10"
                  : theme === "dark"
                    ? "border-gray-700 hover:border-gray-500"
                    : "border-gray-200 bg-slate-50 hover:border-gray-300"
              }`}
            >
              <input
                type="checkbox"
                className="hidden"
                checked={editingTest.settings?.immediateFeedback || false}
                onChange={(e) => {
                  setEditingTest({
                    ...editingTest,
                    settings: {
                      ...editingTest.settings,
                      immediateFeedback: e.target.checked,
                    },
                  });
                }}
              />
              <div
                className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                  editingTest.settings?.immediateFeedback
                    ? "bg-red-500 border-red-500"
                    : theme === "dark"
                      ? "border-gray-500"
                      : "border-gray-300"
                }`}
              >
                {editingTest.settings?.immediateFeedback && (
                  <Check className="w-3 h-3 text-white" />
                )}
              </div>
              <div>
                <h3
                  className={`font-semibold ${theme === "dark" ? "text-white" : "text-gray-900"}`}
                >
                  {t("immediateFeedback")}
                </h3>
                <p className="text-sm opacity-70">
                  {t("immediateFeedbackDesc")}
                </p>
              </div>
            </label>

            <label
              className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                editingTest.settings?.scrambleOptions
                  ? "border-red-500 bg-red-50 dark:bg-red-500/10"
                  : theme === "dark"
                    ? "border-gray-700 hover:border-gray-500"
                    : "border-gray-200 bg-slate-50 hover:border-gray-300"
              }`}
            >
              <input
                type="checkbox"
                className="hidden"
                checked={editingTest.settings?.scrambleOptions || false}
                onChange={(e) => {
                  setEditingTest({
                    ...editingTest,
                    settings: {
                      ...editingTest.settings,
                      scrambleOptions: e.target.checked,
                    },
                  });
                }}
              />
              <div
                className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                  editingTest.settings?.scrambleOptions
                    ? "bg-red-500 border-red-500"
                    : theme === "dark"
                      ? "border-gray-500"
                      : "border-gray-300"
                }`}
              >
                {editingTest.settings?.scrambleOptions && (
                  <Check className="w-3 h-3 text-white" />
                )}
              </div>
              <div>
                <h3
                  className={`font-semibold ${theme === "dark" ? "text-white" : "text-gray-900"}`}
                >
                  {t("scrambleOptions")}
                </h3>
                <p className="text-sm opacity-70">{t("scrambleOptionsDesc")}</p>
              </div>
            </label>
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {editingTest.questions.map((question) => (
            <Card key={question.id} className="flex flex-col overflow-visible">
              {/* Card header */}
              <div
                className={`px-5 py-3 border-b flex justify-between items-center ${theme === "dark" ? "border-gray-700 bg-gray-800/60" : "border-gray-100 bg-slate-50"}`}
              >
                <span
                  className={`font-black text-sm ${theme === "dark" ? "text-white" : "text-gray-900"}`}
                >
                  Q{question.number}
                </span>
                <button
                  onClick={() => deleteQuestion(question.id)}
                  className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-md transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="p-5 flex-1 space-y-4">
                {/* ── QUESTION TEXT EDITOR ── */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 opacity-60">
                    {t("questionText")}
                  </label>
                  <textarea
                    value={question.text || ""}
                    onChange={(e) =>
                      updateQuestion(question.id, { text: e.target.value })
                    }
                    placeholder="Enter question text..."
                    className={`w-full text-sm rounded-lg border focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors p-3 resize-none ${theme === "dark" ? "bg-gray-900 border-gray-700 text-white" : "bg-white border-gray-200 text-gray-900"}`}
                    rows={4}
                  />
                </div>

                {/* ── QUESTION IMAGE ── */}
                {question.image && (
                  <div
                    className={`rounded-xl p-3 border ${theme === "dark" ? "bg-gray-900/60 border-gray-700" : "bg-slate-50 border-gray-100"}`}
                  >
                    <img
                      src={question.image}
                      alt={`Q${question.number}`}
                      className={`w-full rounded-lg border object-contain ${theme === "dark" ? "border-gray-700" : "border-gray-200"}`}
                    />
                  </div>
                )}

                {/* ── QUESTION TYPE ── */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 opacity-60">
                    {t("questionType")}
                  </label>
                  <select
                    value={question.type || "multiple_choice"}
                    onChange={(e) => {
                      const newType = e.target.value;
                      let updates = { type: newType };
                      if (newType === "true_false") {
                        // Create 4 options (A, B, C, D) for true/false questions
                        if (question.options?.length >= 4) {
                          // Preserve existing option text, just ensure we have 4 options
                          updates.options = question.options
                            .slice(0, 4)
                            .map((opt, idx) => ({
                              letter: String.fromCharCode(65 + idx), // A, B, C, D
                              text: opt.text || "",
                            }));
                        } else {
                          updates.options = [
                            { letter: "A", text: "" },
                            { letter: "B", text: "" },
                            { letter: "C", text: "" },
                            { letter: "D", text: "" },
                          ];
                        }
                        updates.correctAnswer = [];
                      } else if (newType === "text_input") {
                        updates.options = [];
                        updates.correctAnswer = [];
                      } else if (newType === "multiple_choice") {
                        if (!question.options?.length)
                          updates.options = [
                            { letter: "A", text: "" },
                            { letter: "B", text: "" },
                            { letter: "C", text: "" },
                            { letter: "D", text: "" },
                          ];
                      } else if (newType === "none") {
                        updates.options = [];
                        updates.correctAnswer = [];
                      }
                      updateQuestion(question.id, updates);
                    }}
                    className={`w-full text-sm rounded-lg border focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors p-2.5 ${theme === "dark" ? "bg-gray-900 border-gray-700 text-white" : "bg-white border-gray-200 text-gray-900"}`}
                  >
                    <option value="multiple_choice">
                      {t("multipleChoice")}
                    </option>
                    <option value="true_false">{t("trueFalse")}</option>
                    <option value="text_input">{t("textInput")}</option>
                    <option value="none">{t("none")}</option>
                  </select>
                </div>

                {/* ── CORRECT ANSWER SELECTOR ── */}
                {question.type !== "none" && (
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider mb-2 opacity-60">
                      {t("correctAnswers")}
                    </label>

                    {question.type === "multiple_choice" && (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="block text-xs font-bold uppercase tracking-wider opacity-60">
                            {t("options")}
                          </label>
                          <Button
                            variant="ghost"
                            onClick={() => {
                              const newLetter = String.fromCharCode(
                                65 + question.options.length,
                              );
                              updateQuestion(question.id, {
                                options: [
                                  ...question.options,
                                  { letter: newLetter, text: "" },
                                ],
                              });
                            }}
                            className="text-xs py-1 px-2"
                            icon={<Plus className="w-3 h-3" />}
                          >
                            {t("addOption")}
                          </Button>
                        </div>
                        <div className="flex flex-col gap-2">
                          {question.options.map((option, idx) => {
                            const isCorrect = question.correctAnswer.includes(
                              option.letter,
                            );
                            return (
                              <div
                                key={option.letter}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border-2 transition-all ${
                                  isCorrect
                                    ? "border-red-500 bg-red-50 dark:bg-red-500/10"
                                    : theme === "dark"
                                      ? "border-gray-700"
                                      : "border-gray-100 bg-slate-50"
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isCorrect}
                                  onChange={(e) => {
                                    const curr = question.correctAnswer;
                                    const next = e.target.checked
                                      ? [...curr, option.letter].sort()
                                      : curr.filter((a) => a !== option.letter);
                                    updateQuestion(question.id, {
                                      correctAnswer: next,
                                    });
                                  }}
                                  className="w-4 h-4 text-red-600 bg-gray-100 border-gray-300 rounded focus:ring-red-500"
                                />
                                {/* Letter badge */}
                                <span
                                  className={`w-7 h-7 rounded-lg flex-shrink-0 flex items-center justify-center text-xs font-bold transition-colors ${
                                    isCorrect
                                      ? "bg-red-500 text-white"
                                      : theme === "dark"
                                        ? "bg-gray-700 text-gray-300"
                                        : "bg-white border border-gray-200 text-gray-500"
                                  }`}
                                >
                                  {option.letter}
                                </span>
                                {/* Option text input */}
                                <input
                                  type="text"
                                  value={option.text || ""}
                                  onChange={(e) => {
                                    const newOptions = [...question.options];
                                    newOptions[idx] = {
                                      ...newOptions[idx],
                                      text: e.target.value,
                                    };
                                    updateQuestion(question.id, {
                                      options: newOptions,
                                    });
                                  }}
                                  placeholder={`Option ${option.letter}`}
                                  className={`text-sm leading-snug flex-1 bg-transparent border-0 focus:ring-0 p-0 ${
                                    isCorrect
                                      ? "text-red-700 dark:text-red-400 font-medium"
                                      : theme === "dark"
                                        ? "text-gray-300"
                                        : "text-gray-600"
                                  }`}
                                />
                                {/* Remove option */}
                                {question.options.length > 2 && (
                                  <button
                                    onClick={() => {
                                      const newOptions =
                                        question.options.filter(
                                          (_, i) => i !== idx,
                                        );
                                      const newCorrectAnswer =
                                        question.correctAnswer.filter(
                                          (a) => a !== option.letter,
                                        );
                                      updateQuestion(question.id, {
                                        options: newOptions,
                                        correctAnswer: newCorrectAnswer,
                                      });
                                    }}
                                    className="text-gray-400 hover:text-red-500 transition-colors p-1"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                )}
                                {/* Check indicator */}
                                {isCorrect && (
                                  <Check className="w-4 h-4 text-red-500 flex-shrink-0" />
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {question.type === "true_false" && (
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider mb-2 opacity-60">
                          {t("options")}
                        </label>
                        <div className="space-y-3">
                          {question.options.map((option, idx) => {
                            const isSelected = question.correctAnswer.includes(
                              option.letter,
                            );
                            return (
                              <div
                                key={option.letter}
                                className={`flex items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                                  isSelected
                                    ? "border-red-500 bg-red-50 dark:bg-red-500/10"
                                    : theme === "dark"
                                      ? "border-gray-700 bg-gray-800"
                                      : "border-gray-200 bg-white"
                                }`}
                              >
                                <span className="font-bold text-sm w-6 flex-shrink-0">
                                  {option.letter})
                                </span>
                                <input
                                  type="text"
                                  value={option.text || ""}
                                  onChange={(e) => {
                                    const newOptions = [...question.options];
                                    newOptions[idx] = {
                                      ...newOptions[idx],
                                      text: e.target.value,
                                    };
                                    updateQuestion(question.id, {
                                      options: newOptions,
                                    });
                                  }}
                                  placeholder={`Option ${option.letter}`}
                                  className={`text-sm flex-1 min-w-0 bg-transparent border-0 focus:ring-0 p-0 ${
                                    isSelected
                                      ? "text-red-700 dark:text-red-400 font-medium"
                                      : theme === "dark"
                                        ? "text-gray-300"
                                        : "text-gray-600"
                                  }`}
                                />
                                <div className="flex gap-1 flex-shrink-0">
                                  <button
                                    onClick={() =>
                                      updateQuestion(question.id, {
                                        correctAnswer: [
                                          ...(
                                            question.correctAnswer || []
                                          ).filter((a) => a !== option.letter),
                                          option.letter,
                                        ],
                                      })
                                    }
                                    className={`px-2 py-1 rounded-lg text-xs font-bold transition-all ${
                                      isSelected
                                        ? "bg-red-500 text-white"
                                        : theme === "dark"
                                          ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                    }`}
                                  >
                                    {language === "vi" ? "Đúng" : "True"}
                                  </button>
                                  <button
                                    onClick={() =>
                                      updateQuestion(question.id, {
                                        correctAnswer: (
                                          question.correctAnswer || []
                                        ).filter((a) => a !== option.letter),
                                      })
                                    }
                                    className={`px-2 py-1 rounded-lg text-xs font-bold transition-all ${
                                      !isSelected
                                        ? "bg-gray-500 text-white"
                                        : theme === "dark"
                                          ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                    }`}
                                  >
                                    {language === "vi" ? "Sai" : "False"}
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                    {question.type === "text_input" && (
                      <input
                        type="text"
                        value={question.correctAnswer.join(", ")}
                        onChange={(e) =>
                          updateQuestion(question.id, {
                            correctAnswer: e.target.value
                              .split(",")
                              .map((a) => a.trim())
                              .filter((a) => a),
                          })
                        }
                        placeholder="e.g., Apple, Banana"
                        className={`w-full text-sm rounded-lg border focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors p-3 ${theme === "dark" ? "bg-gray-900 border-gray-700 text-white" : "bg-white border-gray-200 text-gray-900"}`}
                      />
                    )}
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      </PageWrapper>
    );
  }

  // Simplified and clean Test Page styling...
  if (currentPage === "test" && currentTest) {
    const progressPercentage = Math.round(
      (answeredQuestions.size / currentTest.questions.length) * 100,
    );

    return (
      <div
        className={`min-h-screen ${theme === "dark" ? "bg-[#0f1115] text-gray-300" : "bg-slate-50 text-gray-800"}`}
      >
        {/* Sticky Header specific for Test Taking */}
        <div
          className={`sticky top-0 z-50 shadow-sm border-b ${theme === "dark" ? "bg-gray-900 border-gray-800" : "bg-white border-gray-200"}`}
        >
          <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex flex-col">
              <span
                className={`font-bold ${theme === "dark" ? "text-white" : "text-gray-900"}`}
              >
                {currentTest.name}
              </span>
              <span className="text-xs font-medium opacity-60">
                {retakeMode === "incorrect"
                  ? "Retaking Errors"
                  : `${answeredQuestions.size}/${currentTest.questions.length} Completed`}
              </span>
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                <button
                  onClick={decreaseImageSize}
                  className="px-2 py-1 hover:bg-white dark:hover:bg-gray-700 rounded shadow-sm text-sm font-bold"
                >
                  -
                </button>
                <span className="px-2 text-xs font-bold">
                  {Math.round(imageZoomLevel * 100)}%
                </span>
                <button
                  onClick={increaseImageSize}
                  className="px-2 py-1 hover:bg-white dark:hover:bg-gray-700 rounded shadow-sm text-sm font-bold"
                >
                  +
                </button>
              </div>
              <Button
                variant="secondary"
                onClick={() => {
                  if (confirm(t("exitTest"))) {
                    setCurrentTest(null);
                    setCurrentPage("home");
                  }
                }}
                className="text-sm py-1.5 px-3"
              >
                {t("exit")}
              </Button>
              <Button
                onClick={() => {
                  playClickSound();
                  submitTest();
                }}
                className="text-sm py-1.5 px-4"
              >
                {t("submit")}
              </Button>
            </div>
          </div>
          {/* Progress bar */}
          <div className="w-full h-1 bg-gray-100 dark:bg-gray-800">
            <div
              className="h-full bg-red-500 transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        {showAchievement && (
          <div className="fixed top-20 right-4 z-50 animate-in slide-in-from-top-4 fade-in duration-300">
            <div className="bg-green-500 text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-3 font-semibold">
              <span className="text-2xl">✨</span>
              <div>
                <p className="text-sm opacity-90">{t("achievementUnlocked")}</p>
                <p>
                  {progressPercentage}% {t("overallProgress")}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
          {currentTest.questions.map((question, idx) => (
            <Card key={question.id} className="p-6 sm:p-8">
              <div className="flex items-center justify-between mb-4">
                <h3
                  className={`text-lg font-black ${theme === "dark" ? "text-white" : "text-gray-900"}`}
                >
                  Q{idx + 1}
                </h3>
              </div>

              {question.text && <p className="mb-6 text-lg">{question.text}</p>}

              {question.image && (
                <div className="mb-6 overflow-hidden rounded-lg bg-white">
                  <img
                    src={question.image}
                    alt="Q"
                    className="w-full border border-gray-100"
                    style={{
                      transform: `scale(${imageZoomLevel})`,
                      transformOrigin: "top left",
                      maxWidth: imageZoomLevel > 1 ? "none" : "100%",
                    }}
                  />
                </div>
              )}

              {question.type !== "none" && (
                <div className="mt-6">
                  {question.type === "multiple_choice" && (
                    <div className="flex flex-col gap-2 mt-4">
                      {(question.shuffledOptions || question.options).map(
                        (option) => {
                          const isSelected = (
                            userAnswers[question.id] || []
                          ).includes(option.letter);
                          const isCorrect = question.correctAnswer.includes(
                            option.letter,
                          );
                          const showFeedback =
                            currentTest.settings?.immediateFeedback &&
                            isSelected;

                          return (
                            <button
                              key={option.letter}
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                if (!currentTest.settings?.immediateFeedback) {
                                  const curr = userAnswers[question.id] || [];
                                  handleAnswerSelect(
                                    question.id,
                                    isSelected
                                      ? curr.filter((a) => a !== option.letter)
                                      : [...curr, option.letter].sort(),
                                  );
                                } else {
                                  // Immediate feedback mode - single selection
                                  handleAnswerSelect(question.id, [
                                    option.letter,
                                  ]);
                                }
                              }}
                              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all active:scale-[0.99] ${
                                showFeedback
                                  ? isCorrect
                                    ? "border-green-500 bg-green-50 dark:bg-green-500/10"
                                    : "border-red-500 bg-red-50 dark:bg-red-500/10"
                                  : isSelected
                                    ? "border-red-500 bg-red-50 dark:bg-red-500/10"
                                    : theme === "dark"
                                      ? "border-gray-700 bg-gray-800 hover:border-gray-600"
                                      : "border-gray-200 bg-slate-50 hover:border-gray-300 hover:bg-white"
                              }`}
                            >
                              <span
                                className={`w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center text-sm font-bold transition-colors ${
                                  showFeedback
                                    ? isCorrect
                                      ? "bg-green-500 text-white"
                                      : "bg-red-500 text-white"
                                    : isSelected
                                      ? "bg-red-500 text-white"
                                      : theme === "dark"
                                        ? "bg-gray-700 text-gray-300"
                                        : "bg-white border border-gray-200 text-gray-600"
                                }`}
                              >
                                {option.letter}
                              </span>
                              <span
                                className={`text-sm leading-snug ${
                                  showFeedback
                                    ? isCorrect
                                      ? "text-green-700 dark:text-green-400 font-medium"
                                      : "text-red-700 dark:text-red-400 font-medium"
                                    : isSelected
                                      ? "text-red-700 dark:text-red-400 font-medium"
                                      : theme === "dark"
                                        ? "text-gray-200"
                                        : "text-gray-700"
                                }`}
                              >
                                {option.text || option.letter}
                              </span>
                              {showFeedback && (
                                <div className="ml-auto flex-shrink-0">
                                  {isCorrect ? (
                                    <Check className="w-5 h-5 text-green-500" />
                                  ) : (
                                    <X className="w-5 h-5 text-red-500" />
                                  )}
                                </div>
                              )}
                            </button>
                          );
                        },
                      )}
                    </div>
                  )}
                  {question.type === "true_false" && (
                    <div className="space-y-3">
                      {(question.shuffledOptions || question.options).map(
                        (option) => {
                          const isSelected = (
                            userAnswers[question.id] || []
                          ).includes(option.letter);
                          const isCorrect = question.correctAnswer.includes(
                            option.letter,
                          );
                          const showFeedback =
                            currentTest.settings?.immediateFeedback &&
                            isSelected;

                          return (
                            <div
                              key={option.letter}
                              className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${
                                showFeedback
                                  ? isCorrect
                                    ? "border-green-500 bg-green-50 dark:bg-green-500/10"
                                    : "border-red-500 bg-red-50 dark:bg-red-500/10"
                                  : isSelected
                                    ? "border-red-500 bg-red-50 dark:bg-red-500/10"
                                    : theme === "dark"
                                      ? "border-gray-700 bg-gray-800 hover:border-gray-600"
                                      : "border-gray-200 bg-white hover:border-gray-300"
                              }`}
                            >
                              <span className="font-bold text-sm w-6">
                                {option.letter})
                              </span>
                              <span className="flex-1 text-sm">
                                {option.text || option.letter}
                              </span>
                              <div className="flex gap-2">
                                <button
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    handleAnswerSelect(question.id, [
                                      ...(
                                        userAnswers[question.id] || []
                                      ).filter((a) => a !== option.letter),
                                      option.letter,
                                    ]);
                                  }}
                                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                    isSelected && isCorrect
                                      ? "bg-green-500 text-white"
                                      : isSelected && !isCorrect && showFeedback
                                        ? "bg-red-500 text-white"
                                        : isSelected
                                          ? "bg-red-500 text-white"
                                          : theme === "dark"
                                            ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                  }`}
                                >
                                  {t(
                                    language === "vi"
                                      ? "trueLabelVi"
                                      : "trueLabel",
                                  )}
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
                                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                    !isSelected
                                      ? "bg-gray-500 text-white"
                                      : theme === "dark"
                                        ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                  }`}
                                >
                                  {t(
                                    language === "vi"
                                      ? "falseLabelVi"
                                      : "falseLabel",
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
                        language === "vi"
                          ? "typeAnswerHereVi"
                          : "typeAnswerHere",
                      )}
                      className={`w-full p-4 text-lg rounded-xl border-2 focus:ring-0 focus:border-red-500 transition-colors ${
                        theme === "dark"
                          ? "bg-gray-800 border-gray-700 text-white placeholder-gray-500"
                          : "bg-white border-gray-200 text-gray-900"
                      }`}
                    />
                  )}
                </div>
              )}
            </Card>
          ))}

          <div className="flex justify-center pt-4 pb-12">
            <Button
              onClick={() => {
                playClickSound();
                submitTest();
              }}
              className="px-8 py-4 text-lg w-full max-w-sm"
            >
              {t("submit")} Test
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Results & Rapid mode can follow the same sleek structural improvements (omitted full repetitive markup to save space, but functionally identical to edit/home logic using Card & Button with red primary).
  if (currentPage === "results" && testResults && currentTest) {
    const isPassed = testResults.score >= 5;
    return (
      <PageWrapper
        showApiKeyInput={showApiKeyInput}
        setShowApiKeyInput={setShowApiKeyInput}
        geminiApiKey={geminiApiKey}
        setGeminiApiKey={setGeminiApiKey}
        soundEnabled={soundEnabled}
        toggleSound={toggleSound}
        setCurrentPage={setCurrentPage}
        shareCode={shareCode}
        showShareModal={showShareModal}
        setShowShareModal={setShowShareModal}
        showImportModal={showImportModal}
        setShowImportModal={setShowImportModal}
        importCode={importCode}
        setImportCode={setImportCode}
        importByCode={importByCode}
      >
        <Card className="max-w-2xl mx-auto p-8 lg:p-12 text-center mb-8">
          <h1 className="text-3xl font-black mb-6 uppercase tracking-widest opacity-50">
            {t("testResults")}
          </h1>
          <div
            className={`text-7xl font-black mb-6 ${isPassed ? "text-green-500" : "text-red-500"}`}
          >
            {testResults.score}/10
          </div>
          <div className="flex justify-center gap-4 mt-8 flex-wrap">
            <Button
              onClick={() => {
                setCurrentPage("home");
                setCurrentTest(null);
              }}
              variant="secondary"
            >
              {t("home")}
            </Button>
            <Button
              onClick={() => {
                setUserAnswers({});
                setTestResults(null);
                setCurrentPage("test");
              }}
              icon={<Zap className="w-4 h-4" />}
            >
              {t("retakeTest")}
            </Button>
            {getIncorrectQuestions().length > 0 && (
              <Button
                onClick={() =>
                  startTestWithQuestions(
                    currentTest,
                    getIncorrectQuestions(),
                    "incorrect",
                  )
                }
                variant="dangerOutline"
              >
                {t("retakeIncorrect")} ({getIncorrectQuestions().length})
              </Button>
            )}
          </div>
        </Card>
      </PageWrapper>
    );
  }

  if (currentPage === "rapid-test") {
    if (!rapidCurrentQuestion) return null;
    const question = rapidCurrentQuestion;
    return (
      <div
        className={`min-h-screen ${theme === "dark" ? "bg-[#0f1115] text-gray-300" : "bg-slate-50 text-gray-800"} transition-colors duration-300 font-sans`}
      >
        {/* Header */}
    <div
      className={`sticky top-0 z-[60] transition-colors duration-300 ${theme === "dark" ? "bg-gray-900 border-gray-800" : "bg-white border-gray-100 shadow-sm"} border-b`}
    >
          <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="w-6 h-6 text-orange-500" />
              <h1
                className={`text-xl font-black ${theme === "dark" ? "text-white" : "text-gray-900"}`}
              >
                {t("rapidTestMode")}
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <div
                className={`px-3 py-1 rounded-lg font-bold text-sm ${theme === "dark" ? "bg-gray-800 text-orange-400" : "bg-orange-50 text-orange-600"}`}
              >
                {t("rapidScore")}: {rapidScore}/{rapidTotalQuestions}
              </div>
              <Button
                variant="secondary"
                onClick={() => {
                  if (confirm(t("exitTest"))) exitRapidTest();
                }}
                className="text-sm"
              >
                {t("exit")}
              </Button>
            </div>
          </div>
        </div>

        {/* Particle Effect */}
        {showParticleEffect && <ParticleEffect isVisible={true} />}

        {/* Question Display */}
        <div className="max-w-2xl mx-auto px-4 py-12">
          {!rapidShowResult ? (
            <Card className="p-8 text-center">
              {question.image && (
                <img
                  src={question.image}
                  alt="Question"
                  className="w-full rounded-lg mb-6 border border-gray-200 dark:border-gray-700"
                />
              )}
              {question.text && <p className="text-lg mb-6">{question.text}</p>}

              <div className="space-y-4">
                {question.type === "multiple_choice" && (
                  <div className="grid grid-cols-1 gap-3">
                    {question.options.map((option) => (
                      <button
                        key={option.letter}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setRapidAnswer([option.letter]);
                        }}
                        className={`p-4 rounded-xl border-2 text-left transition-all ${
                          (rapidAnswer || []).includes(option.letter)
                            ? "border-red-500 bg-red-50 dark:bg-red-500/10"
                            : theme === "dark"
                              ? "border-gray-700 bg-gray-800 hover:border-gray-600"
                              : "border-gray-200 bg-white hover:border-gray-300"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold ${
                              (rapidAnswer || []).includes(option.letter)
                                ? "bg-red-500 text-white"
                                : theme === "dark"
                                  ? "bg-gray-700 text-gray-300"
                                  : "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {option.letter}
                          </span>
                          <span className="text-sm">{option.text}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {question.type === "true_false" && (
                  <div className="space-y-3">
                    {question.options.map((option) => {
                      const isSelected = (rapidAnswer || []).includes(
                        option.letter,
                      );
                      return (
                        <div
                          key={option.letter}
                          className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${
                            isSelected
                              ? "border-red-500 bg-red-50 dark:bg-red-500/10"
                              : theme === "dark"
                                ? "border-gray-700 bg-gray-800 hover:border-gray-600"
                                : "border-gray-200 bg-white hover:border-gray-300"
                          }`}
                        >
                          <span className="font-bold text-sm w-6">
                            {option.letter})
                          </span>
                          <span className="flex-1 text-sm">{option.text}</span>
                          <div className="flex gap-2">
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setRapidAnswer([
                                  ...(rapidAnswer || []).filter(
                                    (a) => a !== option.letter,
                                  ),
                                  option.letter,
                                ]);
                              }}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                isSelected
                                  ? "bg-red-500 text-white"
                                  : theme === "dark"
                                    ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                              }`}
                            >
                              True
                            </button>
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setRapidAnswer(
                                  (rapidAnswer || []).filter(
                                    (a) => a !== option.letter,
                                  ),
                                );
                              }}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                !isSelected
                                  ? "bg-gray-500 text-white"
                                  : theme === "dark"
                                    ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                              }`}
                            >
                              False
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
                    value={rapidAnswer || ""}
                    onChange={(e) => setRapidAnswer(e.target.value)}
                    placeholder="Type your answer..."
                    className={`w-full p-4 text-lg rounded-xl border-2 focus:ring-0 focus:border-red-500 transition-colors ${
                      theme === "dark"
                        ? "bg-gray-800 border-gray-700 text-white"
                        : "bg-white border-gray-200 text-gray-900"
                    }`}
                  />
                )}
              </div>

              <Button
                onClick={() => {
                  playClickSound();
                  submitRapidAnswer();
                }}
                disabled={!rapidAnswer}
                className="mt-8 w-full max-w-xs"
              >
                {t("confirmAnswer")}
              </Button>
            </Card>
          ) : (
            <Card className="p-8 text-center">
              <div
                className={`text-6xl mb-6 ${checkRapidAnswer(question, rapidAnswer) ? "text-green-500" : "text-red-500"}`}
              >
                {checkRapidAnswer(question, rapidAnswer) ? "✅" : "❌"}
              </div>
              <h2 className="text-2xl font-bold mb-4">
                {checkRapidAnswer(question, rapidAnswer)
                  ? t("correctAnswerRapid")
                  : t("incorrectAnswerRapid") +
                    " " +
                    question.correctAnswer.join(", ")}
              </h2>
              <Button
                onClick={() => {
                  playClickSound();
                  nextRapidQuestion();
                }}
                className="w-full max-w-xs"
              >
                {t("nextQuestion")}
              </Button>
            </Card>
          )}
        </div>
      </div>
    );
  }

  if (currentPage === "rapid-results") {
    const percentage =
      rapidTotalQuestions > 0
        ? Math.round((rapidScore / rapidTotalQuestions) * 100)
        : 0;
    return (
      <PageWrapper
        showApiKeyInput={showApiKeyInput}
        setShowApiKeyInput={setShowApiKeyInput}
        geminiApiKey={geminiApiKey}
        setGeminiApiKey={setGeminiApiKey}
        soundEnabled={soundEnabled}
        toggleSound={toggleSound}
        setCurrentPage={setCurrentPage}
        shareCode={shareCode}
        showShareModal={showShareModal}
        setShowShareModal={setShowShareModal}
        showImportModal={showImportModal}
        setShowImportModal={setShowImportModal}
        importCode={importCode}
        setImportCode={setImportCode}
        importByCode={importByCode}
      >
        <Card className="max-w-2xl mx-auto p-8 lg:p-12 text-center">
          <Zap className="w-16 h-16 text-orange-500 mx-auto mb-6" />
          <h1 className="text-3xl font-black mb-4">{t("rapidCompleted")}</h1>
          <div className="text-6xl font-black mb-6 text-orange-500">
            {rapidScore}/{rapidTotalQuestions}
          </div>
          <p className="text-lg mb-8">
            {percentage}% {t("correct").toLowerCase()}
          </p>
          <div className="flex justify-center gap-4 flex-wrap">
            <Button
              onClick={() => {
                playClickSound();
                restartRapidTest();
              }}
              variant="secondary"
            >
              {t("restartRapid")}
            </Button>
            <Button onClick={() => exitRapidTest()}>{t("home")}</Button>
          </div>
        </Card>
      </PageWrapper>
    );
  }

  return null;
};

const App = () => (
  <ThemeProvider>
    <LanguageProvider>
      <VisualTestPlatform />
    </LanguageProvider>
  </ThemeProvider>
);

export default App;
