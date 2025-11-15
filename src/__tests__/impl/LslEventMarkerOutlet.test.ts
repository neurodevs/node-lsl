import { randomInt } from 'crypto'
import { assert, test } from '@neurodevs/node-tdd'

import LslEventMarkerOutlet from '../../impl/LslEventMarkerOutlet.js'
import { StreamOutletOptions } from '../../impl/LslStreamOutlet.js'
import SpyEventMarkerOutlet from '../../testDoubles/EventMarkerOutlet/SpyEventMarkerOutlet.js'
import generateRandomOutletOptions from '../../testDoubles/generateRandomOutletOptions.js'
import FakeStreamOutlet from '../../testDoubles/StreamOutlet/FakeStreamOutlet.js'
import AbstractPackageTest from '../AbstractPackageTest.js'

export default class EventMarkerOutletTest extends AbstractPackageTest {
    private static instance: SpyEventMarkerOutlet

    protected static async beforeEach() {
        await super.beforeEach()

        this.setFakeLiblsl()
        this.setFakeStreamOutlet()
        this.setSpyEventMarkerOutlet()

        this.instance = await this.LslEventMarkerOutlet()
    }

    @test()
    protected static async createsInstance() {
        assert.isTruthy(this.instance, 'Failed to create instance!')
    }

    @test()
    protected static async loadsWithEventMarkerSpecificOptions() {
        assert.isEqualDeep(FakeStreamOutlet.callsToConstructor[0].options, {
            name: 'Event markers',
            type: 'Markers',
            channelNames: ['Markers'],
            sampleRateHz: 0,
            channelFormat: 'string',
            sourceId: 'event-markers',
            manufacturer: 'N/A',
            unit: 'N/A',
            chunkSize: 0,
            maxBufferedMs: 0,
        })
    }

    @test()
    protected static async canOverrideDefaultOptions() {
        const options = generateRandomOutletOptions()
        await this.LslEventMarkerOutlet(options)

        assert.isEqualDeep(
            FakeStreamOutlet.callsToConstructor[1].options,
            options
        )
    }

    @test()
    protected static async pushingSingleMarkerIncrementsHitCountAndWaitTime() {
        const markers = [this.generateDurationMarker()]
        await this.instance.pushMarkers(markers)

        const marker = markers[0]

        assert.isEqual(
            FakeStreamOutlet.callsToPushSample[0][0],
            marker.name,
            'Pushed the wrong marker!'
        )

        assert.isEqual(this.instance.totalWaitTimeMs, marker.durationMs)
    }

    @test()
    protected static async pushingTwoMarkersIncrementsHitCountAndWaitTimeTwice() {
        const markers = await this.pushTotalMarkers(2)

        assert.isEqual(FakeStreamOutlet.callsToPushSample.length, 2)

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

        const outlet = this.instance.getStreamOutlet()

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

        const outlet = this.instance.getStreamOutlet()

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

        this.streamOutlet.pushSample = () =>
            assert.fail('Should not have been called')
    }

    @test()
    protected static async pushMarkerCallsPushSampleOnMarkerOutlet() {
        const markerName = this.generateId()
        this.instance.pushMarker(markerName)

        assert.isEqual(FakeStreamOutlet.callsToPushSample[0][0], markerName)
    }

    private static get streamOutlet() {
        return this.instance.getStreamOutlet()
    }

    private static async setupOutlet() {
        LslEventMarkerOutlet.Class = LslEventMarkerOutlet as any
        this.instance = await this.LslEventMarkerOutlet()
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
            name: this.generateId(),
            durationMs: durationMs ?? randomInt(100, 1000),
        }
    }

    private static async LslEventMarkerOutlet(
        options?: Partial<StreamOutletOptions>
    ) {
        return (await LslEventMarkerOutlet.Create(
            options
        )) as SpyEventMarkerOutlet
    }
}
