import { useEffect, useState } from "react";

export function useCurrentUrl() {
    const [currentUrl, setCurrentUrl] = useState<URL>(() => new URL(window.location.href));

    useEffect(() => {
        if (!window.navigation) {
            console.error("Navigation API not supported");
            return;
        }

        const handleNavigate = (e: NavigateEvent) => {
            setCurrentUrl(new URL(e.destination.url));
        };

        window.navigation.addEventListener("navigate", handleNavigate);

        return () => {
            window.navigation.removeEventListener("navigate", handleNavigate);
        };
    }, []);

    return currentUrl;
}
