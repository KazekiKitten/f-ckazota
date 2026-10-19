import { useState, useRef, useEffect } from "react";
import {
  Check,
  Trash2,
  X,
  Image as ImageIcon,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import PageWrapper from "../components/PageWrapper";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import { useLanguage } from "../context/languageContext";
import { useSound } from "../context/soundContext";
import {
  getRelativePosition,
  cropToDataUrl,
  finalizeCroppedQuestions,
} from "../lib/crop";

const RESIZE_HANDLES = [
  { id: "nw", cursor: "nw-resize", dx: -1, dy: -1 },
  { id: "ne", cursor: "ne-resize", dx: 1, dy: -1 },
  { id: "sw", cursor: "sw-resize", dx: -1, dy: 1 },
  { id: "se", cursor: "se-resize", dx: 1, dy: 1 },
  { id: "n", cursor: "n-resize", dx: 0, dy: -1 },
  { id: "s", cursor: "s-resize", dx: 0, dy: 1 },
  { id: "w", cursor: "w-resize", dx: -1, dy: 0 },
  { id: "e", cursor: "e-resize", dx: 1, dy: 0 },
];

const HANDLE_SIZE = 16;

// Effectively no minimum: just enough to avoid a zero-size (blank) canvas
const MIN_SIZE = 0.001;

// FIX: was Math.min(max, Math.min(min, v)) which never exceeded `min`
const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

const CropPage = ({ test, onFinish, onCancel }) => {
  const { t, language } = useLanguage();
  const { playClickSound, playPageTransitionSound } = useSound();
  const [imgElement, setImgElement] = useState(null);
  const resizingRef = useRef(null);
  const handlerRef = useRef(null);
  const rafRef = useRef(null);
  const latestRectRef = useRef(null);
  const [cropState, setCropState] = useState({
    currentPageIndex: 0,
    isSelecting: false,
    startPos: null,
    currentPos: null,
    pendingSelection: null,
    croppedQuestions: [],
  });

  const currentPageImg = test.pages[cropState.currentPageIndex];

  const handleCropStart = (e) => {
    // FIX: React touch listeners are passive, so only preventDefault for mouse.
    // Touch scrolling is blocked via `touchAction: "none"` on the image.
    if (e.type === "mousedown") e.preventDefault();
    const pos = getRelativePosition(e, imgElement);
    setCropState({
      ...cropState,
      isSelecting: true,
      startPos: pos,
      currentPos: pos,
      pendingSelection: null,
    });
  };

  const handleCropMove = (e) => {
    if (!cropState.isSelecting) return;
    if (e.type === "mousemove") e.preventDefault();
    setCropState({
      ...cropState,
      currentPos: getRelativePosition(e, imgElement),
    });
  };

  const handleCropEnd = () => {
    if (!cropState.isSelecting || !cropState.startPos || !cropState.currentPos)
      return;
    const { startPos, currentPos } = cropState;
    const x = Math.min(startPos.x, currentPos.x);
    const y = Math.min(startPos.y, currentPos.y);
    const width = Math.abs(currentPos.x - startPos.x);
    const height = Math.abs(currentPos.y - startPos.y);

    if (width < MIN_SIZE || height < MIN_SIZE) {
      setCropState({
        ...cropState,
        isSelecting: false,
        startPos: null,
        currentPos: null,
      });
      return;
    }

    const croppedImage = cropToDataUrl(imgElement, { x, y, width, height });

    setCropState((prev) => ({
      ...prev,
      isSelecting: false,
      startPos: null,
      currentPos: null,
      pendingSelection: { x, y, width, height, image: croppedImage },
    }));
  };

  const startResize = (handle, e) => {
    if (!cropState.pendingSelection) return;
    if (e.type === "mousedown") e.preventDefault();
    e.stopPropagation();
    const rect = imgElement?.getBoundingClientRect();
    if (!rect) return;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    latestRectRef.current = null;
    resizingRef.current = {
      handle,
      startMouse: { x: clientX, y: clientY },
      startRect: cropState.pendingSelection,
    };
  };

  const handleResizeMove = (e) => {
    if (!resizingRef.current) return;
    // Safe here: window touchmove is registered with { passive: false }
    e.preventDefault();
    const { handle, startMouse, startRect } = resizingRef.current;
    if (!startRect) return;

    const rect = imgElement?.getBoundingClientRect();
    if (!rect) return;

    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const dx = clientX - startMouse.x;
    const dy = clientY - startMouse.y;

    const { x, y, width, height } = startRect;
    const scaleX = rect.width;
    const scaleY = rect.height;

    const hd =
      handle === "move"
        ? { id: "move", dx: 0, dy: 0, move: true }
        : RESIZE_HANDLES.find((h) => h.id === handle);
    if (!hd) return;

    let newX = x;
    let newY = y;
    let newWidth = width;
    let newHeight = height;

    if (hd.move) {
      // Drag the whole box, keeping its size and staying inside the page
      newX = clamp(x + dx / scaleX, 0, 1 - width);
      newY = clamp(y + dy / scaleY, 0, 1 - height);
    }

    if (hd.dx === -1) {
      newX = clamp(x + dx / scaleX, 0, x + width - MIN_SIZE);
      newWidth = width - (newX - x);
    } else if (hd.dx === 1) {
      newWidth = clamp(width + dx / scaleX, MIN_SIZE, 1 - x);
    }
    if (hd.dy === -1) {
      newY = clamp(y + dy / scaleY, 0, y + height - MIN_SIZE);
      newHeight = height - (newY - y);
    } else if (hd.dy === 1) {
      newHeight = clamp(height + dy / scaleY, MIN_SIZE, 1 - y);
    }

    if (newWidth < MIN_SIZE || newHeight < MIN_SIZE) return;

    // Cheap geometry-only update, throttled to one per animation frame.
    // The expensive canvas encode happens once, in handleResizeEnd.
    latestRectRef.current = {
      x: newX,
      y: newY,
      width: newWidth,
      height: newHeight,
    };
    if (rafRef.current) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      const r = latestRectRef.current;
      if (!r) return;
      setCropState((prev) =>
        prev.pendingSelection
          ? { ...prev, pendingSelection: { ...prev.pendingSelection, ...r } }
          : prev,
      );
    });
  };

  const handleResizeEnd = () => {
    if (!resizingRef.current) return;
    resizingRef.current = null;
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    const r = latestRectRef.current;
    latestRectRef.current = null;
    if (!r || !imgElement) return;
    const image = cropToDataUrl(imgElement, r);
    setCropState((prev) =>
      prev.pendingSelection
        ? { ...prev, pendingSelection: { ...prev.pendingSelection, ...r, image } }
        : prev,
    );
  };

  const addPendingQuestion = () => {
    if (!cropState.pendingSelection) return;
    setCropState((prev) => ({
      ...prev,
      croppedQuestions: [
        ...prev.croppedQuestions,
        {
          id: Date.now(),
          pageIndex: prev.currentPageIndex,
          ...prev.pendingSelection,
          correctAnswer: [],
          type: "none",
        },
      ],
      pendingSelection: null,
    }));
  };

  const cancelPending = () => {
    setCropState((prev) => ({ ...prev, pendingSelection: null }));
    resizingRef.current = null;
  };

  const deleteQuestion = (qId) => {
    setCropState((prev) => ({
      ...prev,
      croppedQuestions: prev.croppedQuestions.filter((q) => q.id !== qId),
    }));
  };

  const finishCropping = () => {
    if (cropState.croppedQuestions.length === 0) {
      alert(t("cropAtLeastOne"));
      return;
    }
    onFinish(finalizeCroppedQuestions(cropState.croppedQuestions));
  };

  // FIX: keep the ref pointing at the latest handlers on every render.
  // Previously it was set once on mount, when imgElement was still null,
  // so resizing could never work.
  handlerRef.current = { move: handleResizeMove, end: handleResizeEnd };

  useEffect(() => {
    const onMove = (e) => handlerRef.current.move(e);
    const onEnd = () => handlerRef.current.end();
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onEnd);
    window.addEventListener("touchmove", onMove, { passive: false });
    window.addEventListener("touchend", onEnd);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onEnd);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onEnd);
    };
  }, []);

  // Keyboard shortcuts while a selection is pending: Enter = add, Esc = cancel
  const hasPending = !!cropState.pendingSelection;
  useEffect(() => {
    if (!hasPending) return;
    const onKey = (e) => {
      const tag = e.target?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (e.key === "Enter") {
        e.preventDefault();
        playClickSound();
        addPendingQuestion();
      } else if (e.key === "Escape") {
        e.preventDefault();
        playClickSound();
        cancelPending();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasPending]);

  const renderResizeHandles = () => {
    if (!cropState.pendingSelection) return null;
    return RESIZE_HANDLES.map((h) => (
      <div
        key={h.id}
        onMouseDown={(e) => startResize(h.id, e)}
        onTouchStart={(e) => startResize(h.id, e)}
        className="absolute z-50"
        style={{
          left: h.dx === -1 ? `-${HANDLE_SIZE / 2}px` : h.dx === 1 ? `calc(100% - ${HANDLE_SIZE / 2}px)` : `calc(50% - ${HANDLE_SIZE / 2}px)`,
          top: h.dy === -1 ? `-${HANDLE_SIZE / 2}px` : h.dy === 1 ? `calc(100% - ${HANDLE_SIZE / 2}px)` : `calc(50% - ${HANDLE_SIZE / 2}px)`,
          width: `${HANDLE_SIZE}px`,
          height: `${HANDLE_SIZE}px`,
          background: "var(--accent)",
          border: "2px solid var(--bg)",
          borderRadius: h.dx === 0 || h.dy === 0 ? "2px" : "50%",
          boxShadow: "0 0 0 2px var(--accent), 0 1px 3px rgba(0,0,0,0.3)",
          cursor: h.cursor,
          touchAction: "none",
        }}
      />
    ));
  };

  return (
    <PageWrapper>
      <Card className="sticky top-[57px] z-40 mb-6 p-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-base font-semibold">
              {language === "vi" ? "Cắt câu hỏi" : "Crop Questions"}
            </h1>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              {language === "vi"
                ? "Kéo để chọn, kéo nút để chỉnh kích thước, rồi nhấn Thêm câu hỏi"
                : "Drag to select, drag handles to resize, then Add question"}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                playClickSound();
                playPageTransitionSound();
                onCancel();
              }}
            >
              {t("cancel")}
            </Button>
            <Button
              size="sm"
              onClick={() => {
                playClickSound();
                finishCropping();
              }}
              icon={<Check className="h-3.5 w-3.5" />}
            >
              {t("doneSetAnswers")}
            </Button>
          </div>
        </div>

        <div
          className="mt-4 flex flex-wrap items-center gap-3 border-t pt-4"
          style={{ borderColor: "var(--border)" }}
        >
          <Button
            variant="secondary"
            size="sm"
            disabled={cropState.currentPageIndex === 0}
            onClick={() =>
              setCropState({
                ...cropState,
                currentPageIndex: Math.max(0, cropState.currentPageIndex - 1),
              })
            }
            icon={<ChevronLeft className="h-3.5 w-3.5" />}
          >
            {t("back")}
          </Button>
          <span className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>
            {t("page")} {cropState.currentPageIndex + 1} / {test.pages.length}
          </span>
          <Button
            variant="secondary"
            size="sm"
            disabled={cropState.currentPageIndex === test.pages.length - 1}
            onClick={() =>
              setCropState({
                ...cropState,
                currentPageIndex: Math.min(
                  test.pages.length - 1,
                  cropState.currentPageIndex + 1,
                ),
              })
            }
          >
            {language === "vi" ? "Trang sau" : "Next"}
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
          <span className="badge badge-accent ml-auto">
            {t("questionsCropped")} {cropState.croppedQuestions.length}
          </span>
        </div>
      </Card>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="p-4 xl:col-span-2">
          <h2 className="label">{t("currentPage")}</h2>
          <div
            className="relative mb-14 w-full border"
            style={{ borderColor: "var(--border)", cursor: "crosshair" }}
          >
            <img
              ref={setImgElement}
              src={currentPageImg}
              alt="Page"
              className="block w-full"
              style={{ touchAction: "none" }}
              onMouseDown={handleCropStart}
              onMouseMove={handleCropMove}
              onMouseUp={() => handleCropEnd()}
              onTouchStart={handleCropStart}
              onTouchMove={handleCropMove}
              onTouchEnd={() => handleCropEnd()}
              draggable={false}
            />
            {cropState.isSelecting &&
              cropState.startPos &&
              cropState.currentPos &&
              imgElement && (
                <div
                  className="pointer-events-none absolute border-2"
                  style={{
                    borderColor: "var(--accent)",
                    background: "var(--accent-soft)",
                    left: `${Math.min(cropState.startPos.x, cropState.currentPos.x) * 100}%`,
                    top: `${Math.min(cropState.startPos.y, cropState.currentPos.y) * 100}%`,
                    width: `${Math.abs(cropState.currentPos.x - cropState.startPos.x) * 100}%`,
                    height: `${Math.abs(cropState.currentPos.y - cropState.startPos.y) * 100}%`,
                  }}
                />
              )}
            {cropState.pendingSelection && imgElement && (
              <div
                className="absolute border-2 z-20"
                onMouseDown={(e) => startResize("move", e)}
                onTouchStart={(e) => startResize("move", e)}
                style={{
                  overflow: "visible",
                  touchAction: "none",
                  cursor: "move",
                  left: `${cropState.pendingSelection.x * 100}%`,
                  top: `${cropState.pendingSelection.y * 100}%`,
                  width: `${cropState.pendingSelection.width * 100}%`,
                  height: `${cropState.pendingSelection.height * 100}%`,
                }}
              >
                {/* No image needed here: the page image is already underneath */}
                <div
                  className="block border border-dashed"
                  style={{
                    borderColor: "var(--accent)",
                    width: "100%",
                    height: "100%",
                    background: "var(--accent-soft)",
                    pointerEvents: "none",
                  }}
                />
                {renderResizeHandles()}
                {/* Action buttons pinned just below the selection's bottom edge */}
                <div
                  className="absolute z-50 flex items-center gap-2 whitespace-nowrap p-1.5"
                  onMouseDown={(e) => e.stopPropagation()}
                  onTouchStart={(e) => e.stopPropagation()}
                  style={{
                    top: `calc(100% + ${HANDLE_SIZE + 4}px)`,
                    [cropState.pendingSelection.x > 0.5 ? "right" : "left"]: 0,
                    cursor: "default",
                    // Solid background so the toolbar is readable over the page image
                    background: "var(--surface-2)",
                    border: "1px solid var(--border-strong)",
                    borderRadius: 0,
                    boxShadow: "0 4px 14px rgba(0,0,0,0.25)",
                  }}
                >
                  <Button
                    size="sm"
                    onClick={() => {
                      playClickSound();
                      addPendingQuestion();
                    }}
                    className="btn-primary"
                    icon={<Check className="h-3.5 w-3.5" />}
                  >
                    {language === "vi" ? "Thêm câu hỏi" : "Add question"}
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      playClickSound();
                      cancelPending();
                    }}
                    icon={<X className="h-3.5 w-3.5" />}
                  >
                    {language === "vi" ? "Hủy" : "Cancel"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </Card>

        <Card className="flex max-h-[80vh] flex-col p-4">
          <h2 className="label">{t("croppedQuestions")}</h2>
          <div className="-mr-2 flex-1 space-y-3 overflow-y-auto pr-2">
            {cropState.croppedQuestions.map((q, idx) => (
              <div
                key={q.id}
                className="relative border p-2"
                style={{
                  borderColor: "var(--border)",
                  background: "var(--surface-2)",
                }}
              >
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-semibold">
                    {t("question")} {idx + 1}
                  </span>
                  <button
                    onClick={() => deleteQuestion(q.id)}
                    className="icon-btn icon-btn-sm"
                    aria-label={t("delete")}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
                <img
                  src={q.image}
                  alt={`Q${idx + 1}`}
                  className="block border max-w-full"
                  style={{ borderColor: "var(--border)", maxWidth: "100%" }}
                />
              </div>
            ))}
            {cropState.pendingSelection && (
              <div className="border-2 border-dashed p-2">
                <span className="text-xs font-semibold mb-1 block">
                  {language === "vi" ? "Xem trước (chưa thêm)" : "Preview (pending)"}
                </span>
                <img
                  src={cropState.pendingSelection.image}
                  alt="Preview"
                  className="block border max-w-full"
                  style={{ borderColor: "var(--accent)", maxWidth: "100%" }}
                />
              </div>
            )}
            {cropState.croppedQuestions.length === 0 && !cropState.pendingSelection && (
              <div
                className=" border border-dashed px-4 py-12 text-center text-xs"
                style={{
                  borderColor: "var(--border-strong)",
                  color: "var(--text-muted)",
                }}
              >
                <ImageIcon
                  className="mx-auto mb-2 h-6 w-6"
                  style={{ color: "var(--text-faint)" }}
                />
                {t("selectQuestions")}
              </div>
            )}
          </div>
        </Card>
      </div>
    </PageWrapper>
  );
};

export default CropPage;