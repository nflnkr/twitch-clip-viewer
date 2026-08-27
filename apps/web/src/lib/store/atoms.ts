import { atom } from "@reatom/core";

export const chronologicalOrder = atom(false);
export const markAsViewed = atom(true);
export const clipAutoplay = atom(true);
export const autonextBuffer = atom(4);
export const skipViewed = atom(false);
export const sidebarOpen = atom(true);
export const filtersOpen = atom(true);
export const selectedClipId = atom<string | null>(null);
export const titleFilterField = atom("");
export const selectedGameId = atom<string | null>(null);
export const smallClipButton = atom(false);
