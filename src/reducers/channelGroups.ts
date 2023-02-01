import { nanoid } from "nanoid";

export type ChannelGroup = {
    id: string;
    minViews: number;
    channels: string[];
};

type ChannelGroupsReducerAction =
    | { type: "addGroup", payload: { newChannels: string[]; }; }
    | { type: "deleteGroup", payload: { groupId: string; }; }
    | { type: "addChannels", payload: { groupId: string; newChannels: string[]; }; }
    | { type: "removeChannels", payload: { groupId: string; channels: string[]; }; }
    | { type: "mergeGroups", payload: { groupId1: string; groupId2: string; }; };

export default function channelGroupsReducer(state: ChannelGroup[], action: ChannelGroupsReducerAction) {
    let newChannelGroups: ChannelGroup[] = [];
    switch (action.type) {
        case "addGroup":
            return [
                ...state,
                {
                    id: nanoid(),
                    minViews: 50,
                    channels: action.payload.newChannels
                }
            ];
        case "deleteGroup":
            return [...state.filter(group => group.id !== action.payload.groupId)];
        case "addChannels":
            state.forEach(channelGroup => {
                if (channelGroup.id === action.payload.groupId) newChannelGroups.push({
                    ...channelGroup,
                    channels: [...channelGroup.channels, ...action.payload.newChannels]
                });
                else newChannelGroups.push(channelGroup);
            });
            break;
        case "removeChannels":
            state.forEach(channelGroup => {
                if (channelGroup.id === action.payload.groupId) newChannelGroups.push({
                    ...channelGroup,
                    channels: channelGroup.channels.filter(channel => !action.payload.channels.includes(channel))
                });
                else newChannelGroups.push(channelGroup);
            });
            break;
        case "mergeGroups":
            const groupsToMerge: ChannelGroup[] = [];
            let mergeIndex: number | null = null;
            state.forEach((channelGroup, index) => {
                if ([action.payload.groupId1, action.payload.groupId2].includes(channelGroup.id)) {
                    if (mergeIndex === null) mergeIndex = index;
                    groupsToMerge.push(channelGroup);
                }
                else newChannelGroups.push(channelGroup);
            });
            if (mergeIndex === null) throw new Error("Wrong merge index");
            const newGroup: ChannelGroup = {
                ...groupsToMerge[0],
                channels: [...groupsToMerge[0].channels, ...groupsToMerge[1].channels]
            };
            newChannelGroups.splice(mergeIndex, 0, newGroup);
            break;
    }
    return newChannelGroups;
}