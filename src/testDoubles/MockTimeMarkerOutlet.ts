import { assert } from '@sprucelabs/test-utils'
import { DurationMarker, LslSample, TimeMarkerOutlet } from '..'

export default class MockTimeMarkerOutlet implements TimeMarkerOutlet {
    private didPushMarkers = false
    private pushedMarkers?: DurationMarker[]
    private didPushSamples = false
    private pushedSamples?: LslSample[]

    public stop() {}
    public destroy() {}

    public pushSample(sample: LslSample) {
        if (!this.didPushSamples) {
            this.didPushSamples = true
            this.pushedSamples = []
        }
        this.pushedSamples?.push(sample)
    }

    public async pushMarkers(markers: DurationMarker[]) {
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
