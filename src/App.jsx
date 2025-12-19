import React, { useState, useEffect } from "react";
import { Upload, Plus, Trash2, Edit2, Play, Home, Image, Sun, Moon, Globe } from "lucide-react";
import * as pdfjsLib from "pdfjs-dist";
import * as mammoth from "mammoth";

// Language context and translations
const LanguageContext = React.createContext();

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
    appTitle: "📝 F*ckAzota",
    appDescription: "Tải lên PDF hoặc hình ảnh để tạo bài kiểm tra",
    uploadContent: "Tải lên nội dung bài kiểm tra",
    yourTests: "Bài kiểm tra của bạn",
    noTests: "Chưa có bài kiểm tra nào. Tải lên PDF hoặc hình ảnh để bắt đầu!",
    
    // Upload options
    uploadPdf: "Tải lên PDF",
    uploadPdfDesc: "Mỗi trang thành một câu hỏi",
    uploadImages: "Tải lên hình ảnh",
    uploadImagesDesc: "Chọn nhiều hình ảnh",
    importTest: "Nhập bài kiểm tra",
    importTestDesc: "Tải bài đã lưu (.json)",
    uploadText: "Tải lên văn bản",
    uploadTextDesc: "Phân tích câu hỏi từ (.txt)",
    uploadDocx: "Tải lên DOCX",
    uploadDocxDesc: "Phân tích câu hỏi từ (.docx)",
    
    // Question types
    multipleChoice: "Trắc nghiệm",
    trueFalse: "Đúng/Sai",
    textInput: "Nhập văn bản",
    none: "Không có (Tiêu đề/Hình ảnh)",
    
    // Test creation
    howToExtract: "Bạn muốn trích xuất câu hỏi như thế nào?",
    extractDescription: "Chọn phương pháp để trích xuất câu hỏi từ PDF của bạn",
    autoDetect: "Tự động phát hiện",
    autoDetectDesc: "Tự động tìm và trích xuất câu hỏi bằng cách phát hiện khoảng trắng giữa chúng.",
    manualCrop: "Cắt thủ công",
    manualCropDesc: "Chọn từng câu hỏi bằng cách nhấp và kéo trên các trang PDF.",
    
    // Test taking
    yourAnswer: "Câu trả lời của bạn:",
    selected: "Đã chọn:",
    notAnswered: "Chưa trả lời",
    
    // Results
    testResults: "Kết quả bài kiểm tra",
    passed: "ĐẠT",
    failed: "KHÔNG ĐẠT",
    retakeTest: "Làm lại bài",
    retakeIncorrect: "Làm lại câu sai",
    answerReview: "Xem lại câu trả lời",
    correctAnswer: "Câu trả lời đúng:",
    
    // Rapid test mode
    rapidTest: "Kiểm tra nhanh",
    rapidTestDesc: "Chế độ nhanh - Một câu hỏi tại một thời điểm",
    rapidTestMode: "Chế độ nhanh",
    confirmAnswer: "Xác nhận",
    nextQuestion: "Câu tiếp theo",
    restartRapid: "Chơi lại",
    correctAnswerRapid: "Đúng! Tuyệt vời! 🎉",
    incorrectAnswerRapid: "Sai! Đáp án đúng là",
    rapidScore: "Điểm số",
    rapidCompleted: "Hoàn thành chế độ nhanh!",
    
    // Achievement
    achievementUnlocked: "Thành tựu mở khóa!",
    questionCompleted: "Câu hỏi đã hoàn thành",
    overallProgress: "Tiến độ tổng thể",
    
    // Edit mode
    setAnswers: "Đặt câu trả lời đúng (A, B, C, hoặc D)",
    setAnswersDesc: "Nhấp vào mỗi hình ảnh câu hỏi và nhập câu trả lời đúng. Nhiều câu trả lời: phân tách bằng dấu phẩy (ví dụ: \"A,B\" hoặc \"A, C\")",
    questionType: "Loại câu hỏi",
    questionText: "Văn bản câu hỏi",
    options: "Các lựa chọn",
    correctAnswers: "Câu trả lời đúng",
    addQuestion: "Thêm câu hỏi (Tải hình ảnh)",
    addOption: "Thêm lựa chọn",
    
    // Messages
    processing: "Đang xử lý...",
    converting: "Chuyển đổi PDF thành hình ảnh. Vui lòng đợi.",
    autoDetecting: "Tự động phát hiện câu hỏi...",
    analyzing: "Phân tích các trang PDF để tìm ranh giới câu hỏi. Vui lòng đợi.",
    questionsDetected: "Tự động phát hiện {count} câu hỏi! Bây giờ bạn có thể đặt câu trả lời đúng.",
    noQuestions: "Không tìm thấy câu hỏi nào. Vui lòng kiểm tra định dạng tài liệu của bạn.",
    noQuestionsDetected: "Không phát hiện thấy câu hỏi nào. Vui lòng sử dụng chế độ cắt thủ công.",
    saveSuccess: "Lưu bài kiểm tra thành công!",
    testImported: "Bài kiểm tra \"{name}\" đã được nhập thành công!",
    testDeleted: "Xóa bài kiểm tra này?",
    exitTest: "Thoát bài kiểm tra? Câu trả lời của bạn sẽ bị mất.",
    noCorrectAnswers: "Một số câu hỏi không có câu trả lời đúng. Lưu anyway?",
    cropAtLeastOne: "Vui lòng cắt ít nhất một câu hỏi!",
    selectQuestions: "Chưa cắt câu hỏi nào. Nhấp và kéo trên trang để chọn câu hỏi.",
    page: "Trang",
    questionsCropped: "Câu hỏi đã cắt:",
    doneSetAnswers: "Xong - Đặt câu trả lời",
    croppedQuestions: "Câu hỏi đã cắt",
    currentPage: "Trang hiện tại",
    fromPage: "Từ trang",
    created: "Đã tạo:",
    questions: "câu hỏi",
    preview: "Xem trước",
    pdfInfo: "📄 Thông tin PDF: {count} trang đã tải",
    
    // Theme
    lightTheme: "Chế độ sáng",
    darkTheme: "Chế độ tối",
  },
  en: {
    // Navigation
    home: "Home",
    back: "Back",
    exit: "Exit",
    cancel: "Cancel",
    save: "Save",
    submit: "Submit",
    delete: "Delete",
    edit: "Edit",
    take: "Take",
    
    // Main title and descriptions
    appTitle: "📝 F*ckAzota",
    appDescription: "Upload PDFs or images to create tests",
    uploadContent: "Upload Test Content",
    yourTests: "Your Tests",
    noTests: "No tests yet. Upload a PDF or images to get started!",
    
    // Upload options
    uploadPdf: "Upload PDF",
    uploadPdfDesc: "Each page becomes a question",
    uploadImages: "Upload Images",
    uploadImagesDesc: "Select multiple images",
    importTest: "Import Test",
    importTestDesc: "Load saved test (.json)",
    uploadText: "Upload Text",
    uploadTextDesc: "Parse questions from (.txt)",
    uploadDocx: "Upload DOCX",
    uploadDocxDesc: "Parse questions from (.docx)",
    
    // Question types
    multipleChoice: "Multiple Choice",
    trueFalse: "True/False",
    textInput: "Text Input",
    none: "None (Title/Picture)",
    
    // Test creation
    howToExtract: "How would you like to extract questions?",
    extractDescription: "Choose a method to extract questions from your PDF",
    autoDetect: "Auto-Detect",
    autoDetectDesc: "Automatically find and extract questions by detecting white space gaps between them.",
    manualCrop: "Manual Crop",
    manualCropDesc: "Manually select each question by clicking and dragging on the PDF pages.",
    
    // Test taking
    yourAnswer: "Your Answer:",
    selected: "Selected:",
    notAnswered: "Not answered",
    
    // Results
    testResults: "Test Results",
    passed: "PASSED",
    failed: "FAILED",
    retakeTest: "Retake Test",
    retakeIncorrect: "Retake Incorrect",
    answerReview: "Answer Review",
    correctAnswer: "Correct answer(s):",
    
    // Rapid test mode
    rapidTest: "Rapid Test",
    rapidTestDesc: "Fast mode - One question at a time",
    rapidTestMode: "Rapid Mode",
    confirmAnswer: "Confirm",
    nextQuestion: "Next Question",
    restartRapid: "Restart",
    correctAnswerRapid: "Correct! Great job! 🎉",
    incorrectAnswerRapid: "Wrong! The correct answer is",
    rapidScore: "Score",
    rapidCompleted: "Rapid mode completed!",
    
    // Achievement
    achievementUnlocked: "ACHIEVEMENT UNLOCKED!",
    questionCompleted: "Question Completed",
    overallProgress: "Overall Progress",
    
    // Edit mode
    setAnswers: "Set Correct Answers (A, B, C, or D)",
    setAnswersDesc: "Click on each question image and type the correct answer(s). Multiple answers: separate with commas (e.g., \"A,B\" or \"A, C\")",
    questionType: "Question Type",
    questionText: "Question Text",
    options: "Options",
    correctAnswers: "Correct Answer(s)",
    addQuestion: "Add Question (Upload Image)",
    addOption: "Add Option",
    
    // Messages
    processing: "Processing...",
    converting: "Converting PDF to images. Please wait.",
    autoDetecting: "Auto-detecting questions...",
    analyzing: "Analyzing PDF pages for question boundaries. Please wait.",
    questionsDetected: "Auto-detected {count} questions! You can now set the correct answers.",
    noQuestions: "No questions found. Please check your document format.",
    noQuestionsDetected: "No questions detected. Please use manual crop mode.",
    saveSuccess: "Test saved successfully!",
    testImported: "Test \"{name}\" imported successfully!",
    testDeleted: "Delete this test?",
    exitTest: "Exit test? Your answers will be lost.",
    noCorrectAnswers: "Some questions have no correct answers. Save anyway?",
    cropAtLeastOne: "Please crop at least one question!",
    selectQuestions: "No questions cropped yet. Click and drag on the page to select questions.",
    page: "Page",
    questionsCropped: "Questions Cropped:",
    doneSetAnswers: "Done - Set Answers",
    croppedQuestions: "Cropped Questions",
    currentPage: "Current Page",
    fromPage: "From page",
    created: "Created:",
    questions: "questions",
    preview: "Preview",
    pdfInfo: "📄 PDF Info: {count} page(s) loaded",
    
    // Theme
    lightTheme: "Light Theme",
    darkTheme: "Dark Theme",
  }
};

