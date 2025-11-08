import { createContext, useContext, useState, useEffect } from "react";

type Language = "en" | "sq" | "es" | "fr" | "de" | "it";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: React.ReactNode }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem("language");
    return (saved as Language) || "en";
  });

  useEffect(() => {
    localStorage.setItem("language", language);
  }, [language]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const t = (key: string): string => {
    const translations = getTranslations(language);
    return translations[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }
  return context;
};

const getTranslations = (lang: Language): Record<string, string> => {
  const translations: Record<Language, Record<string, string>> = {
    en: {
      // Navigation
      "nav.home": "Home",
      "nav.jobs": "Micro-Jobs",
      "nav.regions": "Regions",
      "nav.impact": "Impact",
      "nav.profile": "Profile",
      // Auth
      "auth.login": "Login",
      "auth.signup": "Sign Up",
      "auth.email": "Email",
      "auth.password": "Password",
      "auth.confirmPassword": "Confirm Password",
      "auth.username": "Username",
      "auth.rememberMe": "Remember me",
      "auth.loggingIn": "Logging in...",
      "auth.creatingAccount": "Creating account...",
      // Common
      "common.welcome": "Welcome back!",
      "common.loading": "Loading...",
      "common.save": "Save",
      "common.cancel": "Cancel",
      "common.delete": "Delete",
      "common.edit": "Edit",
      "common.search": "Search",
    },
    sq: {
      // Navigation (Albanian)
      "nav.home": "Ballina",
      "nav.jobs": "Mikro-Punët",
      "nav.regions": "Rajonet",
      "nav.impact": "Ndikimi",
      "nav.profile": "Profili",
      // Auth
      "auth.login": "Hyrje",
      "auth.signup": "Regjistrohu",
      "auth.email": "Email",
      "auth.password": "Fjalëkalimi",
      "auth.confirmPassword": "Konfirmo Fjalëkalimin",
      "auth.username": "Emri i përdoruesit",
      "auth.rememberMe": "Më kujto",
      "auth.loggingIn": "Duke u futur...",
      "auth.creatingAccount": "Duke krijuar llogarinë...",
      // Common
      "common.welcome": "Mirë se erdhe përsëri!",
      "common.loading": "Duke u ngarkuar...",
      "common.save": "Ruaj",
      "common.cancel": "Anulo",
      "common.delete": "Fshi",
      "common.edit": "Ndrysho",
      "common.search": "Kërko",
    },
    es: {
      // Navigation (Spanish)
      "nav.home": "Inicio",
      "nav.jobs": "Micro-Trabajos",
      "nav.regions": "Regiones",
      "nav.impact": "Impacto",
      "nav.profile": "Perfil",
      // Auth
      "auth.login": "Iniciar sesión",
      "auth.signup": "Registrarse",
      "auth.email": "Correo electrónico",
      "auth.password": "Contraseña",
      "auth.confirmPassword": "Confirmar contraseña",
      "auth.username": "Nombre de usuario",
      "auth.rememberMe": "Recuérdame",
      "auth.loggingIn": "Iniciando sesión...",
      "auth.creatingAccount": "Creando cuenta...",
      // Common
      "common.welcome": "¡Bienvenido de nuevo!",
      "common.loading": "Cargando...",
      "common.save": "Guardar",
      "common.cancel": "Cancelar",
      "common.delete": "Eliminar",
      "common.edit": "Editar",
      "common.search": "Buscar",
    },
    fr: {
      // Navigation (French)
      "nav.home": "Accueil",
      "nav.jobs": "Micro-Emplois",
      "nav.regions": "Régions",
      "nav.impact": "Impact",
      "nav.profile": "Profil",
      // Auth
      "auth.login": "Connexion",
      "auth.signup": "S'inscrire",
      "auth.email": "Email",
      "auth.password": "Mot de passe",
      "auth.confirmPassword": "Confirmer le mot de passe",
      "auth.username": "Nom d'utilisateur",
      "auth.rememberMe": "Se souvenir de moi",
      "auth.loggingIn": "Connexion en cours...",
      "auth.creatingAccount": "Création du compte...",
      // Common
      "common.welcome": "Bon retour!",
      "common.loading": "Chargement...",
      "common.save": "Enregistrer",
      "common.cancel": "Annuler",
      "common.delete": "Supprimer",
      "common.edit": "Modifier",
      "common.search": "Rechercher",
    },
    de: {
      // Navigation (German)
      "nav.home": "Startseite",
      "nav.jobs": "Jobs",
      "nav.regions": "Regionen",
      "nav.impact": "Auswirkung",
      "nav.profile": "Profil",
      // Auth
      "auth.login": "Anmelden",
      "auth.signup": "Registrieren",
      "auth.email": "E-Mail",
      "auth.password": "Passwort",
      "auth.confirmPassword": "Passwort bestätigen",
      "auth.username": "Benutzername",
      "auth.rememberMe": "Erinnere dich an mich",
      "auth.loggingIn": "Anmeldung läuft...",
      "auth.creatingAccount": "Konto wird erstellt...",
      // Common
      "common.welcome": "Willkommen zurück!",
      "common.loading": "Wird geladen...",
      "common.save": "Speichern",
      "common.cancel": "Abbrechen",
      "common.delete": "Löschen",
      "common.edit": "Bearbeiten",
      "common.search": "Suchen",
    },
    it: {
      // Navigation (Italian)
      "nav.home": "Home",
      "nav.jobs": "Micro-Lavori",
      "nav.regions": "Regioni",
      "nav.impact": "Impatto",
      "nav.profile": "Profilo",
      // Auth
      "auth.login": "Accedi",
      "auth.signup": "Registrati",
      "auth.email": "Email",
      "auth.password": "Password",
      "auth.confirmPassword": "Conferma password",
      "auth.username": "Nome utente",
      "auth.rememberMe": "Ricordami",
      "auth.loggingIn": "Accesso in corso...",
      "auth.creatingAccount": "Creazione account...",
      // Common
      "common.welcome": "Bentornato!",
      "common.loading": "Caricamento...",
      "common.save": "Salva",
      "common.cancel": "Annulla",
      "common.delete": "Elimina",
      "common.edit": "Modifica",
      "common.search": "Cerca",
    },
  };

  return translations[lang] || translations.en;
};
