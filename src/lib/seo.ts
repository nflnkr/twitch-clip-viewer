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
        { property: "og:type", content: "website" },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        ...(image
            ? [
                  { name: "twitter:image", content: image },
                  { name: "twitter:card", content: "summary_large_image" },
                  { property: "og:image", content: image },
                  { property: "og:image:width", content: "1200" },
                  { property: "og:image:height", content: "630" },
              ]
            : []),
        ...(url
            ? [
                  { property: "og:url", content: url },
                  { name: "twitter:url", content: url },
              ]
            : []),
    ];

    return tags;
};
