import AbstractSpruceTest, {
    test,
    assert,
    errorAssert,
    generateId,
} from '@sprucelabs/test-utils'
import LiblslImpl from '../../components/Liblsl'
import LslOutletImpl, {
    LslOutletOptions,
} from '../../components/LslOutlet'
import { LslSample } from '../../nodeLsl.types'
import FakeLiblsl from '../../testDoubles/FakeLiblsl'
import {
    TEST_CHANNEL_FORMATS_MAP,
    TEST_SUPPORTED_CHANNEL_FORMATS,
    TEST_UNSUPPORTED_CHANNEL_FORMATS,
    TestChannelFormat,
} from '../support/consts'
import generateRandomOutletOptions from '../support/generateRandomOutletOptions'

export default class LslOutletTest extends AbstractSpruceTest {
    private static fakeLiblsl: FakeLiblsl
    private static randomOutletOptions: LslOutletOptions
    private static channelFormatIdx: number

    protected static async beforeEach() {
        await super.beforeEach()
        delete LslOutletImpl.Class
        this.randomOutletOptions = generateRandomOutletOptions()

        const channelFormat = this.randomOutletOptions.channelFormat
        this.channelFormatIdx = TEST_CHANNEL_FORMATS_MAP[channelFormat]
        this.fakeLiblsl = new FakeLiblsl()

        LiblslImpl.setInstance(this.fakeLiblsl)
    }

    @test()
    protected static async throwsWithMissingRequiredParams() {
        const err = await assert.doesThrowAsync(
            //@ts-ignore
            async () => await LslOutletImpl.Create()
        )
        errorAssert.assertError(err, 'MISSING_PARAMETERS', {
            parameters: [
                'name',
                'type',
                'channelNames',
                'sampleRate',
                'channelFormat',
                'sourceId',
                'manufacturer',
                'unit',
                'chunkSize',
                'maxBuffered',
            ],
        })
    }

    @test()
    protected static async throwsWithInvalidChannelNames() {
        await this.assertThrowsInvalidChannelNames(0)
    }

    @test()
    protected static async allowsZeroSampleRate() {
        await this.Outlet({ sampleRate: 0 })
    }

    @test()
    protected static async throwsWithInvalidSampleRate() {
        await this.assertThrowsInvalidSampleRate(-1)
        await this.assertThrowsInvalidSampleRate(-1.5)
    }

    @test()
    protected static async throwsWithInvalidChannelFormat() {
        await this.assertDoesThrowInvalidParameters(
            //@ts-ignore
            { channelFormat: generateId() },
            ['channelFormat']
        )
    }

    @test()
    protected static async throwsWithInvalidChunkSize() {
        await this.Outlet({ chunkSize: 0 })
        await this.assertThrowsInvalidChunkSize(-1)
        await this.assertThrowsInvalidChunkSize(-1.5)
        await this.assertThrowsInvalidChunkSize(1.5)
    }

    @test()
    protected static async throwsWithInvalidMaxBuffered() {
        await this.Outlet({ maxBuffered: 0 })
        await this.assertThrowsInvalidMaxBuffered(-1)
        await this.assertThrowsInvalidMaxBuffered(-1.5)
        await this.assertThrowsInvalidMaxBuffered(1.5)
    }

    @test()
    protected static async throwsWithUnsupportedType() {
        for (let unsupportedType of TEST_UNSUPPORTED_CHANNEL_FORMATS) {
            await assert.doesThrowAsync(
                async () =>
                    await this.Outlet({ channelFormat: unsupportedType }),
                `This method currently does not support the ${unsupportedType} type! Please implement it.`
            )
        }
    }

    @test()
    protected static async supportsAllKnownChannelFormats() {
        for (const format of TEST_SUPPORTED_CHANNEL_FORMATS) {
            await this.Outlet({ channelFormat: format as TestChannelFormat })
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
        await this.Outlet()

        const { ...options } = this.randomOutletOptions as any

        options.channelCount = options.channelNames.length

        delete options.manufacturer
        delete options.unit
        delete options.chunkSize
        delete options.maxBuffered
        delete options.channelNames

        assert.isEqualDeep(this.fakeLiblsl.lastCreateStreamInfoOptions, {
            ...options,
            channelFormat: this.channelFormatIdx,
        })
    }

    @test()
    protected static async canOverrideClassInstantiatedInFactory() {
        LslOutletImpl.Class = CheckingOutlet
        const instance = await this.Outlet()

        assert.isInstanceOf(instance, CheckingOutlet)
    }

    @test('can add one label to channels', [generateId()])
    @test('can add two labels to channels', [generateId(), generateId()])
    protected static async appendsChannelsBasedOnCount(labels: string[]) {
        const type = generateId()
        const unit = generateId()

        await this.Outlet({ channelNames: labels, type, unit })

        assert.isEqualDeep(
            this.fakeLiblsl.lastAppendChannelsToStreamInfoOptions,
            {
                info: this.fakeLiblsl.streamInfo,
                channels: labels.map((label) => ({
                    label,
                    type,
                    unit,
                })),
            }
        )
    }

    @test()
    protected static async canDestroyOutlet() {
        const outlet = await this.Outlet()
        outlet.destroy()

        assert.isEqual(this.fakeLiblsl.destroyOutletHitCount, 1)
    }

    @test()
    protected static async pushSampleShouldNotCreateMultipleOutlets() {
        const outlet = await this.FloatOutlet()
        outlet.pushSample([1.0])
        outlet.pushSample([2.0])
        outlet.pushSample([3.0])

        assert.isEqual(this.fakeLiblsl.createStreamInfoHitCount, 1)
    }

    @test()
    protected static async waitsForTenMsAfterConstructionBeforeReturning() {
        const startMs = Date.now()
        await this.Outlet({ waitAfterConstructionMs: 10 })
        const endMs = Date.now()

        assert.isAbove(endMs - startMs, 10)
    }

    private static async assertThrowsInvalidMaxBuffered(maxBuffered: number) {
        await this.assertDoesThrowInvalidParameters({ maxBuffered }, [
            'maxBuffered',
        ])
    }

    private static async assertThrowsInvalidChunkSize(chunkSize: number) {
        await this.assertDoesThrowInvalidParameters({ chunkSize }, [
            'chunkSize',
        ])
    }

    private static async assertThrowsInvalidSampleRate(sampleRate: number) {
        await this.assertDoesThrowInvalidParameters({ sampleRate }, [
            'sampleRate',
        ])
    }

    private static async assertThrowsInvalidChannelNames(count: number) {
        await this.assertDoesThrowInvalidParameters(
            { channelNames: new Array(count).fill(generateId()) },
            ['channelNames']
        )
    }

    private static async assertDoesThrowInvalidParameters(
        options: Partial<LslOutletOptions>,
        parameters: string[]
    ) {
        const err = await assert.doesThrowAsync(
            async () => await this.Outlet(options)
        )
        errorAssert.assertError(err, 'INVALID_PARAMETERS', {
            parameters,
        })
    }

    private static async StringOutlet() {
        return await this.Outlet({ channelFormat: 'string' })
    }

    private static async FloatOutlet() {
        return await this.Outlet({ channelFormat: 'float32' })
    }

    private static async Outlet(options?: Partial<LslOutletOptions>) {
        return await LslOutletImpl.Create({
            ...this.randomOutletOptions,
            ...options,
        })
    }
}

class CheckingOutlet extends LslOutletImpl {
    public constructor(options: LslOutletOptions) {
        super(options)
    }
}
