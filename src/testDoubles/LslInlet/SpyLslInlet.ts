import LslStreamInlet, {
    OnDataCallback,
    LslInletOptions,
} from '../../impl/LslStreamInlet.js'

export default class SpyLslInlet extends LslStreamInlet {
    public constructor(options: LslInletOptions, onData: OnDataCallback) {
        super(options, onData)
    }
}
