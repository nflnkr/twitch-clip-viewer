import { ChannelGroup } from "../model/channelgroup";
import { Text, Badge, Card, Button } from "@nextui-org/react";
import { removeChannelGroup, setSelectedChannelGroupIndex } from "../stores/app";
import { IoMdClose } from "react-icons/io";


interface Props {
    channelGroup: ChannelGroup;
    index: number;
    isSelected?: boolean;
}

export default function ChannelGroupItem({ channelGroup, index, isSelected }: Props) {

    return (
        <Card
            isHoverable
            isPressable
            variant="bordered"
            onPress={() => setSelectedChannelGroupIndex(index)}
            css={{
                boxShadow: isSelected ? "rgb(89 140 203 / 10%) 0px 2px 10px 0px" : undefined,
            }}
        >
            <Card.Header css={{
                py: "2px",
                px: "8px",
                backgroundColor: isSelected ? "$primaryDark" : undefined,
            }}>
                <Text size="small">Min views: {channelGroup.minViews}</Text>
                {channelGroup.titleFilter &&
                    <Text
                        size="small"
                        css={{
                            maxWidth: "18em",
                            overflow: "hidden",
                            whiteSpace: "nowrap",
                        }}
                    >, Filter: {channelGroup.titleFilter}</Text>
                }
                <Button
                    icon={<IoMdClose />}
                    onPress={() => removeChannelGroup(channelGroup.id)}
                    css={{
                        ml: "auto",
                        height: "20px",
                        minWidth: "20px",
                        width: "20px",
                        backgroundColor: "rgb(0 0 0 / 0)",
                        color: "rgba(255, 255, 255, 0.5)",
                        "&:hover": {
                            color: "rgba(255, 255, 255, 0.9)",
                        }
                    }}
                />
            </Card.Header>
            <Card.Body css={{
                p: "4px",
                backgroundColor: "#26262e",
                flexWrap: "wrap",
                flexDirection: "row",
                gap: "2px",
            }}>
                {channelGroup.channels.map(channel => (
                    <Badge
                        color="secondary"
                        key={`${channelGroup.id}-${channel}`}
                        size="sm"
                    >{channel}</Badge>
                ))}
            </Card.Body>
        </Card>
    );
}