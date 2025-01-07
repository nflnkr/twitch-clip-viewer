import { useEffect, useState } from "react";

export function useDebouncedValue<TValue>(value: TValue, delay: number) {
    const [state, setState] = useState(value);

    useEffect(() => {
        const t = setTimeout(setState, delay, value);

        return () => {
            clearTimeout(t);
        };
    }, [value, delay]);

    return state;
}
