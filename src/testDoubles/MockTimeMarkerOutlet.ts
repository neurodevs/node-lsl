import { assert } from '@sprucelabs/test-utils'
import { DurationMarker, LslSample, TimeMarkerOutlet } from '..'

export default class MockTimeMarkerOutlet implements TimeMarkerOutlet {
	public static instance: MockTimeMarkerOutlet
	private didPushMarkers = false
	private pushedMarkers?: DurationMarker[]
	private didPushSamples = false
	private pushedSamples?: LslSample[]

	public constructor() {
		MockTimeMarkerOutlet.instance = this
	}

	public stop(): void {}
	public destroy(): void {}

	public pushSample(sample: LslSample): void {
		if (!this.didPushSamples) {
			this.didPushSamples = true
			this.pushedSamples = []
		}
		this.pushedSamples?.push(sample)
	}

	public async pushMarkers(markers: DurationMarker[]): Promise<void> {
		this.didPushMarkers = true
		this.pushedMarkers = markers
	}

	public assertDidPushSamples(samples?: LslSample[]) {
		assert.isTrue(
			this.didPushSamples,
			`Expected to have pushed samples but didn't. Try 'outlet.pushSample(...)'`
		)

		if (samples) {
			assert.isEqualDeep(this.pushedSamples, samples)
		}
	}

	public assertDidNotPushSamples() {
		assert.isFalse(
			this.didPushSamples,
			`Expected to NOT have pushed samples but did. Try 'outlet.pushSample(...)'`
		)
	}

	public assertDidPushMarkers(markers?: DurationMarker[]) {
		assert.isTrue(
			this.didPushMarkers,
			`Expected to have pushed markers but didn't. Try 'outlet.pushMarkers(...)'`
		)

		if (markers) {
			assert.isEqualDeep(this.pushedMarkers, markers)
		}
	}

	public assertDidNotPushMarkers() {
		assert.isFalse(
			this.didPushMarkers,
			`Expected to NOT have pushed markers but did. Try 'outlet.pushMarkers(...)'`
		)
	}
}
