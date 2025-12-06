import { StreamInfo } from '../../impl/LslStreamInfo.js'
import LslStreamInlet, {
    OnDataCallback,
    StreamInletOptions,
} from '../../impl/LslStreamInlet.js'

export class SpyStreamInlet extends LslStreamInlet {
    public constructor(
        info: StreamInfo,
        options: StreamInletOptions,
        onData: OnDataCallback
    ) {
        super(info, options, onData)
    }

    public getStreamInfo() {
        return this.info
    }

    public getBoundInlet() {
        return this.inlet
    }
}
