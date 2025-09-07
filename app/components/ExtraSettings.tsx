import { reatomComponent } from "@reatom/react";
import { NumberInput } from "~/components/NumberInput";
import { Button } from "~/components/ui/button";
import { Label } from "~/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "~/components/ui/popover";
import { Switch } from "~/components/ui/switch";
import { db } from "~/lib/db";
import { useTranslations } from "~/lib/locale/locales";
import {
    autonextBuffer,
    chronologicalOrder,
    clipAutoplay,
    markAsViewed,
} from "~/lib/settings/atoms";
import { useLiveQuery } from "dexie-react-hooks";
import { Settings } from "lucide-react";
import type { Dispatch, SetStateAction } from "react";

interface Props {
    selectClip: (clipId: string | null, autonext?: boolean) => void;
    setSelectedGame: Dispatch<SetStateAction<string>>;
}

const ExtraSettingsPopover = reatomComponent(function ExtraSettingsPopover({
    selectClip,
    setSelectedGame,
}: Props) {
    const t = useTranslations();
    const viewedClips = useLiveQuery(() => db.viewedClips.toArray());

    function clearViewedClips() {
        db.viewedClips.clear();
    }

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    size="icon"
                >
                    <Settings />
                </Button>
            </PopoverTrigger>
            <PopoverContent
                className="w-[20rem] gap-6"
                side="left"
            >
                <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-2">
                        <div className="mr-auto flex items-center gap-2">
                            <Switch
                                id="clip-autoplay"
                                checked={clipAutoplay()}
                                onCheckedChange={clipAutoplay.set}
                            />
                            <Label htmlFor="clip-autoplay">{t("clipAutoplay")}</Label>
                        </div>
                        <div className="mr-auto flex items-center gap-2">
                            <Switch
                                id="mark-as-viewed"
                                checked={markAsViewed()}
                                onCheckedChange={markAsViewed.set}
                            />
                            <Label htmlFor="mark-as-viewed">{t("viewed.markAsViewed")}</Label>
                        </div>
                        <div className="mr-auto flex items-center gap-2">
                            <Switch
                                id="chronological-order"
                                checked={chronologicalOrder()}
                                onCheckedChange={(value) => {
                                    chronologicalOrder.set(value);
                                    selectClip(null);
                                    setSelectedGame("");
                                }}
                            />
                            <Label htmlFor="chronological-order">{t("chronologicalOrder")}</Label>
                        </div>
                    </div>
                    <div className="flex flex-col gap-1">
                        <Label htmlFor="autonext-buffer">{t("autonextBuffer")}</Label>
                        <NumberInput
                            id="autonext-buffer"
                            name="autonext-buffer"
                            value={autonextBuffer()}
                            onValueChange={(v) => {
                                if (v !== undefined) {
                                    autonextBuffer.set(v);
                                }
                            }}
                            min={0}
                        />
                    </div>
                    <Button
                        variant="destructive"
                        onClick={clearViewedClips}
                        disabled={!viewedClips?.length}
                        className="h-full"
                    >
                        {`${t("viewed.clearViewedClips")} (${viewedClips?.length || 0})`}
                    </Button>
                </div>
            </PopoverContent>
        </Popover>
    );
});

export default ExtraSettingsPopover;
