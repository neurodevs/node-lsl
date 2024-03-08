import { assert } from '@sprucelabs/test-utils'
import { DurationMarker, LslSample, TimeMarkerOutlet } from '..'

export default class MockTimeMarkerOutlet implements TimeMarkerOutlet {
	public static instance: MockTimeMarkerOutlet
	private didPushMarkers = false
	private markers?: DurationMarker[]

	public constructor() {
		MockTimeMarkerOutlet.instance = this
	}

	public stop(): void {}
	public destroy(): void {}
	public pushSample(_sample: LslSample): void {}

	public async pushMarkers(markers: DurationMarker[]): Promise<void> {
		this.didPushMarkers = true
		this.markers = markers
	}

	public assertDidPushMarkers(markers?: DurationMarker[]) {
		assert.isTrue(
			this.didPushMarkers,
			`Expected to have pushed markers but didn't. Try 'outlet.pushMarkers(...)'`
		)

		if (markers) {
			assert.isEqualDeep(this.markers, markers)
		}
	}

	public assertDidNotPushMarkers() {
		assert.isFalse(
			this.didPushMarkers,
			`Expected to NOT have pushed markers but did. Try 'outlet.pushMarkers(...)'`
		)
	}
}
