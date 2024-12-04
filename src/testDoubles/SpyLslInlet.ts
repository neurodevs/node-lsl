import LslInlet, { LslInletOptions } from '../components/LslInlet'
import { StreamInfo } from '../components/LslStreamInfo'

export class SpyLslInlet extends LslInlet {
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
