import LslOutletImpl, { LslOutletOptions } from './LslOutlet'

export default class TimeMarkerOutletImpl
	extends LslOutletImpl
	implements TimeMarkerOutlet
{
	private isPlaying: boolean = false
	private waitResolve?: () => void
	private timeout?: any

	public static TimeMarkerOutlet(options?: Partial<LslOutletOptions>) {
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

		//@ts-ignore
		return new (this.Class ?? this)({
			...defaultOptions,
			...options,
		}) as TimeMarkerOutlet
	}

	public async pushMarkers(markers: DurationMarker[]) {
		this.isPlaying = true

		for (let marker of markers) {
			this.pushSample([marker.name])

			await this.wait(marker.durationMs)

			if (!this.isPlaying) {
				return
			}
		}
	}

	protected async wait(durationMs: number) {
		return new Promise((resolve) => this.setTimeout(resolve, durationMs))
	}

	private setTimeout(
		resolve: (value: unknown) => void,
		durationMs: number
	): void {
		this.waitResolve = resolve as any
		this.timeout = setTimeout(resolve, durationMs)
	}

	public stop(): void {
		this.waitResolve?.()
		clearTimeout(this.timeout)
		this.isPlaying = false
	}
}

export interface DurationMarker {
	name: string
	durationMs: number
}

export interface TimeMarkerOutlet {
	pushMarkers(markers: DurationMarker[]): Promise<void>
	stop(): void
}
