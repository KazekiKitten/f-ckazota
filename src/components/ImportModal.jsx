import Modal from "./ui/Modal";
import Button from "./ui/Button";
import { useAppUI } from "../context/appUI";
import { useLanguage } from "../context/languageContext";

const ImportModal = () => {
  const { t } = useLanguage();
  const {
    showImportModal,
    setShowImportModal,
    importCode,
    setImportCode,
    importByCode,
  } = useAppUI();

  if (!showImportModal) return null;

  return (
    <Modal
      title={t("importByCode")}
      onClose={() => setShowImportModal(false)}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          importByCode();
        }}
      >
        <label className="label">Code</label>
        <input
          type="text"
          value={importCode}
          onChange={(e) => setImportCode(e.target.value.toUpperCase())}
          onKeyDown={(e) => {
            if (e.key === "Enter") importByCode();
          }}
          maxLength={6}
          placeholder="ABC123"
          className="input mb-6 text-center text-xl font-semibold tracking-[0.3em]"
          autoFocus
        />
        <div className="flex gap-2">
          <Button
            variant="secondary"
            className="flex-1"
            onClick={() => setShowImportModal(false)}
          >
            {t("cancel")}
          </Button>
          <Button
            type="submit"
            className="flex-1"
            disabled={importCode.length !== 6}
          >
            {t("importTest")}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default ImportModal;
