import { animate, motion, useMotionValue } from "motion/react";
import { useEffect } from "react";

const hostname = globalThis.location?.hostname;

interface Props {
    autoplay: boolean;
    embedUrl: string;
}

export default function TwitchClipEmbed({ autoplay, embedUrl }: Props) {
    const opacity = useMotionValue(0);

    useEffect(() => {
        opacity.jump(0);
        animate(opacity, 1, { duration: 5.7 });
    }, [opacity, embedUrl, autoplay]);

    if (!hostname) return <p className="text-3xl">No clips</p>;

    return (
        <motion.iframe
            src={`${embedUrl}&parent=${hostname}&autoplay=${autoplay}`}
            allow="autoplay; picture-in-picture"
            allowFullScreen
            className="h-full w-full"
            style={{ opacity }}
        />
    );
}
