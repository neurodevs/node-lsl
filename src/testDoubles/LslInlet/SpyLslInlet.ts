import { StreamInfo } from '../../modules/LslStreamInfo'
import LslStreamInlet, { LslInletOptions } from '../../modules/LslStreamInlet'

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
