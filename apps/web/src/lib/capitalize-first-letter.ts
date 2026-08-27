export function capitalizeFirstLetter(str: string) {
    if (!str) return str;

    const first = str[0].toUpperCase();

    return first + str.slice(1);
}
