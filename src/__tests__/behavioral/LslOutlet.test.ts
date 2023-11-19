import { randomInt } from 'crypto'
import AbstractSpruceTest, {
	test,
	assert,
	errorAssert,
	generateId,
} from '@sprucelabs/test-utils'
import LiblslImpl, {
	CreateOutletOptions,
	CreateStreamInfoOptions,
	Liblsl,
	BoundOutlet,
	BoundStreamInfo,
	LslChannel,
	LslSample,
	AppendChannelsToStreamInfoOptions,
	PushSampleOptions,
} from '../../Liblsl'
import LslOutlet, { ChannelFormat, LslOutletOptions } from '../../LslOutlet'

export const CHANNEL_FORMATS = [
	'undefined',
	'float32',
	'double64',
	'string',
	'int32',
	'int16',
	'int8',
	'int64',
] as const

export default class LslOutletTest extends AbstractSpruceTest {
	private static spyLsl: SpyLiblsl
	private static randomOutletOptions: LslOutletOptions
	private static channelIdx: number

	protected static async beforeEach() {
		await super.beforeEach()
		delete LslOutlet.Class
		this.channelIdx = randomInt(7)
		this.randomOutletOptions = {
			name: generateId(),
			type: generateId(),
			channelNames: new Array(randomInt(1, 10)).fill(generateId()),
			sampleRate: Math.random() * 10,
			channelFormat: CHANNEL_FORMATS[this.channelIdx],
			sourceId: generateId(),
			manufacturer: generateId(),
			unit: generateId(),
			chunkSize: randomInt(0, 10),
			maxBuffered: randomInt(0, 10),
		}

		this.spyLsl = new SpyLiblsl()
		LiblslImpl.setInstance(this.spyLsl)
	}

	@test()
	protected static async throwsWhenMissingRequiredParameters() {
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
	protected static async canCreateWithRequiredParams() {
		this.Outlet()
	}

	@test()
	protected static async throwsWithInvalidChannelCount() {
		this.assertThrowsInvalidChannelNames(0)
	}

	@test()
	protected static async throwsWithInvalidSampleRate() {
		this.assertThrowsInvalidSampleRate(0)
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
	protected static async supportsAllKnownChannelFormats() {
		const valid = CHANNEL_FORMATS
		for (const format of valid) {
			this.Outlet({ channelFormat: format as ChannelFormat })
		}
	}

	@test()
	protected static async throwWithInvalidChunkSize() {
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

	@test('pushing sample sends to lsl 1', [1])
	@test('pushing sample sends to lsl 2', [1, 2])
	protected static async pushingSampleSendsToLsl(sample: LslSample) {
		this.pushSample(sample)
		assert.isEqual(this.spyLsl.lastPushedOutlet, this.spyLsl.outlet)
		assert.isEqualDeep(this.spyLsl.lastPushedSample, sample)
		assert.isEqualDeep(this.spyLsl.lastOutletOptions, {
			info: this.spyLsl.streamInfo,
			chunkSize: this.randomOutletOptions.chunkSize,
			maxBuffered: this.randomOutletOptions.maxBuffered,
		})
	}

	@test()
	protected static async constructionPassesCorrectOptionsToCreateStreamInfo() {
		this.Outlet()

		const { ...options } = this.randomOutletOptions as any

		options.channelCount = options.channelNames.length

		delete options.manufacturer
		delete options.unit
		delete options.chunkSize
		delete options.maxBuffered
		delete options.channelNames

		assert.isEqualDeep(this.spyLsl.lastStreamInfoOptions, {
			...options,
			channelFormat: this.channelIdx,
		})
	}

	@test()
	protected static async canOverrideClasInstantiatedInFactory() {
		LslOutlet.Class = CheckingOutlet
		const instance = this.Outlet()
		assert.isInstanceOf(instance, CheckingOutlet)
	}

	@test('can add one label', [generateId()])
	@test('can add two labels', [generateId(), generateId()])
	protected static async appendsChannelsBasedOnCount(labels: string[]) {
		const type = generateId()
		const unit = generateId()

		this.Outlet({ channelNames: labels, type, unit })

		assert.isEqualDeep(this.spyLsl.lastAppendChannelsToStreamInfoOptions, {
			info: this.spyLsl.streamInfo,
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

		assert.isEqual(this.spyLsl.createStreamInfoHitCount, 1)
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

class SpyLiblsl implements Liblsl {
	public lastPushedOutlet?: BoundOutlet
	public lastPushedSample?: LslSample
	public lastOutletOptions?: CreateOutletOptions
	public lastStreamInfoOptions?: CreateStreamInfoOptions
	public outlet: BoundOutlet = {} as BoundOutlet
	public streamInfo: BoundStreamInfo = {} as BoundStreamInfo
	public lastAppendChannelsToStreamInfoOptions?: {
		info: BoundStreamInfo
		channels: LslChannel[]
	}
	public createStreamInfoHitCount = 0

	public createStreamInfo(options: CreateStreamInfoOptions): BoundStreamInfo {
		this.createStreamInfoHitCount++
		this.lastStreamInfoOptions = options
		return this.streamInfo
	}
	public appendChannelsToStreamInfo(
		options: AppendChannelsToStreamInfoOptions
	): void {
		this.lastAppendChannelsToStreamInfoOptions = options
	}

	public createOutlet(options: CreateOutletOptions): BoundOutlet {
		this.lastOutletOptions = options
		return this.outlet
	}
	public pushSample(options: PushSampleOptions): void {
		this.lastPushedOutlet = options.outlet
		this.lastPushedSample = options.sample
	}
}

class CheckingOutlet extends LslOutlet {
	public constructor(options: LslOutletOptions) {
		super(options)
	}
}