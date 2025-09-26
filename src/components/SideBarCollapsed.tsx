import { reatomComponent } from "@reatom/react";
import { ArrowLeft, ArrowRight, CirclePause, CirclePlay, PanelLeftClose } from "lucide-react";
import { motion } from "motion/react";
import { ReactNode } from "react";

import { Button } from "~/components/ui/button";
import { autonextEnabled, sidebarOpen } from "~/lib/settings/atoms";

interface Props {
    hasPrevClip: boolean;
    hasNextClip: boolean;
    selectNextClip: () => void;
    selectPrevClip: () => void;
    switchAutonext: () => void;
    clipProgressOverlay: ReactNode;
}

const SideBarCollapsed = reatomComponent(function SideBarCollapsed({
    hasPrevClip,
    hasNextClip,
    selectPrevClip,
    selectNextClip,
    switchAutonext,
    clipProgressOverlay,
}: Props) {
    return (
        <motion.div
            key="sidebar-collapsed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
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
                className="rounded-none"
                disabled={!hasPrevClip}
                onClick={selectPrevClip}
            >
                <ArrowLeft />
            </Button>
            <Button
                variant="ghost"
                size="icon"
                className="rounded-none"
                onClick={switchAutonext}
            >
                {autonextEnabled() ? <CirclePause /> : <CirclePlay />}
            </Button>
            <Button
                variant="ghost"
                size="icon"
                className="grow rounded-none"
                disabled={!hasNextClip}
                onClick={selectNextClip}
            >
                <ArrowRight />
            </Button>
            <div className="pointer-events-none absolute inset-0">{clipProgressOverlay}</div>
        </motion.div>
    );
});

export default SideBarCollapsed;
