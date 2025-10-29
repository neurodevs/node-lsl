import { StreamInfo } from '../../impl/LslStreamInfo.js'
import LslStreamInlet, {
    StreamInletOptions,
} from '../../impl/LslStreamInlet.js'

export class SpyStreamInlet extends LslStreamInlet {
    public constructor(info: StreamInfo, options: StreamInletOptions) {
        super(info, options)
    }

    public getName() {
        return this.name
    }

    public getStreamInfo() {
        return this.info
    }

    public getBoundInlet() {
        return this.inlet
    }
}
