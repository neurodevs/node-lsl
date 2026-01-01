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
        assert.isEqualDeep(
            {
                ...FakeStreamOutlet.callsToConstructor[0].options,
                name: undefined,
                sourceId: undefined,
            },
            {
                name: undefined,
                type: 'Markers',
                sourceId: undefined,
                channelNames: ['Markers'],
                channelFormat: 'string',
                sampleRateHz: 0,
                chunkSize: 1,
            }
        )

        assert.isTrue(
            FakeStreamOutlet.callsToConstructor[0].options?.sourceId.startsWith(
                'event-markers-'
            ),
            'Source ID was not generated uniquely!'
        )

        assert.isTrue(
            FakeStreamOutlet.callsToConstructor[0].options?.name.startsWith(
                'Event markers ('
            ),
            'Name was not generated uniquely!'
        )
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
        const markers = await this.emitManyFor(2)

        assert.isEqual(FakeStreamOutlet.callsToPushSample.length, 2)

        assert.isEqual(
            this.instance.totalWaitForMs,
            markers[0].waitForMs + markers[1].waitForMs
        )
    }

    @test('interrupts on first marker', 1)
    @test('interrupts on second marker', 2)
    @test('interrupts on third marker', 3)
    protected static async emitterIsInterruptable(bailIdx: number) {
        let hitCount = 0

        this.streamOutlet.pushSample = () => {
            hitCount += 1
            if (hitCount === bailIdx) {
                this.interrupt()
            }
        }

        await this.emitManyFor(10)

        assert.isEqual(hitCount, bailIdx)
    }

    @test()
    protected static async canStartAgainAfterInterrupting() {
        this.interrupt()

        let hitCount = 0

        this.streamOutlet.pushSample = () => {
            hitCount++
        }

        await this.emitManyFor(10)

        assert.isEqual(hitCount, 10)
    }

    @test()
    protected static async doesNotWaitIfInterrupted() {
        await this.setupOutlet()

        const startMs = Date.now()
        const promise = this.emitManyFor(2, 1000)
        this.interrupt()
        await promise
        const endMs = Date.now()

        assert.isBelow(endMs - startMs, 10)
    }

    @test()
    protected static async clearsTimeoutOnInterrupt() {
        void this.emitManyFor(2, 100)
        this.interrupt()

        this.streamOutlet.pushSample = () =>
            assert.fail('Should not have been called')
    }

    @test()
    protected static async emitCallsPushSampleOnStreamOutlet() {
        const markerName = this.generateId()
        await this.emitFor(markerName)

        assert.isEqual(FakeStreamOutlet.callsToPushSample[0][0], markerName)
    }

    @test()
    protected static async emitWaitsForMsIfPassed() {
        SpyEventMarkerEmitter.shouldCallWaitOnSuper = true

        const waitForMs = 10
        const eventMarker = this.generateEventMarker(waitForMs)

        const startMs = Date.now()
        await this.instance.emit(eventMarker)
        const endMs = Date.now()

        assert.isAbove(
            endMs - startMs,
            waitForMs,
            'Did not wait for the specified time!'
        )
    }

    @test()
    protected static async destroyCallsDestroyOnInternalStreamOutlet() {
        this.destroy()

        assert.isEqual(
            FakeStreamOutlet.numCallsToDestroy,
            1,
            'Did not call destroy on outlet!'
        )
    }

    @test()
    protected static async destroyInterruptsIfRunning() {
        let wasHit = false

        const original = this.instance.interrupt.bind(this.instance)

        this.instance.interrupt = () => {
            wasHit = true
            original()
        }

        const promise = this.emitManyFor(5, 10)
        this.destroy()

        assert.isTrue(wasHit, 'Did not call interrupt on destroy!')

        await promise
    }

    @test()
    protected static async sourceIdIsUniqueAcrossInstances() {
        const instance = await this.LslEventMarkerEmitter()

        assert.isNotEqual(
            instance['outlet'].sourceId,
            this.instance['outlet'].sourceId,
            'Source IDs are not unique!'
        )
    }

    private static emitFor(markerName: string) {
        return this.instance.emit({ name: markerName })
    }

    private static async emitManyFor(total: number, waitForMs?: number) {
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

    private static interrupt() {
        this.instance.interrupt()
    }

    private static destroy() {
        this.instance.destroy()
    }

    private static get streamOutlet() {
        return this.instance.getStreamOutlet()
    }

    private static async setupOutlet() {
        LslEventMarkerEmitter.Class = LslEventMarkerEmitter as any
        this.instance = await this.LslEventMarkerEmitter()
    }

    private static async LslEventMarkerEmitter(
        options?: Partial<StreamOutletOptions>
    ) {
        return (await LslEventMarkerEmitter.Create(
            options
        )) as SpyEventMarkerEmitter
    }
}
