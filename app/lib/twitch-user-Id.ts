import axios from "axios";

import type { TwitchUserMetadata } from "~/model/twitch";
import { logger } from "./logger";
import { twitchAuthToken } from "./twitch-auth-token";

export class TwitchUserId {
    private getTwitchAuthData: () => Promise<{ authToken: string; clientId: string }>;
    private idToNameMap = new Map<number, { username: string; expiresAt: number }>();
    private readonly EXPIRATION_TIME = 1000 * 3600 * 24;

    constructor(getTwitchAuthData: () => Promise<{ authToken: string; clientId: string }>) {
        this.getTwitchAuthData = getTwitchAuthData;
    }

    async getUsernameById(id: number) {
        const user = this.idToNameMap.get(id);
        if (user && user.expiresAt > Date.now()) return user.username;

        const username = await this.fetchBroadcasterName(id);
        if (username === null) {
            this.idToNameMap.delete(id);
            return null;
        }

        this.idToNameMap.set(id, {
            username: username,
            expiresAt: Date.now() + this.EXPIRATION_TIME,
        });

        return username;
    }

    async getIdByUsername(username: string): Promise<number | null> {
        for (const [id, user] of this.idToNameMap) {
            if (user.username === username && user.expiresAt > Date.now()) return id;
        }

        const id = await this.fetchBroadcasterId(username);
        if (id === null) return null;

        this.idToNameMap.set(id, {
            username,
            expiresAt: Date.now() + this.EXPIRATION_TIME,
        });

        return id;
    }

    private async fetchBroadcasterId(username: string): Promise<number | null> {
        const url = `https://api.twitch.tv/helix/users?login=${username}`;
        const authData = await this.getTwitchAuthData();

        try {
            const response = await axios<{ data: TwitchUserMetadata[] }>(url, {
                headers: {
                    Authorization: "Bearer " + authData.authToken,
                    "Client-Id": authData.clientId,
                },
            });

            const id = Number(response.data.data[0]?.id);
            if (!id) return null;

            return id;
        } catch (err) {
            logger.error({ err, username }, "Error fetching user id");

            return null;
        }
    }

    private async fetchBroadcasterName(id: number): Promise<string | null> {
        const url = `https://api.twitch.tv/helix/users?id=${id}`;
        const authData = await this.getTwitchAuthData();

        try {
            const response = await axios(url, {
                headers: {
                    Authorization: "Bearer " + authData.authToken,
                    "Client-Id": authData.clientId,
                },
            });

            const username = response.data.data[0]?.display_name;
            if (!username) throw new Error("display_name not found in user metadata");

            return username.toLowerCase();
        } catch (err) {
            logger.error(err, "Error fetching username");

            return null;
        }
    }
}

export const twitchUserId = new TwitchUserId(() => twitchAuthToken.getAuthData());
