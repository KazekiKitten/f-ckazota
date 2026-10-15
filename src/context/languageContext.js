import { createContext, useContext } from "react";

const LanguageContext = createContext(null);

export const useLanguage = () => useContext(LanguageContext);

export default LanguageContext;
