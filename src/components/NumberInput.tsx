import { ChevronDown, ChevronUp } from "lucide-react";
import { useEffect, useEffectEvent, useRef } from "react";
import { NumericFormat, type NumericFormatProps } from "react-number-format";

import { Button } from "./ui/button";
import { Input } from "./ui/input";

export interface NumberInputProps extends Omit<NumericFormatProps, "value" | "onValueChange"> {
    stepper?: number;
    min?: number;
    max?: number;
    value: number;
    onValueChange: (prevState: number) => void;
}

export function NumberInput({
    stepper,
    min = -Infinity,
    max = Infinity,
    onValueChange,
    value,
    ...props
}: NumberInputProps) {
    const ref = useRef<HTMLInputElement>(null);

    const handleIncrement = () => {
        onValueChange(Math.min(value + (stepper ?? 1), max));
    };

    const handleDecrement = () => {
        onValueChange(Math.max(value - (stepper ?? 1), min));
    };

    const handleIncrementEvent = useEffectEvent(handleIncrement);
    const handleDecrementEvent = useEffectEvent(handleDecrement);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (document.activeElement === ref.current) {
                if (e.key === "ArrowUp") {
                    handleIncrementEvent();
                } else if (e.key === "ArrowDown") {
                    handleDecrementEvent();
                }
            }
        };

        window.addEventListener("keydown", handleKeyDown);

        return () => {
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, []);

    const handleChange = (values: { value: string; floatValue: number | undefined }) => {
        const newValue = values.floatValue === undefined ? undefined : values.floatValue;

        if (newValue === undefined) return;

        onValueChange(newValue);
    };

    const handleBlur = () => {
        if (value < min) {
            onValueChange(min);
        } else if (value > max) {
            onValueChange(max);
        }
    };

    return (
        <div className="flex grow items-center">
            <NumericFormat
                value={value}
                onValueChange={handleChange}
                allowNegative={min < 0}
                valueIsNumericString
                onBlur={handleBlur}
                max={max}
                min={min}
                customInput={Input}
                className="relative h-10 [appearance:textfield] rounded-r-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                getInputRef={ref}
                {...props}
            />
            <div className="flex flex-col">
                <Button
                    aria-label="Increase value"
                    className="border-input h-5 rounded-l-none rounded-br-none border-b-[0.5px] border-l-0 px-2.25! focus-visible:relative"
                    variant="outline"
                    size="icon"
                    onClick={handleIncrement}
                    disabled={value === max || props.disabled}
                >
                    <ChevronUp />
                </Button>
                <Button
                    aria-label="Decrease value"
                    className="border-input h-5 rounded-l-none rounded-tr-none border-t-[0.5px] border-l-0 px-2.25! focus-visible:relative"
                    variant="outline"
                    size="icon"
                    onClick={handleDecrement}
                    disabled={value === min || props.disabled}
                >
                    <ChevronDown />
                </Button>
            </div>
        </div>
    );
}
