import { LslOutletOptions } from '../components/LslOutlet'
import TimeMarkerOutletImpl from '../components/TimeMarkerOutlet'

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
