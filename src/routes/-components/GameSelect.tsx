import { reatomComponent } from "@reatom/react";
import { X } from "lucide-react";
import { useState } from "react";

import { Button } from "~/components/ui/button";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "~/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "~/components/ui/popover";
import { useTranslations } from "~/lib/locale/locales";
import { selectedGameId } from "~/lib/store/atoms";
import { stopAutonextTimer } from "~/lib/store/autonext";

const gameImageHeight = 80;
const gameImageWidth = Math.round(gameImageHeight * 0.75);
const noGameBoxArtUrl = `https://static-cdn.jtvnw.net/ttv-boxart/66082-${gameImageWidth}x${gameImageHeight}.jpg`;

interface Props {
    disabled: boolean;
    games: { id: string; name: string; box_art_url: string; count: number }[];
}

function GameSelect({ disabled, games }: Props) {
    const [open, setOpen] = useState(false);
    const t = useTranslations();

    const selectedGame = games.find((game) => game.id === selectedGameId());

    const selectedGameImgSrc =
        selectedGame?.box_art_url.replace(
            "{width}x{height}",
            `${gameImageWidth}x${gameImageHeight}`,
        ) ?? noGameBoxArtUrl;

    return (
        <Popover
            open={open}
            onOpenChange={setOpen}
        >
            <div className="flex h-20 items-center self-end">
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        disabled={disabled}
                        className="aspect-3/4 h-full rounded-r-none bg-cover dark:hover:opacity-70"
                        style={{
                            backgroundImage: `url(${selectedGameImgSrc})`,
                        }}
                    />
                </PopoverTrigger>
                <Button
                    size="xs"
                    variant="outline"
                    onClick={() => {
                        selectedGameId.set(null);
                        stopAutonextTimer();
                    }}
                    className="h-full w-6 rounded-l-none"
                >
                    <X />
                </Button>
            </div>
            <PopoverContent className="w-[20rem] p-0">
                <Command>
                    <CommandInput placeholder={t("searchCategory")} />
                    <CommandList>
                        <CommandEmpty>{t("notFound")}</CommandEmpty>
                        <CommandGroup>
                            {games.map((game) => {
                                const imgSrc = game.box_art_url.replace(
                                    "{width}x{height}",
                                    `${gameImageWidth}x${gameImageHeight}`,
                                );

                                return (
                                    <CommandItem
                                        key={game.id}
                                        value={game.id}
                                        keywords={[game.name]}
                                        onSelect={(currentValue) => {
                                            selectedGameId.set(currentValue);
                                            setOpen(false);
                                        }}
                                    >
                                        <img
                                            src={imgSrc}
                                            alt={game.name}
                                            className="aspect-3/4 w-8 object-cover"
                                        />
                                        <p>{game.name}</p>
                                        <p className="ml-auto">{game.count}</p>
                                    </CommandItem>
                                );
                            })}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}

export default reatomComponent(GameSelect);
