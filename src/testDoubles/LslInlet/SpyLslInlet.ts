import { StreamInfo } from '../../impl/LslStreamInfo'
import LslStreamInlet, { LslInletOptions } from '../../impl/LslStreamInlet'

export class SpyLslInlet extends LslStreamInlet {
    public constructor(info: StreamInfo, options: LslInletOptions) {
        super(info, options)
    }

    public getName() {
        return this.name
    }

    public getStreamInfo() {
        return this.info
    }
}
