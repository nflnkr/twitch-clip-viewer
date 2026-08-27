import { reatomComponent } from "@reatom/react";
import { ArrowLeft, ArrowRight, PanelLeftClose, Pause, Play } from "lucide-react";
import { motion } from "motion/react";

import { Button } from "~/components/ui/button";
import { sidebarOpen } from "~/lib/store/atoms";
import { autonextEnabled, autonextTimer } from "~/lib/store/autonext";

interface Props {
    hasPrevClip: boolean;
    hasNextClip: boolean;
    selectNextClip: () => void;
    selectPrevClip: () => void;
    switchAutonext: () => void;
}

function SideBarCollapsed({
    hasPrevClip,
    hasNextClip,
    selectPrevClip,
    selectNextClip,
    switchAutonext,
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
                {autonextEnabled() ? <Pause /> : <Play />}
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
            <div className="pointer-events-none absolute inset-0">
                <motion.div
                    style={{ width: autonextTimer }}
                    className="h-full bg-zinc-400 opacity-10"
                />
            </div>
        </motion.div>
    );
}

export default reatomComponent(SideBarCollapsed);
