import AbstractSpruceTest, {
	test,
	assert,
	errorAssert,
	generateId,
} from '@sprucelabs/test-utils'
import LiblslImpl from '../../implementations/Liblsl'
import LslOutlet from '../../implementations/LslOutlet'
import { LslOutletOptions, LslSample } from '../../nodeLsl.types'
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
		delete LslOutlet.Class
		this.randomOutletOptions = generateRandomOutletOptions()

		const channelFormat = this.randomOutletOptions.channelFormat
		this.channelFormatIdx = TEST_CHANNEL_FORMATS_MAP[channelFormat]
		this.fakeLiblsl = new FakeLiblsl()
		LiblslImpl.setInstance(this.fakeLiblsl)
	}

	@test()
	protected static async throwsWhenMissingRequiredParams() {
		//@ts-ignore
		const err = assert.doesThrow(() => new LslOutlet())
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
		this.assertThrowsInvalidChannelNames(0)
	}

	@test()
	protected static async throwsWithInvalidSampleRate() {
		this.Outlet({ sampleRate: 0 })
		this.assertThrowsInvalidSampleRate(-1)
		this.assertThrowsInvalidSampleRate(-1.5)
	}

	@test()
	protected static async throwsWithInvalidChannelFormat() {
		//@ts-ignore
		this.assertDoesThrowInvalidParameters({ channelFormat: generateId() }, [
			'channelFormat',
		])
	}

	@test()
	protected static async throwsWithInvalidChunkSize() {
		this.Outlet({ chunkSize: 0 })
		this.assertThrowsInvalidChunkSize(-1)
		this.assertThrowsInvalidChunkSize(-1.5)
		this.assertThrowsInvalidChunkSize(1.5)
	}

	@test()
	protected static async throwsWithInvalidMaxBuffered() {
		this.Outlet({ maxBuffered: 0 })
		this.assertThrowsInvalidMaxBuffered(-1)
		this.assertThrowsInvalidMaxBuffered(-1.5)
		this.assertThrowsInvalidMaxBuffered(1.5)
	}

	@test()
	protected static async throwsWithUnsupportedType() {
		for (let unsupportedType of TEST_UNSUPPORTED_CHANNEL_FORMATS) {
			assert.doesThrow(
				() => this.Outlet({ channelFormat: unsupportedType }),
				`This method currently does not support the ${unsupportedType} type! Please implement it.`
			)
		}
	}

	@test()
	protected static async supportsAllKnownChannelFormats() {
		for (const format of TEST_SUPPORTED_CHANNEL_FORMATS) {
			this.Outlet({ channelFormat: format as TestChannelFormat })
		}
	}

	@test('pushing [1, 2] sample sends to LSL', [1.0, 2.0])
	@test('pushing [1] sample sends to LSL', [1.0])
	protected static async canPushFloatSampleToLsl(sample: LslSample) {
		const outlet = this.FloatOutlet()
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
		const outlet = this.StringOutlet()

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
		const outlet = this.StringOutlet()
		const sample = [generateId()]

		outlet.pushSample(sample)
		const t1 = this.fakeLiblsl.lastPushSampleStringTimestampOptions?.timestamp

		await this.wait(10)

		outlet.pushSample(sample)
		const t2 = this.fakeLiblsl.lastPushSampleStringTimestampOptions?.timestamp

		assert.isNotEqual(t1, t2)
		assert.isEqual(this.fakeLiblsl.localClockHitCount, 2)
	}

	@test()
	protected static async constructionCreatesStreamInfo() {
		this.Outlet()

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
		LslOutlet.Class = CheckingOutlet
		const instance = this.Outlet()

		assert.isInstanceOf(instance, CheckingOutlet)
	}

	@test('can add one label to channels', [generateId()])
	@test('can add two labels to channels', [generateId(), generateId()])
	protected static async appendsChannelsBasedOnCount(labels: string[]) {
		const type = generateId()
		const unit = generateId()

		this.Outlet({ channelNames: labels, type, unit })

		assert.isEqualDeep(this.fakeLiblsl.lastAppendChannelsToStreamInfoOptions, {
			info: this.fakeLiblsl.streamInfo,
			channels: labels.map((label) => ({
				label,
				type,
				unit,
			})),
		})
	}

	@test()
	protected static async canDestroyOutlet() {
		const outlet = this.Outlet()
		outlet.destroy()

		assert.isEqual(this.fakeLiblsl.destroyOutletHitCount, 1)
	}

	@test()
	protected static async pushSampleShouldNotCreateMultipleOutlets() {
		const outlet = this.FloatOutlet()
		outlet.pushSample([1.0])
		outlet.pushSample([2.0])
		outlet.pushSample([3.0])

		assert.isEqual(this.fakeLiblsl.createStreamInfoHitCount, 1)
	}

	private static assertThrowsInvalidMaxBuffered(maxBuffered: number) {
		this.assertDoesThrowInvalidParameters({ maxBuffered }, ['maxBuffered'])
	}

	private static assertThrowsInvalidChunkSize(chunkSize: number) {
		this.assertDoesThrowInvalidParameters({ chunkSize }, ['chunkSize'])
	}

	private static assertThrowsInvalidSampleRate(sampleRate: number) {
		this.assertDoesThrowInvalidParameters({ sampleRate }, ['sampleRate'])
	}

	private static assertThrowsInvalidChannelNames(count: number) {
		this.assertDoesThrowInvalidParameters(
			{ channelNames: new Array(count).fill(generateId()) },
			['channelNames']
		)
	}

	private static assertDoesThrowInvalidParameters(
		options: Partial<LslOutletOptions>,
		parameters: string[]
	) {
		const err = assert.doesThrow(() => this.Outlet(options))
		errorAssert.assertError(err, 'INVALID_PARAMETERS', {
			parameters,
		})
	}

	private static Outlet(options?: Partial<LslOutletOptions>) {
		return LslOutlet.Outlet({
			...this.randomOutletOptions,
			...options,
		})
	}

	private static StringOutlet() {
		return this.Outlet({ channelFormat: 'string' })
	}

	private static FloatOutlet() {
		return this.Outlet({ channelFormat: 'float32' })
	}
}

class CheckingOutlet extends LslOutlet {
	public constructor(options: LslOutletOptions) {
		super(options)
	}
}
