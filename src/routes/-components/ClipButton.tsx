import { reatomComponent } from "@reatom/react";
import { Check } from "lucide-react";
import { ComponentPropsWithRef, ReactNode } from "react";

import { Button } from "~/components/ui/button";
import { smallClipButton } from "~/lib/store/atoms";
import { cn } from "~/lib/utils";

type Props = ComponentPropsWithRef<typeof Button> & {
    selected: boolean;
    fade: boolean;
    viewed: boolean;
    title: ReactNode;
    thumbnailUrl: string;
    leftText: string;
    rightText: ReactNode;
};

function ClipButton({
    selected,
    fade,
    viewed,
    title,
    thumbnailUrl,
    leftText,
    rightText,
    ...props
}: Props) {
    const small = smallClipButton();

    return (
        <Button
            variant="outline"
            {...props}
            className={cn(
                "border-accent flex h-full w-full flex-col items-stretch gap-0 overflow-hidden border-2 p-0 transition-opacity",
                props.className,
                small && "flex-row",
                fade && "border-accent/50 opacity-30",
                selected && "border-accent dark:border-accent",
            )}
        >
            <img
                src={thumbnailUrl}
                alt={title}
                loading="lazy"
                className={cn("min-h-0 grow object-cover", small && "w-1/3")}
            />
            <div className={cn("flex flex-col gap-2 p-2", small && "w-2/3")}>
                <div className="flex items-center gap-1">
                    {viewed && <Check />}
                    <p
                        className="self-start truncate tracking-tighter"
                        title={title}
                    >
                        {title}
                    </p>
                </div>
                <div className="flex justify-between gap-2">
                    <p
                        className="truncate"
                        title={leftText}
                    >
                        {leftText}
                    </p>
                    {rightText}
                </div>
            </div>
        </Button>
    );
}

export default reatomComponent(ClipButton);
