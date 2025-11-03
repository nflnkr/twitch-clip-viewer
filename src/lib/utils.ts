import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function formatSeconds(seconds: number) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    let result = "";
    if (hours > 0) result += `${hours}h`;
    if (minutes > 0) result += `${minutes}m`;
    result += `${secs}s`;

    return result;
}

export function getYearsArray() {
    const currentYear = new Date().getFullYear();

    const yearsArray = [];
    for (let year = currentYear; year >= 2016; year--) {
        yearsArray.push(year);
    }

    return yearsArray;
}

export function uniqueIds<TItemId extends string | number>(ids: TItemId[] | undefined): TItemId[] {
    return Array.from(new Set(ids));
}

export function isDefined<T>(value: T | null | undefined): value is NonNullable<T> {
    return value !== null && value !== undefined;
}
