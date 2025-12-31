import { randomInt } from 'crypto'
import { assert, test } from '@neurodevs/node-tdd'

import LslEventMarkerEmitter from '../../impl/LslEventMarkerEmitter.js'
import { StreamOutletOptions } from '../../impl/LslStreamOutlet.js'
import SpyEventMarkerEmitter from '../../testDoubles/EventMarkerEmitter/SpyEventMarkerEmitter.js'
import generateRandomOutletOptions from '../../testDoubles/generateRandomOutletOptions.js'
import FakeStreamOutlet from '../../testDoubles/StreamOutlet/FakeStreamOutlet.js'
import AbstractPackageTest from '../AbstractPackageTest.js'

export default class EventMarkerEmitterTest extends AbstractPackageTest {
    private static instance: SpyEventMarkerEmitter

    protected static async beforeEach() {
        await super.beforeEach()

        this.setFakeLiblsl()
        this.setFakeStreamOutlet()
        this.setSpyEventMarkerEmitter()

        this.instance = await this.LslEventMarkerEmitter()
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
            sourceId: 'event-markers',
            channelNames: ['Markers'],
            channelFormat: 'string',
            sampleRateHz: 0,
            chunkSize: 0,
            maxBufferedMs: 0,
            manufacturer: 'N/A',
            units: 'N/A',
        })
    }

    @test()
    protected static async canOverrideDefaultOptions() {
        const options = generateRandomOutletOptions()
        await this.LslEventMarkerEmitter(options)

        assert.isEqualDeep(
            FakeStreamOutlet.callsToConstructor[1].options,
            options
        )
    }

    @test()
    protected static async emittingSingleMarkerIncrementsHitCountAndWaitTime() {
        const markers = [this.generateEventMarker()]
        await this.instance.emitMany(markers)

        const marker = markers[0]

        assert.isEqual(
            FakeStreamOutlet.callsToPushSample[0][0],
            marker.name,
            'Pushed the wrong marker!'
        )

        assert.isEqual(this.instance.totalWaitForMs, marker.waitForMs)
    }

    @test()
    protected static async emittingTwoMarkersIncrementsHitCountAndWaitTimeTwice() {
        const markers = await this.emitMany(2)

        assert.isEqual(FakeStreamOutlet.callsToPushSample.length, 2)

        assert.isEqual(
            this.instance.totalWaitForMs,
            markers[0].waitForMs + markers[1].waitForMs
        )
    }

    @test('can interrupt on the first marker', 1)
    @test('can interrupt on the second marker', 2)
    @test('can interrupt on the third marker', 3)
    protected static async eventMarkerEmitterIsInterruptable(bailIdx: number) {
        let hitCount = 0

        const outlet = this.instance.getStreamOutlet()

        outlet.pushSample = () => {
            hitCount += 1
            if (hitCount === bailIdx) {
                this.instance.interrupt()
            }
        }

        await this.emitMany(10)

        assert.isEqual(hitCount, bailIdx)
    }

    @test()
    protected static async canStartAgainAfterInterrupting() {
        this.instance.interrupt()

        let hitCount = 0

        const outlet = this.instance.getStreamOutlet()

        outlet.pushSample = () => {
            hitCount++
        }

        await this.emitMany(10)

        assert.isEqual(hitCount, 10)
    }

    @test()
    protected static async doesNotWaitIfInterrupted() {
        await this.setupOutlet()

        const startMs = Date.now()
        const promise = this.emitMany(2, 1000)
        this.instance.interrupt()
        await promise
        const endMs = Date.now()

        assert.isBelow(endMs - startMs, 10)
    }

    @test()
    protected static async clearsTimeoutOnInterrupt() {
        void this.emitMany(2, 100)
        this.instance.interrupt()

        this.streamOutlet.pushSample = () =>
            assert.fail('Should not have been called')
    }

    @test()
    protected static async emitCallsPushSampleOnStreamOutlet() {
        const markerName = this.generateId()
        this.instance.emit({ name: markerName })

        assert.isEqual(FakeStreamOutlet.callsToPushSample[0][0], markerName)
    }

    @test()
    protected static async destroyCallsDestroyOnInternalStreamOutlet() {
        this.instance.destroy()

        assert.isEqual(
            FakeStreamOutlet.numCallsToDestroy,
            1,
            'Did not call destroy on outlet!'
        )
    }

    private static get streamOutlet() {
        return this.instance.getStreamOutlet()
    }

    private static async setupOutlet() {
        LslEventMarkerEmitter.Class = LslEventMarkerEmitter as any
        this.instance = await this.LslEventMarkerEmitter()
    }

    private static async emitMany(total: number, waitForMs?: number) {
        const markers = new Array(total)
            .fill(null)
            .map(() => this.generateEventMarker(waitForMs))

        await this.instance.emitMany(markers)

        return markers
    }

    private static generateEventMarker(waitForMs?: number) {
        return {
            name: this.generateId(),
            waitForMs: waitForMs ?? randomInt(100, 1000),
        }
    }

    private static async LslEventMarkerEmitter(
        options?: Partial<StreamOutletOptions>
    ) {
        return (await LslEventMarkerEmitter.Create(
            options
        )) as SpyEventMarkerEmitter
    }
}
