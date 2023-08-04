import { Text, Link, styled, Loading } from "@nextui-org/react";
import { TwitchClipMetadata } from "../model/clips";
import { setAdjacentDaysDate, useAppStore } from "../stores/app";
import { useMediaQuery } from "../utils/hooks";


const ClipInfoContainer = styled("div", {
    display: "flex",
    flexDirection: "column",
    gap: "0.25em",
    p: "1em",
});

const ClipAmountBox = styled("div", {
    display: "flex",
    gap: "8px",
    alignItems: "center",
});

export default function ClipInfo({ clipMeta, filteredClips }: {
    clipMeta?: TwitchClipMetadata;
    filteredClips: TwitchClipMetadata[];
}) {
    const currentClipIndex = useAppStore(state => state.currentClipIndex);
    const isLoading = useAppStore(state => state.isLoading);
    const isLandscape = useMediaQuery("(min-width: 1200px)");

    return (
        <ClipInfoContainer css={{
            maxWidth: isLandscape ? "24em" : undefined,
        }}>
            {clipMeta ?
                <>
                    <ClipAmountBox>
                        {filteredClips.length > 0 && <Text size="small">{currentClipIndex + 1}/{filteredClips.length}</Text>}
                        {isLoading && <Loading size="xs" />}
                    </ClipAmountBox>
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
                    <Text
                        title="Show clips within that day ±1"
                        onClick={() => setAdjacentDaysDate(new Date(clipMeta.created_at).getTime())}
                        css={{
                            textDecoration: "underline",
                            cursor: "pointer",
                            alignSelf: "start",
                        }}
                    >Date: {new Date(clipMeta.created_at).toLocaleDateString()}</Text>
                </>
                :
                isLoading && <Loading size="xs" />
            }
        </ClipInfoContainer>
    );
}