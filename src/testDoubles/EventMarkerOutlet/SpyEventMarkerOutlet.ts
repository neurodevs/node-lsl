import LslEventMarkerOutlet from '../../impl/LslEventMarkerOutlet'
import { StreamOutlet } from '../../impl/LslStreamOutlet'

export default class SpyEventMarkerOutlet extends LslEventMarkerOutlet {
    public totalWaitTimeMs: number

    public constructor(outlet: StreamOutlet) {
        super(outlet)
        this.totalWaitTimeMs = 0
    }

    public async wait(durationMs: number) {
        this.totalWaitTimeMs += durationMs
        return Promise.resolve()
    }

    public getStreamOutlet() {
        return this.outlet
    }

    public resetTestDouble() {
        this.totalWaitTimeMs = 0
    }
}
