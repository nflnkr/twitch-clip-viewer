import { css, styled, Text } from "@nextui-org/react";
import { FixedSizeList } from "react-window";
import AutoSizer from "react-virtualized-auto-sizer";
import { useEffect, useRef } from "react";
import { TwitchClipMetadata } from "../model/clips";


const CAROUSEL_HEIGHT = 140;
const CAROUSEL_ITEM_WIDTH = CAROUSEL_HEIGHT * 16 / 9;

const noScrollbars = css({
    scrollbarWidth: "thin",
    scrollbarColor: "transparent transparent",

    "&::-webkit-scrollbar": {
        width: "1px",
        display: "none",
    },

    "&::-webkit-scrollbar-track": {
        background: "transparent",
    },

    "&::-webkit-scrollbar-thumb": {
        backgroundColor: "transparent",
    }
});

const CarouselContainer = styled("div", {
    width: "100%",
    height: `${CAROUSEL_HEIGHT}px`,
    flexShrink: 0,
});

export default function ClipCarousel({ clips, currentClipIndex, handleCarouselItemClick }: {
    clips: TwitchClipMetadata[];
    currentClipIndex: number;
    handleCarouselItemClick: (newIndex: number) => void;
}) {
    const listContainerRef = useRef<HTMLDivElement>(null);

    useEffect(function scrollToNewIndex() {
        listContainerRef.current?.scrollTo({
            left: currentClipIndex * CAROUSEL_ITEM_WIDTH + (CAROUSEL_ITEM_WIDTH - listContainerRef.current.clientWidth) / 2,
            top: 0,
            behavior: "smooth",
        });
    }, [currentClipIndex]);

    useEffect(function attachWheelHandlers() {
        const cleanupFnRef: { current: (() => void) | null; } = { current: null };

        const scrollHandler = (e: globalThis.WheelEvent) => {
            if (!listContainerRef.current) return;

            e.preventDefault();
            listContainerRef.current.scrollBy({ left: e.deltaY });
        };

        // listContainerRef.current is null after first render because it is inside render prop, this is a workaround
        queueMicrotask(() => {
            if (!listContainerRef.current) return;

            listContainerRef.current.addEventListener("wheel", scrollHandler);
            cleanupFnRef.current = () => listContainerRef.current?.removeEventListener("wheel", scrollHandler);
        });
        return () => cleanupFnRef.current?.();
    });

    return (
        <CarouselContainer>
            <AutoSizer>
                {({ height, width }: { height: number, width: number; }) =>
                    <FixedSizeList
                        outerRef={listContainerRef}
                        height={height}
                        width={width}
                        itemCount={clips.length}
                        itemSize={CAROUSEL_ITEM_WIDTH}
                        itemData={{ clips, currentClipIndex, handleCarouselItemClick }}
                        layout="horizontal"
                        className={noScrollbars()}
                    >{CarouselColumn}</FixedSizeList>
                }
            </AutoSizer>
        </CarouselContainer>
    );
}

const CarouselItem = styled("div", {
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    padding: "2px 10px",
    overflowWrap: "anywhere",
    backgroundSize: "cover",
    backgroundRepeat: "no-repeat",
    backgroundPosition: "top",
    cursor: "pointer",
    borderRight: "1px solid black",
    borderTop: "1px solid black",
    borderBottom: "1px solid black",
});

const CarouselText = styled(Text, {
    fontSize: "$sm",
    textShadow: "0 0 3px black",
    userSelect: "none",
});

const Flex = styled("div", {
    display: "flex",
    justifyContent: "space-between",
});

function CarouselColumn({ data, index, style }: {
    data: {
        clips: TwitchClipMetadata[];
        currentClipIndex: number;
        handleCarouselItemClick: (newIndex: number) => void;
    };
    index: number;
    style: any;
}) {
    const clipData = data.clips[index];
    const isCurrentClip = index === data.currentClipIndex;

    return (
        <CarouselItem
            onClick={() => {
                if (!isCurrentClip) data.handleCarouselItemClick(index);
            }}
            style={{
                ...style,
                backgroundImage: `url(${clipData.thumbnail_url})`,
                boxShadow: isCurrentClip ?
                    "rgb(28 86 147 / 80%) 0px 40px 20px -20px inset, rgb(28 86 147 / 80%) 0px -40px 20px -20px inset"
                    :
                    "rgb(135 135 135 / 28%) 0px 0px 10px 0px inset",
            }}
        >
            <CarouselText>{clipData.title}</CarouselText>
            <Flex>
                <CarouselText>{clipData.broadcaster_name}</CarouselText>
                <CarouselText>{clipData.view_count}</CarouselText>
            </Flex>
        </CarouselItem>
    );
}