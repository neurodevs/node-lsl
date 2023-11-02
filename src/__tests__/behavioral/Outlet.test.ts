import AbstractSpruceTest, { test, assert } from '@sprucelabs/test-utils'
import Outlet from '../../Outlet'

export default class OutletTest extends AbstractSpruceTest {
	@test()
	protected static async outletThrowsWithInvalidNumChannels() {
		assert.doesThrow(() => new Outlet({ numChannels: 0 }))
		assert.doesThrow(() => new Outlet({ numChannels: -1 }))
		assert.doesThrow(() => new Outlet({ numChannels: 2.5 }))
	}
}
