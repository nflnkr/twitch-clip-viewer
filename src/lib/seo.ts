export const seo = ({
    title,
    url,
    description,
    keywords,
    image,
}: {
    title: string;
    url?: string;
    description?: string;
    image?: string;
    keywords?: string;
}) => {
    const tags = [
        { title },
        { name: "description", content: description },
        { name: "keywords", content: keywords },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: description },
        { name: "og:type", content: "website" },
        { name: "og:title", content: title },
        { name: "og:description", content: description },
        ...(image
            ? [
                  { name: "twitter:image", content: image },
                  { name: "twitter:card", content: "summary_large_image" },
                  { name: "og:image", content: image },
                  { name: "og:image:width", content: "1200" },
                  { name: "og:image:height", content: "630" },
              ]
            : []),
        ...(url
            ? [
                  { name: "og:url", content: url },
                  { name: "twitter:url", content: url },
              ]
            : []),
    ];

    return tags;
};
