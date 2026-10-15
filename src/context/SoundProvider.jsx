import { useState } from "react";
import SoundContext from "./soundContext";

export const SoundProvider = ({ children }) => {
  const [soundEnabled, setSoundEnabled] = useState(() => {
    const saved = localStorage.getItem("azota-sound-enabled");
    return saved !== null ? saved === "true" : true;
  });
  const [audioContext, setAudioContext] = useState(null);

  const initAudioContext = () => {
    if (!audioContext)
      setAudioContext(new (window.AudioContext || window.webkitAudioContext)());
  };

  const playSound = async (freq, dur, type = "sine", vol = 0.1) => {
    if (!soundEnabled) return;
    if (!audioContext) {
      initAudioContext();
      if (!audioContext) return;
    }
    try {
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }
      const osc = audioContext.createOscillator();
      const gain = audioContext.createGain();
      osc.connect(gain);
      gain.connect(audioContext.destination);
      osc.frequency.setValueAtTime(freq, audioContext.currentTime);
      osc.type = type;
      gain.gain.setValueAtTime(0, audioContext.currentTime);
      gain.gain.linearRampToValueAtTime(vol, audioContext.currentTime + 0.01);
      gain.gain.exponentialRampToValueAtTime(
        0.001,
        audioContext.currentTime + dur,
      );
      osc.start(audioContext.currentTime);
      osc.stop(audioContext.currentTime + dur);
    } catch (e) {
      void e;
    }
  };

  const playClickSound = () => playSound(800, 0.1, "sine", 0.05);
  const playCorrectSound = () => {
    // Gambling-style winning sound: ascending chime with triangle wave for bell-like effect
    [600, 800, 1000, 1200, 1500].forEach((f, i) =>
      setTimeout(() => playSound(f, 0.2, "triangle", 0.15), i * 80),
    );
  };
  const playIncorrectSound = () => {
    [400, 350, 300].forEach((f, i) =>
      setTimeout(() => playSound(f, 0.5, "sawtooth", 0.1), i * 100),
    );
  };
  const playAchievementSound = () => {
    [523, 659, 784, 1047].forEach((f, i) =>
      setTimeout(() => playSound(f, 0.4, "triangle", 0.08), i * 150),
    );
  };
  const playPageTransitionSound = () => playSound(300, 0.2, "sine", 0.05);
  const playTestCompleteSound = () => {
    [523, 659, 784, 1047, 784, 659, 523].forEach((f, i) =>
      setTimeout(() => playSound(f, 0.3, "sine", 0.1), i * 200),
    );
  };
  const playQuestionAppearSound = () => playSound(400, 0.15, "sine", 0.06);
  const playSubmitSound = () => playSound(500, 0.3, "square", 0.08);

  const toggleSound = () => {
    initAudioContext();
    setSoundEnabled(!soundEnabled);
    localStorage.setItem("azota-sound-enabled", !soundEnabled);
  };

  return (
    <SoundContext.Provider
      value={{
        soundEnabled,
        toggleSound,
        playSound,
        playClickSound,
        playCorrectSound,
        playIncorrectSound,
        playAchievementSound,
        playPageTransitionSound,
        playTestCompleteSound,
        playQuestionAppearSound,
        playSubmitSound,
      }}
    >
      {children}
    </SoundContext.Provider>
  );
};
