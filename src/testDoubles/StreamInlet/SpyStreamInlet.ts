import LslStreamInlet, {
    OnDataCallback,
    StreamInletOptions,
} from '../../impl/LslStreamInlet.js'

export class SpyStreamInlet extends LslStreamInlet {
    public constructor(options: StreamInletOptions, onData: OnDataCallback) {
        super(options, onData)
    }

    public getInfoHandle() {
        return this.infoHandle
    }

    public getInletHandle() {
        return this.inletHandle
    }
}
