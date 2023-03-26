import { Text, Link, styled } from "@nextui-org/react";
import { TwitchClipMetadata } from "../model/clips";
import { useAppStore } from "../stores/app";
import { useMediaQuery } from "../utils/hooks";


const ClipInfoContainer = styled("div", {
    display: "flex",
    flexDirection: "column",
    gap: "0.25em",
    p: "1em",
});

export default function ClipInfo({ clipMeta, filteredClips }: {
    clipMeta: TwitchClipMetadata;
    filteredClips: TwitchClipMetadata[];
}) {
    const currentClipIndex = useAppStore(state => state.currentClipIndex);
    const isHideViewed = useAppStore(state => state.isHideViewed);
    const isLandscape = useMediaQuery("(min-width: 1200px)");

    return (
        <ClipInfoContainer css={{
            maxWidth: isLandscape ? "24em" : undefined,
        }}>
            {isHideViewed ?
                <Text size="small">Remaining: {filteredClips.length - 1}</Text>
                :
                filteredClips.length > 0 && <Text size="small">{currentClipIndex + 1}/{filteredClips.length}</Text>
            }
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