// Language provider component
const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState('vi'); // Vietnamese is default
  
  const t = (key) => {
    return translations[language]?.[key] || translations.en[key] || key;
  };
  
  const toggleLanguage = () => {
    const newLang = language === 'vi' ? 'en' : 'vi';
    setLanguage(newLang);
    localStorage.setItem('azota-language', newLang);
  };
  
  useEffect(() => {
    const saved = localStorage.getItem('azota-language');
    if (saved && ['vi', 'en'].includes(saved)) {
      setLanguage(saved);
    }
  }, []);
  
  return (
    <LanguageContext.Provider value={{ language, t, toggleLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};

// Theme provider component
const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState('light'); // Default to light theme
  
  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('azota-theme', newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };
  
  useEffect(() => {
    const saved = localStorage.getItem('azota-theme');
    if (saved && ['light', 'dark'].includes(saved)) {
      setTheme(saved);
      document.documentElement.classList.toggle('dark', saved === 'dark');
    } else {
      // Check system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setTheme(prefersDark ? 'dark' : 'light');
      document.documentElement.classList.toggle('dark', prefersDark);
    }
  }, []);
  
  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

const ThemeContext = React.createContext();

const VisualTestPlatform = () => {
  const [currentPage, setCurrentPage] = useState("home");
  const [tests, setTests] = useState([]);
  const [currentTest, setCurrentTest] = useState(null);
  const [editingTest, setEditingTest] = useState(null);
  const [testResults, setTestResults] = useState(null);
  const [userAnswers, setUserAnswers] = useState({});
  const [incorrectQuestions, setIncorrectQuestions] = useState([]);
  const [retakeMode, setRetakeMode] = useState('full'); // 'full' or 'incorrect'
  const [showAchievement, setShowAchievement] = useState(false);
  const [achievementData, setAchievementData] = useState({ questionNum: 0, totalQuestions: 0, questionText: '', progressPercentage: 0 });
  const [answeredQuestions, setAnsweredQuestions] = useState(new Set());
  const [imageZoomLevel, setImageZoomLevel] = useState(1); // 1 = 100%, 1.5 = 150%, etc.
  
  // Rapid test mode state
  const [rapidTestMode, setRapidTestMode] = useState(false);
  const [rapidCurrentQuestion, setRapidCurrentQuestion] = useState(null);
  const [rapidAnswer, setRapidAnswer] = useState(null);
  const [rapidShowResult, setRapidShowResult] = useState(false);
  const [rapidScore, setRapidScore] = useState(0);
  const [rapidAnsweredQuestions, setRapidAnsweredQuestions] = useState(new Set());
  const [rapidTotalQuestions, setRapidTotalQuestions] = useState(0);
  const [showParticleEffect, setShowParticleEffect] = useState(false);
  
  // Sound system
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [audioContext, setAudioContext] = useState(null);

  // Crop page state
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

  // Simple animations - no page resets
  const [simpleAnimations, setSimpleAnimations] = useState(true);

  // Simple animation helper - no page resets
  const triggerSimpleAnimation = (page) => {
    // Just a lightweight state update without disrupting the UI
    if (simpleAnimations) {
      setSimpleAnimations(false);
      setTimeout(() => setSimpleAnimations(true), 100);
    }
  };

  // Particle effects component
  const ParticleEffect = ({ isVisible }) => {
    if (!isVisible) return null;

    const particles = [];
    const colors = ['#10b981', '#34d399', '#6ee7b7', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];
    
    for (let i = 0; i < 20; i++) {
      particles.push(
        <div
          key={i}
          className="particle confetti"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            background: `linear-gradient(45deg, ${colors[Math.floor(Math.random() * colors.length)]}, ${colors[Math.floor(Math.random() * colors.length)]})`,
            animationDelay: `${Math.random() * 0.5}s`,
            animationDuration: `${1 + Math.random()}s`
          }}
        />
      );
    }

    return (
      <div className="particle-container">
        {particles}
      </div>
    );
  };

  // Initialize sound system and load preferences
  useEffect(() => {
    const savedSoundEnabled = localStorage.getItem('azota-sound-enabled');
    if (savedSoundEnabled !== null) {
      setSoundEnabled(savedSoundEnabled === 'true');
    }
  }, []);

  // Clean up achievement timeout on unmount
  useEffect(() => {
    return () => {
      if (window.achievementTimeout) {
        clearTimeout(window.achievementTimeout);
      }
    };
  }, []);

  // Enhanced crop selection with animations
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

    setCropState({
      ...cropState,
      currentPos: { x, y },
    });
  };

  const handleCropMouseUp = async (imgRef) => {
    if (!cropState.isSelecting || !cropState.startPos || !cropState.currentPos)
      return;

    const { startPos, currentPos } = cropState;
    const x = Math.min(startPos.x, currentPos.x);
    const y = Math.min(startPos.y, currentPos.y);
    const width = Math.abs(currentPos.x - startPos.x);
    const height = Math.abs(currentPos.y - startPos.y);

    // Don't create crops that are too small
    if (width < 0.05 || height < 0.05) {
      setCropState({
        ...cropState,
        isSelecting: false,
        startPos: null,
        currentPos: null,
      });
      return;
    }

    // Crop the image with animation
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
          type: "none", // Default new crops to "none" type
        },
      ],
    });
  };

  const finishCropping = () => {
    if (cropState.croppedQuestions.length === 0) {
      alert(t('cropAtLeastOne'));
      return;
    }

    const questions = cropState.croppedQuestions.map((q, idx) => ({
      ...q,
      number: idx + 1,
      type: "multiple_choice",
      options: [
        {letter: "A", text: ""},
        {letter: "B", text: ""},
        {letter: "C", text: ""},
        {letter: "D", text: ""},
      ],
    }));

    setEditingTest({
      ...editingTest,
      questions: questions,
    });

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

 // Parse document text to extract questions
  const parseQuestions = (text) => {
    const questions = [];
    const lines = text.split('\n');
    let currentQuestion = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Match question pattern (Câu X or Question X or numbered)
      const qMatch = line.match(/^(?:Câu|Question)\s+(\d+)\s*[:.]\s*(.+)/i) || line.match(/^(\d+)\.\s*(.+)/);
      if (qMatch) {
        if (currentQuestion) {
          questions.push(currentQuestion);
        }
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

      // Match option pattern - handle multiple formats
      if (currentQuestion) {
        // Check if line contains multiple options (inline format)
        // Pattern: starts with A-D followed by . or ), then has more A-D patterns
        const hasMultipleOptions = /^[A-D][\.\)]/.test(line) && 
                                   (line.match(/[A-D][\.\)]/g) || []).length > 1;
        
        if (hasMultipleOptions) {
          // Split by looking for letter followed by . or )
          // Use a more flexible approach to extract all options
          const optionPattern = /([A-D])[\.\)]\s*([^A-D]+?)(?=\s*[A-D][\.\)]|$)/g;
          let match;
          while ((match = optionPattern.exec(line)) !== null) {
            currentQuestion.options.push({
              letter: match[1],
              text: match[2].trim(),
            });
          }
          continue;
        }

        // Try standard single-line option format
        // Must start with letter followed by . or ) and then whitespace
        const optMatch = line.match(/^([A-D])[\.\)]\s+(.+)$/);
        if (optMatch) {
          currentQuestion.options.push({
            letter: optMatch[1],
            text: optMatch[2].trim(),
          });
        }
      }
    }

    if (currentQuestion) {
      questions.push(currentQuestion);
    }

    return questions;
  };

  // Set up PDF.js worker
  useEffect(() => {
    // Use dynamic version matching
    const version = pdfjsLib.version || "4.4.168";
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${version}/build/pdf.worker.min.mjs`;
  }, []);

  // Convert PDF pages to images with cropping capability
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

        await page.render({
          canvasContext: context,
          viewport: viewport,
        }).promise;

        images.push({
          dataUrl: canvas.toDataURL("image/png"),
          pageNumber: i,
        });
      }

      return images;
    } catch (error) {
      console.error("Error converting PDF:", error);
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle PDF upload
  const handlePdfUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.includes("pdf")) {
      alert(language === 'vi' ? "Vui lòng tải lên file PDF" : "Please upload a PDF file");
      return;
    }

    try {
      const images = await pdfToImages(file);

      const newTest = {
        id: Date.now(),
        name: file.name.replace(".pdf", ""),
        type: "visual",
        mode: "crop", // 'crop' or 'page'
        pages: images.map((img) => img.dataUrl),
        questions: [], // Will be created by cropping or auto-detection
        createdAt: new Date().toLocaleDateString(),
      };

      setTests([...tests, newTest]);
      setEditingTest(newTest);
      setCurrentPage("pdf-mode-select");
      triggerSimpleAnimation("pdf-mode-select");
    } catch (error) {
      alert((language === 'vi' ? "Lỗi xử lý PDF: " : "Error processing PDF: ") + error.message);
    }
  };

  // Auto-detect questions from PDF pages
  const autoDetectQuestions = async () => {
    setIsProcessing(true);
    try {
      const questions = [];

      for (let i = 0; i < editingTest.pages.length; i++) {
        const pageImage = editingTest.pages[i];

        // Create an image element to analyze
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

        // Get image data to analyze
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        // Find horizontal white spaces (potential question separators)
        const rowBrightness = [];
        const threshold = 240; // Brightness threshold for "white" space

        for (let y = 0; y < canvas.height; y++) {
          let whitePixels = 0;
          for (let x = 0; x < canvas.width; x++) {
            const idx = (y * canvas.width + x) * 4;
            const brightness = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
            if (brightness > threshold) whitePixels++;
          }
          rowBrightness.push(whitePixels / canvas.width);
        }

        // Find gaps (sequences of bright rows)
        const gaps = [];
        let gapStart = null;
        const whiteThreshold = 0.85; // 85% white pixels in row
        const minGapHeight = Math.floor(canvas.height * 0.02); // At least 2% of page height

        for (let y = 0; y < rowBrightness.length; y++) {
          if (rowBrightness[y] > whiteThreshold) {
            if (gapStart === null) gapStart = y;
          } else {
            if (gapStart !== null && y - gapStart > minGapHeight) {
              gaps.push({ start: gapStart, end: y });
            }
            gapStart = null;
          }
        }

        // Create questions from segments between gaps
        if (gaps.length > 0) {
          let lastY = 0;

          for (const gap of gaps) {
            if (gap.start - lastY > canvas.height * 0.05) {
              // At least 5% of page
              // Crop this section
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
                type: "none", // Auto-detected questions default to "none" type
              });
            }
            lastY = gap.end;
          }

          // Add remaining section
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
          // No gaps found, use entire page as one question
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
        alert(t('noQuestionsDetected'));
        setCurrentPage("crop");
        triggerSimpleAnimation("crop");
        return;
      }

      // Number questions
      const numberedQuestions = questions.map((q, idx) => ({
        ...q,
        number: idx + 1,
      }));

      setEditingTest({
        ...editingTest,
        questions: numberedQuestions,
      });

      setCurrentPage("edit");
      triggerSimpleAnimation("edit");
      alert(t('questionsDetected').replace('{count}', numberedQuestions.length));
    } catch (error) {
      console.error("Auto-detect error:", error);
      alert((language === 'vi' ? "Lỗi tự động phát hiện câu hỏi: " : "Error auto-detecting questions: ") + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle image upload
  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    try {
      const images = await Promise.all(
        files.map((file) => {
          return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });
        }),
      );

      const newTest = {
        id: Date.now(),
        name: `Test ${new Date().toLocaleString()}`,
        type: "visual",
        pages: images,
        questions: [],
        createdAt: new Date().toLocaleDateString(),
      };

      setTests([...tests, newTest]);
      setEditingTest(newTest);
      setCurrentPage("crop");
      triggerSimpleAnimation("crop");
    } catch (error) {
      alert((language === 'vi' ? "Lỗi xử lý hình ảnh: " : "Error processing images: ") + error.message);
    }
  };

  // Download test as JSON
  const downloadTest = (test) => {
    const testData = {
      name: test.name,
      type: test.type,
      questions: test.questions,
      exportedAt: new Date().toISOString(),
      version: "2.0",
    };

    const jsonString = JSON.stringify(testData, null, 2);
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

  // Upload test from JSON
  const handleTestUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      if (!file.name.endsWith(".json")) {
        alert(language === 'vi' ? "Vui lòng tải lên file test .json." : "Please upload a .json test file.");
        return;
      }

      const jsonText = await file.text();
      const testData = JSON.parse(jsonText);

      if (
        !testData.name ||
        !testData.questions ||
        !Array.isArray(testData.questions)
      ) {
        alert(language === 'vi' ? "Định dạng file test không hợp lệ." : "Invalid test file format.");
        return;
      }

      const importedTest = {
        id: Date.now(),
        name: testData.name,
        type: testData.type || "visual",
        questions: testData.questions,
        createdAt: new Date().toLocaleDateString(),
      };

      setTests([...tests, importedTest]);
      alert(t('testImported').replace('{name}', importedTest.name));
    } catch (error) {
      console.error("Error importing test:", error);
      alert((language === 'vi' ? "Lỗi nhập test: " : "Error importing test: ") + error.message);
    }
  };

  // Handle text file upload
  const handleTextUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.name.endsWith(".txt")) {
      alert(language === 'vi' ? "Vui lòng tải lên file .txt." : "Please upload a .txt file.");
      return;
    }

    try {
      const text = await file.text();
      const questions = parseQuestions(text);

      if (questions.length === 0) {
        alert(t('noQuestions'));
        return;
      }

      const newTest = {
        id: Date.now(),
        name: file.name.replace(".txt", ""),
        type: "text",
        questions: questions,
        createdAt: new Date().toLocaleDateString(),
      };

      setTests([...tests, newTest]);
      setEditingTest(newTest);
      setCurrentPage("edit");
      triggerSimpleAnimation("edit");
    } catch (error) {
      alert((language === 'vi' ? "Lỗi xử lý file text: " : "Error processing text file: ") + error.message);
    }
  };

  // Handle DOCX file upload
  const handleDocxUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.name.endsWith(".docx")) {
      alert(language === 'vi' ? "Vui lòng tải lên file .docx." : "Please upload a .docx file.");
      return;
    }

    try {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      const text = result.value;
      const questions = parseQuestions(text);

      if (questions.length === 0) {
        alert(t('noQuestions'));
        return;
      }

      const newTest = {
        id: Date.now(),
        name: file.name.replace(".docx", ""),
        type: "text",
        questions: questions,
        createdAt: new Date().toLocaleDateString(),
      };

      setTests([...tests, newTest]);
      setEditingTest(newTest);
      setCurrentPage("edit");
      triggerSimpleAnimation("edit");
    } catch (error) {
      alert((language === 'vi' ? "Lỗi xử lý file DOCX: " : "Error processing DOCX file: ") + error.message);
    }
  };

  // Add new question (image)
  const addQuestion = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        const newQuestion = {
          id: Date.now(),
          number: editingTest.questions.length + 1,
          image: e.target.result,
          correctAnswer: [],
          type: "none", // Default new questions to "none" type
          options: [
            {letter: "A", text: ""},
            {letter: "B", text: ""},
            {letter: "C", text: ""},
            {letter: "D", text: ""},
          ],
        };
        setEditingTest({
          ...editingTest,
          questions: [...editingTest.questions, newQuestion],
        });
      };
      reader.readAsDataURL(file);
    };
    input.click();
  };

  // Delete question
  const deleteQuestion = (questionId) => {
    setEditingTest({
      ...editingTest,
      questions: editingTest.questions
        .filter((q) => q.id !== questionId)
        .map((q, idx) => ({ ...q, number: idx + 1 })),
    });
  };

  // Update question
  const updateQuestion = (questionId, updates) => {
    setEditingTest({
      ...editingTest,
      questions: editingTest.questions.map((q) =>
        q.id === questionId ? { ...q, ...updates } : q,
      ),
    });
  };

  // Save test
  const saveTest = () => {
    if (editingTest.questions.some((q) => q.correctAnswer.length === 0)) {
      if (!confirm(t('noCorrectAnswers'))) {
        return;
      }
    }
    setTests(tests.map((t) => (t.id === editingTest.id ? editingTest : t)));
    setEditingTest(null);
    setCurrentPage("home");
    triggerSimpleAnimation("home");
    alert(t('saveSuccess'));
  };

  // Start test
  const startTest = (test) => {
    startTestWithQuestions(test, test.questions, 'full');
  };

  const submitTest = () => {
    let score = 0;
    const pointsPerQuestion = 10 / currentTest.questions.length;
    const incorrect = [];

    currentTest.questions.forEach((q) => {
      let isCorrect = false;
      if (q.type === "text_input") {
        const userSplit = (userAnswers[q.id] || "").split(',').map(a => a.trim().toLowerCase()).filter(a => a);
        const correctSplit = q.correctAnswer.map(a => a.toLowerCase());
        isCorrect = userSplit.length === correctSplit.length && userSplit.every(a => correctSplit.includes(a));
      } else {
        const userAns = userAnswers[q.id] || [];
        const correctAns = q.correctAnswer || [];
        isCorrect = userAns.length === correctAns.length && userAns.every(a => correctAns.includes(a));
      }
      if (isCorrect) {
        score += pointsPerQuestion;
      } else {
        incorrect.push(q);
      }
    });

    setTestResults({
      score: Math.round(score * 10) / 10,
      total: currentTest.questions.length,
      answers: userAnswers,
    });
    setIncorrectQuestions(incorrect);
    setCurrentPage("results");
    playSubmitSound(); // Sound effect for test submission
    playPageTransitionSound(); // Sound effect for page transition
    triggerSimpleAnimation("results");
  };

  // Start test with specific questions (full test or incorrect only)
  const startTestWithQuestions = (test, questions, mode = 'full') => {
    // Clear any existing achievement timeout
    if (window.achievementTimeout) {
      clearTimeout(window.achievementTimeout);
    }
    
    const filteredTest = {
      ...test,
      questions: questions,
    };
    setCurrentTest(filteredTest);
    setUserAnswers({});
    setTestResults(null);
    setRetakeMode(mode);
    setAnsweredQuestions(new Set()); // Reset answered questions
    setShowAchievement(false); // Hide any existing achievements
    setAchievementData({ questionNum: 0, totalQuestions: 0, questionText: '', progressPercentage: 0 }); // Reset achievement data
    setImageZoomLevel(1); // Reset image zoom to 100%
    setCurrentPage("test");
    playPageTransitionSound(); // Sound effect
    triggerSimpleAnimation("test");
  };

  // Get incorrect questions from last test
  const getIncorrectQuestions = () => {
    if (!testResults || !currentTest) return [];
    
    const incorrect = [];
    currentTest.questions.forEach((q) => {
      let isCorrect = false;
      if (q.type === "text_input") {
        const userSplit = (testResults.answers[q.id] || "").split(',').map(a => a.trim().toLowerCase()).filter(a => a);
        const correctSplit = q.correctAnswer.map(a => a.toLowerCase());
        isCorrect = userSplit.length === correctSplit.length && userSplit.every(a => correctSplit.includes(a));
      } else if (q.type === "none") {
        isCorrect = true; // "None" type questions are always considered correct
      } else {
        const userAns = testResults.answers[q.id] || [];
        const correctAns = q.correctAnswer || [];
        isCorrect = userAns.length === correctAns.length && userAns.every(a => correctAns.includes(a));
      }
      if (!isCorrect) {
        incorrect.push(q);
      }
    });
    return incorrect;
  };

  // Handle answer selection with achievement
  const handleAnswerSelect = (questionId, newAnswer) => {
    // Update answers immediately
    const updatedAnswers = {
      ...userAnswers,
      [questionId]: newAnswer,
    };
    setUserAnswers(updatedAnswers);
    
    // Check if this is the first time answering this question
    if (!answeredQuestions.has(questionId)) {
      const newAnsweredQuestions = new Set([...answeredQuestions, questionId]);
      setAnsweredQuestions(newAnsweredQuestions);
      
      // Show achievement immediately
      const currentQuestion = currentTest.questions.find(q => q.id === questionId);
      const questionIndex = currentTest.questions.findIndex(q => q.id === questionId);
      const displayNumber = retakeMode === 'incorrect' ? (questionIndex + 1) : (currentQuestion?.number || questionIndex + 1);
      const totalQuestions = currentTest.questions.length;
      const newProgressPercentage = Math.round((newAnsweredQuestions.size / totalQuestions) * 100);
      
      // Clear any existing achievement timeout
      if (window.achievementTimeout) {
        clearTimeout(window.achievementTimeout);
      }
      
      // Set achievement data and show it
      setAchievementData({
        questionNum: displayNumber,
        totalQuestions: totalQuestions,
        questionText: currentQuestion?.text?.length > 50 ? currentQuestion.text.substring(0, 50) + '...' : (currentQuestion?.text || ''),
        progressPercentage: newProgressPercentage
      });
      setShowAchievement(true);
      playAchievementSound(); // Sound effect for achievement
      
      // Hide achievement after 3 seconds
      window.achievementTimeout = setTimeout(() => {
        setShowAchievement(false);
      }, 3000);
    }
  };

  // Image zoom controls
  const increaseImageSize = () => {
    setImageZoomLevel(prev => Math.min(prev + 0.25, 3)); // Max 300%
  };

  const decreaseImageSize = () => {
    setImageZoomLevel(prev => Math.max(prev - 0.25, 0.5)); // Min 50%
  };

  const resetImageSize = () => {
    setImageZoomLevel(1); // Reset to 100%
  };

  // Rapid test mode functions
  const startRapidTest = (test) => {
    // Clear any existing achievement timeout
    if (window.achievementTimeout) {
      clearTimeout(window.achievementTimeout);
    }
    
    const questions = test.questions.filter(q => q.type !== 'none'); // Filter out display-only questions
    setRapidTestMode(true);
    setRapidCurrentQuestion(null);
    setRapidAnswer(null);
    setRapidShowResult(false);
    setRapidScore(0);
    setRapidAnsweredQuestions(new Set());
    setRapidTotalQuestions(questions.length);
    setShowParticleEffect(false);
    
    // Get first random question
    getRandomRapidQuestion(questions);
    setCurrentPage("rapid-test");
    playPageTransitionSound(); // Sound effect
    triggerSimpleAnimation("rapid-test");
  };

  const getRandomRapidQuestion = (questions) => {
    const availableQuestions = questions.filter(q => !rapidAnsweredQuestions.has(q.id));
    if (availableQuestions.length === 0) {
      // All questions answered, show completion
      setCurrentPage("rapid-results");
      playTestCompleteSound(); // Sound effect
      triggerSimpleAnimation("rapid-results");
      return;
    }
    
    const randomIndex = Math.floor(Math.random() * availableQuestions.length);
    const randomQuestion = availableQuestions[randomIndex];
    setRapidCurrentQuestion(randomQuestion);
    setRapidAnswer(null);
    setRapidShowResult(false);
    setShowParticleEffect(false);
    playQuestionAppearSound(); // Sound effect
  };

  const submitRapidAnswer = () => {
    if (!rapidCurrentQuestion || !rapidAnswer) return;
    
    const isCorrect = checkRapidAnswer(rapidCurrentQuestion, rapidAnswer);
    setRapidShowResult(true);
    
    if (isCorrect) {
      setRapidScore(prev => prev + 1);
      setShowParticleEffect(true);
      playCorrectSound(); // Sound effect for correct answer
      
      // Hide particle effect after animation
      setTimeout(() => {
        setShowParticleEffect(false);
      }, 2000);
    } else {
      playIncorrectSound(); // Sound effect for incorrect answer
    }
    
    // Add to answered questions
    setRapidAnsweredQuestions(prev => new Set([...prev, rapidCurrentQuestion.id]));
  };

  const checkRapidAnswer = (question, answer) => {
    if (question.type === "text_input") {
      const userSplit = (answer || "").split(',').map(a => a.trim().toLowerCase()).filter(a => a);
      const correctSplit = question.correctAnswer.map(a => a.toLowerCase());
      return userSplit.length === correctSplit.length && userSplit.every(a => correctSplit.includes(a));
    } else {
      const userAns = Array.isArray(answer) ? answer : [answer];
      const correctAns = question.correctAnswer || [];
      return userAns.length === correctAns.length && userAns.every(a => correctAns.includes(a));
    }
  };

  const nextRapidQuestion = () => {
    const test = tests.find(t => t.questions.some(q => q.id === rapidCurrentQuestion?.id)) || currentTest;
    const questions = test.questions.filter(q => q.type !== 'none');
    getRandomRapidQuestion(questions);
  };

  const restartRapidTest = () => {
    const test = tests.find(t => t.questions.some(q => q.id === rapidCurrentQuestion?.id)) || currentTest;
    const questions = test.questions.filter(q => q.type !== 'none');
    setRapidScore(0);
    setRapidAnsweredQuestions(new Set());
    getRandomRapidQuestion(questions);
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

  // Sound system functions
  const initAudioContext = () => {
    if (!audioContext) {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      setAudioContext(ctx);
    }
  };

  const playSound = (frequency, duration, type = 'sine', volume = 0.1) => {
    if (!soundEnabled || !audioContext) return;
    
    try {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
      oscillator.type = type;
      
      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(volume, audioContext.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + duration);
    } catch (error) {
      console.warn('Sound playback failed:', error);
    }
  };

  const playClickSound = () => {
    playSound(800, 0.1, 'sine', 0.05);
  };

  const playHoverSound = () => {
    playSound(600, 0.05, 'sine', 0.03);
  };

  const playCorrectSound = () => {
    // Success chord - multiple frequencies
    setTimeout(() => playSound(523, 0.3, 'sine', 0.1), 0);   // C
    setTimeout(() => playSound(659, 0.3, 'sine', 0.1), 100); // E
    setTimeout(() => playSound(784, 0.3, 'sine', 0.1), 200); // G
  };

  const playIncorrectSound = () => {
    // Sad descending tone
    playSound(400, 0.5, 'sawtooth', 0.1);
    setTimeout(() => playSound(350, 0.5, 'sawtooth', 0.1), 100);
    setTimeout(() => playSound(300, 0.5, 'sawtooth', 0.1), 200);
  };

  const playAchievementSound = () => {
    // Triumphant fanfare
    const notes = [523, 659, 784, 1047]; // C, E, G, C (higher)
    notes.forEach((freq, index) => {
      setTimeout(() => playSound(freq, 0.4, 'triangle', 0.08), index * 150);
    });
  };

  const playPageTransitionSound = () => {
    playSound(300, 0.2, 'sine', 0.05);
  };

  const playTestCompleteSound = () => {
    // Victory melody
    const melody = [523, 659, 784, 1047, 784, 659, 523];
    melody.forEach((freq, index) => {
      setTimeout(() => playSound(freq, 0.3, 'sine', 0.1), index * 200);
    });
  };

  const playQuestionAppearSound = () => {
    playSound(400, 0.15, 'sine', 0.06);
  };

  const playSubmitSound = () => {
    playSound(500, 0.3, 'square', 0.08);
  };

  const toggleSound = () => {
    initAudioContext();
    setSoundEnabled(!soundEnabled);
    localStorage.setItem('azota-sound-enabled', !soundEnabled);
  };

  // Header component with theme and language switchers
  const Header = () => (
    <div className={`${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-b`}>
      <div className="w-full px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
        <h1 className={`text-lg sm:text-xl lg:text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
          {t('appTitle')}
        </h1>
        <div className="flex items-center gap-2 md:gap-4">
          <button
            onClick={toggleTheme}
            className={`p-2 rounded-lg transition-all duration-200 ${theme === 'dark' ? 'bg-gray-700 text-yellow-400 hover:bg-gray-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            title={theme === 'light' ? t('darkTheme') : t('lightTheme')}
          >
            {theme === 'light' ? <Moon className="w-4 h-4 md:w-5 md:h-5" /> : <Sun className="w-4 h-4 md:w-5 md:h-5" />}
          </button>
          <button
            onClick={toggleLanguage}
            className={`p-2 rounded-lg transition-all duration-200 ${theme === 'dark' ? 'bg-gray-700 text-blue-400 hover:bg-gray-600' : 'bg-gray-100 text-blue-600 hover:bg-gray-200'}`}
            title={language === 'vi' ? 'Switch to English' : 'Chuyển sang tiếng Việt'}
          >
            <Globe className="w-4 h-4 md:w-5 md:h-5" />
            <span className="hidden sm:inline ml-1 text-sm font-medium">{language.toUpperCase()}</span>
          </button>
          <button
            onClick={toggleSound}
            className={`p-2 rounded-lg transition-all duration-200 ${soundEnabled ? (theme === 'dark' ? 'bg-gray-700 text-green-400 hover:bg-gray-600' : 'bg-gray-100 text-green-600 hover:bg-gray-200') : (theme === 'dark' ? 'bg-gray-700 text-red-400 hover:bg-gray-600' : 'bg-gray-100 text-red-600 hover:bg-gray-200')}`}
            title={soundEnabled ? (language === 'vi' ? 'Tắt âm thanh' : 'Mute sounds') : (language === 'vi' ? 'Bật âm thanh' : 'Unmute sounds')}
          >
            {soundEnabled ? '🔊' : '🔇'}
            <span className="hidden sm:inline ml-1 text-sm font-medium">{soundEnabled ? 'ON' : 'OFF'}</span>
          </button>
        </div>
      </div>
    </div>
  );

  // Page wrapper component
  const PageWrapper = ({ children, className = "" }) => (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900' : 'bg-slate-50'} transition-colors duration-300 ${className}`}>
      <Header />
      <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </div>
    </div>
  );

  // PDF Mode Selection page
  if (currentPage === "pdf-mode-select" && editingTest) {
    return (
      <PageWrapper>
        <div className="w-full">
          <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-lg p-6 lg:p-8`}>
            <h1 className={`text-2xl lg:text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-800'} mb-4 text-center`}>
              {t('howToExtract')}
            </h1>
            <p className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'} mb-8 text-center`}>
              {t('extractDescription')}
            </p>

            {isProcessing && (
              <div className={`${theme === 'dark' ? 'bg-blue-900 border-blue-700 text-blue-300' : 'bg-blue-100 border-blue-500 text-blue-700'} border-l-4 p-4 mb-6 rounded animate-pulse`}>
                <p className="font-bold">{t('autoDetecting')}</p>
                <p>{t('analyzing')}</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <button
                onClick={() => {
                  playClickSound();
                  autoDetectQuestions();
                }}
                disabled={isProcessing}
                className={`border-2 rounded-lg p-6 lg:p-8 transition-all duration-300 hover:scale-105 hover:shadow-xl ${theme === 'dark' ? 'border-green-600 bg-green-800 hover:bg-green-700 text-white' : 'border-green-300 bg-green-500 hover:bg-green-600 text-white'} disabled:opacity-50 shadow-lg`}
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className={`${theme === 'dark' ? 'bg-green-700' : 'bg-green-500'} text-white p-3 rounded-full shadow-lg`}>
                    <Image className="w-8 h-8" />
                  </div>
                  <h2 className={`text-xl lg:text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
                    {t('autoDetect')}
                  </h2>
                </div>
                <p className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'} mb-2`}>
                  {t('autoDetectDesc')}
                </p>
                <ul className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} space-y-1`}>
                  <li>✓ {language === 'vi' ? 'Nhanh chóng và tự động' : 'Fast and automatic'}</li>
                  <li>✓ {language === 'vi' ? 'Hoạt động tốt nhất với câu hỏi được chia cách rõ ràng' : 'Works best with well-spaced questions'}</li>
                  <li>✓ {language === 'vi' ? 'Không cần cắt thủ công' : 'No manual cropping needed'}</li>
                  <li>⚠ {language === 'vi' ? 'Có thể cần điều chỉnh nếu câu hỏi gần nhau' : 'May need adjustment if questions are close together'}</li>
                </ul>
              </button>

              <button
                onClick={() => {
                  playClickSound();
                  playPageTransitionSound();
                  setCurrentPage("crop");
                  triggerSimpleAnimation("crop");
                }}
                className={`border-2 rounded-lg p-6 lg:p-8 transition-all duration-300 hover:scale-105 hover:shadow-xl ${theme === 'dark' ? 'border-blue-600 bg-blue-800 hover:bg-blue-700 text-white' : 'border-blue-300 bg-blue-500 hover:bg-blue-600 text-white'} shadow-lg`}
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className={`${theme === 'dark' ? 'bg-blue-700' : 'bg-blue-500'} text-white p-3 rounded-full shadow-lg`}>
                    <Edit2 className="w-8 h-8" />
                  </div>
                  <h2 className={`text-xl lg:text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
                    {t('manualCrop')}
                  </h2>
                </div>
                <p className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'} mb-2`}>
                  {t('manualCropDesc')}
                </p>
                <ul className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} space-y-1`}>
                  <li>✓ {language === 'vi' ? 'Chính xác nhất' : 'Most accurate'}</li>
                  <li>✓ {language === 'vi' ? 'Kiểm soát hoàn toàn' : 'Full control over selection'}</li>
                  <li>✓ {language === 'vi' ? 'Hoạt động với mọi bố cục' : 'Works with any layout'}</li>
                  <li>✓ {language === 'vi' ? 'Có thể trích xuất câu hỏi một phần' : 'Can extract partial questions'}</li>
                </ul>
              </button>
            </div>

            <div className={`${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'} rounded p-4 mb-6`}>
              <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                <strong>{t('pdfInfo').split(':')[0]}:</strong> {editingTest.pages.length} {t('page').toLowerCase()}(s) {language === 'vi' ? 'đã tải' : 'loaded'}
              </p>
            </div>

            <button
              onClick={() => {
                playClickSound();
                playPageTransitionSound();
                setEditingTest(null);
                setCurrentPage("home");
                triggerSimpleAnimation("home");
              }}
              className={`w-full font-semibold py-3 px-4 rounded shadow-lg hover:shadow-xl transition-all duration-200 ${theme === 'dark' ? 'bg-gray-600 hover:bg-gray-700 text-white' : 'bg-gray-500 hover:bg-gray-600 text-white'}`}
            >
              {t('cancel')}
            </button>
          </div>
        </div>
      </PageWrapper>
    );
  }

  // Crop page
  if (currentPage === "crop" && editingTest) {
    const currentPageImg = editingTest.pages[cropState.currentPageIndex];

    return (
      <PageWrapper>
        <div className="w-full">
          <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-lg p-6 mb-6`}>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-4">
              <div>
                <h1 className={`text-xl lg:text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
                  {language === 'vi' ? 'Cắt câu hỏi từ PDF' : 'Crop Questions from PDF'}
                </h1>
                <p className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                  {language === 'vi' ? 'Nhấp và kéo để chọn mỗi khu vực câu hỏi' : 'Click and drag to select each question area'}
                </p>
              </div>
              <button
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
                className={`py-2 px-4 rounded transition-all duration-200 ${theme === 'dark' ? 'bg-gray-600 hover:bg-gray-700 text-white' : 'bg-gray-500 hover:bg-gray-600 text-white'} w-full sm:w-auto`}
              >
                {t('cancel')}
              </button>
            </div>

            <div className="flex flex-col lg:flex-row gap-4 mb-4">
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() =>
                    setCropState({
                      ...cropState,
                      currentPageIndex: Math.max(
                        0,
                        cropState.currentPageIndex - 1,
                      ),
                    })
                  }
                  disabled={cropState.currentPageIndex === 0}
                  className={`py-2 px-4 rounded disabled:opacity-50 transition-all duration-200 ${theme === 'dark' ? 'bg-gray-600 hover:bg-gray-700 text-white' : 'bg-gray-500 hover:bg-gray-600 text-white'}`}
                >
                  {language === 'vi' ? 'Trang trước' : 'Previous Page'}
                </button>
                <span className={`py-2 px-4 rounded ${theme === 'dark' ? 'bg-gray-700 text-gray-300' : 'bg-gray-100'}`}>
                  {t('page')} {cropState.currentPageIndex + 1} {language === 'vi' ? 'trên' : 'of'} {editingTest.pages.length}
                </span>
                <button
                  onClick={() =>
                    setCropState({
                      ...cropState,
                      currentPageIndex: Math.min(
                        editingTest.pages.length - 1,
                        cropState.currentPageIndex + 1,
                      ),
                    })
                  }
                  disabled={
                    cropState.currentPageIndex === editingTest.pages.length - 1
                  }
                  className={`py-2 px-4 rounded disabled:opacity-50 transition-all duration-200 ${theme === 'dark' ? 'bg-gray-600 hover:bg-gray-700 text-white' : 'bg-gray-500 hover:bg-gray-600 text-white'}`}
                >
                  {language === 'vi' ? 'Trang sau' : 'Next Page'}
                </button>
              </div>

              <div className="flex-1"></div>

              <div className={`px-4 py-2 rounded font-semibold ${theme === 'dark' ? 'bg-blue-900 text-blue-300' : 'bg-blue-100 text-blue-800'}`}>
                {t('questionsCropped')} {cropState.croppedQuestions.length}
              </div>

              <button
                onClick={() => {
                  playClickSound();
                  finishCropping();
                }}
                className={`font-semibold py-2 px-6 rounded transition-all duration-200 hover:scale-105 ${theme === 'dark' ? 'bg-green-700 hover:bg-green-600 text-white' : 'bg-green-500 hover:bg-green-600 text-white'}`}
              >
                {t('doneSetAnswers')}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className={`xl:col-span-2 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-lg p-6`}>
              <h3 className={`font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-800'} mb-4`}>{t('currentPage')}</h3>
              <div className="relative inline-block">
                <img
                  ref={imgRef}
                  src={currentPageImg}
                  alt={`${t('page')} ${cropState.currentPageIndex + 1}`}
                  className="w-full border-2 border-gray-300 rounded cursor-crosshair transition-transform duration-200 hover:scale-[1.02]"
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
                      className="absolute border-2 border-blue-500 bg-blue-200 bg-opacity-30 pointer-events-none animate-pulse"
                      style={{
                        left: `${Math.min(cropState.startPos.x, cropState.currentPos.x) * 100}%`,
                        top: `${Math.min(cropState.startPos.y, cropState.currentPos.y) * 100}%`,
                        width: `${Math.abs(cropState.currentPos.x - cropState.startPos.x) * 100}%`,
                        height: `${Math.abs(cropState.currentPos.y - cropState.startPos.y) * 100}%`,
                      }}
                    />
                  )}
              </div>
            </div>

            <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-lg p-6`}>
              <h3 className={`font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-800'} mb-4`}>
                {t('croppedQuestions')}
              </h3>
              <div className="space-y-4 max-h-[600px] overflow-y-auto">
                {cropState.croppedQuestions.map((q, idx) => (
                  <div
                    key={q.id}
                    className={`border-2 rounded p-3 transition-all duration-200 hover:shadow-md ${theme === 'dark' ? 'border-gray-600' : 'border-gray-200'}`}
                    style={{ animationDelay: `${idx * 0.1}s` }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className={`font-semibold ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                        Q{idx + 1}
                      </span>
                      <button
                        onClick={() => {
                          setCropState({
                            ...cropState,
                            croppedQuestions: cropState.croppedQuestions.filter(
                              (cq) => cq.id !== q.id,
                            ),
                          });
                        }}
                        className="text-red-500 hover:text-red-700 transition-colors duration-200"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <img
                      src={q.image}
                      alt={`Question ${idx + 1}`}
                      className="w-full rounded border transition-transform duration-200 hover:scale-105"
                    />
                    <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} mt-1`}>
                      {t('fromPage')} {q.pageIndex + 1}
                    </p>
                  </div>
                ))}
                {cropState.croppedQuestions.length === 0 && (
                  <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} text-center py-8`}>
                    {t('selectQuestions')}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </PageWrapper>
    );
  }

  // Home page
  if (currentPage === "home") {
    return (
      <PageWrapper>
        <div className="w-full">
          <div className="text-center mb-8 lg:mb-12">
            <h1 className={`text-3xl lg:text-4xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-800'} mb-2 rainbow-text`}>
              {t('appTitle')}
            </h1>
            <p className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
              {t('appDescription')}
            </p>
          </div>

          {isProcessing && (
            <div className={`${theme === 'dark' ? 'bg-yellow-900 border-yellow-700 text-yellow-300' : 'bg-yellow-100 border-yellow-500 text-yellow-700'} border-l-4 p-4 mb-6 rounded animate-pulse`}>
              <p className="font-bold">{t('processing')}</p>
              <p>{t('converting')}</p>
            </div>
          )}

          <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-lg p-6 lg:p-8 mb-8`}>
            <h2 className={`text-xl lg:text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-800'} mb-6`}>
              {t('uploadContent')}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 lg:gap-6">
              <div className={`${theme === 'dark' ? 'bg-indigo-900 border-indigo-700 hover:bg-indigo-800' : 'bg-indigo-50 border-indigo-300 hover:bg-indigo-100'} border-2 border-dashed rounded-lg p-6 lg:p-8 text-center transition-all duration-300 hover:scale-105 hover:shadow-xl cursor-pointer`}>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handlePdfUpload}
                  className="hidden"
                  id="pdf-input"
                  disabled={isProcessing}
                />
                <label
                  htmlFor="pdf-input"
                  className={`cursor-pointer ${isProcessing ? "opacity-50" : ""}`}
                >
                  <Upload className={`w-8 h-8 lg:w-12 lg:h-12 mx-auto mb-4 ${theme === 'dark' ? 'text-indigo-400' : 'text-indigo-500'}`} />
                  <p className={`text-sm lg:text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-700'} mb-2`}>
                    {t('uploadPdf')}
                  </p>
                  <p className={`text-xs lg:text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'}`}>
                    {t('uploadPdfDesc')}
                  </p>
                </label>
              </div>

              <div className={`${theme === 'dark' ? 'bg-purple-900 border-purple-700 hover:bg-purple-800' : 'bg-purple-50 border-purple-300 hover:bg-purple-100'} border-2 border-dashed rounded-lg p-6 lg:p-8 text-center transition-all duration-300 hover:scale-105 hover:shadow-xl cursor-pointer`}>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="hidden"
                  id="image-input"
                />
                <label htmlFor="image-input" className="cursor-pointer">
                  <Image className={`w-8 h-8 lg:w-12 lg:h-12 mx-auto mb-4 ${theme === 'dark' ? 'text-purple-400' : 'text-purple-500'}`} />
                  <p className={`text-sm lg:text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-700'} mb-2`}>
                    {t('uploadImages')}
                  </p>
                  <p className={`text-xs lg:text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'}`}>
                    {t('uploadImagesDesc')}
                  </p>
                </label>
              </div>

              <div className={`${theme === 'dark' ? 'bg-green-900 border-green-700 hover:bg-green-800' : 'bg-green-50 border-green-300 hover:bg-green-100'} border-2 border-dashed rounded-lg p-6 lg:p-8 text-center transition-all duration-300 hover:scale-105 hover:shadow-xl cursor-pointer`}>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleTestUpload}
                  className="hidden"
                  id="test-input"
                />
                <label htmlFor="test-input" className="cursor-pointer">
                  <Upload className={`w-8 h-8 lg:w-12 lg:h-12 mx-auto mb-4 ${theme === 'dark' ? 'text-green-400' : 'text-green-500'}`} />
                  <p className={`text-sm lg:text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-700'} mb-2`}>
                    {t('importTest')}
                  </p>
                  <p className={`text-xs lg:text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'}`}>
                    {t('importTestDesc')}
                  </p>
                </label>
              </div>

              <div className={`${theme === 'dark' ? 'bg-teal-900 border-teal-700 hover:bg-teal-800' : 'bg-teal-50 border-teal-300 hover:bg-teal-100'} border-2 border-dashed rounded-lg p-6 lg:p-8 text-center transition-all duration-300 hover:scale-105 hover:shadow-xl cursor-pointer`}>
                <input
                  type="file"
                  accept=".txt"
                  onChange={handleTextUpload}
                  className="hidden"
                  id="text-input"
                />
                <label htmlFor="text-input" className="cursor-pointer">
                  <Upload className={`w-8 h-8 lg:w-12 lg:h-12 mx-auto mb-4 ${theme === 'dark' ? 'text-teal-400' : 'text-teal-500'}`} />
                  <p className={`text-sm lg:text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-700'} mb-2`}>
                    {t('uploadText')}
                  </p>
                  <p className={`text-xs lg:text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'}`}>
                    {t('uploadTextDesc')}
                  </p>
                </label>
              </div>

              <div className={`${theme === 'dark' ? 'bg-red-900 border-red-700 hover:bg-red-800' : 'bg-red-50 border-red-300 hover:bg-red-100'} border-2 border-dashed rounded-lg p-6 lg:p-8 text-center transition-all duration-300 hover:scale-105 hover:shadow-xl cursor-pointer`}>
                <input
                  type="file"
                  accept=".docx"
                  onChange={handleDocxUpload}
                  className="hidden"
                  id="docx-input"
                />
                <label htmlFor="docx-input" className="cursor-pointer">
                  <Upload className={`w-8 h-8 lg:w-12 lg:h-12 mx-auto mb-4 ${theme === 'dark' ? 'text-red-400' : 'text-red-500'}`} />
                  <p className={`text-sm lg:text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-700'} mb-2`}>
                    {t('uploadDocx')}
                  </p>
                  <p className={`text-xs lg:text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'}`}>
                    {t('uploadDocxDesc')}
                  </p>
                </label>
              </div>
            </div>
          </div>

          {tests.length > 0 && (
            <div>
              <h2 className={`text-xl lg:text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-800'} mb-6`}>
                {t('yourTests')}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
                {tests.map((test, idx) => (
                  <div
                    key={test.id}
                    className={`${theme === 'dark' ? 'bg-gray-800 hover:bg-gray-750' : 'bg-white hover:shadow-lg'} rounded-lg shadow-md p-4 lg:p-6 transition-all duration-300 hover:scale-105`}
                    style={{ animationDelay: `${idx * 0.1}s` }}
                  >
                    <h3 className={`text-lg lg:text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-800'} mb-2`}>
                      {test.name}
                    </h3>
                    <p className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'} mb-2`}>
                      {test.questions.length} {t('questions')}
                    </p>
                    <p className={`text-xs lg:text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} mb-4`}>
                      {t('created')} {test.createdAt}
                    </p>
                    {test.questions[0]?.image && (
                      <img
                        src={test.questions[0].image}
                        alt={t('preview')}
                        className="w-full h-24 lg:h-32 object-cover rounded mb-4 transition-transform duration-200 hover:scale-105"
                      />
                    )}
                    {test.questions[0]?.text && (
                      <div className={`w-full h-24 lg:h-32 ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'} rounded mb-4 flex items-center justify-center`}>
                        <p className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'} text-xs lg:text-sm text-center px-4`}>
                          {test.questions[0].text.length > 100
                            ? test.questions[0].text.substring(0, 100) + "..."
                            : test.questions[0].text}
                        </p>
                      </div>
                    )}
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
                      <button
                        onClick={() => {
                          playClickSound();
                          startTest(test);
                        }}
                        className={`font-semibold py-2 px-3 lg:px-4 rounded flex items-center justify-center gap-1 lg:gap-2 shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105 text-xs lg:text-sm ${theme === 'dark' ? 'bg-green-700 hover:bg-green-600 text-white' : 'bg-green-500 hover:bg-green-600 text-white'}`}
                      >
                        <Play className="w-3 h-3 lg:w-4 lg:h-4" /> {t('take')}
                      </button>
                      <button
                        onClick={() => {
                          playClickSound();
                          startRapidTest(test);
                        }}
                        className={`font-semibold py-2 px-3 lg:px-4 rounded flex items-center justify-center gap-1 lg:gap-2 shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105 text-xs lg:text-sm ${theme === 'dark' ? 'bg-orange-700 hover:bg-orange-600 text-white' : 'bg-orange-500 hover:bg-orange-600 text-white'}`}
                        title={t('rapidTestDesc')}
                      >
                        ⚡ {t('rapidTest')}
                      </button>
                      <button
                        onClick={() => {
                          playClickSound();
                          setEditingTest(test);
                          setCurrentPage("edit");
                          playPageTransitionSound();
                          triggerSimpleAnimation("edit");
                        }}
                        className={`font-semibold py-2 px-3 lg:px-4 rounded flex items-center justify-center gap-1 lg:gap-2 shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105 text-xs lg:text-sm ${theme === 'dark' ? 'bg-blue-700 hover:bg-blue-600 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white'}`}
                      >
                        <Edit2 className="w-3 h-3 lg:w-4 lg:h-4" /> {t('edit')}
                      </button>
                      <button
                        onClick={() => {
                          playClickSound();
                          downloadTest(test);
                        }}
                        className={`font-semibold py-2 px-3 lg:px-4 rounded flex items-center justify-center gap-1 lg:gap-2 shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105 text-xs lg:text-sm ${theme === 'dark' ? 'bg-purple-700 hover:bg-purple-600 text-white' : 'bg-purple-500 hover:bg-purple-600 text-white'}`}
                      >
                        <Upload className="w-3 h-3 lg:w-4 lg:h-4 rotate-180" /> {t('save')}
                      </button>
                      <button
                        onClick={() => {
                          playClickSound();
                          if (confirm(t('testDeleted'))) {
                            setTests(tests.filter((t) => t.id !== test.id));
                          }
                        }}
                        className={`font-semibold py-2 px-3 lg:px-4 rounded flex items-center justify-center gap-1 lg:gap-2 shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105 text-xs lg:text-sm ${theme === 'dark' ? 'bg-red-700 hover:bg-red-600 text-white' : 'bg-red-500 hover:bg-red-600 text-white'}`}
                      >
                        <Trash2 className="w-3 h-3 lg:w-4 lg:h-4" /> {t('delete')}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tests.length === 0 && (
            <div className="text-center py-12">
              <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} text-lg`}>
                {t('noTests')}
              </p>
            </div>
          )}
        </div>
      </PageWrapper>
    );
  }

  // Edit page
  if (currentPage === "edit" && editingTest) {
    return (
      <PageWrapper>
        <div className="w-full">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6 lg:mb-8">
            <button
              onClick={() => {
                playClickSound();
                playPageTransitionSound();
                setEditingTest(null);
                setCurrentPage("home");
                triggerSimpleAnimation("home");
              }}
              className={`py-2 px-4 rounded flex items-center gap-2 transition-all duration-200 hover:scale-105 ${theme === 'dark' ? 'bg-gray-600 hover:bg-gray-700 text-white' : 'bg-gray-500 hover:bg-gray-600 text-white'} w-full sm:w-auto`}
            >
              <Home className="w-4 h-4" /> {t('back')}
            </button>
            <input
              type="text"
              value={editingTest.name}
              onChange={(e) =>
                setEditingTest({ ...editingTest, name: e.target.value })
              }
              className={`flex-1 text-lg lg:text-2xl font-bold border-b-2 pb-2 focus:outline-none focus:border-indigo-500 bg-transparent transition-colors duration-200 ${theme === 'dark' ? 'border-gray-600 text-white' : 'border-gray-300 text-gray-800'}`}
            />
          </div>

          <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-lg p-6 lg:p-8 mb-6`}>
            <h2 className={`text-lg lg:text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-800'} mb-4`}>
              {t('setAnswers')}
            </h2>
            <p className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'} mb-6`}>
              {t('setAnswersDesc')}
            </p>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
              {editingTest.questions.map((question, idx) => (
                <div
                  key={question.id}
                  className={`${theme === 'dark' ? 'bg-gray-700' : 'bg-white'} rounded-lg shadow-md p-4 lg:p-6 hover:shadow-lg transition-all duration-300 border ${theme === 'dark' ? 'border-gray-600' : 'border-gray-200'}`}
                  style={{ animationDelay: `${idx * 0.1}s` }}
                >
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
                    <h3 className={`text-lg lg:text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
                      {language === 'vi' ? 'Câu hỏi' : 'Question'} {question.number}
                    </h3>
                    <button
                      onClick={() => deleteQuestion(question.id)}
                      className={`py-2 px-4 rounded flex items-center gap-1 shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105 ${theme === 'dark' ? 'bg-red-700 hover:bg-red-600 text-white' : 'bg-red-500 hover:bg-red-600 text-white'} w-full sm:w-auto`}
                    >
                      <Trash2 className="w-4 h-4" /> {t('delete')}
                    </button>
                  </div>

                  <div className="mb-4">
                    <label className={`block text-sm font-semibold ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                      {t('questionType')}
                    </label>
                    <select
                      value={question.type || "multiple_choice"}
                      onChange={(e) => {
                        const newType = e.target.value;
                        let updates = { type: newType };
                        if (newType === "true_false") {
                          updates.options = [
                            {letter: "T", text: language === 'vi' ? "Đúng" : "True"},
                            {letter: "F", text: language === 'vi' ? "Sai" : "False"},
                          ];
                          updates.correctAnswer = [];
                        } else if (newType === "text_input") {
                          updates.options = [];
                          updates.correctAnswer = [];
                        } else if (newType === "multiple_choice") {
                          if (!question.options || question.options.length === 0) {
                            updates.options = [
                              {letter: "A", text: question.text ? "Option A" : ""},
                              {letter: "B", text: question.text ? "Option B" : ""},
                              {letter: "C", text: question.text ? "Option C" : ""},
                              {letter: "D", text: question.text ? "Option D" : ""},
                            ];
                          }
                        } else if (newType === "none") {
                          updates.options = [];
                          updates.correctAnswer = [];
                        }
                        updateQuestion(question.id, updates);
                      }}
                      className={`w-full border rounded p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors duration-200 ${theme === 'dark' ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white text-gray-800'}`}
                    >
                      <option value="multiple_choice">{t('multipleChoice')}</option>
                      <option value="true_false">{t('trueFalse')}</option>
                      <option value="text_input">{t('textInput')}</option>
                      <option value="none">{t('none')}</option>
                    </select>
                  </div>

                  {question.image && (
                    <img
                      src={question.image}
                      alt={`${language === 'vi' ? 'Câu hỏi' : 'Question'} ${question.number}`}
                      className="w-full rounded mb-4 border border-gray-200 transition-transform duration-200 hover:scale-105"
                    />
                  )}

                  {question.type === "none" && (
                    <div className="mb-4">
                      <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} italic`}>
                        {language === 'vi' ? 'Câu hỏi này chỉ để hiển thị tiêu đề hoặc hình ảnh, không cần câu trả lời.' : 'This question is for displaying title or picture content only, no answer required.'}
                      </p>
                    </div>
                  )}

                  {question.type === "multiple_choice" && (
                    <>
                      {question.text && (
                        <div className="mb-4">
                          <label className={`block text-sm font-semibold ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                            {t('questionText')}
                          </label>
                          <input
                            type="text"
                            value={question.text}
                            onChange={(e) => updateQuestion(question.id, { text: e.target.value })}
                            className={`w-full border rounded p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors duration-200 ${theme === 'dark' ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white text-gray-800'}`}
                            placeholder={language === 'vi' ? 'Nhập văn bản câu hỏi' : 'Enter question text'}
                          />
                        </div>
                      )}

                      <div className="mb-4">
                        <label className={`block text-sm font-semibold ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                          {t('options')}
                        </label>
                        <div className="space-y-3">
                          {question.options.map((option, optIdx) => (
                            <div key={optIdx} className={`flex items-center gap-3 p-3 border rounded-lg transition-colors duration-200 ${theme === 'dark' ? 'border-gray-600' : 'border-gray-200'}`}>
                              <span className={`font-semibold w-8 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>{option.letter}.</span>
                              {question.text && (
                                <input
                                  type="text"
                                  value={option.text}
                                  onChange={(e) => {
                                    const newOptions = [...question.options];
                                    newOptions[optIdx] = { ...option, text: e.target.value };
                                    updateQuestion(question.id, { options: newOptions });
                                  }}
                                  className={`flex-1 border rounded p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors duration-200 ${theme === 'dark' ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white text-gray-800'}`}
                                  placeholder={`${language === 'vi' ? 'Lựa chọn' : 'Option'} ${option.letter}`}
                                />
                              )}
                              <input
                                type="checkbox"
                                checked={question.correctAnswer.includes(option.letter)}
                                onChange={(e) => {
                                  const current = question.correctAnswer;
                                  const newAnswers = e.target.checked
                                    ? [...current, option.letter].sort()
                                    : current.filter((a) => a !== option.letter);
                                  updateQuestion(question.id, { correctAnswer: newAnswers });
                                }}
                                className="w-5 h-5 text-indigo-600"
                              />
                              <button
                                onClick={() => {
                                  const newOptions = question.options.filter((_, i) => i !== optIdx);
                                  updateQuestion(question.id, { options: newOptions });
                                }}
                                className="text-red-500 hover:text-red-700 p-1 transition-colors duration-200"
                              >
                                <Trash2 className="w-5 h-5" />
                              </button>
                            </div>
                          ))}
                        </div>
                        <button
                          onClick={() => {
                            const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
                            const used = question.options.map(o => o.letter);
                            const next = letters.split('').find(l => !used.includes(l));
                            if (next) {
                              const newOptions = [...question.options, {letter: next, text: question.text ? `Option ${next}` : ""}];
                              updateQuestion(question.id, { options: newOptions });
                            }
                          }}
                          className={`mt-3 py-2 px-4 rounded flex items-center gap-2 shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105 ${theme === 'dark' ? 'bg-indigo-700 hover:bg-indigo-600 text-white' : 'bg-indigo-500 hover:bg-indigo-600 text-white'}`}
                        >
                          <Plus className="w-4 h-4" /> {t('addOption')}
                        </button>
                      </div>
                    </>
                  )}

                  {question.type === "true_false" && (
                    <div className="mb-4">
                      <label className={`block text-sm font-semibold ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                        {t('correctAnswers')}
                      </label>
                      <div className="space-y-3">
                        {question.options.map((option) => (
                          <label key={option.letter} className={`flex items-center p-3 border rounded-lg hover:border-indigo-500 cursor-pointer transition-colors duration-200 ${theme === 'dark' ? 'border-gray-600' : 'border-gray-200'}`}>
                            <input
                              type="radio"
                              name={`correct-${question.id}`}
                              value={option.letter}
                              checked={question.correctAnswer.includes(option.letter)}
                              onChange={(e) => updateQuestion(question.id, { correctAnswer: [e.target.value] })}
                              className="w-5 h-5 mr-3 text-indigo-600"
                            />
                            <span className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>{option.text}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  {question.type === "text_input" && (
                    <div className="mb-4">
                      <label className={`block text-sm font-semibold ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                        {t('correctAnswers')}
                      </label>
                      <input
                        type="text"
                        value={question.correctAnswer.join(", ")}
                        onChange={(e) => {
                          const answers = e.target.value.split(',').map(a => a.trim()).filter(a => a);
                          updateQuestion(question.id, { correctAnswer: answers });
                        }}
                        placeholder={language === 'vi' ? 'Phân tách nhiều câu trả lời bằng dấu phẩy' : 'Separate multiple answers with commas'}
                        className={`w-full border rounded p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors duration-200 ${theme === 'dark' ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white text-gray-800'}`}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => {
                  playClickSound();
                  addQuestion();
                }}
                className={`flex-1 font-semibold py-3 px-4 rounded flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 ${theme === 'dark' ? 'bg-indigo-700 hover:bg-indigo-600 text-white' : 'bg-indigo-500 hover:bg-indigo-600 text-white'}`}
              >
                <Plus className="w-5 h-5" /> {t('addQuestion')}
              </button>

              <button
                onClick={() => {
                  playClickSound();
                  saveTest();
                }}
                className={`flex-1 font-semibold py-3 px-4 rounded shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 ${theme === 'dark' ? 'bg-green-700 hover:bg-green-600 text-white' : 'bg-green-500 hover:bg-green-600 text-white'}`}
              >
                {t('save')}
              </button>
            </div>
          </div>
        </div>
      </PageWrapper>
    );
  }

  // Test taking page
  if (currentPage === "test" && currentTest) {
    const progressPercentage = Math.round((answeredQuestions.size / currentTest.questions.length) * 100);

    return (
      <PageWrapper>
        {/* Progress Indicator */}
        <div className="progress-indicator">
          <div>✨ {language === 'vi' ? 'Câu hỏi hoàn thành!' : 'Question Completed!'}</div>
          <div className="progress-counter">
            {answeredQuestions.size} / {currentTest.questions.length} ({progressPercentage}%)
          </div>
        </div>

        {/* Achievement Popup */}
        {showAchievement && (
          <div className="achievement-popup">
            <div className="achievement-content">
              <div className="achievement-title">✨ {t('achievementUnlocked')}</div>
              <div className="achievement-subtitle">
                {t('questionCompleted')} {achievementData.questionNum} / {achievementData.totalQuestions}
              </div>
              {achievementData.questionText && (
                <div className="achievement-subtitle" style={{ fontSize: '12px', opacity: 0.7 }}>
                  "{achievementData.questionText}"
                </div>
              )}
              <div className="achievement-progress">
                <div 
                  className="achievement-progress-bar"
                  style={{ '--progress-width': `${achievementData.progressPercentage || progressPercentage}%` }}
                ></div>
              </div>
              <div className="achievement-counter">
                {t('overallProgress')}: {achievementData.progressPercentage || progressPercentage}%
              </div>
            </div>
          </div>
        )}

        <div className="w-full">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 lg:mb-8 gap-4">
            <div>
              <h1 className={`text-2xl lg:text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
                {currentTest.name}
              </h1>
              <p className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'} mt-1`}>
                {retakeMode === 'incorrect' 
                  ? (language === 'vi' ? `Làm lại câu sai (${currentTest.questions.length} câu)` : `Retaking incorrect questions (${currentTest.questions.length} questions)`)
                  : (language === 'vi' ? `Bài kiểm tra đầy đủ (${currentTest.questions.length} câu)` : `Full test (${currentTest.questions.length} questions)`)
                }
              </p>
              
              {/* Image Size Controls */}
              <div className="flex items-center gap-2 mt-3">
                <span className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  {language === 'vi' ? 'Kích thước hình ảnh:' : 'Image size:'}
                </span>
                <button
                  onClick={decreaseImageSize}
                  disabled={imageZoomLevel <= 0.5}
                  className={`px-2 py-1 rounded text-sm font-bold transition-all duration-200 hover:scale-105 ${
                    imageZoomLevel <= 0.5
                      ? 'opacity-50 cursor-not-allowed'
                      : `${theme === 'dark' ? 'bg-red-700 hover:bg-red-600 text-white' : 'bg-red-500 hover:bg-red-600 text-white'}`
                  }`}
                  title={language === 'vi' ? 'Thu nhỏ hình ảnh' : 'Decrease image size'}
                >
                  −
                </button>
                <span className={`px-3 py-1 rounded text-sm font-semibold ${
                  theme === 'dark' ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'
                }`}>
                  {Math.round(imageZoomLevel * 100)}%
                </span>
                <button
                  onClick={increaseImageSize}
                  disabled={imageZoomLevel >= 3}
                  className={`px-2 py-1 rounded text-sm font-bold transition-all duration-200 hover:scale-105 ${
                    imageZoomLevel >= 3
                      ? 'opacity-50 cursor-not-allowed'
                      : `${theme === 'dark' ? 'bg-green-700 hover:bg-green-600 text-white' : 'bg-green-500 hover:bg-green-600 text-white'}`
                  }`}
                  title={language === 'vi' ? 'Phóng to hình ảnh' : 'Increase image size'}
                >
                  +
                </button>
                <button
                  onClick={resetImageSize}
                  className={`px-2 py-1 rounded text-xs font-medium transition-all duration-200 hover:scale-105 ${
                    theme === 'dark' ? 'bg-blue-700 hover:bg-blue-600 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white'
                  }`}
                  title={language === 'vi' ? 'Đặt lại kích thước' : 'Reset size'}
                >
                  {language === 'vi' ? 'Đặt lại' : 'Reset'}
                </button>
              </div>
            </div>
            <button
              onClick={() => {
                playClickSound();
                // Clear achievement timeout
                if (window.achievementTimeout) {
                  clearTimeout(window.achievementTimeout);
                }
                
                if (confirm(t('exitTest'))) {
                  setCurrentTest(null);
                  setCurrentPage("home");
                  setRetakeMode('full');
                  triggerSimpleAnimation("home");
                }
              }}
              className={`py-2 px-4 rounded transition-all duration-200 hover:scale-105 ${theme === 'dark' ? 'bg-gray-600 hover:bg-gray-700 text-white' : 'bg-gray-500 hover:bg-gray-600 text-white'} w-full sm:w-auto`}
            >
              {t('exit')}
            </button>
          </div>

          <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-lg p-6 lg:p-8`}>
            <div className="space-y-6 lg:space-y-8">
              {currentTest.questions.map((question, idx) => (
                <div
                  key={question.id}
                  className={`border-b-2 pb-6 lg:pb-8 last:border-b-0`}
                  style={{ animationDelay: `${idx * 0.1}s` }}
                >
                  <h3 className={`text-lg lg:text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-800'} mb-4`}>
                    {language === 'vi' ? 'Câu hỏi' : 'Question'} {idx + 1}
                    {retakeMode === 'incorrect' && (
                      <span className={`text-sm ml-2 px-2 py-1 rounded ${theme === 'dark' ? 'bg-orange-900 text-orange-300' : 'bg-orange-100 text-orange-800'}`}>
                        {language === 'vi' ? 'Câu sai' : 'Incorrect'}
                      </span>
                    )}
                  </h3>

                  {question.text && (
                    <p className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} mb-4 text-base lg:text-lg`}>{question.text}</p>
                  )}

                  {question.image && (
                    <div className="image-zoom-container mb-4">
                      <img
                        src={question.image}
                        alt={`${language === 'vi' ? 'Câu hỏi' : 'Question'} ${question.number}`}
                        className="rounded border-2 border-gray-200 transition-transform duration-200 hover:scale-[1.02]"
                        style={{
                          transform: `scale(${imageZoomLevel})`,
                          transformOrigin: 'center center',
                          maxWidth: imageZoomLevel > 1 ? 'none' : '100%',
                        }}
                      />
                    </div>
                  )}

                  {question.type === "none" && (
                    <div className={`${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'} border-l-4 border-blue-500 p-4 rounded`}>
                      <p className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'} italic`}>
                        {language === 'vi' ? 'Câu hỏi này chỉ để hiển thị nội dung, không cần trả lời.' : 'This question is for display only, no answer required.'}
                      </p>
                    </div>
                  )}

                  {question.type === "multiple_choice" && question.text && (
                    <div className="space-y-2">
                      <p className={`font-semibold ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                        {t('yourAnswer')}
                      </p>
                      <div className="space-y-2">
                        {question.options.map((option) => (
                          <label
                            key={option.letter}
                            onMouseEnter={() => playHoverSound()}
                            className={`flex items-center p-3 border-2 rounded hover:border-indigo-500 hover:bg-indigo-50 cursor-pointer transition-all duration-200 ${theme === 'dark' ? 'border-gray-600 hover:bg-gray-700' : 'border-gray-300'}`}
                          >
                            <input
                              type="checkbox"
                              checked={(userAnswers[question.id] || []).includes(option.letter)}
                            onChange={(e) => {
                                const current = userAnswers[question.id] || [];
                                const newAnswers = e.target.checked
                                  ? [...current, option.letter].sort()
                                  : current.filter((a) => a !== option.letter);
                                handleAnswerSelect(question.id, newAnswers);
                              }}
                              className="w-4 h-4 mr-3"
                            />
                            <span className={`font-semibold ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} w-8`}>
                              {option.letter}.
                            </span>
                            <span className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>{option.text}</span>
                          </label>
                        ))}
                      </div>
                      {(userAnswers[question.id] || []).length > 0 && (
                        <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} mt-2`}>
                          {t('selected')} {(userAnswers[question.id] || []).join(", ")}
                        </p>
                      )}
                    </div>
                  )}

                  {question.type === "multiple_choice" && question.image && (
                    <div className="space-y-2">
                      <p className={`font-semibold ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                        {t('yourAnswer')}
                      </p>
                      <div className="flex gap-2 lg:gap-3 flex-wrap">
                        {question.options.map((option) => (
                          <button
                            key={option.letter}
                            onClick={() => {
                              const current = userAnswers[question.id] || [];
                              const newAnswers = current.includes(option.letter)
                                ? current.filter((a) => a !== option.letter)
                                : [...current, option.letter].sort();
                              handleAnswerSelect(question.id, newAnswers);
                            }}
                            onMouseEnter={() => playHoverSound()}
                            className={`px-4 lg:px-6 py-2 lg:py-3 rounded-lg font-bold text-sm lg:text-lg transition-all duration-200 shadow-md hover:shadow-lg hover:scale-105 ${
                              (userAnswers[question.id] || []).includes(option.letter)
                                ? "bg-indigo-500 text-white"
                                : `${theme === 'dark' ? 'bg-gray-600 text-gray-300 hover:bg-gray-500' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`
                            }`}
                          >
                            {option.letter}
                          </button>
                        ))}
                      </div>
                      {(userAnswers[question.id] || []).length > 0 && (
                        <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} mt-2`}>
                          {t('selected')} {(userAnswers[question.id] || []).join(", ")}
                        </p>
                      )}
                    </div>
                  )}

                  {question.type === "true_false" && (
                    <div className="space-y-2">
                      <p className={`font-semibold ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                        {t('yourAnswer')}
                      </p>
                      <div className="space-y-2">
                        {question.options.map((option) => (
                          <label
                            key={option.letter}
                            onMouseEnter={() => playHoverSound()}
                            className={`flex items-center p-3 border-2 rounded hover:border-indigo-500 hover:bg-indigo-50 cursor-pointer transition-all duration-200 ${theme === 'dark' ? 'border-gray-600 hover:bg-gray-700' : 'border-gray-300'}`}
                          >
                            <input
                              type="radio"
                              name={`question-${question.id}`}
                              value={option.letter}
                              checked={(userAnswers[question.id] || []).includes(option.letter)}
                              onChange={(e) =>
                                handleAnswerSelect(question.id, [e.target.value])
                              }
                              className="w-4 h-4 mr-3"
                            />
                            <span className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>{option.text}</span>
                          </label>
                        ))}
                      </div>
                      {(userAnswers[question.id] || []).length > 0 && (
                        <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} mt-2`}>
                          {t('selected')} {(userAnswers[question.id] || []).join(", ")}
                        </p>
                      )}
                    </div>
                  )}

                  {question.type === "text_input" && (
                    <div className="space-y-2">
                      <p className={`font-semibold ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                        {t('yourAnswer')}
                      </p>
                      <input
                        type="text"
                        placeholder={language === 'vi' ? 'Nhập câu trả lời của bạn, phân tách nhiều câu bằng dấu phẩy' : "Enter your answer(s), separate multiple with commas"}
                        value={userAnswers[question.id] || ""}
                        onChange={(e) => handleAnswerSelect(question.id, e.target.value)}
                        className={`w-full border-2 rounded p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors duration-200 ${theme === 'dark' ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white text-gray-800'}`}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-4 mt-6 lg:mt-8">
              <button
                onClick={() => {
                  playClickSound();
                  // Clear achievement timeout
                  if (window.achievementTimeout) {
                    clearTimeout(window.achievementTimeout);
                  }
                  
                  if (confirm(t('exitTest'))) {
                    setCurrentTest(null);
                    setCurrentPage("home");
                    setRetakeMode('full');
                    triggerSimpleAnimation("home");
                  }
                }}
                className={`flex-1 font-semibold py-3 px-4 rounded shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 ${theme === 'dark' ? 'bg-gray-600 hover:bg-gray-700 text-white' : 'bg-gray-500 hover:bg-gray-600 text-white'}`}
              >
                {t('cancel')}
              </button>
              <button
                onClick={() => {
                  playClickSound();
                  submitTest();
                }}
                className={`flex-1 font-semibold py-3 px-4 rounded shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 ${theme === 'dark' ? 'bg-green-700 hover:bg-green-600 text-white' : 'bg-green-500 hover:bg-green-600 text-white'}`}
              >
                {t('submit')}
              </button>
            </div>
          </div>
        </div>
      </PageWrapper>
    );
  }

  // Results page
  if (currentPage === "results" && testResults && currentTest) {
    const passScore = 5;
    const isPassed = testResults.score >= passScore;

    return (
      <PageWrapper>
        <div className="w-full">
          <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-lg p-6 lg:p-8 text-center mb-6 lg:mb-8`}>
            <h1 className={`text-2xl lg:text-4xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-800'} mb-4`}>
              {t('testResults')}
            </h1>

            <div
              className={`text-4xl lg:text-6xl font-bold mb-4 ${
                isPassed ? "text-green-500" : "text-red-500"
              }`}
            >
              {testResults.score}/10
            </div>

            <p
              className={`text-xl lg:text-2xl font-semibold mb-4 ${
                isPassed ? "text-green-600" : "text-red-600"
              }`}
            >
              {isPassed ? "✓ " + t('passed') : "✗ " + t('failed')}
            </p>

            {getIncorrectQuestions().length > 0 && (
              <div className={`mb-6 p-4 rounded-lg ${theme === 'dark' ? 'bg-orange-900 border-orange-700 text-orange-300' : 'bg-orange-100 border-orange-300 text-orange-800'} border-l-4`}>
                <p className="font-semibold">
                  {language === 'vi' 
                    ? `${getIncorrectQuestions().length} câu sai - Bạn có thể làm lại chỉ những câu này!`
                    : `${getIncorrectQuestions().length} incorrect questions - You can retake just these!`
                  }
                </p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => {
                  playClickSound();
                  playPageTransitionSound();
                  setCurrentPage("home");
                  setCurrentTest(null);
                  setTestResults(null);
                  setIncorrectQuestions([]);
                  setRetakeMode('full');
                  triggerSimpleAnimation("home");
                }}
                className={`font-semibold py-3 px-6 rounded shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 ${theme === 'dark' ? 'bg-indigo-700 hover:bg-indigo-600 text-white' : 'bg-indigo-500 hover:bg-indigo-600 text-white'}`}
              >
                {language === 'vi' ? 'Quay về trang chủ' : 'Back to Home'}
              </button>
              <button
                onClick={() => {
                  playClickSound();
                  // Clear achievement timeout
                  if (window.achievementTimeout) {
                    clearTimeout(window.achievementTimeout);
                  }
                  
                  setUserAnswers({});
                  setTestResults(null);
                  setAnsweredQuestions(new Set());
                  setShowAchievement(false);
                  setCurrentPage("test");
                  triggerSimpleAnimation("test");
                }}
                className={`font-semibold py-3 px-6 rounded shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 ${theme === 'dark' ? 'bg-green-700 hover:bg-green-600 text-white' : 'bg-green-500 hover:bg-green-600 text-white'}`}
              >
                {t('retakeTest')}
              </button>
              {getIncorrectQuestions().length > 0 && (
                <button
                  onClick={() => {
                    playClickSound();
                    const incorrect = getIncorrectQuestions();
                    startTestWithQuestions(currentTest, incorrect, 'incorrect');
                  }}
                  className={`font-semibold py-3 px-6 rounded shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 ${theme === 'dark' ? 'bg-orange-700 hover:bg-orange-600 text-white' : 'bg-orange-500 hover:bg-orange-600 text-white'}`}
                >
                  {t('retakeIncorrect')} ({getIncorrectQuestions().length})
                </button>
              )}
            </div>
          </div>

          <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-lg p-6 lg:p-8`}>
            <h2 className={`text-xl lg:text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-800'} mb-6`}>
              {t('answerReview')}
            </h2>

            <div className="space-y-6 lg:space-y-8">
              {currentTest.questions.map((question, idx) => {
                let isCorrect = false;
                if (question.type === "text_input") {
                  const userSplit = (userAnswers[question.id] || "").split(',').map(a => a.trim().toLowerCase()).filter(a => a);
                  const correctSplit = question.correctAnswer.map(a => a.toLowerCase());
                  isCorrect = userSplit.length === correctSplit.length && userSplit.every(a => correctSplit.includes(a));
                } else if (question.type === "none") {
                  isCorrect = true; // "None" type questions are always considered correct
                } else {
                  const userAns = userAnswers[question.id] || [];
                  const correctAns = question.correctAnswer || [];
                  isCorrect = userAns.length === correctAns.length && userAns.every(a => correctAns.includes(a));
                }

                return (
                  <div
                    key={question.id}
                    className={`border-l-4 pl-4 lg:pl-6 pb-6 lg:pb-8`}
                    style={{ animationDelay: `${idx * 0.1}s` }}
                  >
                    <h3 className={`font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-800'} mb-3 text-base lg:text-lg`}>
                      {language === 'vi' ? 'Câu hỏi' : 'Question'} {question.number}
                    </h3>

                    {question.text && (
                      <p className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} mb-4`}>{question.text}</p>
                    )}

                    {question.image && (
                      <img
                        src={question.image}
                        alt={`${language === 'vi' ? 'Câu hỏi' : 'Question'} ${question.number}`}
                        className="w-full rounded mb-4 border-2 border-gray-200 transition-transform duration-200 hover:scale-105"
                      />
                    )}

                    <div className="space-y-2">
                      <p
                        className={`p-3 rounded font-semibold text-sm lg:text-base ${
                          isCorrect
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {language === 'vi' ? 'Câu trả lời của bạn: ' : 'Your answer: '}
                        {question.type === "text_input"
                          ? (userAnswers[question.id] || t('notAnswered'))
                          : ((userAnswers[question.id] || []).length > 0
                            ? (userAnswers[question.id] || []).join(", ")
                            : t('notAnswered'))}
                      </p>

                      {!isCorrect && question.type !== "none" && (
                        <p className={`p-3 rounded ${theme === 'dark' ? 'bg-blue-900 text-blue-300' : 'bg-blue-100 text-blue-800'} font-semibold text-sm lg:text-base`}>
                          {t('correctAnswer')} {question.correctAnswer.join(", ")}
                        </p>
                      )}

                      {question.type === "none" && (
                        <p className={`p-3 rounded ${theme === 'dark' ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'} font-semibold text-sm lg:text-base`}>
                          {language === 'vi' ? 'Câu hỏi hiển thị - không cần câu trả lời' : 'Display question - no answer required'}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </PageWrapper>
    );
  }

  // Rapid test mode page
  if (currentPage === "rapid-test" && rapidTestMode && rapidCurrentQuestion) {
    const isCorrect = rapidShowResult ? checkRapidAnswer(rapidCurrentQuestion, rapidAnswer) : false;

    return (
      <PageWrapper>
        <ParticleEffect isVisible={showParticleEffect} />
        
        <div className="rapid-test-container">
          {/* Score display */}
          <div className={`mb-6 px-6 py-3 rounded-full ${
            theme === 'dark' ? 'bg-gray-800 border border-gray-600' : 'bg-white border border-gray-200'
          } shadow-lg`}>
            <div className="flex items-center gap-4 text-lg font-bold">
              <span className={theme === 'dark' ? 'text-white' : 'text-gray-800'}>
                {t('rapidScore')}: {rapidScore}
              </span>
              <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                |
              </span>
              <span className={theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}>
                {rapidAnsweredQuestions.size} / {rapidTotalQuestions}
              </span>
            </div>
          </div>

          {/* Question card */}
          <div className={`rapid-question-card ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-xl p-8`}>
            <h2 className={`text-2xl lg:text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-800'} mb-6 text-center`}>
              {language === 'vi' ? 'Câu hỏi' : 'Question'} {rapidAnsweredQuestions.size + 1}
            </h2>

            {rapidCurrentQuestion.text && (
              <p className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} mb-6 text-lg lg:text-xl text-center`}>
                {rapidCurrentQuestion.text}
              </p>
            )}

            {rapidCurrentQuestion.image && (
              <div className="mb-6 flex justify-center">
                <img
                  src={rapidCurrentQuestion.image}
                  alt="Question"
                  className="max-w-full max-h-64 object-contain rounded border-2 border-gray-200"
                />
              </div>
            )}

            {!rapidShowResult ? (
              // Answer selection
              <div className="space-y-4">
                {rapidCurrentQuestion.type === "multiple_choice" && rapidCurrentQuestion.options && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {rapidCurrentQuestion.options.map((option) => (
                      <button
                        key={option.letter}
                        onClick={() => setRapidAnswer([option.letter])}
                        className={`p-4 rounded-lg border-2 text-left transition-all duration-200 hover:scale-105 ${
                          rapidAnswer?.includes(option.letter)
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : theme === 'dark'
                            ? 'border-gray-600 hover:border-gray-500 bg-gray-700 text-gray-300'
                            : 'border-gray-300 hover:border-gray-400 bg-gray-50 text-gray-700'
                        }`}
                      >
                        <span className="font-bold mr-3">{option.letter}.</span>
                        {option.text}
                      </button>
                    ))}
                  </div>
                )}

                {rapidCurrentQuestion.type === "true_false" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {rapidCurrentQuestion.options?.map((option) => (
                      <button
                        key={option.letter}
                        onClick={() => setRapidAnswer([option.letter])}
                        className={`p-4 rounded-lg border-2 text-center transition-all duration-200 hover:scale-105 ${
                          rapidAnswer?.includes(option.letter)
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : theme === 'dark'
                            ? 'border-gray-600 hover:border-gray-500 bg-gray-700 text-gray-300'
                            : 'border-gray-300 hover:border-gray-400 bg-gray-50 text-gray-700'
                        }`}
                      >
                        {option.text}
                      </button>
                    ))}
                  </div>
                )}

                {rapidCurrentQuestion.type === "text_input" && (
                  <div className="space-y-4">
                    <input
                      type="text"
                      value={rapidAnswer || ""}
                      onChange={(e) => setRapidAnswer(e.target.value)}
                      placeholder={language === 'vi' ? 'Nhập câu trả lời của bạn' : 'Enter your answer'}
                      className={`w-full p-4 rounded-lg border-2 text-lg ${
                        theme === 'dark' 
                          ? 'border-gray-600 bg-gray-700 text-white placeholder-gray-400'
                          : 'border-gray-300 bg-white text-gray-800 placeholder-gray-500'
                      } focus:outline-none focus:border-blue-500`}
                    />
                  </div>
                )}

                {rapidCurrentQuestion.type === "none" && (
                  <div className={`p-6 rounded-lg text-center ${
                    theme === 'dark' ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'
                  }`}>
                    <p className="text-lg">
                      {language === 'vi' ? 'Câu hỏi hiển thị - không cần trả lời' : 'Display question - no answer required'}
                    </p>
                    <button
                      onClick={nextRapidQuestion}
                      className={`mt-4 px-6 py-3 rounded-lg font-bold transition-all duration-200 hover:scale-105 ${
                        theme === 'dark' ? 'bg-blue-700 hover:bg-blue-600 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white'
                      }`}
                    >
                      {t('nextQuestion')}
                    </button>
                  </div>
                )}

                {rapidCurrentQuestion.type !== "none" && (
                  <div className="flex justify-center mt-8">
                    <button
                      onClick={submitRapidAnswer}
                      disabled={!rapidAnswer || (Array.isArray(rapidAnswer) && rapidAnswer.length === 0)}
                      className={`px-8 py-4 rounded-lg font-bold text-lg transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 ${
                        theme === 'dark' ? 'bg-green-700 hover:bg-green-600 text-white' : 'bg-green-500 hover:bg-green-600 text-white'
                      }`}
                    >
                      {t('confirmAnswer')}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              // Results display
              <div className="text-center space-y-6">
                <div className={`p-6 rounded-lg ${
                  isCorrect ? 'rapid-result-correct' : 'rapid-result-incorrect'
                }`}>
                  <div className="text-3xl mb-4">
                    {isCorrect ? '🎉' : '❌'}
                  </div>
                  <h3 className="text-2xl font-bold mb-2">
                    {isCorrect ? t('correctAnswerRapid') : t('incorrectAnswerRapid')}
                  </h3>
                  {!isCorrect && (
                    <p className="text-lg opacity-90">
                      {rapidCurrentQuestion.correctAnswer.join(", ")}
                    </p>
                  )}
                </div>

                <div className="flex justify-center gap-4">
                  <button
                    onClick={() => {
                      playClickSound();
                      restartRapidTest();
                    }}
                    className={`px-6 py-3 rounded-lg font-bold transition-all duration-200 hover:scale-105 ${
                      theme === 'dark' ? 'bg-red-700 hover:bg-red-600 text-white' : 'bg-red-500 hover:bg-red-600 text-white'
                    }`}
                  >
                    {t('restartRapid')}
                  </button>
                  <button
                    onClick={() => {
                      playClickSound();
                      nextRapidQuestion();
                    }}
                    className={`px-6 py-3 rounded-lg font-bold transition-all duration-200 hover:scale-105 ${
                      theme === 'dark' ? 'bg-blue-700 hover:bg-blue-600 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white'
                    }`}
                  >
                    {t('nextQuestion')}
                  </button>
                </div>
              </div>
            )}

            {/* Exit button */}
            <div className="flex justify-center mt-8">
              <button
                onClick={() => {
                  playClickSound();
                  playPageTransitionSound();
                  exitRapidTest();
                }}
                className={`px-4 py-2 rounded-lg transition-all duration-200 hover:scale-105 ${
                  theme === 'dark' ? 'bg-gray-600 hover:bg-gray-700 text-white' : 'bg-gray-500 hover:bg-gray-600 text-white'
                }`}
              >
                {language === 'vi' ? 'Thoát' : 'Exit'}
              </button>
            </div>
          </div>
        </div>
      </PageWrapper>
    );
  }

  // Rapid test results page
  if (currentPage === "rapid-results") {
    return (
      <PageWrapper>
        <div className="w-full flex items-center justify-center min-h-[60vh]">
          <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-xl p-8 text-center max-w-md w-full`}>
            <div className="text-6xl mb-6">
              {rapidScore === rapidTotalQuestions ? '🏆' : rapidScore > rapidTotalQuestions / 2 ? '👏' : '💪'}
            </div>
            <h2 className={`text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-800'} mb-4`}>
              {t('rapidCompleted')}
            </h2>
            <div className={`text-5xl font-bold mb-6 ${
              rapidScore === rapidTotalQuestions ? 'text-green-500' : 
              rapidScore > rapidTotalQuestions / 2 ? 'text-blue-500' : 'text-orange-500'
            }`}>
              {rapidScore} / {rapidTotalQuestions}
            </div>
            <p className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'} mb-8`}>
              {rapidScore === rapidTotalQuestions 
                ? (language === 'vi' ? 'Hoàn hảo! Bạn đã trả lời đúng tất cả câu hỏi!' : 'Perfect! You got all questions correct!')
                : rapidScore > rapidTotalQuestions / 2
                ? (language === 'vi' ? 'Tuyệt vời! Làm tốt lắm!' : 'Great job! Well done!')
                : (language === 'vi' ? 'Tiếp tục luyện tập nhé!' : 'Keep practicing!')
              }
            </p>
            <div className="space-y-4">
              <button
                onClick={() => {
                  playClickSound();
                  restartRapidTest();
                }}
                className={`w-full py-3 px-6 rounded-lg font-bold transition-all duration-200 hover:scale-105 ${
                  theme === 'dark' ? 'bg-blue-700 hover:bg-blue-600 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white'
                }`}
              >
                {t('restartRapid')}
              </button>
              <button
                onClick={() => {
                  playClickSound();
                  playPageTransitionSound();
                  exitRapidTest();
                }}
                className={`w-full py-3 px-6 rounded-lg font-bold transition-all duration-200 hover:scale-105 ${
                  theme === 'dark' ? 'bg-gray-600 hover:bg-gray-700 text-white' : 'bg-gray-500 hover:bg-gray-600 text-white'
                }`}
              >
                {language === 'vi' ? 'Quay về trang chủ' : 'Back to Home'}
              </button>
            </div>
          </div>
        </div>
      </PageWrapper>
    );
  }

  return null;
};

// Main App component with providers
const App = () => {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <VisualTestPlatform />
      </LanguageProvider>
    </ThemeProvider>
  );
};

export default App;
