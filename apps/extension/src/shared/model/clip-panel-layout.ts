export interface ClipPanelLayout {
    x: number;
    y: number;
    width: number;
    height: number;
}

const STORAGE_KEY = "ttv-clip-viewer.clip-panel-layout";

function isFiniteNumber(value: unknown): value is number {
    return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

export function loadClipPanelLayout(): ClipPanelLayout | null {
    try {
        const raw = window.localStorage.getItem(STORAGE_KEY);

        if (!raw) return null;

        const parsed = JSON.parse(raw) as Partial<ClipPanelLayout>;

        if (
            isFiniteNumber(parsed.x) &&
            isFiniteNumber(parsed.y) &&
            isFiniteNumber(parsed.width) &&
            isFiniteNumber(parsed.height)
        ) {
            return parsed as ClipPanelLayout;
        }
    } catch {
        return null;
    }

    return null;
}

export function saveClipPanelLayout(layout: ClipPanelLayout) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(layout));
}
