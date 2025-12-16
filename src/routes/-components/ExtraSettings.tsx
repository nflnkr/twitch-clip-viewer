import { reatomComponent } from "@reatom/react";
import { useLiveQuery } from "dexie-react-hooks";
import { Settings } from "lucide-react";

import EnFlag from "~/components/EnFlag";
import { NumberInput } from "~/components/NumberInput";
import RuFlag from "~/components/RuFlag";
import { Button } from "~/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "~/components/ui/dialog";
import { Label } from "~/components/ui/label";
import { db } from "~/lib/db";
import { useLocaleContext, useTranslations } from "~/lib/locale/locales";
import { autonextBuffer } from "~/lib/store/atoms";
import { cn } from "~/lib/utils";

const ExtraSettingsDialog = reatomComponent(function ExtraSettingsDialog() {
    const t = useTranslations();
    const { locale, setLocale } = useLocaleContext();
    const viewedClipsLength = useLiveQuery(() => db.viewedClips.toArray())?.length ?? 0;

    function clearViewedClips() {
        db.viewedClips.clear();
    }

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button
                    variant="secondary"
                    size="icon"
                >
                    <Settings />
                </Button>
            </DialogTrigger>
            <DialogContent
                className="gap-6 sm:max-w-104"
                aria-describedby={undefined}
            >
                <DialogHeader>
                    <DialogTitle>{t("settings")}</DialogTitle>
                </DialogHeader>
                <div className="flex flex-col gap-4">
                    <div className="flex flex-wrap gap-1">
                        <Button
                            variant="secondary"
                            onClick={() => setLocale("en")}
                            className={cn("border p-1", locale === "en" && "border-accent")}
                        >
                            <EnFlag />
                            English
                        </Button>
                        <Button
                            variant="secondary"
                            onClick={() => setLocale("ru")}
                            className={cn("border p-1", locale === "ru" && "border-accent")}
                        >
                            <RuFlag />
                            Русский
                        </Button>
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
                        disabled={!viewedClipsLength}
                    >
                        {`${t("viewed.clearViewedClips")} (${viewedClipsLength})`}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
});

export default ExtraSettingsDialog;
