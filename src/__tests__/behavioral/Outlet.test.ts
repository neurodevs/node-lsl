import AbstractSpruceTest, { test, assert } from '@sprucelabs/test-utils'
import Outlet, { ChannelFormat } from '../../Outlet'

export default class OutletTest extends AbstractSpruceTest {
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

	@test()
	protected static async outletHasRequiredProperties() {
		const outlet = this.createOutletWithDefaults({})
		const requiredProperties = Object.keys(this.saneDefaults)
		for (let requiredProperty of requiredProperties) {
			assert.isTrue(
				requiredProperty in outlet,
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
}
