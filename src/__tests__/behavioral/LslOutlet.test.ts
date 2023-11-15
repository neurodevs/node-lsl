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
	LslBindingsOutlet,
	LslBindingsStreamInfo,
	LslSample,
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
		this.channelIdx = randomInt(7)
		this.randomOutletOptions = {
			name: generateId(),
			type: generateId(),
			channelCount: randomInt(1, 10),
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
				'channelCount',
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
		this.assertThrowsInvalidChannelCount(0)
		this.assertThrowsInvalidChannelCount(-1)
		this.assertThrowsInvalidChannelCount(1.5)
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
	protected static async pushingSamplePassesCorrectOptionsToCreateStreamInfo() {
		this.pushSample([1])
		const { ...options } = this.randomOutletOptions as any

		delete options.manufacturer
		delete options.unit
		delete options.chunkSize
		delete options.maxBuffered

		assert.isEqualDeep(this.spyLsl.lastStreamInfoOptions, {
			...options,
			channelFormat: this.channelIdx,
		})
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

	private static assertThrowsInvalidChannelCount(count: number) {
		this.assertDoesThrowInvalidParameters({ channelCount: count }, [
			'channelCount',
		])
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
		return new LslOutlet({
			...this.randomOutletOptions,
			...options,
		})
	}
}

class SpyLiblsl implements Liblsl {
	public lastPushedOutlet?: LslBindingsOutlet
	public lastPushedSample?: LslSample
	public lastOutletOptions?: CreateOutletOptions
	public lastStreamInfoOptions?: CreateStreamInfoOptions
	public outlet: LslBindingsOutlet = {} as LslBindingsOutlet
	public streamInfo: LslBindingsStreamInfo = {} as LslBindingsStreamInfo

	public createStreamInfo(
		options: CreateStreamInfoOptions
	): LslBindingsStreamInfo {
		this.lastStreamInfoOptions = options
		return this.streamInfo
	}
	public createOutlet(options: CreateOutletOptions): LslBindingsOutlet {
		this.lastOutletOptions = options
		return this.outlet
	}
	public pushSample(outlet: LslBindingsOutlet, sample: LslSample): void {
		this.lastPushedOutlet = outlet
		this.lastPushedSample = sample
	}
}
