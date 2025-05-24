import { enUS, ru, type Locale } from "date-fns/locale";
import { createContext, useContext } from "react";

export const locales = ["en", "ru"] as const;

export type AppLocale = (typeof locales)[number];

export const defaultLocale = "en" satisfies AppLocale;

export const datefnsLocaleByAppLocale: Record<AppLocale, Locale> = {
    en: enUS,
    ru: ru,
};

export const LocaleContext = createContext<{
    locale: AppLocale;
    setLocale: (locale: AppLocale) => void;
}>({ locale: defaultLocale, setLocale: () => null });

export function useLocaleContext() {
    return useContext(LocaleContext);
}

export function useTranslations() {
    const { locale } = useContext(LocaleContext);

    return (key: keyof typeof en) => {
        if (locale === defaultLocale) {
            return en[key];
        }

        return translations[locale][key];
    };
}

const en = {
    settings: "Settings",
    addChannel: "Add channel",
    openClip: "Open clip",
    openVod: "Open VOD",
    minViews: "Min views",
    clipAutoplay: "Clip autoplay",
    chronologicalOrder: "Chronological order",
    titleFilter: "Filter clips by title",
    autonextBuffer: "Autonext: estimate time for clip to load (s)",
    "viewed.skipViewed": "Skip viewed",
    "viewed.markAsViewed": "Mark as viewed",
    "viewed.clearViewedClips": "Clear viewed clips",
    "player.autoplay": "Autoplay",
    "time.lastWeek": "Last week",
    "time.lastMonth": "Last month",
    "time.lastYear": "Last year",
    "time.all": "All",
    "time.currentClipDate": "Current clip + 1d",
} as const;

const translations: Record<
    Exclude<AppLocale, typeof defaultLocale>,
    Record<keyof typeof en, string>
> = {
    ru: {
        settings: "Настройки",
        addChannel: "Добавить канал",
        openClip: "Открыть клип",
        openVod: "Открыть VOD",
        minViews: "Мин. просмотров",
        clipAutoplay: "Автовоспроизведение клипа",
        chronologicalOrder: "Хронологический порядок",
        titleFilter: "Фильтровать по названию клипа",
        autonextBuffer: "Время для загрузки клипа при автовоспроизведении",
        "viewed.skipViewed": "Пропускать просмотренные",
        "viewed.markAsViewed": "Помечать просмотренным",
        "viewed.clearViewedClips": "Очистить просмотренные клипы",
        "player.autoplay": "Авто",
        "time.lastWeek": "Последняя неделя",
        "time.lastMonth": "Последний месяц",
        "time.lastYear": "Последний год",
        "time.all": "Все",
        "time.currentClipDate": "Текущий клип + 1д",
    },
};
