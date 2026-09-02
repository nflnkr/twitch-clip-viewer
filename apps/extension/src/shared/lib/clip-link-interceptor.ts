import { create } from "zustand";

interface ClipLinkInterceptorState {
    enabled: boolean;
}

export const useClipLinkInterceptor = create<ClipLinkInterceptorState>(() => ({
    enabled: true,
}));

export function setClipLinkInterceptorEnabled(enabled: boolean): void {
    useClipLinkInterceptor.setState({ enabled });
}
