import { test, assert } from '@neurodevs/node-tdd'

import { ChannelFormat, LslSample } from 'impl/LiblslAdapter.js'
import { CHANNEL_FORMATS } from '../../consts.js'
import { StreamInfo } from '../../impl/LslStreamInfo.js'
import LslStreamOutlet, {
    StreamOutletOptions,
} from '../../impl/LslStreamOutlet.js'
import {
    TEST_SUPPORTED_CHANNEL_FORMATS,
    TEST_UNSUPPORTED_CHANNEL_FORMATS,
    TestChannelFormat,
} from '../../testDoubles/consts.js'
import generateRandomOutletOptions from '../../testDoubles/generateRandomOutletOptions.js'
import FakeLiblsl from '../../testDoubles/Liblsl/FakeLiblsl.js'
import FakeStreamInfo from '../../testDoubles/StreamInfo/FakeStreamInfo.js'
import AbstractPackageTest from '../AbstractPackageTest.js'

export default class LslStreamOutletTest extends AbstractPackageTest {
    private static randomOutletOptions: StreamOutletOptions

    protected static async beforeEach() {
        await super.beforeEach()

        delete LslStreamOutlet.Class

        this.randomOutletOptions = generateRandomOutletOptions()

        this.setFakeLiblsl()
        this.setFakeStreamInfo()
    }

    @test()
    protected static async throwsWithEmptyChannelNames() {
        await this.assertThrowsWithEmptyChannelNames()
    }

    @test()
    protected static async allowsZeroSampleRateHz() {
        await this.LslStreamOutlet({ sampleRateHz: 0 })
    }

    @test()
    protected static async throwsWithInvalidSampleRateHz() {
        await this.assertThrowsInvalidSampleRateHz(-1)
        await this.assertThrowsInvalidSampleRateHz(-1.5)
    }

    @test()
    protected static async throwsWithInvalidChannelFormat() {
        await this.assertThrowsInvalidChannelFormat(
            'invalid-format' as ChannelFormat
        )
    }

    @test()
    protected static async allowsZeroChunkSize() {
        await this.LslStreamOutlet({ chunkSize: 0 })
    }

    @test()
    protected static async throwsWithInvalidChunkSize() {
        await this.assertThrowsInvalidChunkSize(-1)
        await this.assertThrowsInvalidChunkSize(-1.5)
        await this.assertThrowsInvalidChunkSize(1.5)
    }

    @test()
    protected static async allowsZeroMaxBufferedMs() {
        await this.LslStreamOutlet({ maxBufferedMs: 0 })
    }

    @test()
    protected static async throwsWithInvalidMaxBufferedMs() {
        await this.assertThrowsInvalidMaxBufferedMs(-1)
        await this.assertThrowsInvalidMaxBufferedMs(-1.5)
        await this.assertThrowsInvalidMaxBufferedMs(1.5)
    }

    @test()
    protected static async throwsWithUnsupportedType() {
        for (let unsupportedType of TEST_UNSUPPORTED_CHANNEL_FORMATS) {
            await assert.doesThrowAsync(
                async () =>
                    await this.LslStreamOutlet({
                        channelFormat: unsupportedType,
                    }),
                `This method currently does not support the ${unsupportedType} type! Please implement it.`
            )
        }
    }

    @test()
    protected static async supportsAllKnownChannelFormats() {
        for (const format of TEST_SUPPORTED_CHANNEL_FORMATS) {
            await this.LslStreamOutlet({
                channelFormat: format as TestChannelFormat,
            })
        }
    }

    @test('pushing [1, 2] sample sends to LSL', [1.0, 2.0])
    @test('pushing [1] sample sends to LSL', [1.0])
    protected static async canPushFloatSampleToLsl(sample: LslSample) {
        const outlet = await this.FloatOutlet()
        outlet.pushSample(sample)

        assert.isEqual(
            this.fakeLiblsl.lastPushSampleFloatTimestampOptions?.outletHandle,
            this.fakeLiblsl.outletHandle
        )
        assert.isEqualDeep(
            this.fakeLiblsl.lastPushSampleFloatTimestampOptions?.sample,
            sample
        )
        assert.isEqualDeep(this.fakeLiblsl.lastCreateOutletOptions, {
            infoHandle: this.fakeLiblsl.infoHandle,
            chunkSize: this.randomOutletOptions.chunkSize,
            maxBufferedMs: this.randomOutletOptions.maxBufferedMs,
        })
        assert.isNumber(
            this.fakeLiblsl.lastPushSampleFloatTimestampOptions?.timestamp
        )
    }

