import { randomInt } from 'crypto'
import AbstractSpruceTest, {
	test,
	assert,
	errorAssert,
	generateId,
} from '@sprucelabs/test-utils'
import ArrayType from 'ref-array-napi'
import ref from 'ref-napi'
import LiblslImpl, {
	CreateStreamInfoOptions,
	LiblslBindings,
	Liblsl,
	LslSample,
	StreamInfo,
	CreateOutletOptions,
	LslBindingsOutlet,
	LslBindingsStreamInfo,
	LslChannel,
} from '../../Liblsl'

export default class LiblslTest extends AbstractSpruceTest {
	private static lsl: Liblsl
	private static libraryPath?: string
	private static libraryOptions?: Record<string, any>
	private static fakeBindings: LiblslBindings
	private static fakeStreamInfo: StreamInfo
	private static fakeOutlet: LslBindingsOutlet
	private static createStreamInfoParams?: any[]
	private static createOutletParams?: any[]
	private static pushSampleParams?: any[]
	private static localClock: number
	private static shouldThrowWhenCreatingBindings: boolean

	protected static async beforeEach(): Promise<void> {
		await super.beforeEach()

		delete this.libraryPath
		delete this.libraryOptions
		delete this.createStreamInfoParams
		delete this.createOutletParams
		delete this.pushSampleParams

		process.env.LIBLSL_PATH = generateId()

		this.fakeStreamInfo = {}
		this.fakeOutlet = {}
		this.localClock = new Date().getTime()
		this.shouldThrowWhenCreatingBindings = false

		this.fakeBindings = {
			lsl_create_streaminfo: (...params: any[]) => {
				this.createStreamInfoParams = params
				return this.fakeStreamInfo
			},
			lsl_create_outlet: (...params: any[]) => {
				this.createOutletParams = params
				return this.fakeOutlet
			},
			lsl_push_sample_ft: (...params: any[]) => {
				this.pushSampleParams = params
				return 0
			},
			lsl_local_clock: () => this.localClock,
			lsl_get_desc: () => {
				this.didGetDescription = true
			},
		}

		LiblslImpl.ffi = {
			//@ts-ignore
			Library: (path: string, options: Record<string, any>) => {
				this.libraryPath = path
				this.libraryOptions = options
				if (this.shouldThrowWhenCreatingBindings) {
					throw new Error('Failed to create bindings')
				}
				return this.fakeBindings
			},
		}

		LiblslImpl.reset()
		this.lsl = LiblslImpl.getInstance()
	}

	@test()
	protected static async throwsIfNoEnvSet() {
		delete process.env.LIBLSL_PATH
		const err = assert.doesThrow(() => new LiblslImpl())
		errorAssert.assertError(err, 'MISSING_PARAMETERS', {
			parameters: ['env.LIBLSL_PATH'],
		})
	}

	@test()
	protected static async throwsHelpfulErrorWhenBindingsFailToLoad() {
		this.shouldThrowWhenCreatingBindings = true
		const err = assert.doesThrow(() => new LiblslImpl())
		errorAssert.assertError(err, 'FAILED_TO_LOAD_LIBLSL', {
			liblslPath: process.env.LIBLSL_PATH,
		})
	}

	@test()
	protected static async worksAsASingleton() {
		const liblsl = LiblslImpl.getInstance()
		assert.isInstanceOf(liblsl, LiblslImpl)
	}

	@test()
	protected static async singletonIsTheSame() {
		assert.isEqual(LiblslImpl.getInstance(), LiblslImpl.getInstance())
	}

	@test()
	protected static canSetInstance() {
		const fake = new FakeLiblsl()
		LiblslImpl.setInstance(fake)
		assert.isEqual(LiblslImpl.getInstance(), fake)
	}

	@test()
	protected static async createsExpectedBindingsToLiblsl() {
		process.env.LIBLSL_PATH = generateId()
		new LiblslImpl()
		assert.isEqual(this.libraryPath, process.env.LIBLSL_PATH)
		const expected = {
			lsl_create_streaminfo: [
				streamInfo,
				['string', 'string', 'int', 'double', 'int', 'string'],
			],
			lsl_create_outlet: [outletType, [streamInfo, 'int', 'int']],
			lsl_local_clock: ['double', []],
			lsl_push_sample_ft: ['void', [outletType, FloatArray, 'double']],
		}
		assert.isEqual(
			JSON.stringify(this.libraryOptions),
			JSON.stringify(expected)
		)
	}

