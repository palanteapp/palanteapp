import { useUser } from '../contexts/UserContext';
import type { AppLanguage } from '../types';
import { en } from './en';
import { es } from './es';

const dictionaries = { en, es } as const;

function lookup(dict: unknown, key: string): string | undefined {
    const hit = key.split('.').reduce<unknown>(
        (acc, part) => (acc && typeof acc === 'object' ? (acc as Record<string, unknown>)[part] : undefined),
        dict
    );
    return typeof hit === 'string' ? hit : undefined;
}

export function useTranslation() {
    const { user } = useUser();
    const language: AppLanguage = user?.language ?? 'en';

    const t = (key: string): string => lookup(dictionaries[language], key) ?? lookup(dictionaries.en, key) ?? key;

    return { t, language };
}
