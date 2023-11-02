import AbstractSpruceTest, { test, assert } from '@sprucelabs/test-utils'
import Outlet from '../../Outlet'

export default class OutletTest extends AbstractSpruceTest {
	@test()
	protected static async canCreateOutlet() {
		const outlet = new Outlet()
		assert.isTruthy(outlet)
	}
}
