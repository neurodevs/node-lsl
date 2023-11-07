import AbstractSpruceTest, { test, assert } from '@sprucelabs/test-utils'
import { ChannelFormat } from '../../Liblsl'
import Outlet from '../../Outlet'

export default class OutletTest extends AbstractSpruceTest {
	private static defaultOutlet: SpyOutlet
	private static saneDefaults = {
		name: 'Muse S (2nd gen) - EEG',
		type: 'EEG',
		channelCount: 5,
		sampleRate: 256,
		channelFormat: 'float32',
		sourceId: 'muse-eeg',
		manufacturer: 'Interaxon Inc.',
		unit: 'microvolts',
		chunkSize: 0,
		maxBuffered: 360,
	}

	private static validChannelFormats: ChannelFormat[] = [
		'undefined',
		'float32',
		'double64',
		'string',
		'int32',
		'int16',
		'int8',
		'int64',
	]

	protected static async beforeEach() {
		await super.beforeEach()
		process.env.LIBLSL_PATH =
			'/opt/homebrew/Cellar/lsl/1.16.2/lib/liblsl.1.16.2.dylib'
		this.defaultOutlet = this.createOutletWithDefaults({})
	}

	@test()
	protected static async outletHasRequiredProperties() {
		const requiredProperties = Object.keys(this.saneDefaults)
		for (let requiredProperty of requiredProperties) {
			assert.isTrue(
				requiredProperty in this.defaultOutlet,
				`${requiredProperty} does not exist on Outlet instance`
			)
		}
	}

	@test()
	protected static async outletPersistsValidSelectionFromChannelFormats() {
		for (let validChannelFormat of this.validChannelFormats) {
			const outlet = this.createOutletWithDefaults({
				channelFormat: validChannelFormat,
			})
			assert.isNumber(outlet.getChannelFormat())
		}
	}

	@test()
	protected static async outletThrowsWithInvalidNumChannels() {
		this.assertInvalidInputThrows(
			'channelCount',
			[0, 1.5, -1, -1.5],
			'Invalid channelCount'
		)
	}

	@test()
	protected static async outletThrowsWithInvalidSampleRate() {
		this.assertInvalidInputThrows(
			'sampleRate',
			[0, -1, -1.5],
			'Invalid sampleRate'
		)
	}

	@test()
	protected static async outletThrowsWithInvalidChannelFormat() {
		this.assertInvalidInputThrows(
			'channelFormat',
			['float', 'int', 'double', 1],
			'Invalid channelFormat'
		)
	}

	@test()
	protected static async outletThrowsWithInvalidChunkSize() {
		this.assertInvalidInputThrows(
			'chunkSize',
			[1.5, -1, -1.5],
			'Invalid chunkSize'
		)
	}

	@test()
	protected static async outletThrowsWithInvalidMaxBuffered() {
		this.assertInvalidInputThrows(
			'maxBuffered',
			[1.5, -1, -1.5],
			'Invalid maxBuffered'
		)
	}

	@test()
	protected static async outletCanInstantiateLiblsl() {
		assert.isTruthy(this.defaultOutlet.getLiblsl())
	}

	@test()
	protected static async outletHasStreamInfo() {
		assert.isTruthy(this.defaultOutlet.getStreamInfo())
	}

	@test()
	protected static async outletHasStreamInfoDescription() {
		assert.isTruthy(this.defaultOutlet.getDesc())
	}

	@test()
	protected static async outletCanCreateOutlet() {
		assert.isTruthy(this.defaultOutlet.getOutlet())
	}

	@test()
	protected static async outletCanPushSample() {
		this.defaultOutlet.pushSample([])
	}

	private static assertInvalidInputThrows(
		argName: string,
		invalidValues: any[],
		errorMatcher: string
	) {
		for (let invalidValue of invalidValues) {
			assert.doesThrow(
				() => this.createOutletWithDefaults({ [argName]: invalidValue }),
				errorMatcher
			)
		}
	}

	private static createOutletWithDefaults(args: any) {
		return new SpyOutlet({ ...this.saneDefaults, ...args })
	}
}

class SpyOutlet extends Outlet {
	public getChannelFormat() {
		return this.channelFormat
	}

	public getLiblsl() {
		return this.liblsl
	}

	public getStreamInfo() {
		return this.streamInfo
	}

	public getDesc() {
		return this.desc
	}

	public getOutlet() {
		return this.outlet
	}
}
