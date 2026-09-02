import { widgetController } from "~/shared/lib/widgets/widget-controller";
import { clipViewerWidgetOptions } from "~/widgets/clip-viewer/widget";
import { devtoolsWidgetOptions } from "~/widgets/devtools/widget";

export function initWidgets() {
    if (import.meta.env.DEV) widgetController.registerWidget(devtoolsWidgetOptions);

    widgetController.registerWidget(clipViewerWidgetOptions).start();
}
