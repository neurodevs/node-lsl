import { StreamInfo } from '../../impl/LslStreamInfo'
import LslStreamInlet, { StreamInletOptions } from '../../impl/LslStreamInlet'

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
}
