import { Movie } from "@mui/icons-material";
import { useEffect, useRef, type RefObject } from "react";
import { createPortal } from "react-dom";

import { endFlight, type FlightItem } from "~/shared/lib/clip-queue";

const CHIP_SIZE = 28;
const Z_INDEX = 2147483647;
const START_SCALE = 2;
const END_SCALE = 1;
const ARC_OFFSET = 0.5;
const MID_SCALE = START_SCALE + (END_SCALE - START_SCALE) * ARC_OFFSET;
const DURATION = 750;

interface FlyingClipProps {
    flight: FlightItem;
    targetRef: RefObject<HTMLButtonElement | null>;
}

export function FlyingClip({ flight, targetRef }: FlyingClipProps) {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const element = ref.current;
        const target = targetRef.current;

        if (!element || !target) {
            endFlight(flight.id);

            return;
        }

        const targetRect = target.getBoundingClientRect();
        const targetX = targetRect.left + targetRect.width / 2;
        const targetY = targetRect.top + targetRect.height / 2;

        const dx = targetX - flight.x;
        const dy = targetY - flight.y;

        const animation = element.animate(
            [
                {
                    transform: `translate(0, 0) scale(${START_SCALE})`,
                    opacity: 1,
                    offset: 0,
                },
                {
                    transform: `translate(${dx * 0.5}px, ${dy * 0.5 - 40}px) scale(${MID_SCALE})`,
                    opacity: 1,
                    offset: ARC_OFFSET,
                },
                {
                    opacity: 1,
                    offset: 0.8,
                },
                {
                    transform: `translate(${dx}px, ${dy}px) scale(${END_SCALE})`,
                    opacity: 0,
                    offset: 1,
                },
            ],
            { duration: DURATION, easing: "linear" },
        );

        animation.onfinish = () => endFlight(flight.id);

        return () => animation.cancel();
    }, [flight.id, flight.x, flight.y, targetRef]);

    return createPortal(
        <div
            ref={ref}
            style={{
                position: "fixed",
                left: flight.x - CHIP_SIZE / 2,
                top: flight.y - CHIP_SIZE / 2,
                width: CHIP_SIZE,
                height: CHIP_SIZE,
                zIndex: Z_INDEX,
                pointerEvents: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "50%",
                backgroundColor: "#5E427E",
                color: "#EFEFF1",
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.4)",
            }}
        >
            <Movie fontSize="small" />
        </div>,
        document.body,
    );
}
