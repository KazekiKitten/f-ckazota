import { emptyOptions } from "./questions";
import { getProvider, isCustomProvider } from "./aiProviders";

const OPENAI_COMPATIBLE_BASE_URLS = {
  openai: "https://api.openai.com/v1",
  openrouter: "https://openrouter.ai/api/v1",
  groq: "https://api.groq.com/openai/v1",
  nvidia: "https://integrate.api.nvidia.com/v1",
};

const normalizeBaseUrl = (url) => url.replace(/\/+$/, "");

const DEFAULT_MAX_TOKENS = 8192;

// ── Prompt ──────────────────────────────────────────────────────────────────

const buildExtractionPrompt = (mode, structured) => {
  const example =
    '{"number":1,"text":"What is 2+2?","type":"multiple_choice","options":[{"letter":"A","text":"3"},{"letter":"B","text":"4"}],"correctAnswer":["B"],"answerSource":"marked"}';
  const responseFormat = structured
    ? `Respond as a JSON object with a "questions" array:\n{"questions":[${example}]}`
    : `Respond as a JSON array:\n[${example}]`;

  return `Analyze this exam/quiz ${mode === "page" ? "page image" : "image"} and extract ALL questions with their FULL TEXT, options with their FULL ANSWER TEXT, and correct answers.${
    mode === "image"
      ? " Questions may be split across pages/images but are still a part of the same question."
      : ""
  }

CRITICAL:
1. Extract the COMPLETE question text including all context, passages, formulas.
2. For EACH option (A, B, C, D), extract the FULL ANSWER TEXT after the letter. Never leave it empty.
3. If a question includes an image/diagram, describe it briefly like "[Image: diagram of triangle]".
4. For reading comprehension, include the entire passage in the question text.
5. Preserve the original language (Vietnamese, English, etc.).
6. Include formulas, equations, code exactly as they appear.
7. NEVER include the question number in the text. The app adds its own numbering.
8. If the page shows the answer (an answer key, or a visible mark such as a circle, tick, bold, underline or highlight), use it and set "answerSource" to "marked". If the page shows no answer, you may answer the question yourself only when you are certain, and then set "answerSource" to "inferred". Never guess; if unsure, leave correctAnswer empty and omit answerSource.

TRUE/FALSE QUESTIONS:
Type 1 - Simple (2 options): Use type "true_false" with options [{letter:"T",text:"True"},{letter:"F",text:"False"}]. Map Vietnamese Đ/S to T/F. correctAnswer is ["T"] or ["F"].
Type 2 - Multiple choice with T/F per option: Use type "multiple_choice". correctAnswer is the array of TRUE option letters.

For each question, identify: number, FULL text, all options with COMPLETE answer text, correct answer(s).

${responseFormat}

If you cannot determine the correct answer, leave correctAnswer empty. For fill-in-the-blank, use type "text_input" with empty options.

Extract ALL questions. Extract FULL TEXT for questions AND options. NEVER leave option text empty.`;
};

// Extra instructions from the user are appended last so they override defaults.
const buildPrompts = (mode, extraRequest, previousContext, structured) => {
  let prompt = buildExtractionPrompt(mode, structured);
  if (previousContext) {
    prompt += `\n\nPREVIOUS PAGE CONTEXT (questions already extracted):\n${previousContext}`;
  }
  if (extraRequest) {
    prompt += `\n\nEXTRA INSTRUCTIONS: ${extraRequest}`;
  }
  return prompt;
};

// Only include context when the last question looks incomplete (a multiple
// choice question with fewer than 4 options), and truncate to ~500 chars so
// we don't bloat every page's prompt.
const buildPreviousContext = (questions) => {
  if (questions.length === 0) return "";
  const last = questions[questions.length - 1];
  if (last.type === "true_false" || last.type === "text_input") return "";
  if ((last.options || []).length >= 4) return "";
  return JSON.stringify({
    number: last.number,
    text: (last.text || "").slice(0, 500),
    options: (last.options || []).map((o) => `${o.letter}. ${o.text || ""}`.trim()),
  });
};

