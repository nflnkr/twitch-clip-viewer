import { Text, Link, styled } from "@nextui-org/react";
import { TwitchClipMetadata } from "../model/clips";
import { useMediaQuery } from "../utils/hooks";


const ClipInfoContainer = styled("div", {
    display: "flex",
    flexDirection: "column",
    gap: "0.25em",
});

export default function ClipInfo({ clipMeta }: {
    clipMeta: TwitchClipMetadata;
}) {
    const isLandscape = useMediaQuery("(min-width: 1200px)");

    return (
        <ClipInfoContainer css={{
            marginTop: isLandscape ? "2em" : undefined,
            maxWidth: isLandscape ? "22em" : undefined,
        }}>
            <Text h3 css={{ overflowWrap: "anywhere" }}>{clipMeta.title}</Text>
            <Link
                target="_blank"
                rel="noopener noreferrer"
                color="secondary"
                href={`https://twitch.tv/${clipMeta.broadcaster_name.toLowerCase()}`}
            >
                {clipMeta.broadcaster_name}
            </Link>
            <Text>Views: {clipMeta.view_count}</Text>
            <Text>Author: {clipMeta.creator_name}</Text>
            <Text>Date: {new Date(clipMeta.created_at).toLocaleDateString()}</Text>
        </ClipInfoContainer>
    );
}