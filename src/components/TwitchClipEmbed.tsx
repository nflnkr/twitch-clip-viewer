import { styled } from "@nextui-org/react";
import { TwitchClipMetadata } from "../types";


const MainContainer = styled("div", {
    width: "100%",
    flexGrow: 1,
    display: "flex",
    alignItems: "center",
    aspectRatio: "16 / 9"
});

const IframeContainer = styled("div", {
    position: "relative",
    width: "100%",
    height: "100%",
    "& iframe": {
        width: "100%",
        height: "100%",
    }
});

interface Props {
    clip: TwitchClipMetadata;
    autoplay?: boolean;
}

const hostname = window.location.hostname;

export default function TwitchClipEmbed({ clip, autoplay = false }: Props) {

    return (
        <MainContainer>
            <IframeContainer>
                <iframe
                    src={`${clip.embed_url}&parent=${hostname}&autoplay=${autoplay}`}
                    frameBorder="0"
                    allow=" autoplay; picture-in-picture"
                    allowFullScreen
                    title="Embedded twitch clip"
                />
            </IframeContainer>
        </MainContainer>
    );
}