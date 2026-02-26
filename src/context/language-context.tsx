
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Language, translations } from '@/lib/translations';

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (path: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
    const [language, setLanguageState] = useState<Language>('en');

    useEffect(() => {
        const savedLanguage = localStorage.getItem('app-language') as Language;
        if (savedLanguage && (savedLanguage === 'en' || savedLanguage === 'ta')) {
            setLanguageState(savedLanguage);
        }
    }, []);

    const setLanguage = (lang: Language) => {
        setLanguageState(lang);
        localStorage.setItem('app-language', lang);
        document.documentElement.lang = lang;
    };

    const t = (path: string): string => {
        const keys = path.split('.');
        let result: any = translations[language];

        for (const key of keys) {
            if (result && result[key]) {
                result = result[key];
            } else {
                return path; // Return key if not found
            }
        }

        return typeof result === 'string' ? result : path;
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => {
    const context = useContext(LanguageContext);
    if (context === undefined) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
};
