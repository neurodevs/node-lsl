import { randomInt } from 'crypto'
import AbstractSpruceTest, {
	test,
	assert,
	errorAssert,
	generateId,
} from '@sprucelabs/test-utils'
import LiblslImpl, { LslSample } from '../../Liblsl'
import LslOutlet, { LslOutletOptions } from '../../LslOutlet'
import { TEST_CHANNEL_FORMATS, TestChannelFormat } from '../support/consts'
import generateRandomOutletOptions from '../support/generateRandomOutletOptions'
import { SpyLiblsl } from '../support/SpyLiblsl'

export default class LslOutletTest extends AbstractSpruceTest {
	private static spyLiblsl: SpyLiblsl
	private static randomOutletOptions: LslOutletOptions
	private static channelFormatIdx: number

	protected static async beforeEach() {
		await super.beforeEach()
		delete LslOutlet.Class
		this.channelFormatIdx = randomInt(8)
		this.randomOutletOptions = generateRandomOutletOptions(
			this.channelFormatIdx
		)
		this.spyLiblsl = new SpyLiblsl()
		LiblslImpl.setInstance(this.spyLiblsl)
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
	protected static async supportsAllKnownChannelFormats() {
		for (const format of TEST_CHANNEL_FORMATS) {
			this.Outlet({ channelFormat: format as TestChannelFormat })
		}
	}

	@test('pushing [1, 2] sample sends to LSL', [1.0, 2.0])
	@test('pushing [1] sample sends to LSL', [1.0])
	protected static async canPushFloatSampleToLsl(sample: LslSample) {
		const outlet = this.FloatOutlet()
		outlet.pushSample(sample)

		assert.isEqual(
			this.spyLiblsl.lastPushSampleFtOptions?.outlet,
			this.spyLiblsl.outlet
		)
		assert.isEqualDeep(this.spyLiblsl.lastPushSampleFtOptions?.sample, sample)
		assert.isEqualDeep(this.spyLiblsl.lastCreateOutletOptions, {
			info: this.spyLiblsl.streamInfo,
			chunkSize: this.randomOutletOptions.chunkSize,
			maxBuffered: this.randomOutletOptions.maxBuffered,
		})
		assert.isNumber(this.spyLiblsl.lastPushSampleFtOptions?.timestamp)
	}

	@test()
	protected static async canPushStringSampleToLsl() {
		const sample = [generateId()]
		const outlet = this.StringOutlet()

		outlet.pushSample(sample)

		assert.isEqual(
			this.spyLiblsl.lastPushSampleStrtOptions?.outlet,
			this.spyLiblsl.outlet
		)
		assert.isEqualDeep(this.spyLiblsl.lastPushSampleStrtOptions?.sample, sample)
		assert.isNumber(this.spyLiblsl.lastPushSampleStrtOptions?.timestamp)
	}

	@test()
	protected static async pushingStringTwiceGivesDifferentTimestamps() {
		const outlet = this.StringOutlet()
		const sample = [generateId()]

		outlet.pushSample(sample)
		const t1 = this.spyLiblsl.lastPushSampleStrtOptions?.timestamp

		await this.wait(10)

		outlet.pushSample(sample)
		const t2 = this.spyLiblsl.lastPushSampleStrtOptions?.timestamp

		assert.isNotEqual(t1, t2)
		assert.isEqual(this.spyLiblsl.localClockHitCount, 2)
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

		assert.isEqualDeep(this.spyLiblsl.lastCreateStreamInfoOptions, {
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

		assert.isEqualDeep(this.spyLiblsl.lastAppendChannelsToStreamInfoOptions, {
			info: this.spyLiblsl.streamInfo,
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

		assert.isEqual(this.spyLiblsl.destroyOutletHitCount, 1)
	}

	@test()
	protected static async pushSampleShouldNotCreateMultipleOutlets() {
		const outlet = this.FloatOutlet()
		outlet.pushSample([1.0])
		outlet.pushSample([2.0])
		outlet.pushSample([3.0])

		assert.isEqual(this.spyLiblsl.createStreamInfoHitCount, 1)
	}

	@test()
	protected static async pushSampleThrowsWithUnsupportedType() {
		const unsupportedTypes = [
			'undefined',
			'double64',
			'int32',
			'int16',
			'int8',
			'int64',
		] as const

		for (let unsupportedType of unsupportedTypes) {
			const outlet = this.Outlet({ channelFormat: unsupportedType })
			assert.doesThrow(
				() => outlet.pushSample([]),
				`This method currently does not support the ${unsupportedType} type! Please implement it.`
			)
		}
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
