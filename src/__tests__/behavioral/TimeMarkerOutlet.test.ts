import { randomInt } from 'crypto'
import AbstractSpruceTest, {
	assert,
	generateId,
	test,
} from '@sprucelabs/test-utils'
import LiblslImpl from '../../implementations/Liblsl'
import TimeMarkerOutletImpl from '../../implementations/TimeMarkerOutlet'
import { LslOutletOptions } from '../../nodeLsl.types'
import FakeLiblsl from '../../testDoubles/FakeLiblsl'
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
		const markers = [this.generateDurationMarkerValues()]
		await this.outlet.pushMarkers(markers)

		assert.isEqual(this.fakeLiblsl.pushSampleStrtHitCount, 1)
		assert.isEqual(this.outlet.totalWaitTimeMs, markers[0].durationMs)
	}

	@test()
	protected static async pushingTwoMarkersIncrementsHitCountAndWaitTimeTwice() {
		const markers = await this.pushTotalMarkers(2)

		assert.isEqual(this.fakeLiblsl.pushSampleStrtHitCount, 2)
		assert.isEqual(
			this.outlet.totalWaitTimeMs,
			markers[0].durationMs + markers[1].durationMs
		)
	}

	@test('can stop on the first marker', 1)
	@test('can stop on the second marker', 2)
	@test('can stop on the third marker', 3)
	protected static async canStopTimeMarkersMidPush(bailIdx: number) {
		let hitCount = 0

		this.outlet.pushSample = () => {
			hitCount += 1
			if (hitCount === bailIdx) {
				this.outlet.stop()
			}
		}

		await this.pushTotalMarkers(10)

		assert.isEqual(hitCount, bailIdx)
	}

	@test()
	protected static async canStartAgainAfterStopping() {
		this.outlet.stop()

		let hitCount = 0

		this.outlet.pushSample = () => {
			hitCount++
		}

		await this.pushTotalMarkers(10)

		assert.isEqual(hitCount, 10)
	}

	@test()
	protected static async doesNotWaitIfStopped() {
		this.setupTimeMarkerImpl()

		const startMs = Date.now()

		const promise = this.pushTotalMarkers(2, 1000)

		this.outlet.stop()

		await promise

		const endMs = Date.now()
		assert.isBelow(endMs - startMs, 10)
	}

	@test()
	protected static async clearsTheTimeoutOnStop() {
		this.setupTimeMarkerImpl()

		const promise = this.pushTotalMarkers(2, 100)

		this.outlet.stop()
		this.outlet.pushSample = () => assert.fail('Should not have been called')

		await promise
		await this.wait(100)
	}

	private static setupTimeMarkerImpl() {
		TimeMarkerOutletImpl.Class = TimeMarkerOutletImpl as any
		this.outlet = this.Outlet()
	}

	private static async pushTotalMarkers(total: number, durationMs?: number) {
		const markers = new Array(total)
			.fill(null)
			.map(() => this.generateDurationMarkerValues(durationMs))

		await this.outlet.pushMarkers(markers)

		return markers
	}

	private static generateDurationMarkerValues(durationMs?: number) {
		return {
			name: generateId(),
			durationMs: durationMs ?? randomInt(100, 1000),
		}
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
