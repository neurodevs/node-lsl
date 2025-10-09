import { randomInt } from 'crypto'
import { assert, test } from '@sprucelabs/test-utils'
import generateId from '@neurodevs/generate-id'
import EventMarkerOutlet from '../../modules/EventMarkerOutlet'
import { LslOutletOptions } from '../../modules/LslStreamOutlet'
import generateRandomOutletOptions from '../../testDoubles/generateRandomOutletOptions'
import FakeLslOutlet from '../../testDoubles/LslOutlet/FakeLslOutlet'
import SpyMarkerOutlet from '../../testDoubles/MarkerOutlet/SpyMarkerOutlet'
import AbstractPackageTest from '../AbstractPackageTest'

export default class EventMarkerOutletTest extends AbstractPackageTest {
    private static instance: SpyMarkerOutlet

    protected static async beforeEach() {
        await super.beforeEach()

        this.setFakeLiblsl()
        this.setFakeLslOutlet()
        this.setSpyMarkerOutlet()

        this.instance = await this.EventMarkerOutlet()
    }

    @test()
    protected static async loadsWithEventMarkerSpecificOptions() {
        assert.isEqualDeep(FakeLslOutlet.callsToConstructor[0].options, {
            name: 'Event markers',
            type: 'Markers',
            channelNames: ['Markers'],
            sampleRate: 0,
            channelFormat: 'string',
            sourceId: 'event-markers',
            manufacturer: 'N/A',
            unit: 'N/A',
            chunkSize: 0,
            maxBuffered: 0,
        })
    }

    @test()
    protected static async canOverrideDefaultOptions() {
        const options = generateRandomOutletOptions()
        await this.EventMarkerOutlet(options)

        assert.isEqualDeep(FakeLslOutlet.callsToConstructor[1].options, options)
    }

    @test()
    protected static async pushingSingleMarkerIncrementsHitCountAndWaitTime() {
        const markers = [this.generateDurationMarker()]
        await this.instance.pushMarkers(markers)

        const marker = markers[0]

        assert.isEqual(
            FakeLslOutlet.callsToPushSample[0][0],
            marker.name,
            'Pushed the wrong marker!'
        )

        assert.isEqual(this.instance.totalWaitTimeMs, marker.durationMs)
    }

    @test()
    protected static async pushingTwoMarkersIncrementsHitCountAndWaitTimeTwice() {
        const markers = await this.pushTotalMarkers(2)

        assert.isEqual(FakeLslOutlet.callsToPushSample.length, 2)

        assert.isEqual(
            this.instance.totalWaitTimeMs,
            markers[0].durationMs + markers[1].durationMs
        )
    }

    @test('can stop on the first marker', 1)
    @test('can stop on the second marker', 2)
    @test('can stop on the third marker', 3)
    protected static async canStopEventMarkersMidPush(bailIdx: number) {
        let hitCount = 0

        const outlet = this.instance.getLslOutlet()

        outlet.pushSample = () => {
            hitCount += 1
            if (hitCount === bailIdx) {
                this.instance.stop()
            }
        }

        await this.pushTotalMarkers(10)

        assert.isEqual(hitCount, bailIdx)
    }

    @test()
    protected static async canStartAgainAfterStopping() {
        this.instance.stop()

        let hitCount = 0

        const outlet = this.instance.getLslOutlet()

        outlet.pushSample = () => {
            hitCount++
        }

        await this.pushTotalMarkers(10)

        assert.isEqual(hitCount, 10)
    }

    @test()
    protected static async doesNotWaitIfStopped() {
        await this.setupOutlet()

        const startMs = Date.now()
        const promise = this.pushTotalMarkers(2, 1000)
        this.instance.stop()
        await promise
        const endMs = Date.now()

        assert.isBelow(endMs - startMs, 10)
    }

    @test()
    protected static async clearsTheTimeoutOnStop() {
        void this.pushTotalMarkers(2, 100)
        this.instance.stop()

        this.lslOutlet.pushSample = () =>
            assert.fail('Should not have been called')
    }

    @test()
    protected static async pushMarkerCallsPushSampleOnMarkerOutlet() {
        const markerName = generateId()
        this.instance.pushMarker(markerName)

        assert.isEqual(FakeLslOutlet.callsToPushSample[0][0], markerName)
    }

    private static get lslOutlet() {
        return this.instance.getLslOutlet()
    }

    private static async setupOutlet() {
        EventMarkerOutlet.Class = EventMarkerOutlet as any
        this.instance = await this.EventMarkerOutlet()
    }

    private static async pushTotalMarkers(total: number, durationMs?: number) {
        const markers = new Array(total)
            .fill(null)
            .map(() => this.generateDurationMarker(durationMs))

        await this.instance.pushMarkers(markers)

        return markers
    }

    private static generateDurationMarker(durationMs?: number) {
        return {
            name: generateId(),
            durationMs: durationMs ?? randomInt(100, 1000),
        }
    }

    private static async EventMarkerOutlet(
        options?: Partial<LslOutletOptions>
    ) {
        return (await EventMarkerOutlet.Create(options)) as SpyMarkerOutlet
    }
}
