import { atom } from "@reatom/core";
import { animate, AnimationPlaybackControlsWithThen, motionValue } from "motion/react";

let currentAutonextTimerAnimation: AnimationPlaybackControlsWithThen | null = null;

export const autonextEnabled = atom(false);

export const autonextTimer = motionValue("0%");

export function startAutonextTimer(duration: number) {
    autonextEnabled.set(true);

    currentAutonextTimerAnimation?.stop();
    autonextTimer.jump("0%");
    currentAutonextTimerAnimation = animate(autonextTimer, "100%", {
        ease: "linear",
        duration,
    });
}

export function stopAutonextTimer() {
    autonextEnabled.set(false);

    currentAutonextTimerAnimation?.stop();
    autonextTimer.jump("0%");
}
