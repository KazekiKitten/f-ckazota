import Header from "./Header";
import ShareModal from "./ShareModal";
import ImportModal from "./ImportModal";

const PageWrapper = ({ children }) => (
  <div className="min-h-screen">
    <Header />
    <ShareModal />
    <ImportModal />

    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10 animate-fade-in">
      {children}
    </main>
  </div>
);

export default PageWrapper;
