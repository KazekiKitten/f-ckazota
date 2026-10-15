import { createContext, useContext } from "react";

const SoundContext = createContext(null);

export const useSound = () => useContext(SoundContext);

export default SoundContext;
