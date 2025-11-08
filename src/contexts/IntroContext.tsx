import { createContext, useContext, ReactNode } from "react";

interface IntroContextType {
  showIntro: () => void;
}

const IntroContext = createContext<IntroContextType | undefined>(undefined);

interface IntroProviderProps {
  children: ReactNode;
  onShowIntro: () => void;
}

export const IntroProvider = ({ children, onShowIntro }: IntroProviderProps) => {
  const showIntro = () => {
    sessionStorage.removeItem('introShown');
    onShowIntro();
  };

  return (
    <IntroContext.Provider value={{ showIntro }}>
      {children}
    </IntroContext.Provider>
  );
};

export const useIntro = () => {
  const context = useContext(IntroContext);
  if (context === undefined) {
    throw new Error("useIntro must be used within an IntroProvider");
  }
  return context;
};
