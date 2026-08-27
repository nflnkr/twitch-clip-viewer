import pino, { SerializedError } from "pino";

import { env } from "~/env";

const logtailTarget = {
    target: "@logtail/pino",
    options: {
        sourceToken: env.LOGTAIL_SOURCE_TOKEN,
    },
};

const pinoPrettyTarget = { target: "pino-pretty" };

const targets = process.env.NODE_ENV === "production" ? [logtailTarget] : [pinoPrettyTarget];

const transport = pino.transport({ targets });

export const logger = pino(
    {
        serializers: {
            err: pino.stdSerializers.wrapErrorSerializer(axiosErrorSerializer),
        },
    },
    transport,
);

function axiosErrorSerializer(error: SerializedError) {
    if (error.name === "AxiosError") {
        const toJSON = error.toJSON.bind(error);
        error.toJSON = () => {
            const json = toJSON();

            delete json.config;

            return {
                ...json,
                responseData: error.response?.data,
            };
        };
    }

    return error;
}
