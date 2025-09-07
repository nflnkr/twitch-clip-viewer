import { env } from "~/env";
import pino from "pino";

const logtailTarget = {
    target: "@logtail/pino",
    options: {
        sourceToken: env.LOGTAIL_SOURCE_TOKEN,
    },
};

const pinoPrettyTarget = { target: "pino-pretty" };

const targets = process.env.NODE_ENV === "production" ? [logtailTarget] : [pinoPrettyTarget];

const transport = pino.transport({ targets });

export const logger = pino(transport);
