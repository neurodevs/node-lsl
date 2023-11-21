import { randomInt } from 'crypto'
import AbstractSpruceTest, { assert, test } from '@sprucelabs/test-utils'
import LiblslImpl from '../../Liblsl'
import { LslOutletOptions } from '../../LslOutlet'
import TimeMarkerOutlet from '../../TimeMarkerOutlet'
import generateRandomOutletOptions from '../support/generateRandomOutletOptions'
import { SpyLiblsl } from '../support/SpyLiblsl'

export default class TimeMarkerOutletTest extends AbstractSpruceTest {
	private static spyLiblsl: SpyLiblsl

	protected static async beforeEach() {
		await super.beforeEach()
		TimeMarkerOutlet.Class = SpyTimeMarkerOutlet
		this.spyLiblsl = new SpyLiblsl()
		LiblslImpl.setInstance(this.spyLiblsl)
	}

	@test()
	protected static async canCreateFromOutletMethod() {
		this.Outlet()
	}

	@test()
	protected static async loadsWithTimeMarkerSpecificOptions() {
		const outlet = this.Outlet()
		assert.isEqualDeep(outlet.options, {
			name: 'Time markers',
			type: 'Markers',
			channelNames: ['Markers'],
			sampleRate: 0,
			channelFormat: 'string',
			sourceId: 'time-markers',
			manufacturer: 'N/A',
			unit: 'N/A',
			chunkSize: 0,
			maxBuffered: 0,
		})
	}

	@test()
	protected static async canOverrideDefaultOptions() {
		const options = generateRandomOutletOptions(randomInt(8))
		const outlet = this.Outlet(options)
		assert.isEqualDeep(outlet.options, options)
	}

	private static Outlet(options?: Partial<LslOutletOptions>) {
		return TimeMarkerOutlet.Outlet(options) as SpyTimeMarkerOutlet
	}
}

class SpyTimeMarkerOutlet extends TimeMarkerOutlet {
	public options: LslOutletOptions
	public constructor(options: LslOutletOptions) {
		super(options)
		this.options = options
	}
}
