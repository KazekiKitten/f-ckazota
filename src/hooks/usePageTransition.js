import { useState } from "react";

export const usePageTransition = () => {
  const [simpleAnimations, setSimpleAnimations] = useState(true);

  return () => {
    if (simpleAnimations) {
      setSimpleAnimations(false);
      setTimeout(() => setSimpleAnimations(true), 100);
    }
  };
};
