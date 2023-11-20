import { randomInt } from 'crypto'
import AbstractSpruceTest, {
	test,
	assert,
	errorAssert,
	generateId,
} from '@sprucelabs/test-utils'
import LiblslImpl, { LslSample } from '../../Liblsl'
import LslOutlet, { ChannelFormat, LslOutletOptions } from '../../LslOutlet'
import { SpyLiblsl } from '../SpyLiblsl'

export const CHANNEL_FORMATS = [
	'undefined',
	'float32',
	'double64',
	'string',
	'int32',
	'int16',
	'int8',
	'int64',
]

export default class LslOutletTest extends AbstractSpruceTest {
	private static spyLiblsl: SpyLiblsl
	private static randomOutletOptions: LslOutletOptions
	private static channelIdx: number

	protected static async beforeEach() {
		await super.beforeEach()
		delete LslOutlet.Class
		this.channelIdx = randomInt(8)
		this.randomOutletOptions = generateRandomOptions(this.channelIdx)
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
		const valid = CHANNEL_FORMATS
		for (const format of valid) {
			this.Outlet({ channelFormat: format as ChannelFormat })
		}
	}

	@test('pushing [1, 2] sample sends to LSL', [1, 2])
	@test('pushing [1] sample sends to LSL', [1])
	protected static async canPushSampleToLsl(sample: LslSample) {
		this.pushSample(sample)
		assert.isEqual(
			this.spyLiblsl.lastPushSampleOptions?.outlet,
			this.spyLiblsl.outlet
		)
		assert.isEqualDeep(this.spyLiblsl.lastPushSampleOptions?.sample, sample)
		assert.isEqualDeep(this.spyLiblsl.lastCreateOutletOptions, {
			info: this.spyLiblsl.streamInfo,
			chunkSize: this.randomOutletOptions.chunkSize,
			maxBuffered: this.randomOutletOptions.maxBuffered,
		})
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
			channelFormat: this.channelIdx,
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
	protected static async pushSampleShouldNotCreateMultipleOutlets() {
		const outlet = this.Outlet()
		outlet.pushSample([1])
		outlet.pushSample([2])
		outlet.pushSample([3])

		assert.isEqual(this.spyLiblsl.createStreamInfoHitCount, 1)
	}

	private static pushSample(sample: LslSample) {
		const outlet = this.Outlet()
		outlet.pushSample(sample)
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
}

class CheckingOutlet extends LslOutlet {
	public constructor(options: LslOutletOptions) {
		super(options)
	}
}

export function generateRandomOptions(randomChannelIdx: number) {
	return {
		name: generateId(),
		type: generateId(),
		channelNames: new Array(randomInt(1, 10)).fill(generateId()),
		sampleRate: Math.random() * 10,
		channelFormat: CHANNEL_FORMATS[randomChannelIdx],
		sourceId: generateId(),
		manufacturer: generateId(),
		unit: generateId(),
		chunkSize: randomInt(0, 10),
		maxBuffered: randomInt(0, 10),
	}
}
