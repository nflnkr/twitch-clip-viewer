import { ChevronsUpDownIcon, X } from "lucide-react";
import { useState, type Dispatch, type SetStateAction } from "react";

import { useTranslations } from "~/lib/locale/locales";
import { Button } from "./ui/button";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "./ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";

const gameImageHeight = 44;
const gameImageWidth = Math.round(gameImageHeight * 0.75);

interface Props {
    disabled: boolean;
    games: { id: string; name: string; box_art_url: string; count: number }[];
    selectedGameId: string | null;
    setSelectedGameId: Dispatch<SetStateAction<string | null>>;
    onClearSelectedGameClick: () => void;
}

export default function GameSelect({
    disabled,
    games,
    selectedGameId,
    setSelectedGameId,
    onClearSelectedGameClick,
}: Props) {
    const [open, setOpen] = useState(false);
    const t = useTranslations();

    const selectedGame = games.find((game) => game.id === selectedGameId);

    return (
        <Popover
            open={open}
            onOpenChange={setOpen}
        >
            <div className="flex items-center">
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        disabled={disabled}
                        className="grow justify-between truncate rounded-r-none"
                    >
                        <span className="truncate">
                            {selectedGame ? selectedGame.name : t("selectCategory")}
                        </span>
                        <ChevronsUpDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </PopoverTrigger>
                <Button
                    variant="outline"
                    size="icon"
                    onClick={onClearSelectedGameClick}
                    className="h-full rounded-l-none border-l-0"
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
                                        onSelect={(currentValue) => {
                                            setSelectedGameId(currentValue);
                                            setOpen(false);
                                        }}
                                    >
                                        <img
                                            src={imgSrc}
                                            alt={game.name}
                                            className="aspect-[3/4] object-cover"
                                            style={{
                                                width: `${gameImageWidth}px`,
                                            }}
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
