import type { TwitchClipMetadata } from "~/model/twitch";

const hostname = globalThis.location?.hostname;

interface Props {
    clip: TwitchClipMetadata | undefined;
    noChannels: boolean;
    autoplay: boolean;
}

export default function TwitchClipEmbed({ clip, autoplay, noChannels }: Props) {
    if (noChannels) return <p className="text-3xl">No Channels</p>;
    if (!clip || !hostname) return <p className="text-3xl">No clips</p>;

    return (
        <iframe
            src={`${clip.embed_url}&parent=${hostname}&autoplay=${autoplay}`}
            allow="autoplay; picture-in-picture"
            allowFullScreen
            title="Embedded twitch clip"
            className="h-full w-full"
        />
    );
}
