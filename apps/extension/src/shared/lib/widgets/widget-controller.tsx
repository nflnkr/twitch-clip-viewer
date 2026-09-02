import { createContext, StrictMode, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";

import { WidgetRoot } from "./WidgetRoot";

interface WidgetContext {
    targetElement: HTMLElement;
    rootElement: HTMLElement;
}

interface WidgetConfig {
    id: string;
    selector: string;
    insertPosition: "before" | "after" | "prepend" | "append";
    render: (context: WidgetContext) => ReactNode;
}

export const WidgetContext = createContext<WidgetContext>(null!);

export function widgetOptions(widgetConfig: WidgetConfig) {
    return widgetConfig;
}

class WidgetController {
    private widgets = new Map<string, WidgetConfig>();
    private observer: MutationObserver | null = null;

    public registerWidget(widgetConfig: WidgetConfig) {
        this.widgets.set(widgetConfig.id, widgetConfig);

        return this;
    }

    public start() {
        // initial mount
        const now = performance.now();
        this.widgets.forEach((widget) => {
            document.querySelectorAll<HTMLElement>(widget.selector).forEach((element) => {
                this.mountWidget(widget, element);
            });
        });
        if (import.meta.env.DEV) this.flushLogs(now);

        const observer = new MutationObserver((mutations) => {
            const now = performance.now();

            for (const mutation of mutations) {
                // mount on class added
                if (mutation.type === "attributes" && mutation.attributeName === "class") {
                    const target = mutation.target;
                    if (target instanceof HTMLElement) {
                        this.widgets.forEach((widget) => {
                            if (target.matches(widget.selector)) this.mountWidget(widget, target);
                        });

                        continue;
                    }
                }

                // unmount from removed nodes
                for (const removedNode of mutation.removedNodes) {
                    if (!(removedNode instanceof HTMLElement)) continue;

                    if (removedNode.matches("[data-widget-attached]"))
                        this.unmountWidget(removedNode);

                    removedNode
                        .querySelectorAll<HTMLElement>("[data-widget-attached]")
                        .forEach((element) => {
                            this.unmountWidget(element);
                        });
                }

                // mount to added nodes
                for (const addedNode of mutation.addedNodes) {
                    if (!(addedNode instanceof HTMLElement)) continue;

                    this.widgets.forEach((widget) => {
                        if (addedNode.matches(widget.selector)) this.mountWidget(widget, addedNode);

                        addedNode
                            .querySelectorAll<HTMLElement>(widget.selector)
                            .forEach((element) => {
                                this.mountWidget(widget, element);
                            });

                        for (
                            let ancestor = addedNode.parentElement;
                            ancestor && ancestor !== document.body;
                            ancestor = ancestor.parentElement
                        ) {
                            if (ancestor.matches(widget.selector))
                                this.mountWidget(widget, ancestor);
                        }
                    });
                }
            }

            if (import.meta.env.DEV) this.flushLogs(now, mutations);
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributeFilter: ["class"],
        });
    }

    private mountWidget(widget: WidgetConfig, targetElement: HTMLElement) {
        if (targetElement.__widgetsMeta) {
            for (const widgetMeta of targetElement.__widgetsMeta) {
                // skip mounting if widget is already attached to this target node
                if (widgetMeta.widgetId === widget.id) return;
            }
        }

        if (import.meta.env.DEV) this.logMount(widget.id, targetElement);

        const rootElement = document.createElement("div");

        rootElement.dataset.widgetId = widget.id;
        targetElement.dataset.widgetAttached = "true";

        const reactRoot = createRoot(rootElement);

        targetElement.__widgetsMeta ??= [];
        targetElement.__widgetsMeta.push({
            widgetId: widget.id,
            reactRoot,
            rootElement,
        });

        // attach node
        targetElement[widget.insertPosition](rootElement);

        const context = { targetElement, rootElement };

        reactRoot.render(
            <StrictMode>
                <WidgetContext value={context}>
                    <WidgetRoot>{widget.render(context)}</WidgetRoot>
                </WidgetContext>
            </StrictMode>,
        );
    }

    private unmountWidget(target: HTMLElement) {
        if (!target.__widgetsMeta) {
            throw new Error(
                "Error unmounting widget, target element does not have '__widgetData' property",
            );
        }

        for (const widgetData of target.__widgetsMeta) {
            const { widgetId, reactRoot, rootElement } = widgetData;

            if (import.meta.env.DEV) this.logUnmount(widgetId);

            reactRoot.unmount();
            if (rootElement.parentNode) rootElement.parentNode.removeChild(rootElement);
        }
    }

    public stop() {
        this.observer?.disconnect();
        this.observer = null;
    }

    // dev logging
    private mountedWidgets: Record<string, HTMLElement[]> = {};
    private unmountedWidgetIds: string[] = [];
    private logMount(widgetId: string, addedNode: HTMLElement) {
        const mountedWidgetElements = this.mountedWidgets[widgetId];
        if (mountedWidgetElements) mountedWidgetElements.push(addedNode);
        else this.mountedWidgets[widgetId] = [addedNode];
    }
    private logUnmount(widgetId: string) {
        this.unmountedWidgetIds.push(widgetId);
    }
    private flushLogs(now?: number, mutations?: MutationRecord[]) {
        if (!Object.values(this.mountedWidgets).length && !this.unmountedWidgetIds.length) return;

        console.log(
            `%cWidget controller ${mutations ? "mutation" : "initial"} pass: ${now ? `${(performance.now() - now).toFixed(1)}ms` : ""}`,
            "color: #cf3aa0; font-weight: bold",
            {
                mutations,
                mountedWidgets: Object.values(this.mountedWidgets).length
                    ? this.mountedWidgets
                    : null,
                unmountedWidgets: this.unmountedWidgetIds.length ? this.unmountedWidgetIds : null,
            },
        );
        this.mountedWidgets = {};
        this.unmountedWidgetIds = [];
    }
}

declare global {
    interface HTMLElement {
        __widgetsMeta?: {
            widgetId: string;
            reactRoot: Root;
            rootElement: HTMLElement;
        }[];
    }
}

export const widgetController = new WidgetController();
