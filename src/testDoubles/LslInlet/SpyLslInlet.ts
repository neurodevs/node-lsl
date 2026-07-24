import LslStreamInlet, {
    OnDataCallback,
    LslInletOptions,
} from '../../impl/LslStreamInlet.js'

export class SpyLslInlet extends LslStreamInlet {
    public constructor(options: LslInletOptions, onData: OnDataCallback) {
        super(options, onData)
    }
}