/**
 * Safety net for questions the model still split across pages.
 * Only merges on strong signals so a correct extraction is never corrupted:
 * - A page's last multiple-choice question whose options continue with the
 *   very next letter on the next page's first question, OR
 * - A "question" with no text AND (no options OR no image) of its own.
 *
 * IMPORTANT: do NOT merge an image-only question that has options (it carries
 * its own question in the image) just because it lacks text — those options
 * would be silently dropped.
 */
export const mergeSplitQuestions = (questions) => {
  const optionLetter = (option) => String(option?.letter || "").toUpperCase();
  const hasNoText = (q) => !q.text || !q.text.trim();
  const hasNoOptions = (q) => !(q.options || []).length;
  const hasNoImage = (q) => !q.image;
  const succeedingLetter = (letter) =>
    String.fromCharCode(letter.charCodeAt(0) + 1);

  const continuesOptions = (previous, next) => {
    // True/false and text-input questions never continue an options list
    if (previous.type !== "multiple_choice" || next.type !== "multiple_choice")
      return false;
    const previousLetters = (previous.options || [])
      .map(optionLetter)
      .filter(Boolean);
    const nextLetters = (next.options || []).map(optionLetter).filter(Boolean);
    if (previousLetters.length === 0 || nextLetters.length === 0) return false;
    if (nextLetters.some((letter) => previousLetters.includes(letter)))
      return false;
    const lastPrevious = [...previousLetters].sort().slice(-1)[0];
    const firstNext = [...nextLetters].sort()[0];
    // A fresh question starts at "A"; a continuation picks up right after
    return firstNext === succeedingLetter(lastPrevious);
  };

  const merged = [];
  for (const question of questions) {
    const previous = merged[merged.length - 1];
    const spansPages =
      previous &&
      question.pageIndex !== previous.pageIndex &&
      ((hasNoText(question) && (hasNoOptions(question) || hasNoImage(question))) ||
        continuesOptions(previous, question));

    if (spansPages) {
      const existingLetters = new Set(
        (previous.options || []).map(optionLetter),
      );
      const addedOptions = (question.options || []).filter(
        (option) => !existingLetters.has(optionLetter(option)),
      );
      merged[merged.length - 1] = {
        ...previous,
        text: previous.text || question.text || "",
        image: previous.image || question.image || null,
        options: [...(previous.options || []), ...addedOptions],
        correctAnswer: Array.from(
          new Set([
            ...(previous.correctAnswer || []),
            ...(question.correctAnswer || []),
          ]),
        ),
      };
      continue;
    }
    merged.push({ ...question });
  }
  return merged;
};

/**
 * Removes a leading question number from question text.
 */
const stripLeadingQuestionNumber = (text) => {
  if (typeof text !== "string") return text;
  return (
    text
      .replace(/^\s*(?:câu|cau|question|questions|ques)\s*\.?\s*\d+\s*[.):\-–—]+\s*/i, "")
      .replace(/^\s*q\s*\.?\s*\d+\s*[.):\-–—]+\s+(?=\S)/i, "")
      .replace(/^\s*\d+\s*[.)]\s*(?!\d)/, "")
      .trim()
  );
};

// ── Answer / question normalization ─────────────────────────────────────────

const isTrueText = (text) => text === "đúng" || text === "true";
const isFalseText = (text) => text === "sai" || text === "false";

const cleanOptions = (rawOptions) =>
  (Array.isArray(rawOptions) ? rawOptions : [])
    .filter((option) => option && typeof option === "object")
    .map((option) => ({
      letter: String(option.letter ?? "").trim().toUpperCase(),
      text: String(option.text ?? ""),
    }));

