import LslEventMarkerOutlet from '../../impl/LslEventMarkerOutlet.js'
import { LslOutlet } from '../../impl/LslStreamOutlet.js'

export default class SpyEventMarkerOutlet extends LslEventMarkerOutlet {
    public static shouldCallWaitOnSuper = false

    public totalWaitAfterMs: number

    public constructor(outlet: LslOutlet) {
        super(outlet)

        this.totalWaitAfterMs = 0
    }

    public async wait(waitAfterMs: number) {
        this.totalWaitAfterMs += waitAfterMs

        if (SpyEventMarkerOutlet.shouldCallWaitOnSuper) {
            return super.wait(waitAfterMs)
        }
        return Promise.resolve()
    }

    public getStreamOutlet() {
        return this.outlet
    }

    public resetTestDouble() {
        this.totalWaitAfterMs = 0
    }
}
