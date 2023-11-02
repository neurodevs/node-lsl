interface OutletArgs {
	numChannels?: number
	sampleRate?: number
}

class Outlet {
	private numChannels: number
	private sampleRate: number

	public constructor({ numChannels = 1, sampleRate = 100 }: OutletArgs) {
		if (!isPositiveInteger(numChannels)) {
			throw new Error('Invalid numChannels: must be a positive integer!')
		}

		if (!isPositiveNumber(sampleRate)) {
			throw new Error('Invalid sampleRate: must be a positive number!')
		}

		this.numChannels = numChannels
		this.sampleRate = sampleRate
	}
}

const isPositiveNumber = (value: number) => {
	return value > 0
}

const isPositiveInteger = (value: number) => {
	return value > 0 && Number.isInteger(value)
}

export default Outlet
