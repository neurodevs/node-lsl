import LslEventMarkerEmitter from '../../impl/LslEventMarkerEmitter.js'
import { StreamOutlet } from '../../impl/LslStreamOutlet.js'

export default class SpyEventMarkerEmitter extends LslEventMarkerEmitter {
    public static shouldCallWaitOnSuper = false

    public totalwaitAfterMs: number

    public constructor(outlet: StreamOutlet) {
        super(outlet)

        this.totalwaitAfterMs = 0
    }

    public async wait(waitAfterMs: number) {
        this.totalwaitAfterMs += waitAfterMs

        if (SpyEventMarkerEmitter.shouldCallWaitOnSuper) {
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
