import { randomInt } from 'crypto'
import { assert, generateId, test } from '@sprucelabs/test-utils'
import { LslOutletOptions } from '../components/LslOutlet'
import TimeMarkerOutletImpl from '../components/TimeMarkerOutlet'
import FakeStreamInfo from '../testDoubles/FakeStreamInfo'
import generateRandomOutletOptions from '../testDoubles/generateRandomOutletOptions'
import SpyTimeMarkerOutlet from '../testDoubles/SpyTimeMarkerOutlet'
import AbstractNodeLslTest from './AbstractNodeLslTest'

export default class TimeMarkerOutletTest extends AbstractNodeLslTest {
    private static outlet: SpyTimeMarkerOutlet

    protected static async beforeEach() {
        await super.beforeEach()

        this.setFakeStreamInfo()
        this.setSpyTimeMarkerOutlet()
        this.setFakeLiblsl()

        this.outlet = await this.Outlet()
    }

    @test()
    protected static async loadsWithTimeMarkerSpecificOptions() {
        assert.isEqualDeep(this.outlet.passedOptions, {
            name: this.name_,
            type: this.type,
            channelNames: this.channelNames,
            sampleRate: this.sampleRate,
            channelFormat: this.channelFormat,
            sourceId: this.sourceId,
            manufacturer: this.manufacturer,
            unit: this.unit,
            chunkSize: this.chunkSize,
            maxBuffered: this.maxBuffered,
        })
    }

    @test()
    protected static async canOverrideDefaultOptions() {
        const options = generateRandomOutletOptions()
        const outlet = await this.Outlet(options)
        assert.isEqualDeep(outlet.passedOptions, options)
    }

    @test()
    protected static async pushingSingleMarkerIncrementsHitCountAndWaitTime() {
        const markers = [this.generateDurationMarkerValues()]
        await this.outlet.pushMarkers(markers)

        assert.isEqual(this.fakeLiblsl.pushSampleStringTimestampHitCount, 1)
        assert.isEqual(this.outlet.totalWaitTimeMs, markers[0].durationMs)
    }

    @test()
    protected static async pushingTwoMarkersIncrementsHitCountAndWaitTimeTwice() {
        const markers = await this.pushTotalMarkers(2)

        assert.isEqual(this.fakeLiblsl.pushSampleStringTimestampHitCount, 2)
        assert.isEqual(
            this.outlet.totalWaitTimeMs,
            markers[0].durationMs + markers[1].durationMs
        )
    }

    @test('can stop on the first marker', 1)
    @test('can stop on the second marker', 2)
    @test('can stop on the third marker', 3)
    protected static async canStopTimeMarkersMidPush(bailIdx: number) {
        let hitCount = 0

        this.outlet.pushSample = () => {
            hitCount += 1
            if (hitCount === bailIdx) {
                this.outlet.stop()
            }
        }

        await this.pushTotalMarkers(10)

        assert.isEqual(hitCount, bailIdx)
    }

    @test()
    protected static async canStartAgainAfterStopping() {
        this.outlet.stop()

        let hitCount = 0

        this.outlet.pushSample = () => {
            hitCount++
        }

        await this.pushTotalMarkers(10)

        assert.isEqual(hitCount, 10)
    }

    @test()
    protected static async doesNotWaitIfStopped() {
        await this.setupTimeMarkerImpl()

        const startMs = Date.now()
        const promise = this.pushTotalMarkers(2, 1000)
        this.outlet.stop()
        await promise
        const endMs = Date.now()

        assert.isBelow(endMs - startMs, 10)
    }

    @test()
    protected static async clearsTheTimeoutOnStop() {
        await this.setupTimeMarkerImpl()

        const promise = this.pushTotalMarkers(2, 100)

        this.outlet.stop()
        this.outlet.pushSample = () =>
            assert.fail('Should not have been called')

        await promise
        await this.wait(100)
    }

    @test()
    protected static async createsStreamInfoWithCorrectOptions() {
        assert.isEqualDeep(
            FakeStreamInfo.callsToConstructor[0],
            {
                channelNames: this.channelNames,
                channelFormat: this.channelFormat,
                sampleRate: this.sampleRate,
                name: this.name_,
                type: this.type,
                sourceId: this.sourceId,
                units: this.unit,
            },
            'Should create stream info!'
        )
    }

    private static async setupTimeMarkerImpl() {
        TimeMarkerOutletImpl.Class = TimeMarkerOutletImpl as any
        this.outlet = await this.Outlet()
    }

    private static async pushTotalMarkers(total: number, durationMs?: number) {
        const markers = new Array(total)
            .fill(null)
            .map(() => this.generateDurationMarkerValues(durationMs))

        await this.outlet.pushMarkers(markers)

        return markers
    }

    private static generateDurationMarkerValues(durationMs?: number) {
        return {
            name: generateId(),
            durationMs: durationMs ?? randomInt(100, 1000),
        }
    }

    protected static readonly name_ = 'Time markers'
    protected static readonly type = 'Markers'
    protected static readonly channelNames = ['Markers']
    protected static readonly channelFormat = 'string'
    protected static readonly sourceId = 'time-markers'
    protected static readonly manufacturer = 'N/A'
    protected static readonly unit = 'N/A'
    protected static readonly sampleRate = 0
    protected static readonly chunkSize = 0
    protected static readonly maxBuffered = 0

    private static async Outlet(options?: Partial<LslOutletOptions>) {
        return (await TimeMarkerOutletImpl.Create(
            options
        )) as SpyTimeMarkerOutlet
    }
}
