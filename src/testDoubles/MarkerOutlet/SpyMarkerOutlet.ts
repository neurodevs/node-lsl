import EventMarkerOutlet from '../../components/EventMarkerOutlet'
import { LslOutlet } from '../../components/LslStreamOutlet'

export default class SpyMarkerOutlet extends EventMarkerOutlet {
    public totalWaitTimeMs: number

    public constructor(lslOutlet: LslOutlet) {
        super(lslOutlet)
        this.totalWaitTimeMs = 0
    }

    public async wait(durationMs: number) {
        this.totalWaitTimeMs += durationMs
        return Promise.resolve()
    }

    public getLslOutlet() {
        return this.lslOutlet
    }

    public resetTestDouble() {
        this.totalWaitTimeMs = 0
    }
}
