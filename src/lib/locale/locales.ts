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
    clips: "Clips",
    addChannel: "Add channel",
    minViews: "Min views",
    clipAutoplay: "Clip autoplay",
    chronologicalOrder: "Chronological order",
    filters: "Filters",
    search: "Search",
    filterByCategory: "By category",
    searchCategory: "Search category",
    notFound: "Nothing found",
    selectCategory: "Select category",
    autonextBuffer: "Autonext reserve time, s",
    "viewed.skipViewed": "Skip viewed",
    "viewed.markAsViewed": "Mark as viewed",
    "viewed.clearViewedClips": "Clear viewed clips",
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
        clips: "Клипы",
        addChannel: "Добавить канал",
        minViews: "Мин. просмотров",
        clipAutoplay: "Автовоспроизведение клипа",
        chronologicalOrder: "Хронологический порядок",
        filters: "Фильтры",
        search: "Поиск",
        searchCategory: "Поиск по категориям",
        filterByCategory: "По категории",
        notFound: "Ничего не найдено",
        selectCategory: "Выберите категорию",
        autonextBuffer: "Запас времени при автовоспроизведении, с",
        "viewed.skipViewed": "Пропускать просмотренные",
        "viewed.markAsViewed": "Помечать просмотренным",
        "viewed.clearViewedClips": "Очистить просмотренные клипы",
        "time.lastWeek": "Последняя неделя",
        "time.lastMonth": "Последний месяц",
        "time.lastYear": "Последний год",
        "time.all": "Все",
        "time.currentClipDate": "Текущий клип + 1д",
    },
};