// Free-text answers keep their wording; multiple-choice answers become a
// clean list of upper-case letters ("b", "B, D" and ["B","D"] all work).
const splitAnswers = (raw, type) => {
  const list = Array.isArray(raw) ? raw : typeof raw === "string" ? [raw] : [];
  const strings = list.map((item) => String(item).trim()).filter(Boolean);
  if (type === "text_input") return strings;
  return strings
    .flatMap((item) => item.split(/[\s,;]+/))
    .map((item) => item.toUpperCase())
    .filter(Boolean);
};

const normalizeAiQuestion = (q, pageIndex, pageImage, index) => {
  let questionType = q.type || "multiple_choice";
  const rawOptions = cleanOptions(q.options);
  let questionOptions = Array.isArray(q.options) ? rawOptions : emptyOptions();
  let correctAnswer = splitAnswers(q.correctAnswer, questionType);

  const hasTwoOptions = rawOptions.length === 2;
  const optionsAreTF =
    hasTwoOptions &&
    ((rawOptions[0].letter === "T" && rawOptions[1].letter === "F") ||
      (rawOptions[0].letter === "Đ" && rawOptions[1].letter === "S") ||
      (rawOptions[0].letter === "D" && rawOptions[1].letter === "S"));

  const optionTextsAreTF =
    hasTwoOptions &&
    rawOptions.some((option) => {
      const text = option.text.trim().toLowerCase();
      return isTrueText(text) || isFalseText(text);
    });

  if (hasTwoOptions && (optionsAreTF || optionTextsAreTF)) {
    questionType = "true_false";
    // Resolve each answer through the ORIGINAL option, so "A. Đúng / B. Sai"
    // maps "A" to "T" instead of leaving an answer that matches no option.
    const toTrueFalse = (answer) => {
      const key = String(answer).trim().toUpperCase();
      const optionText = (
        rawOptions.find((option) => option.letter === key)?.text || ""
      )
        .trim()
        .toLowerCase();
      if (isTrueText(optionText)) return "T";
      if (isFalseText(optionText)) return "F";
      if (key === "T" || key === "Đ" || key === "D") return "T";
      if (key === "F" || key === "S") return "F";
      return null;
    };
    questionOptions = [
      { letter: "T", text: "True" },
      { letter: "F", text: "False" },
    ];
    correctAnswer = Array.from(
      new Set(correctAnswer.map(toTrueFalse).filter(Boolean)),
    );
  } else if (questionType !== "text_input" && rawOptions.length > 0) {
    // Drop answers that don't match any option letter
    const letters = new Set(rawOptions.map((option) => option.letter));
    correctAnswer = correctAnswer.filter((answer) => letters.has(answer));
  }

  const hasText = Boolean(q.text?.trim());
  const answerSource =
    correctAnswer.length > 0 &&
    (q.answerSource === "marked" || q.answerSource === "inferred")
      ? q.answerSource
      : null;

  return {
    id: crypto.randomUUID(),
    pageIndex,
    text: stripLeadingQuestionNumber(q.text || ""),
    image: hasText ? null : pageImage,
    number: q.number || index + 1,
    type: questionType,
    options: questionOptions,
    correctAnswer,
    ...(answerSource && { answerSource }),
  };
};

// ── Response parsing ────────────────────────────────────────────────────────

// Walks a JSON array starting at `start` (the "["), collecting every complete
// top-level object. This salvages the finished questions when a response is
// cut off by the token limit, instead of discarding the whole page.
const scanQuestionArray = (text, start) => {
  const items = [];
  let depth = 0;
  let inString = false;
  let escaped = false;
  let objectStart = -1;
  for (let i = start; i < text.length; i++) {
    const char = text[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (char === "\\") escaped = true;
      else if (char === '"') inString = false;
      continue;
    }
    if (char === '"') {
      inString = true;
    } else if (char === "[" || char === "{") {
      depth++;
      if (char === "{" && depth === 2) objectStart = i;
    } else if (char === "]" || char === "}") {
      if (char === "}" && depth === 2 && objectStart !== -1) {
        try {
          items.push(JSON.parse(text.slice(objectStart, i + 1)));
        } catch {
          // malformed object: skip it, keep scanning
        }
        objectStart = -1;
      }
      depth--;
      if (depth === 0) return { items, closed: true };
    }
  }
  return { items, closed: false };
};