    @test()
    protected static async canPushStringSampleToLsl() {
        const sample = [this.generateId()]
        const outlet = await this.StringOutlet()

        outlet.pushSample(sample)

        assert.isEqual(
            this.fakeLiblsl.lastPushSampleStringTimestampOptions?.outletHandle,
            this.fakeLiblsl.outletHandle
        )
        assert.isEqualDeep(
            this.fakeLiblsl.lastPushSampleStringTimestampOptions?.sample,
            sample
        )
        assert.isNumber(
            this.fakeLiblsl.lastPushSampleStringTimestampOptions?.timestamp
        )
    }

    @test()
    protected static async pushingStringTwiceGivesDifferentTimestamps() {
        const outlet = await this.StringOutlet()
        const sample = [this.generateId()]

        outlet.pushSample(sample)
        const t1 =
            this.fakeLiblsl.lastPushSampleStringTimestampOptions?.timestamp

        await this.wait(10)

        outlet.pushSample(sample)
        const t2 =
            this.fakeLiblsl.lastPushSampleStringTimestampOptions?.timestamp

        assert.isNotEqual(t1, t2)
        assert.isEqual(this.fakeLiblsl.localClockHitCount, 2)
    }

    @test()
    protected static async constructionCreatesStreamInfo() {
        await this.LslStreamOutlet()

        assert.isEqualDeep(FakeStreamInfo.callsToConstructor[0], {
            channelNames: this.randomOutletOptions.channelNames,
            channelFormat: this.randomOutletOptions.channelFormat,
            sampleRateHz: this.randomOutletOptions.sampleRateHz,
            name: this.randomOutletOptions.name,
            type: this.randomOutletOptions.type,
            sourceId: this.randomOutletOptions.sourceId,
            units: this.randomOutletOptions.units,
        })
    }

    @test()
    protected static async canOverrideClassInstantiatedInFactory() {
        LslStreamOutlet.Class = CheckingOutlet
        const instance = await this.LslStreamOutlet()

        assert.isInstanceOf(instance, CheckingOutlet)
    }

    @test()
    protected static async canDestroyOutlet() {
        const outlet = await this.LslStreamOutlet()
        outlet.destroy()

        assert.isEqual(this.fakeLiblsl.destroyOutletHitCount, 1)
    }

    @test()
    protected static async destroyAlsoCallsDestroyStreamInfo() {
        const outlet = await this.LslStreamOutlet()
        outlet.destroy()

        assert.isEqual(
            FakeStreamInfo.numCallsToDestroy,
            1,
            'Did not call destroy on stream info!'
        )
    }

    @test()
    protected static async destroysOutletHandleBeforeInletHandle() {
        const outlet = await this.LslStreamOutlet()

        const calls: string[] = []

        this.fakeLiblsl.destroyOutlet = (_options) => {
            calls.push('destroyOutlet')
        }

        outlet.info.destroy = () => {
            calls.push('destroyStreamInfo')
        }

        outlet.destroy()

        assert.isEqualDeep(
            calls,
            ['destroyOutlet', 'destroyStreamInfo'],
            'Did not destroy in correct order!'
        )
    }

    @test()
    protected static async pushSampleShouldNotCreateMultipleOutlets() {
        const outlet = await this.FloatOutlet()
        outlet.pushSample([1.0])
        outlet.pushSample([2.0])
        outlet.pushSample([3.0])

        assert.isEqual(this.fakeLiblsl.createOutletHitCount, 1)
    }

    @test()
    protected static async pushSampleAcceptsOptionalPreciseTimestamp() {
        const outlet = await this.FloatOutlet()
        const fakeTimestamp = Math.random() * 1000

        outlet.pushSample([1.0], fakeTimestamp)

        assert.isEqual(
            this.fakeLiblsl.lastPushSampleFloatTimestampOptions?.timestamp,
            fakeTimestamp
        )
    }

    @test()
    protected static async waitsForTenMsAfterConstructionBeforeReturning() {
        const startMs = Date.now()
        await this.LslStreamOutlet({ waitAfterConstructionMs: 10 })
        const endMs = Date.now()

        assert.isAbove(endMs - startMs, 8)
    }

