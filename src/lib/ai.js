import { emptyOptions } from "./questions";
import { getProvider, isCustomProvider } from "./aiProviders";

const OPENAI_COMPATIBLE_BASE_URLS = {
  openai: "https://api.openai.com/v1",
  openrouter: "https://openrouter.ai/api/v1",
  groq: "https://api.groq.com/openai/v1",
  nvidia: "https://integrate.api.nvidia.com/v1",
};

const buildExtractionPrompt = (mode) =>
  `Analyze this exam/quiz ${mode === "page" ? "page image" : "image"} and extract ALL questions with their FULL TEXT CONTENT, options with their FULL ANSWER TEXT, and correct answers.${
    mode === "image"
      ? " Sometimes different questions could be split into different pages/images but is still apart of the question so take it into account"
      : ""
  }

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

For each question ${mode === "page" ? "on this page" : "in this image"}, identify:
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

IMPORTANT: Extract ALL questions you can see ${mode === "page" ? "on this page" : "in this image"}. Extract the FULL TEXT for both questions AND options. NEVER leave option text empty.`;

// Extra instructions from the user are appended last so they override the
// defaults above (e.g. "solve everything" or "extract only, no answers").
const buildPrompts = (mode, extraRequest) => {
  const base = buildExtractionPrompt(mode);
  const extra =
    typeof extraRequest === "string" ? extraRequest.trim() : "";
  if (!extra) return base;
  return `${base}

ADDITIONAL USER INSTRUCTIONS (these override anything above):
${extra}`;
};

const normalizeAiQuestion = (q, pageIndex, pageImage, index) => {
  let questionType = q.type || "multiple_choice";
  let questionOptions = q.options || emptyOptions();
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

  return {
    id: Date.now() + index,
    pageIndex,
    text: q.text || "",
    image: q.text ? null : pageImage,
    number: q.number || index + 1,
    type: questionType,
    options: questionOptions,
    correctAnswer,
  };
};

const parseQuestionsFromText = (textResponse) => {
  const jsonMatch = textResponse.match(/\[[\s\S]*\]/);
  if (!jsonMatch) return [];
  try {
    const parsed = JSON.parse(jsonMatch[0]);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    // Hallucinated or malformed output for this page: skip it and keep going
    // instead of failing the whole extraction run.
    return [];
  }
};

// Rate-limit headers are only sent by some providers; null means unavailable
const readUsage = (headers) => {
  const requests = headers?.get?.("x-ratelimit-remaining-requests");
  const tokens = headers?.get?.("x-ratelimit-remaining-tokens");
  if (requests === null && tokens === null) return null;
  return { requests, tokens };
};

const extractWithGemini = async ({ model, apiKey, pageImage, mode, extraRequest }) => {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: buildPrompts(mode, extraRequest) },
              {
                inline_data: {
                  mime_type: "image/png",
                  data: pageImage.split(",")[1],
                },
              },
            ],
          },
        ],
      }),
    },
  );
  const data = await response.json();
  if (data.error) throw new Error(data.error.message);
  return {
    text: data.candidates[0].content.parts[0].text,
    usage: readUsage(response.headers),
  };
};

const extractWithOpenAICompatible = async ({
  providerId,
  model,
  apiKey,
  pageImage,
  mode,
  baseUrl,
  extraRequest,
}) => {
  const endpoint = baseUrl || OPENAI_COMPATIBLE_BASE_URLS[providerId];
  if (!endpoint) {
    throw new Error("CUSTOM_BASE_URL_REQUIRED");
  }
  const response = await fetch(`${endpoint}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: buildPrompts(mode, extraRequest) },
            { type: "image_url", image_url: { url: pageImage } },
          ],
        },
      ],
    }),
  });
  const data = await response.json();
  if (data.error) {
    throw new Error(data.error.message || JSON.stringify(data.error));
  }
  return {
    text: data.choices[0].message.content,
    usage: readUsage(response.headers),
  };
};

/**
 * One text-only chat turn for the assistant. Uses the same provider, model
 * and key configured in Settings.
 */
export const chatOnce = async ({
  providerId,
  model,
  apiKey,
  messages,
  baseUrl,
  onUsage,
}) => {
  if (!apiKey) throw new Error("MISSING_KEY");
  if (!model) throw new Error("MISSING_MODEL");
  const provider = getProvider(providerId);
  const history = messages.map((m) => ({ role: m.role, content: m.text }));

  if (provider.id === "gemini") {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: history.map((m) => ({
            role: m.role === "assistant" ? "model" : "user",
            parts: [{ text: m.content }],
          })),
        }),
      },
    );
    const data = await response.json();
    if (data.error) throw new Error(data.error.message);
    if (onUsage) onUsage(readUsage(response.headers));
    return data.candidates[0].content.parts[0].text;
  }

  const endpoint = baseUrl || OPENAI_COMPATIBLE_BASE_URLS[provider.id];
  if (!endpoint) throw new Error("CUSTOM_BASE_URL_REQUIRED");
  const response = await fetch(`${endpoint}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ model, messages: history }),
  });
  const data = await response.json();
  if (data.error) {
    throw new Error(data.error.message || JSON.stringify(data.error));
  }
  if (onUsage) onUsage(readUsage(response.headers));
  return data.choices[0].message.content;
};

