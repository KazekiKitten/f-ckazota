import Modal from "./ui/Modal";
import Button from "./ui/Button";
import { useAppUI } from "../context/appUI";
import { useLanguage } from "../context/languageContext";

const ShareModal = () => {
  const { t } = useLanguage();
  const { showShareModal, setShowShareModal, shareCode } = useAppUI();

  if (!showShareModal) return null;

  return (
    <Modal title={t("shareTest")} onClose={() => setShowShareModal(false)}>
      <div
        className="mb-4 border px-4 py-6 text-center text-3xl font-semibold tracking-[0.35em]"
        style={{
          borderColor: "var(--border)",
          background: "var(--surface-2)",
          color: "var(--accent)",
        }}
      >
        {shareCode}
      </div>
      <p
        className="mb-6 text-center text-xs"
        style={{ color: "var(--text-muted)" }}
      >
        {t("shareCodeHint")}
      </p>
      <div className="flex gap-2">
        <Button
          className="flex-1"
          onClick={() => {
            navigator.clipboard.writeText(shareCode);
            setShowShareModal(false);
          }}
        >
          {t("copyCode")}
        </Button>
        <Button
          variant="secondary"
          className="flex-1"
          onClick={() => setShowShareModal(false)}
        >
          {t("done")}
        </Button>
      </div>
    </Modal>
  );
};

export default ShareModal;
