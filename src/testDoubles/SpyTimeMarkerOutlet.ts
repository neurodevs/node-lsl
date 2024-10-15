import { LslOutletOptions } from '../implementations/LslOutlet'
import TimeMarkerOutletImpl from '../implementations/TimeMarkerOutlet'

export default class SpyTimeMarkerOutlet extends TimeMarkerOutletImpl {
    public passedOptions: LslOutletOptions
    public totalWaitTimeMs: number

    public constructor(options: LslOutletOptions) {
        super(options)
        this.passedOptions = options
        this.totalWaitTimeMs = 0
    }

    public async wait(durationMs: number) {
        this.totalWaitTimeMs += durationMs
        return Promise.resolve()
    }
}
