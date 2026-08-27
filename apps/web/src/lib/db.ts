import Dexie, { type EntityTable } from "dexie";

export interface ViewedClip {
    id: number;
    clipId: string;
    timestamp: number;
}

export const db = new Dexie("clipviewerdb") as Dexie & {
    viewedClips: EntityTable<ViewedClip, "id">;
};

db.version(1).stores({
    viewedClips: "++id, clipId, timestamp",
});
