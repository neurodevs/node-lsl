import { StreamInfo } from '../../impl/LslStreamInfo.js'
import LslStreamInlet, {
    OnDataCallback,
    StreamInletConstructorOptions,
} from '../../impl/LslStreamInlet.js'

export class SpyStreamInlet extends LslStreamInlet {
    public constructor(
        info: StreamInfo,
        options: StreamInletConstructorOptions,
        onData: OnDataCallback
    ) {
        super(info, options, onData)
    }

    public getStreamInfo() {
        return this.info
    }

    public getInletHandle() {
        return this.inletHandle
    }
}
