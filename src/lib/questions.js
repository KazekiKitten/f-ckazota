export const emptyOptions = () => [
  { letter: "A", text: "" },
  { letter: "B", text: "" },
  { letter: "C", text: "" },
  { letter: "D", text: "" },
];

export const isTrueFalseQuestion = (q) => {
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

  const optionsHaveTFIndicators = (q.options || []).some((opt) =>
    /\(true\s*\/\s*false\)|\(true\s*or\s*false\)|\(đúng\s*\/\s*sai\)|\(đúng\s*hay\s*sai\)|answer:\s*(true|false|đúng|sai)/i.test(
      opt.text || "",
    ),
  );

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

export const isAnswerCorrect = (question, answer) => {
  if (question.type === "text_input") {
    const userSplit = (answer || "")
      .split(",")
      .map((a) => a.trim().toLowerCase())
      .filter((a) => a);
    const correctSplit = (question.correctAnswer || []).map((a) =>
      a.toLowerCase(),
    );
    return (
      userSplit.length === correctSplit.length &&
      userSplit.every((a) => correctSplit.includes(a))
    );
  }
  const userAns =
    answer == null ? [] : Array.isArray(answer) ? answer : [answer];
  const correctAns = question.correctAnswer || [];
  return (
    userAns.length === correctAns.length &&
    userAns.every((a) => correctAns.includes(a))
  );
};

export const gradeTest = (questions, userAnswers) => {
  let score = 0;
  const pointsPerQuestion = 10 / questions.length;
  const incorrect = [];
  questions.forEach((q) => {
    if (isAnswerCorrect(q, userAnswers[q.id])) score += pointsPerQuestion;
    else incorrect.push(q);
  });
  return { score: Math.round(score * 10) / 10, incorrect };
};

export const getIncorrectQuestions = (test, answers) =>
  test.questions.filter(
    (q) => q.type !== "none" && !isAnswerCorrect(q, answers[q.id]),
  );

export const applyScrambledOptions = (questions) =>
  questions.map((q) => {
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

export const parseQuestions = (text) => {
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
        /^[A-D][.)]/.test(line) &&
        (line.match(/[A-D][.)]/g) || []).length > 1;
      if (hasMultipleOptions) {
        const optionPattern =
          /([A-D])[.)]\s*([^A-D]+?)(?=\s*[A-D][.)]|$)/g;
        let match;
        while ((match = optionPattern.exec(line)) !== null)
          currentQuestion.options.push({
            letter: match[1],
            text: match[2].trim(),
          });
        continue;
      }
      const optMatch = line.match(/^([A-D])[.)]\s+(.+)$/);
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

export const parseQuestionsFromText = async (file) =>
  parseQuestions(await file.text());

export const parseQuestionsFromDocx = async (file) => {
  const { default: mammoth } = await import("mammoth");
  const result = await mammoth.extractRawText({
    arrayBuffer: await file.arrayBuffer(),
  });
  return parseQuestions(result.value);
};
