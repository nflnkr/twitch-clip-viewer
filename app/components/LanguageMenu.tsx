import { Globe } from "lucide-react";
import { Button } from "~/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { useLocaleContext } from "~/lib/locales";
import { cn } from "~/lib/utils";
import RuFlag from "./RuFlag";
import EnFlag from "./EnFlag";

export default function LanguageMenu() {
    const { locale, setLocale } = useLocaleContext();

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="outline"
                    size="icon"
                >
                    <Globe />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56">
                <DropdownMenuGroup>
                    <DropdownMenuItem
                        onClick={() => setLocale("en")}
                        className={cn({ "font-bold": locale === "en" })}
                    >
                        <EnFlag />
                        English
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        onClick={() => setLocale("ru")}
                        className={cn({ "font-bold": locale === "ru" })}
                    >
                        <RuFlag />
                        Русский
                    </DropdownMenuItem>
                </DropdownMenuGroup>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
