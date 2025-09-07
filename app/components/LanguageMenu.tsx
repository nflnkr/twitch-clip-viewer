import { Button } from "~/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { useLocaleContext } from "~/lib/locale/locales";
import { cn } from "~/lib/utils/utils";
import { Globe } from "lucide-react";
import EnFlag from "./EnFlag";
import RuFlag from "./RuFlag";

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