/**
 * Parses a model response into question objects.
 * Returns { items, found, closed }:
 *  - found:  a JSON question list was located at all
 *  - closed: the list was complete (false means it was cut off)
 */
const parseQuestionResponse = (textResponse) => {
  const text = String(textResponse || "").replace(/```(?:json)?/gi, "");

  // Fast path: the whole response is valid JSON (structured / JSON mode)
  try {
    const parsed = JSON.parse(text.trim());
    const list = Array.isArray(parsed) ? parsed : parsed?.questions;
    if (Array.isArray(list)) return { items: list, found: true, closed: true };
  } catch {
    // fall through to scanning
  }

  // Start at the first "[" that begins a list of objects, so stray brackets
  // in prose (e.g. "[Image: ...]") are ignored.
  const match = /\[\s*\{/.exec(text);
  if (!match) {
    return /\[\s*\]/.test(text)
      ? { items: [], found: true, closed: true }
      : { items: [], found: false, closed: false };
  }
  const { items, closed } = scanQuestionArray(text, match.index);
  return { items, found: true, closed };
};

// ── Usage ───────────────────────────────────────────────────────────────────

const toNumberOrNull = (value) => {
  if (value == null || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
};

// Always returns an object so every call can be counted, even when the
// provider sends no rate-limit headers (browsers also hide them unless the
// provider exposes them via CORS).
const readUsage = (headers) => ({
  requests: toNumberOrNull(headers?.get?.("x-ratelimit-remaining-requests")),
  tokens: toNumberOrNull(headers?.get?.("x-ratelimit-remaining-tokens")),
});

// ── Retry with backoff ──────────────────────────────────────────────────────

const MAX_RETRY_DELAY_MS = 30000;

const abortError = () => new DOMException("Aborted", "AbortError");

const sleep = (ms, signal) =>
  new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(abortError());
    const onAbort = () => {
      clearTimeout(timer);
      reject(abortError());
    };
    const timer = setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, ms);
    signal?.addEventListener("abort", onAbort, { once: true });
  });

const getRetryDelay = (response, attempt) => {
  const retryAfter = response?.headers?.get?.("retry-after");
  if (retryAfter) {
    const seconds = parseInt(retryAfter, 10);
    if (!Number.isNaN(seconds)) {
      return Math.min(seconds * 1000, MAX_RETRY_DELAY_MS);
    }
    const date = new Date(retryAfter);
    if (!Number.isNaN(date.getTime())) {
      return Math.min(Math.max(0, date.getTime() - Date.now()), MAX_RETRY_DELAY_MS);
    }
  }
  return Math.min(1000 * Math.pow(2, attempt), 10000) + Math.random() * 250;
};

const fetchWithRetry = async (url, options, maxRetries = 3) => {
  const signal = options?.signal;
  let lastResponse;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      lastResponse = await fetch(url, options);
    } catch (err) {
      if (err.name === "AbortError") throw err;
      if (attempt < maxRetries) {
        await sleep(getRetryDelay(null, attempt), signal);
        continue;
      }
      throw err;
    }
    if (lastResponse.status === 429 || lastResponse.status >= 500) {
      if (attempt < maxRetries) {
        await sleep(getRetryDelay(lastResponse, attempt), signal);
        continue;
      }
    }
    return lastResponse;
  }
  return lastResponse;
};

// Reads the body as JSON; on failure (HTML error pages, proxies) reports the
// HTTP status instead of a confusing SyntaxError.
const readJson = async (response) => {
  const raw = await response.text();
  try {
    return JSON.parse(raw);
  } catch {
    throw new Error(
      response.ok
        ? "INVALID_JSON_RESPONSE"
        : `HTTP ${response.status}: ${raw.slice(0, 200)}`,
    );
  }
};

const errorMessage = (error, response) =>
  (typeof error === "string" ? error : error?.message) ||
  `HTTP ${response.status}`;

// ── Image encoding ──────────────────────────────────────────────────────────

const extractImageParts = (pageImage) => {
  const match = pageImage.match(/^data:(image\/[a-z0-9.+-]+);/i);
  return { mimeType: match ? match[1] : "image/png", data: pageImage.split(",")[1] };
};

// ── Unified provider call ───────────────────────────────────────────────────

const GEMINI_BLOCKED_REASONS = ["SAFETY", "PROHIBITED_CONTENT", "BLOCKLIST"];

/**
 * Either pass `history` (chat messages) or `prompt` (+ optional `imageDataUrl`).
 * Returns { text, usage, truncated }.
 */
const callProvider = async ({
  providerId,
  model,
  apiKey,
  baseUrl,
  prompt,
  imageDataUrl,
  history,
  signal,
  maxTokens,
  structured,
}) => {
  const provider = getProvider(providerId);
  const isGemini = provider.id === "gemini";
  const extraHeaders = { "Content-Type": "application/json" };

  if (isGemini) {
    extraHeaders["x-goog-api-key"] = apiKey;
    let contents;
    if (history) {
      contents = history.map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      }));
    } else {
      const parts = [{ text: prompt || "" }];
      if (imageDataUrl) {
        const { mimeType, data } = extractImageParts(imageDataUrl);
        parts.push({ inline_data: { mime_type: mimeType, data } });
      }
      contents = [{ parts }];
    }
    const body = {
      contents,
      generationConfig: {
        maxOutputTokens: maxTokens || DEFAULT_MAX_TOKENS,
        temperature: 0,
        ...(structured && { responseMimeType: "application/json" }),
      },
    };
    const response = await fetchWithRetry(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      { method: "POST", headers: extraHeaders, body: JSON.stringify(body), signal },
    );
    const data = await readJson(response);
    if (data.error) throw new Error(errorMessage(data.error, response));
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    if (data.promptFeedback?.blockReason) {
      throw new Error(`BLOCKED: ${data.promptFeedback.blockReason}`);
    }
    if (!data.candidates?.length) throw new Error("EMPTY_RESPONSE");
    const candidate = data.candidates[0];
    if (GEMINI_BLOCKED_REASONS.includes(candidate.finishReason)) {
      throw new Error("SAFETY_FILTER");
    }
    const text = (candidate.content?.parts || []).map((p) => p.text || "").join("");
    return {
      text,
      usage: readUsage(response.headers),
      truncated: candidate.finishReason === "MAX_TOKENS",
    };
  }

  extraHeaders["Authorization"] = `Bearer ${apiKey}`;
  const content = imageDataUrl
    ? [
        { type: "text", text: prompt || "" },
        { type: "image_url", image_url: { url: imageDataUrl } },
      ]
    : prompt || "";
  const body = {
    model,
    messages: history || [{ role: "user", content }],
    max_tokens: maxTokens || DEFAULT_MAX_TOKENS,
    ...(structured && { response_format: { type: "json_object" } }),
  };
  const response = await fetchWithRetry(
    `${normalizeBaseUrl(baseUrl || OPENAI_COMPATIBLE_BASE_URLS[providerId])}/chat/completions`,
    { method: "POST", headers: extraHeaders, body: JSON.stringify(body), signal },
  );
  const data = await readJson(response);
  if (data.error) throw new Error(errorMessage(data.error, response));
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  if (!data.choices?.length) throw new Error("EMPTY_RESPONSE");
  const choice = data.choices[0];
  const messageContent = choice.message?.content;
  const text = Array.isArray(messageContent)
    ? messageContent.map((p) => p.text || "").join("")
    : messageContent || "";
  return {
    text,
    usage: readUsage(response.headers),
    truncated: choice.finish_reason === "length",
  };
};

// ── Public API ──────────────────────────────────────────────────────────────

export const chatOnce = async ({
  providerId,
  model,
  apiKey,
  messages,
  baseUrl,
  onUsage,
  signal,
}) => {
  if (!apiKey) throw new Error("MISSING_KEY");
  if (!model) throw new Error("MISSING_MODEL");
  const history = messages.map((m) => ({ role: m.role, content: m.text }));
  const result = await callProvider({ providerId, model, apiKey, history, baseUrl, signal });
  if (onUsage) onUsage(result.usage);
  return result.text;
};

export const testApiKey = async ({ providerId, model, apiKey, baseUrl, onUsage, signal }) => {
  if (!apiKey) throw new Error("MISSING_KEY");
  if (!model) throw new Error("MISSING_MODEL");
  const result = await callProvider({
    providerId,
    model,
    apiKey,
    baseUrl,
    history: [{ role: "user", content: "Reply with the single word: OK" }],
    maxTokens: 8,
    signal,
  });
  if (onUsage) onUsage(result.usage);
  return true;
};

/**
 * Extracts questions from page images using the configured provider.
 * Returns { questions, failedPages } so the UI can offer per-page retries.
 * A page is reported in failedPages when its request failed, its response was
 * cut off or unparseable, or some of its questions had to be skipped. Any
 * questions that could still be recovered from that page are kept.
 * Aborting through `signal` rejects with an AbortError.
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
  signal,
  structured,
  maxTokens,
}) => {
  const provider = getProvider(providerId);
  if (!model) throw new Error("MISSING_MODEL");
  if (isCustomProvider(providerId) && !baseUrl) {
    throw new Error("CUSTOM_BASE_URL_REQUIRED");
  }

  const questions = [];
  const failedPages = [];
  const MAX_LOG_CHARS = 4000;
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
    if (signal?.aborted) throw abortError();
    if (onProgress) onProgress(i + 1, pages.length);
    const pageImage = pages[i];
    log("request", i + 1, `${provider.name} · ${model}`);

    const previousContext = buildPreviousContext(questions);

    let result;
    try {
      // The page image is sent at its original resolution
      result = await callProvider({
        providerId: provider.id,
        model,
        apiKey,
        baseUrl,
        prompt: buildPrompts(mode, extraRequest, previousContext, structured),
        imageDataUrl: pageImage,
        signal,
        structured,
        maxTokens,
      });
    } catch (error) {
      // A cancelled run must stop, not carry on to the remaining pages
      if (error?.name === "AbortError") throw error;
      log("error", i + 1, error?.message || String(error));
      failedPages.push({ page: i + 1, error: error?.message || String(error) });
      continue;
    }

    if (result.usage && onUsage) onUsage(result.usage);
    const textResponse = result.text;
    log("response", i + 1, textResponse);

    const problems = [];
    const { items, found, closed } = parseQuestionResponse(textResponse);
    if (!found) {
      problems.push("No questions found in response (parse failure)");
    } else if (result.truncated || !closed) {
      problems.push(
        "Response was cut off before the end; some questions may be missing",
      );
    }

    let skipped = 0;
    items.forEach((q) => {
      try {
        questions.push(normalizeAiQuestion(q, i, pageImage, questions.length));
      } catch {
        skipped++;
      }
    });
    if (skipped > 0) {
      problems.push(`${skipped} malformed question(s) skipped`);
    }

    log("result", i + 1, items.length - skipped);
    if (problems.length > 0) {
      const message = problems.join("; ");
      log("error", i + 1, message);
      failedPages.push({ page: i + 1, error: message });
    }
  }

  return { questions: mergeSplitQuestions(questions), failedPages };
};