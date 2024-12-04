import { LslOutletOptions } from '../components/LslOutlet'
import { StreamInfo } from '../components/LslStreamInfo'
import TimeMarkerOutletImpl from '../components/TimeMarkerOutlet'

export default class SpyTimeMarkerOutlet extends TimeMarkerOutletImpl {
    public passedOptions: LslOutletOptions
    public totalWaitTimeMs: number

    public constructor(info: StreamInfo, options: LslOutletOptions) {
        super(info, options)
        this.passedOptions = options
        this.totalWaitTimeMs = 0
    }

    public async wait(durationMs: number) {
        this.totalWaitTimeMs += durationMs
        return Promise.resolve()
    }
}
