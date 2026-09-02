import { loadRobotoFont } from "~/shared/lib/load-roboto-font";

import { initClipLinkInterceptor } from "./clip-link-interceptor";
import { initWidgets } from "./setup";

if (document.body.dataset.ttvClipViewerExtensionLoaded !== "true") {
    loadRobotoFont();

    initWidgets();

    initClipLinkInterceptor();

    document.body.dataset.ttvClipViewerExtensionLoaded = "true";
} else {
    console.error("TTV Clip Viewer extension already loaded");
}
