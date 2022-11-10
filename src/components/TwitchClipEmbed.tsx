import { useEffect } from "react";
import styled from "styled-components/macro";
import { TwitchClipMetadata } from "../types";


const MainContainer = styled.div`
    width: 100%;
    align-self: center;
`;

const IframeContainer = styled.div`
    position: relative;
    width: 100%;
    padding-bottom: 56.25%;
    & iframe {
        position: absolute;
        width: 100%;
        height: 100%;
        top: 0;
        left: 0;
    }
`;

interface Props {
    clip: TwitchClipMetadata;
    autoplay?: boolean;
}

export default function TwitchClipEmbed({ clip, autoplay = false }: Props) {

    return (
        <MainContainer>
            <IframeContainer>
                <iframe
                    src={`${clip.embed_url}&parent=localhost&autoplay=${autoplay}`}
                    frameBorder="0"
                    allow=" autoplay; picture-in-picture"
                    allowFullScreen
                    title="Embedded twitch clip"
                />
            </IframeContainer>
        </MainContainer>
    );
}