import AbstractSpruceTest, { test, assert } from '@sprucelabs/test-utils'
import Outlet from '../../Outlet'

export default class OutletTest extends AbstractSpruceTest {
	@test()
	protected static async outletThrowsWithInvalidNumChannels() {
		const errorMatcher = 'Invalid numChannels'
		assert.doesThrow(() => new Outlet({ numChannels: 0 }), errorMatcher)
		assert.doesThrow(() => new Outlet({ numChannels: -1 }), errorMatcher)
		assert.doesThrow(() => new Outlet({ numChannels: 2.5 }), errorMatcher)
	}

	@test()
	protected static async outletThrowsWithInvalidSampleRate() {
		const errorMatcher = 'Invalid sampleRate'
		assert.doesThrow(() => new Outlet({ sampleRate: 0 }), errorMatcher)
		assert.doesThrow(() => new Outlet({ sampleRate: -1 }), errorMatcher)
		assert.doesThrow(() => new Outlet({ sampleRate: -0.5 }), errorMatcher)
	}
}
