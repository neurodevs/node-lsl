import { randomInt } from 'crypto'
import AbstractSpruceTest, {
	assert,
	generateId,
	test,
} from '@sprucelabs/test-utils'
import FakeLiblsl from '../../FakeLiblsl'
import LiblslImpl from '../../Liblsl'
import { LslOutletOptions } from '../../LslOutlet'
import TimeMarkerOutletImpl from '../../TimeMarkerOutlet'
import generateRandomOutletOptions from '../support/generateRandomOutletOptions'

export default class TimeMarkerOutletTest extends AbstractSpruceTest {
	private static fakeLiblsl: FakeLiblsl
	private static outlet: SpyTimeMarkerOutlet

	protected static async beforeEach() {
		await super.beforeEach()
		TimeMarkerOutletImpl.Class = SpyTimeMarkerOutlet
		this.fakeLiblsl = new FakeLiblsl()
		LiblslImpl.setInstance(this.fakeLiblsl)
		this.outlet = this.Outlet()
	}

	@test()
	protected static async loadsWithTimeMarkerSpecificOptions() {
		assert.isEqualDeep(this.outlet.spyOptions, {
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
		const options = generateRandomOutletOptions()
		const outlet = this.Outlet(options)
		assert.isEqualDeep(outlet.spyOptions, options)
	}

	@test()
	protected static async pushingSingleMarkerIncrementsHitCountAndWaitTime() {
		const markers = [this.generateRandomDurationMarker()]
		await this.outlet.pushMarkers(markers)
		assert.isEqual(this.fakeLiblsl.pushSampleStrtHitCount, 1)
		assert.isEqual(this.outlet.totalWaitTimeMs, markers[0].durationMs)
	}

	@test()
	protected static async pushingTwoMarkersIncrementsHitCountAndWaitTimeTwice() {
		const markers = [
			this.generateRandomDurationMarker(),
			this.generateRandomDurationMarker(),
		]
		await this.outlet.pushMarkers(markers)
		assert.isEqual(this.fakeLiblsl.pushSampleStrtHitCount, 2)
		assert.isEqual(
			this.outlet.totalWaitTimeMs,
			markers[0].durationMs + markers[1].durationMs
		)
	}

	private static generateRandomDurationMarker() {
		return { name: generateId(), durationMs: randomInt(100, 1000) }
	}

	private static Outlet(options?: Partial<LslOutletOptions>) {
		return TimeMarkerOutletImpl.TimeMarkerOutlet(options) as SpyTimeMarkerOutlet
	}
}

class SpyTimeMarkerOutlet extends TimeMarkerOutletImpl {
	public spyOptions: LslOutletOptions
	public totalWaitTimeMs: number

	public constructor(options: LslOutletOptions) {
		super(options)
		this.spyOptions = options
		this.totalWaitTimeMs = 0
	}

	public async wait(durationMs: number) {
		this.totalWaitTimeMs += durationMs
		return Promise.resolve()
	}
}
