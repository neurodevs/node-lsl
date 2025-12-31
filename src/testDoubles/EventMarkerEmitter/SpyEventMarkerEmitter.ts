import LslEventMarkerEmitter from '../../impl/LslEventMarkerEmitter.js'
import { StreamOutlet } from '../../impl/LslStreamOutlet.js'

export default class SpyEventMarkerEmitter extends LslEventMarkerEmitter {
    public totalWaitForMs: number

    public constructor(outlet: StreamOutlet) {
        super(outlet)
        this.totalWaitForMs = 0
    }

    public async wait(waitForMs: number) {
        this.totalWaitForMs += waitForMs
        return Promise.resolve()
    }

    public getStreamOutlet() {
        return this.outlet
    }

    public resetTestDouble() {
        this.totalWaitForMs = 0
    }
}
