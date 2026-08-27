import { ReactNode } from "react";

import { Toggle } from "./ui/toggle";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

interface Props {
    pressed: boolean;
    onPressedChange: (value: boolean) => void;
    title: string;
    children: ReactNode;
}

function ToggleWithTooltip({ pressed, onPressedChange, title, children }: Props) {
    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <span>
                    <Toggle
                        pressed={pressed}
                        onPressedChange={onPressedChange}
                    >
                        {children}
                    </Toggle>
                </span>
            </TooltipTrigger>
            <TooltipContent>
                <p>{title}</p>
            </TooltipContent>
        </Tooltip>
    );
}

export default ToggleWithTooltip;
