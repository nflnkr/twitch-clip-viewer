import { ChevronsUpDownIcon } from "lucide-react";
import { useState, type Dispatch, type SetStateAction } from "react";
import { useTranslations } from "~/lib/locales";
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
    games: { id: string; name: string; box_art_url: string }[];
    selectedGame: string;
    setSelectedGame: Dispatch<SetStateAction<string>>;
}

export default function GameSelect({ disabled, games, selectedGame, setSelectedGame }: Props) {
    const [open, setOpen] = useState(false);
    const t = useTranslations();

    return (
        <Popover
            open={open}
            onOpenChange={setOpen}
        >
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    disabled={disabled}
                    className="grow justify-between"
                >
                    {selectedGame ? selectedGame : t("selectCategory")}
                    <ChevronsUpDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[22rem] p-0">
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
                                        value={game.name}
                                        onSelect={(currentValue) => {
                                            setSelectedGame((prev) => {
                                                return currentValue === prev ? "" : currentValue;
                                            });
                                            setOpen(false);
                                        }}
                                    >
                                        <img
                                            src={imgSrc}
                                            alt={game.name}
                                            className={`mr-2 h-[${gameImageHeight}px] w-[${gameImageWidth}px]`}
                                        />
                                        {game.name}
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
