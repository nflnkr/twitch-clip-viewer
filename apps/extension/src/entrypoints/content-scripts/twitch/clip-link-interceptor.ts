import { parseClipIdFromUrl, queueClipFromUrl, triggerFlight } from "~/shared/lib/clip-queue";
import { useClipLinkInterceptor } from "~/shared/lib/clip-link-interceptor";

export function initClipLinkInterceptor() {
    document.addEventListener(
        "click",
        (event) => {
            if (event.defaultPrevented) return;
            if (!useClipLinkInterceptor.getState().enabled) return;

            const target = event.target;
            if (!(target instanceof Element)) return;

            const link = target.closest<HTMLAnchorElement>("a");
            if (
                !link?.closest(
                    '[data-a-target="chat-line-message"], .chat-line__message, .video-chat__message, .ffz--chat-card',
                )
            )
                return;

            const href = link.getAttribute("href");
            if (!href || !parseClipIdFromUrl(href)) return;

            event.preventDefault();
            event.stopImmediatePropagation();

            if (event.clientX || event.clientY) {
                triggerFlight(event.clientX, event.clientY);
            } else if (link instanceof Element) {
                const rect = link.getBoundingClientRect();
                triggerFlight(rect.left + rect.width / 2, rect.top + rect.height / 2);
            }

            void queueClipFromUrl(href);
        },
        { capture: true },
    );
}
