import { StreamInfo } from '../../components/LslStreamInfo'
import LslStreamInlet, {
    LslInletOptions,
} from '../../components/LslStreamInlet'

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