    @test()
    protected static async defaultsMaxBufferedMsToSixMinutesInSeconds() {
        const outlet = await this.LslStreamOutlet({ maxBufferedMs: undefined })

        assert.isEqualDeep(
            outlet['maxBufferedMs'],
            360 * 1000,
            'Did not set maxBufferedMs as 6 minutes!'
        )
    }

    @test()
    protected static async defaultsManufacturerToNA() {
        const outlet = await this.LslStreamOutlet({ manufacturer: undefined })

        assert.isEqualDeep(
            outlet['manufacturer'],
            'N/A',
            'Did not set manufacturer as N/A!'
        )
    }

    @test()
    protected static async defaultsUnitsToNA() {
        const outlet = await this.LslStreamOutlet({ units: undefined })
        assert.isEqualDeep(outlet['units'], 'N/A', 'Did not set units as N/A!')
    }

    @test()
    protected static async throwsWithUnknownErrorCode() {
        await this.assertThrowsWithErrorCode(
            -999,
            `An unknown liblsl error has occurred!`
        )
    }

    @test()
    protected static async throwsWithErrorCodeNegativeOne() {
        await this.assertThrowsWithErrorCode(
            -1,
            `The liblsl operation failed due to a timeout!`
        )
    }

    @test()
    protected static async throwsWithErrorCodeNegativeTwo() {
        await this.assertThrowsWithErrorCode(
            -2,
            `The liblsl stream has been lost!`
        )
    }

    @test()
    protected static async throwsWithErrorCodeNegativeThree() {
        await this.assertThrowsWithErrorCode(
            -3,
            'A liblsl argument was incorrectly specified!'
        )
    }

    @test()
    protected static async throwsWithErrorCodeNegativeFour() {
        await this.assertThrowsWithErrorCode(
            -4,
            'An internal liblsl error has occurred!'
        )
    }

    private static async assertThrowsWithErrorCode(
        errorCode: number,
        message: string
    ) {
        FakeLiblsl.fakeErrorCode = errorCode

        const outlet =
            Math.random() > 0.5
                ? await this.FloatOutlet()
                : await this.StringOutlet()

        assert.doesThrow(() => {
            outlet.pushSample([1.0])
        }, message)
    }

    private static async assertThrowsWithEmptyChannelNames() {
        await this.createAndAssertThrows(
            'channelNames',
            [],
            `Invalid channel count! Must be a positive integer, not: 0.`
        )
    }

    private static async assertThrowsInvalidSampleRateHz(sampleRateHz: number) {
        await this.createAndAssertThrows(
            'sampleRateHz',
            sampleRateHz,
            `Invalid sample rate! Must be a positive number or zero, not: ${sampleRateHz}`
        )
    }

    private static async assertThrowsInvalidChannelFormat(
        channelFormat: ChannelFormat
    ) {
        await this.createAndAssertThrows(
            'channelFormat',
            channelFormat,
            `Invalid channel format! Must be one of: ${CHANNEL_FORMATS.join(', ')}, not ${channelFormat}.`
        )
    }

    private static async assertThrowsInvalidMaxBufferedMs(
        maxBufferedMs: number
    ) {
        await this.createAndAssertThrows(
            'maxBufferedMs',
            maxBufferedMs,
            `Invalid max buffered! Must be a positive integer or zero, not: ${maxBufferedMs}`
        )
    }

    private static async assertThrowsInvalidChunkSize(chunkSize: number) {
        await this.createAndAssertThrows(
            'chunkSize',
            chunkSize,
            `Invalid chunk size! Must be a positive integer or zero, not: ${chunkSize}`
        )
    }

    private static async createAndAssertThrows(
        option: keyof StreamOutletOptions,
        value: number | string[] | ChannelFormat,
        expectedMessage: string
    ) {
        const err = await assert.doesThrowAsync(
            async () => await this.LslStreamOutlet({ [option]: value })
        )

        assert.isTrue(
            err.message.includes(expectedMessage),
            'Did not receive the expected error!'
        )
    }

    private static async StringOutlet() {
        return await this.LslStreamOutlet({ channelFormat: 'string' })
    }

    private static async FloatOutlet() {
        return await this.LslStreamOutlet({ channelFormat: 'float32' })
    }

    private static async LslStreamOutlet(
        options?: Partial<StreamOutletOptions>
    ) {
        return await LslStreamOutlet.Create({
            ...this.randomOutletOptions,
            ...options,
        })
    }
}

class CheckingOutlet extends LslStreamOutlet {
    public constructor(info: StreamInfo, options: StreamOutletOptions) {
        super(info, options)
    }
}
