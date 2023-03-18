import { useMemo } from "react";
import TwitchClipEmbed from "../components/TwitchClipEmbed";
import { Button, Text, Loading, styled, keyframes } from "@nextui-org/react";
import { ImArrowLeft2, ImArrowRight2 } from "react-icons/im";
import ClipCarousel from "../components/ClipCarousel";
import { setCurrentClipIndex, setIsInfinitePlay, useAppStore } from "../stores/app";
import { TwitchClipMetadata } from "../model/clips";
import okayegImage from "../images/okayeg.png";


const CenterContentBox = styled("div", {
    display: "flex",
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: "1em",
});

const ClipContainer = styled("div", {
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    flexGrow: 1,
    maxHeight: "100vh",
    minHeight: "160px",
});

const ButtonsContainer = styled("div", {
    display: "flex",
    width: "100%",
    gap: "1px",
});

const ControlsButton = styled(Button, {
    backgroundColor: "$primaryDark",
    flex: "1 1 50%",
    borderRadius: 0,
    minWidth: "120px",
});

const sliderAnimation = keyframes({
    "0%": { width: "0%" },
    "100%": { width: "100%" }
});

const ClipProgressBar = styled("div", {
    height: "4px",
    backgroundColor: "$blue300",
});

export default function ClipBox({ nextClip, prevClip, filteredClips, clipMeta }: {
    nextClip: () => void;
    prevClip: () => void;
    filteredClips: TwitchClipMetadata[];
    clipMeta: TwitchClipMetadata | undefined;
}) {
    const channels = useAppStore(state => state.channels);
    const currentClipIndex = useAppStore(state => state.currentClipIndex);
    const isClipAutoplay = useAppStore(state => state.isClipAutoplay);
    const isInfinitePlay = useAppStore(state => state.isInfinitePlay);
    const isShowCarousel = useAppStore(state => state.isShowCarousel);
    const infinitePlayBuffer = useAppStore(state => state.infinitePlayBuffer);

    // disable rerender on isAutoplay change
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const clip = useMemo(() => clipMeta ? <TwitchClipEmbed key={Math.random()} clip={clipMeta} autoplay={isClipAutoplay} /> : null, [clipMeta]);

    const clipProgressBar = useMemo(() => (
        clipMeta && isInfinitePlay ?
            <ClipProgressBar
                key={clipMeta.id + isInfinitePlay.toString()}
                css={{
                    animation: `${sliderAnimation} ${(clipMeta.duration + infinitePlayBuffer).toFixed(0)}s linear`,
                }}
            /> : null
        // eslint-disable-next-line react-hooks/exhaustive-deps
    ), [clipMeta, isInfinitePlay]);

    const handleCarouselItemClick = (newIndex: number) => {
        setCurrentClipIndex(newIndex);
        setIsInfinitePlay(false);
    };

    return (
        <ClipContainer>
            {filteredClips.length && clipMeta ?
                <>
                    {clip}
                    {isShowCarousel &&
                        <ClipCarousel
                            clips={filteredClips}
                            currentClipIndex={currentClipIndex}
                            handleCarouselItemClick={handleCarouselItemClick}
                        />
                    }
                    <ButtonsContainer>
                        <ControlsButton
                            size="md"
                            disabled={currentClipIndex === 0}
                            onPress={prevClip}
                            icon={<ImArrowLeft2 />}
                        />
                        <ControlsButton
                            size="md"
                            disabled={currentClipIndex >= filteredClips.length - 1}
                            onPress={nextClip}
                            icon={<ImArrowRight2 />}
                        />
                    </ButtonsContainer>
                    {clipProgressBar}
                </>
                :
                channels.length ?
                    <CenterContentBox><Loading size="xl" /></CenterContentBox>
                    :
                    <CenterContentBox>
                        <Text h2>No channels</Text>
                        <img alt="okayeg" src={okayegImage} />
                    </CenterContentBox>
            }
        </ClipContainer>
    );
}