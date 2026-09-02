import axios from "axios";

function requireEnv(name: string, value: string | undefined): string {
    if (!value) {
        throw new Error(`Missing environment variable: ${name}`);
    }

    return value;
}

export class TwitchAuthToken {
    private readonly clientId: string;
    private readonly clientSecret: string;
    authToken: string | null = null;
    private authTokenExpiresAt = 0;

    constructor(clientId: string, clientSecret: string) {
        this.clientId = clientId;
        this.clientSecret = clientSecret;
    }

    async getAuthData() {
        if (Date.now() > this.authTokenExpiresAt) {
            await this.fetchAuthToken();
        }

        if (!this.authToken) {
            console.error("No auth token after fetching");

            throw new Error("No auth token after fetching");
        }

        return {
            authToken: this.authToken,
            clientId: this.clientId,
        };
    }

    private async fetchAuthToken() {
        try {
            const response = await axios.post<{
                access_token: string;
                expires_in: number;
                token_type: string;
            }>("https://id.twitch.tv/oauth2/token", {
                client_id: this.clientId,
                client_secret: this.clientSecret,
                grant_type: "client_credentials",
            });

            this.authToken = response.data.access_token;
            this.authTokenExpiresAt = (response.data.expires_in - 3600) * 1000 + Date.now();
        } catch (err) {
            this.authToken = null;

            console.error("Error getting auth token", err);
        }
    }
}

export const twitchAuthToken = new TwitchAuthToken(
    requireEnv("TWITCH_API_CLIENT_ID", process.env.TWITCH_API_CLIENT_ID),
    requireEnv("TWITCH_API_CLIENT_SECRET", process.env.TWITCH_API_CLIENT_SECRET),
);
