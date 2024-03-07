import TimeMarkerOutletImpl from '../implementations/TimeMarkerOutlet'
import { LslOutletOptions } from '../nodeLsl.types'

export default class SpyTimeMarkerOutlet extends TimeMarkerOutletImpl {
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
