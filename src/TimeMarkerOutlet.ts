import LslOutletImpl, { LslOutletOptions } from './LslOutlet'

export default class TimeMarkerOutlet extends LslOutletImpl {
	public static Outlet(options?: Partial<LslOutletOptions>) {
		const defaultOptions = {
			name: 'Time markers',
			type: 'Markers',
			channelNames: ['Markers'],
			sampleRate: 0,
			channelFormat: 'string',
			sourceId: 'time-markers',
			manufacturer: 'N/A',
			unit: 'N/A',
			chunkSize: 0,
			maxBuffered: 0,
		} as LslOutletOptions
		return new (this.Class ?? this)({ ...defaultOptions, ...options })
	}

	public async pushMarkers(markers: DurationMarker[]) {
		for (let marker of markers) {
			this.pushSample([marker.name])
			await this.wait(marker.durationMs)
		}
	}

	protected async wait(durationMs: number) {
		return new Promise((resolve) => setTimeout(resolve, durationMs))
	}
}

export interface DurationMarker {
	name: string
	durationMs: number
}
