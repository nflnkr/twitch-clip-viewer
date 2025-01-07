import pino from "pino";

if (!process.env.LOGTAIL_SOURCE_TOKEN)
    throw new Error("LOGTAIL_SOURCE_TOKEN env variable must be set");

const logtailTarget = {
    target: "@logtail/pino",
    options: {
        sourceToken: process.env.LOGTAIL_SOURCE_TOKEN,
    },
};

const pinoPrettyTarget = { target: "pino-pretty" };

const targets = process.env.NODE_ENV === "production" ? [logtailTarget] : [pinoPrettyTarget];

const transport = pino.transport({ targets });

export const logger = pino(transport);
