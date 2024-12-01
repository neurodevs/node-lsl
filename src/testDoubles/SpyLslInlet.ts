import LslInlet, { LslInletOptions } from '../components/LslInlet'

export class SpyLslInlet extends LslInlet {
    public constructor(options: LslInletOptions) {
        super(options)
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
}
