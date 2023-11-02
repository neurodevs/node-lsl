import AbstractSpruceTest, { test, assert } from '@sprucelabs/test-utils'
import Outlet from '../../Outlet'

export default class OutletTest extends AbstractSpruceTest {
	private static saneDefaults = {
		numChannels: 3,
		sampleRate: 100,
	}

	@test()
	protected static async outletThrowsWithInvalidNumChannels() {
		const errorMatcher = 'Invalid numChannels'
		assert.doesThrow(
			() => new Outlet({ ...this.saneDefaults, numChannels: 0 }),
			errorMatcher
		)
		assert.doesThrow(
			() => new Outlet({ ...this.saneDefaults, numChannels: -1 }),
			errorMatcher
		)
		assert.doesThrow(
			() => new Outlet({ ...this.saneDefaults, numChannels: 2.5 }),
			errorMatcher
		)
	}

	@test()
	protected static async outletThrowsWithInvalidSampleRate() {
		const errorMatcher = 'Invalid sampleRate'
		assert.doesThrow(
			() => new Outlet({ ...this.saneDefaults, sampleRate: 0 }),
			errorMatcher
		)
		assert.doesThrow(
			() => new Outlet({ ...this.saneDefaults, sampleRate: -1 }),
			errorMatcher
		)
		assert.doesThrow(
			() => new Outlet({ ...this.saneDefaults, sampleRate: -0.5 }),
			errorMatcher
		)
	}
}
