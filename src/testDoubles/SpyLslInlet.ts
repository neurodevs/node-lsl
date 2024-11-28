import LslInlet, { LslInletOptions } from '../components/LslInlet'

export class SpyLslInlet extends LslInlet {
    public constructor(options?: LslInletOptions) {
        super(options)
    }

    public getName() {
        return this.name
    }
}
