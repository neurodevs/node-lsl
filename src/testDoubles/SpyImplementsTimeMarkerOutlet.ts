import { DurationMarker, TimeMarkerOutlet } from '../nodeLsl.types'

export default class SpyImplementsTimeMarkerOutlet implements TimeMarkerOutlet {
	public pushMarkersCalls: DurationMarker[][]
	public pushSampleCalls: string[][]
	public numStopCalls: number
	public numDestroyCalls: number

	public static TimeMarkerOutlet() {
		return new this()
	}

	protected constructor() {
		this.pushMarkersCalls = []
		this.pushSampleCalls = []
		this.numStopCalls = 0
		this.numDestroyCalls = 0
	}

	public async pushMarkers(markers: DurationMarker[]) {
		this.pushMarkersCalls.push(markers)
	}

	public pushSample(sample: string[]) {
		this.pushSampleCalls.push(sample)
	}

	public stop() {
		this.numStopCalls++
	}

	public destroy() {
		this.numDestroyCalls++
	}

	public resetMock() {
		this.pushMarkersCalls = []
		this.pushSampleCalls = []
		this.numStopCalls = 0
		this.numDestroyCalls = 0
	}
}
