import { useState } from "react";
import { Check, Trash2, Image as ImageIcon, ChevronLeft, ChevronRight } from "lucide-react";
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

const CropPage = ({ test, onFinish, onCancel }) => {
  const { t, language } = useLanguage();
  const { playClickSound, playPageTransitionSound } = useSound();
  const [imgElement, setImgElement] = useState(null);
  const [cropState, setCropState] = useState({
    currentPageIndex: 0,
    isSelecting: false,
    startPos: null,
    currentPos: null,
    croppedQuestions: [],
  });

  const currentPageImg = test.pages[cropState.currentPageIndex];

  const handleCropStart = (e) => {
    e.preventDefault();
    const pos = getRelativePosition(e, imgElement);
    setCropState({
      ...cropState,
      isSelecting: true,
      startPos: pos,
      currentPos: pos,
    });
  };

  const handleCropMove = (e) => {
    if (!cropState.isSelecting) return;
    e.preventDefault();
    setCropState({
      ...cropState,
      currentPos: getRelativePosition(e, imgElement),
    });
  };

  const handleCropEnd = async () => {
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

    const croppedImage = cropToDataUrl(imgElement, {
      x,
      y,
      width,
      height,
    });

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
    onFinish(finalizeCroppedQuestions(cropState.croppedQuestions));
  };

  return (
    <PageWrapper>
      {/* Toolbar */}
      <Card className="sticky top-[57px] z-40 mb-6 p-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-base font-semibold">
              {language === "vi" ? "Cắt câu hỏi" : "Crop Questions"}
            </h1>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              {language === "vi"
                ? "Kéo thả để khoanh vùng"
                : "Drag to select"}
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
            className="relative w-full overflow-hidden border"
            style={{ borderColor: "var(--border)", cursor: "crosshair" }}
          >
            <img
              ref={setImgElement}
              src={currentPageImg}
              alt="Page"
              className="block w-full"
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
                    onClick={() =>
                      setCropState({
                        ...cropState,
                        croppedQuestions: cropState.croppedQuestions.filter(
                          (cq) => cq.id !== q.id,
                        ),
                      })
                    }
                    className="icon-btn icon-btn-sm"
                    aria-label={t("delete")}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
                <img
                  src={q.image}
                  alt={`Q${idx + 1}`}
                  className="w-fullborder"
                  style={{ borderColor: "var(--border)" }}
                />
              </div>
            ))}
            {cropState.croppedQuestions.length === 0 && (
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
