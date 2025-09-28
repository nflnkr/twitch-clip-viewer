import { motion } from "motion/react";

const hostname = globalThis.location?.hostname;

interface Props {
    autoplay: boolean;
    embedUrl: string;
}

export default function TwitchClipEmbed({ autoplay, embedUrl }: Props) {
    if (!hostname) return <p className="text-3xl">No clips</p>;

    return (
        <motion.iframe
            src={`${embedUrl}&parent=${hostname}&autoplay=${autoplay}`}
            allow="autoplay; picture-in-picture"
            allowFullScreen
            className="h-full w-full"
            initial={{
                opacity: 0,
            }}
            animate={{
                opacity: 1,
                transition: { delay: 0.7 },
            }}
        />
    );
}
