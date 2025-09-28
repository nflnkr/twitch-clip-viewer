import { reatomComponent } from "@reatom/react";
import { ArrowLeft, ArrowRight, Calendar, ExternalLink, Pause, Play } from "lucide-react";
import { motion } from "motion/react";

import { Button } from "~/components/ui/button";
import { useTranslations } from "~/lib/locale/locales";
import { autonextEnabled, autonextTimer } from "~/lib/settings/autonext";
import { getVodLink } from "~/lib/vod-link";
import type { TwitchClipMetadata } from "~/model/twitch";

function BottomBar({
    currentClip,
    hasPrevClip,
    hasNextClip,
    selectNextClip,
    selectPrevClip,
    switchAutonext,
}: {
    currentClip: TwitchClipMetadata | undefined;
    hasPrevClip: boolean;
    hasNextClip: boolean;
    selectNextClip: () => void;
    selectPrevClip: () => void;
    switchAutonext: () => void;
}) {
    const t = useTranslations();

    const vodLink = currentClip ? getVodLink(currentClip.vod_offset, currentClip.video_id) : null;

    return (
        <motion.div
            initial={{ height: 0, padding: 0 }}
            animate={{ height: "5rem", padding: "0.25rem" }}
            exit={{ height: 0, padding: 0 }}
            className="flex flex-col gap-1 overflow-y-clip"
        >
            {currentClip && (
                <div className="flex grow items-center justify-between gap-2">
                    <p
                        title={currentClip.title}
                        className="truncate px-2 text-xl font-semibold tracking-tighter"
                    >
                        {currentClip.title}
                    </p>
                    <div className="flex gap-1">
                        <Button
                            variant="link"
                            size="sm"
                            className="tracking-tight"
                            asChild
                        >
                            <a
                                target="_blank"
                                rel="noopener noreferrer"
                                color="secondary"
                                href={`https://twitch.tv/${currentClip.broadcaster_name.toLowerCase()}`}
                            >
                                {currentClip.broadcaster_name}
                                <ExternalLink />
                            </a>
                        </Button>
                        <Button
                            variant="link"
                            size="sm"
                            asChild
                            className="tracking-tight"
                        >
                            <a
                                target="_blank"
                                rel="noopener noreferrer"
                                color="secondary"
                                href={vodLink ?? undefined}
                            >
                                {new Date(currentClip.created_at).toLocaleString()}
                                {vodLink ? <ExternalLink /> : <Calendar />}
                            </a>
                        </Button>
                    </div>
                </div>
            )}
            <div className="relative flex grow gap-1">
                <Button
                    variant="outline"
                    disabled={!hasPrevClip}
                    onClick={selectPrevClip}
                    className="h-full grow"
                >
                    <ArrowLeft />
                </Button>
                <Button
                    variant="outline"
                    disabled={!hasNextClip}
                    onClick={switchAutonext}
                    className="h-full"
                >
                    {autonextEnabled() ? <Pause /> : <Play />}
                </Button>
                <Button
                    variant="outline"
                    disabled={!hasNextClip}
                    onClick={selectNextClip}
                    className="h-full grow"
                >
                    <ArrowRight />
                </Button>
                <div className="pointer-events-none absolute inset-0">
                    <motion.div
                        style={{ width: autonextTimer }}
                        className="h-full bg-zinc-400 opacity-10"
                    />
                </div>
            </div>
        </motion.div>
    );
}

export default reatomComponent(BottomBar);
