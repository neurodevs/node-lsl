import { test, assert } from '@sprucelabs/test-utils'
import generateId from '@neurodevs/generate-id'
import { CHANNEL_FORMATS } from '../../consts'
import { StreamInfo } from '../../modules/LslStreamInfo'
import LslStreamOutlet, {
    LslOutletOptions,
} from '../../modules/LslStreamOutlet'
import {
    TEST_SUPPORTED_CHANNEL_FORMATS,
    TEST_UNSUPPORTED_CHANNEL_FORMATS,
    TestChannelFormat,
} from '../../testDoubles/consts'

import generateRandomOutletOptions from '../../testDoubles/generateRandomOutletOptions'
import FakeStreamInfo from '../../testDoubles/StreamInfo/FakeStreamInfo'
import { ChannelFormat, LslSample } from '../../types'
import AbstractPackageTest from '../AbstractPackageTest'

export default class LslStreamOutletTest extends AbstractPackageTest {
    private static randomOutletOptions: LslOutletOptions

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
    protected static async allowsZeroSampleRate() {
        await this.LslStreamOutlet({ sampleRate: 0 })
    }

    @test()
    protected static async throwsWithInvalidSampleRate() {
        await this.assertThrowsInvalidSampleRate(-1)
        await this.assertThrowsInvalidSampleRate(-1.5)
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
    protected static async allowsZeroMaxBuffered() {
        await this.LslStreamOutlet({ maxBuffered: 0 })
    }

    @test()
    protected static async throwsWithInvalidMaxBuffered() {
        await this.assertThrowsInvalidMaxBuffered(-1)
        await this.assertThrowsInvalidMaxBuffered(-1.5)
        await this.assertThrowsInvalidMaxBuffered(1.5)
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
            this.fakeLiblsl.lastPushSampleFloatTimestampOptions?.outlet,
            this.fakeLiblsl.outlet
        )
        assert.isEqualDeep(
            this.fakeLiblsl.lastPushSampleFloatTimestampOptions?.sample,
            sample
        )
        assert.isEqualDeep(this.fakeLiblsl.lastCreateOutletOptions, {
            info: this.fakeLiblsl.streamInfo,
            chunkSize: this.randomOutletOptions.chunkSize,
            maxBuffered: this.randomOutletOptions.maxBuffered,
        })
        assert.isNumber(
            this.fakeLiblsl.lastPushSampleFloatTimestampOptions?.timestamp
        )
    }

    @test()
    protected static async canPushStringSampleToLsl() {
        const sample = [generateId()]
        const outlet = await this.StringOutlet()

        outlet.pushSample(sample)

        assert.isEqual(
            this.fakeLiblsl.lastPushSampleStringTimestampOptions?.outlet,
            this.fakeLiblsl.outlet
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
        const sample = [generateId()]

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
            sampleRate: this.randomOutletOptions.sampleRate,
            name: this.randomOutletOptions.name,
            type: this.randomOutletOptions.type,
            sourceId: this.randomOutletOptions.sourceId,
            units: this.randomOutletOptions.unit,
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
    protected static async pushSampleShouldNotCreateMultipleOutlets() {
        const outlet = await this.FloatOutlet()
        outlet.pushSample([1.0])
        outlet.pushSample([2.0])
        outlet.pushSample([3.0])

        assert.isEqual(this.fakeLiblsl.createOutletHitCount, 1)
    }

    @test()
    protected static async waitsForTenMsAfterConstructionBeforeReturning() {
        const startMs = Date.now()
        await this.LslStreamOutlet({ waitAfterConstructionMs: 10 })
        const endMs = Date.now()

        assert.isAbove(endMs - startMs, 10)
    }

    private static async assertThrowsWithEmptyChannelNames() {
        await this.createAndAssertThrows(
            'channelNames',
            [],
            `Invalid channel count! Must be a positive integer, not: 0.`
        )
    }

    private static async assertThrowsInvalidSampleRate(sampleRate: number) {
        await this.createAndAssertThrows(
            'sampleRate',
            sampleRate,
            `Invalid sample rate! Must be a positive number or zero, not: ${sampleRate}`
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

    private static async assertThrowsInvalidMaxBuffered(maxBuffered: number) {
        await this.createAndAssertThrows(
            'maxBuffered',
            maxBuffered,
            `Invalid max buffered! Must be a positive integer or zero, not: ${maxBuffered}`
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
        option: keyof LslOutletOptions,
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

    private static async LslStreamOutlet(options?: Partial<LslOutletOptions>) {
        return await LslStreamOutlet.Create({
            ...this.randomOutletOptions,
            ...options,
        })
    }
}

class CheckingOutlet extends LslStreamOutlet {
    public constructor(info: StreamInfo, options: LslOutletOptions) {
        super(info, options)
    }
}