const MAX_LOG_CHARS = 4000;

const TEST_PROMPT = "Reply with the single word: OK";

/**
 * Sends a minimal text-only request to verify a key/model combination.
 * No images are sent, so this stays cheap and fast.
 */
export const testApiKey = async ({ providerId, model, apiKey, baseUrl, onUsage }) => {
  if (!apiKey) throw new Error("MISSING_KEY");
  if (!model) throw new Error("MISSING_MODEL");
  const provider = getProvider(providerId);

  if (provider.id === "gemini") {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: TEST_PROMPT }] }],
          generationConfig: { maxOutputTokens: 8 },
        }),
      },
    );
    const data = await response.json();
    if (data.error) throw new Error(data.error.message);
    if (!data.candidates?.length) throw new Error("EMPTY_RESPONSE");
    return true;
  }

  const endpoint = baseUrl || OPENAI_COMPATIBLE_BASE_URLS[provider.id];
  if (!endpoint) throw new Error("CUSTOM_BASE_URL_REQUIRED");
  const response = await fetch(`${endpoint}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: TEST_PROMPT }],
      max_tokens: 8,
    }),
  });
  const data = await response.json();
  if (data.error) {
    throw new Error(data.error.message || "REQUEST_FAILED");
  }
  if (!data.choices?.length) throw new Error("EMPTY_RESPONSE");
  if (onUsage) onUsage(readUsage(response.headers));
  return true;
};

/**
 * Extracts questions from page images using the configured provider.
 * Gemini uses its native API; every other supported provider speaks the
 * OpenAI chat-completions schema.
 */
export const extractQuestions = async ({
  pages,
  providerId,
  model,
  apiKey,
  mode,
  extraRequest,
  onProgress,
  onLog,
  onUsage,
  baseUrl,
}) => {
  const provider = getProvider(providerId);
  if (!model) throw new Error("MISSING_MODEL");
  if (isCustomProvider(providerId) && !baseUrl) {
    throw new Error("CUSTOM_BASE_URL_REQUIRED");
  }
  const questions = [];
  const log = (kind, page, text) => {
    if (!onLog) return;
    onLog({
      kind,
      page,
      total: pages.length,
      text:
        typeof text === "string" && text.length > MAX_LOG_CHARS
          ? `${text.slice(0, MAX_LOG_CHARS)}\n… (truncated)`
          : text,
    });
  };

  for (let i = 0; i < pages.length; i++) {
    if (onProgress) onProgress(i + 1, pages.length);
    const pageImage = pages[i];
    log("request", i + 1, `${provider.name} · ${model}`);

    let result;
    try {
      result =
        provider.id === "gemini"
          ? await extractWithGemini({
              model,
              apiKey,
              pageImage,
              mode,
              extraRequest,
            })
          : await extractWithOpenAICompatible({
              providerId: provider.id,
              model,
              apiKey,
              pageImage,
              mode,
              baseUrl,
              extraRequest,
            });
    } catch (error) {
      log("error", i + 1, error?.message || String(error));
      throw error;
    }

    if (result.usage && onUsage) onUsage(result.usage);
    const textResponse = result.text;
    log("response", i + 1, textResponse);

    const parsed = parseQuestionsFromText(textResponse);
    log("result", i + 1, parsed.length);
    parsed.forEach((q) => {
      questions.push(normalizeAiQuestion(q, i, pageImage, questions.length));
    });
  }

  return questions;
};
