import { ThemeProvider } from "./context/ThemeProvider";
import { LanguageProvider } from "./context/LanguageProvider";
import { SoundProvider } from "./context/SoundProvider";
import { AuthProvider } from "./context/AuthProvider";
import VisualTestPlatform from "./VisualTestPlatform";

const App = () => (
  <ThemeProvider>
    <LanguageProvider>
      <SoundProvider>
        <AuthProvider>
          <VisualTestPlatform />
        </AuthProvider>
      </SoundProvider>
    </LanguageProvider>
  </ThemeProvider>
);

export default App;
