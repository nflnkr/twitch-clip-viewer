import { createCanvas, loadImage } from "@napi-rs/canvas";
import { createServerOnlyFn } from "@tanstack/react-start";

export const composeImageGrid = createServerOnlyFn(async function ({
    urls,
    resultWidth,
    resultHeight,
    rows,
    cols,
    gap,
    padding,
}: {
    urls: string[];
    resultWidth: number;
    resultHeight: number;
    rows: number;
    cols: number;
    gap: number;
    padding: number;
}) {
    const maxSlots = rows * cols;
    const usedUrls = urls.slice(0, maxSlots);

    const canvas = createCanvas(resultWidth, resultHeight);
    const ctx = canvas.getContext("2d");

    ctx.fillStyle = "#581f7e";
    ctx.fillRect(0, 0, resultWidth, resultHeight);

    const totalGapX = gap * (cols - 1);
    const totalGapY = gap * (rows - 1);

    const availableW = resultWidth - padding * 2 - totalGapX;
    const availableH = resultHeight - padding * 2 - totalGapY;
    if (availableW <= 0 || availableH <= 0) {
        throw new Error("Result dimensions too small for given padding/gap/rows/cols");
    }

    const cellW = Math.floor(availableW / cols);
    const cellH = Math.floor(availableH / rows);

    const loadPromises = usedUrls.map(async (url) => {
        const res = await fetch(url);
        if (!res.ok) {
            throw new Error(`Failed to fetch image ${url}: ${res.status} ${res.statusText}`);
        }

        const arrayBuffer = await res.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        return loadImage(buffer);
    });

    const images = await Promise.allSettled(loadPromises);

    for (let idx = 0; idx < maxSlots; idx++) {
        const row = Math.floor(idx / cols);
        const col = idx % cols;
        const dx = padding + col * (cellW + gap);
        const dy = padding + row * (cellH + gap);

        const settled = images[idx];
        if (!settled || settled.status !== "fulfilled") {
            ctx.fillStyle = "#391452ff";
            ctx.fillRect(dx, dy, cellW, cellH);
            continue;
        }

        const img = settled.value;

        const imgW = img.width;
        const imgH = img.height;
        const targetW = cellW;
        const targetH = cellH;

        const scale = Math.max(targetW / imgW, targetH / imgH);
        const sWidth = targetW / scale;
        const sHeight = targetH / scale;

        const sx = Math.max(0, (imgW - sWidth) / 2);
        const sy = Math.max(0, (imgH - sHeight) / 2);

        ctx.drawImage(img, sx, sy, sWidth, sHeight, dx, dy, targetW, targetH);
    }

    return canvas.convertToBlob();
});
