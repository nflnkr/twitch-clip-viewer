import { reatomComponent } from "@reatom/react";
import type { ReactNode } from "@tanstack/react-router";
import { Button } from "~/components/ui/button";
import {
    autonextEnabled,
    autonextEnabled as autonextEnabledAtom,
    sidebarOpen,
} from "~/lib/settings/atoms";
import type { TwitchClipMetadata } from "~/model/twitch";
import { ArrowLeft, ArrowRight, CirclePause, CirclePlay, PanelLeftClose } from "lucide-react";
import { motion } from "motion/react";

interface Props {
    previousClip: TwitchClipMetadata | undefined;
    nextClip: TwitchClipMetadata | undefined;
    selectClip: (clipId: string | null, autonext?: boolean) => void;
    selectNextClip: (autonext?: boolean) => void;
    clipProgressOverlay: ReactNode;
}

const SideBarCollapsed = reatomComponent(function SideBarCollapsed({
    previousClip,
    nextClip,
    selectClip,
    selectNextClip,
    clipProgressOverlay,
}: Props) {
    return (
        <motion.div
            key="sidebar-collapsed"
            initial={{
                opacity: 0,
            }}
            animate={{
                opacity: 1,
            }}
            className="relative flex h-full flex-col"
        >
            <Button
                variant="ghost"
                size="icon"
                className="aspect-square rounded-none p-0 transition-transform duration-200 [&_svg]:size-6"
                onClick={() => sidebarOpen.set((o) => !o)}
            >
                <PanelLeftClose />
            </Button>
            <Button
                variant="ghost"
                size="icon"
                className="rounded-none hover:bg-gray-950"
                disabled={!previousClip}
                onClick={() => selectClip(previousClip?.id ?? null)}
            >
                <ArrowLeft />
            </Button>
            <Button
                variant="outline"
                className="rounded-none hover:bg-gray-950"
                onClick={() => autonextEnabledAtom.set((prev) => !prev)}
            >
                {autonextEnabled() ? <CirclePause /> : <CirclePlay />}
            </Button>
            <Button
                variant="ghost"
                size="icon"
                className="grow rounded-none hover:bg-gray-950"
                disabled={!nextClip}
                onClick={() => selectNextClip()}
            >
                <ArrowRight />
            </Button>
            <div className="pointer-events-none absolute inset-0">{clipProgressOverlay}</div>
        </motion.div>
    );
});

export default SideBarCollapsed;
