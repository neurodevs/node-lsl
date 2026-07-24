import LslEventMarkerEmitter from '../../impl/LslEventMarkerEmitter.js'
import { LslOutlet } from '../../impl/LslStreamOutlet.js'

export default class SpyLslEmitter extends LslEventMarkerEmitter {
    public static shouldCallWaitOnSuper = false

    public totalwaitAfterMs: number

    public constructor(outlet: LslOutlet) {
        super(outlet)

        this.totalwaitAfterMs = 0
    }

    public async wait(waitAfterMs: number) {
        this.totalwaitAfterMs += waitAfterMs

        if (SpyLslEmitter.shouldCallWaitOnSuper) {
            return super.wait(waitAfterMs)
        }
        return Promise.resolve()
    }

    public getStreamOutlet() {
        return this.outlet
    }

    public resetTestDouble() {
        this.totalwaitAfterMs = 0
    }
}
