import LslInlet, { LslInletOptions } from '../components/LslInlet'
import { StreamInfo } from '../components/LslStreamInfo'

export class SpyLslInlet extends LslInlet {
    public constructor(info: StreamInfo, options: LslInletOptions) {
        super(info, options)
    }

    public getName() {
        return this.name
    }

    public getType() {
        return this.type
    }

    public getSourceId() {
        return this.sourceId
    }

    public getManufacturer() {
        return this.manufacturer
    }

    public getUnits() {
        return this.units
    }

    public getStreamInfo() {
        return this.streamInfo
    }
}