	@test()
	protected static createStreamInfoThrowsWithMissingRequiredParams() {
		//@ts-ignore
		const err = assert.doesThrow(() => this.lsl.createStreamInfo())
		errorAssert.assertError(err, 'MISSING_PARAMETERS', {
			parameters: [
				'name',
				'type',
				'channelCount',
				'sampleRate',
				'channelFormat',
				'sourceId',
			],
		})
	}

	@test()
	protected static async canGetStreamInfoWithRequiredParams() {
		const options = this.generateRandomCreateStreamInfoOptions()
		const actual = this.lsl.createStreamInfo(options)

		assert.isEqual(actual, this.fakeStreamInfo)
		assert.isEqualDeep(this.createStreamInfoParams, Object.values(options))
	}

	@test()
	protected static async createOutletThrowsWhenMissingRequiredParams() {
		//@ts-ignore
		const err = assert.doesThrow(() => this.lsl.createOutlet({}))
		errorAssert.assertError(err, 'MISSING_PARAMETERS', {
			parameters: ['info', 'chunkSize', 'maxBuffered'],
		})
	}

	@test()
	protected static async canCreateOutletWithRequiredParams() {
		const info = this.createRandomStreamInfo()
		const options = {
			info,
			chunkSize: randomInt(10),
			maxBuffered: randomInt(10),
		}
		const actual = this.lsl.createOutlet(options)
		assert.isEqualDeep(this.createOutletParams, Object.values(options))
		assert.isEqual(actual, this.fakeOutlet)
	}

	@test()
	protected static async pushSampleThrowsWhenMissingRequiredParams() {
		//@ts-ignore
		const err = assert.doesThrow(() => this.lsl.pushSample())
		errorAssert.assertError(err, 'MISSING_PARAMETERS', {
			parameters: ['outlet', 'sample'],
		})
	}

	@test()
	protected static async pushSampleCallsBindings() {
		const expected = [1, 2, 3]
		this.lsl.pushSample(this.fakeOutlet, expected)
		assert.isEqual(this.pushSampleParams?.[0], this.fakeOutlet)
		assert.isEqual(this.pushSampleParams?.[1], expected)
		assert.isEqual(this.pushSampleParams?.[2], this.localClock)
	}

	@test()
	protected static async appendChannelsThrowsWithMissingParams() {
		const err = assert.doesThrow(() => this.lsl.appendChannelsToStreamInfo())
		errorAssert.assertError(err, 'MISSING_PARAMETERS', {
			parameters: ['info', 'channels'],
		})
	}

	@test()
	protected static async addingSingleChannelGetsDescription() {
		const info = this.createRandomStreamInfo()
		const channel: LslChannel = {
			label: generateId(),
			type: generateId(),
			unit: generateId(),
		}

		this.lsl.appendChannelsToStreamInfo(info, [channel])
		assert.isTrue(this.didGetDescription)
	}

	private static createRandomStreamInfo() {
		return this.lsl.createStreamInfo(
			this.generateRandomCreateStreamInfoOptions()
		)
	}

	private static generateRandomCreateStreamInfoOptions() {
		return {
			name: generateId(),
			type: generateId(),
			channelCount: randomInt(10),
			sampleRate: randomInt(10),
			channelFormat: randomInt(10),
			sourceId: generateId(),
		}
	}
}

class FakeLiblsl implements Liblsl {
	public createOutlet(_options: CreateOutletOptions): LslBindingsOutlet {
		return {} as LslBindingsOutlet
	}
	public createStreamInfo(
		_options: CreateStreamInfoOptions
	): LslBindingsStreamInfo {
		return {} as StreamInfo
	}
	public pushSample(_sample: LslSample): void {}
}

const streamInfo = ref.refType(ref.types.void)
const outletType = ref.refType(ref.types.void)
const FloatArray = ArrayType(ref.types.float)
