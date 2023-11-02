interface OutletArgs {
	numChannels: number
}

class Outlet {
	private numChannels: number

	public constructor({ numChannels }: OutletArgs) {
		if (numChannels <= 0 || !Number.isInteger(numChannels)) {
			throw new Error('Invalid numChannels: must be a positive integer!')
		}

		this.numChannels = numChannels
	}
}

export default Outlet
