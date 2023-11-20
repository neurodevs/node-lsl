import { randomInt } from 'crypto'
import AbstractSpruceTest, { test } from '@sprucelabs/test-utils'
import LiblslImpl from '../../Liblsl'
import LslOutletImpl, { LslOutletOptions } from '../../LslOutlet'
import { SpyLiblsl } from '../SpyLiblsl'
import { generateRandomOptions } from './LslOutlet.test'

export default class TimeMarkerOutletTest extends AbstractSpruceTest {
	private static spyLiblsl: SpyLiblsl

	protected static async beforeEach() {
		await super.beforeEach()
		delete TimeMarkerOutlet.Class
		this.spyLiblsl = new SpyLiblsl()
		LiblslImpl.setInstance(this.spyLiblsl)
	}

	@test()
	protected static async canCreateFromOutletMethod() {
		TimeMarkerOutlet.Outlet({})
	}

	@test()
	protected static async canOverrideDefaultOptions() {
		const options = generateRandomOptions(randomInt(8))
		TimeMarkerOutlet.Outlet(options)
	}
}

class TimeMarkerOutlet extends LslOutletImpl {
	public static Outlet(options: Partial<LslOutletOptions>) {
		const defaultOptions = {
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
		}
		return new (this.Class ?? this)({ ...defaultOptions, ...options })
	}
}
