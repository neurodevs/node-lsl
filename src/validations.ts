export function isStringInArray(value: string, array: readonly string[]) {
    return array.indexOf(value) !== -1
}

export function isGreaterThanOrEqualToZero(value: number) {
    return value >= 0
}

export function isPositiveInteger(value: number) {
    //@ts-ignore
    return Number.isInteger(value) && value > 0
}

export function isPositiveIntegerOrZero(value: number) {
    //@ts-ignore
    return Number.isInteger(value) && value >= 0
}
