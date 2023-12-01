export function isStringInArray(value: string, array: readonly string[]) {
	return array.indexOf(value) !== -1
}

export function isGreaterThanOrEqualToZero(value: number): boolean {
	return value >= 0
}

export function isPositiveInteger(value: number): boolean {
	return Number.isInteger(value) && value > 0
}

export function isPositiveIntegerOrZero(value: number): boolean {
	return Number.isInteger(value) && value >= 0
}
