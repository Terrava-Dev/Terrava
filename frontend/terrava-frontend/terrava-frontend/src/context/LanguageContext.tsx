import { createContext, useContext, useState, useEffect } from "react"
import { translations, type Lang, type TranslationKey } from "./translations"

export type LanguageContextType = {
  lang: Lang
  setLang: (lang: Lang) => void
  t: (key: TranslationKey) => string
}

export const LanguageContext = createContext<LanguageContextType>({
  lang: "en",
  setLang: () => {},
  t: (key) => key,
})

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    const saved = localStorage.getItem("terrava_lang")
    return (saved === "en" || saved === "ta") ? saved : "en"
  })

  const setLang = (newLang: Lang) => {
    setLangState(newLang)
    localStorage.setItem("terrava_lang", newLang)
  }

  useEffect(() => {
    document.documentElement.lang = lang === "ta" ? "ta" : "en"
  }, [lang])

  const t = (key: TranslationKey): string => {
    return translations[lang][key] ?? translations["en"][key] ?? key
  }

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useLang() {
  return useContext(LanguageContext)
}