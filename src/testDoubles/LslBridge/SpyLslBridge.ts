import LslWebSocketBridge, {
    LslBridgeConstructorOptions,
} from '../../impl/LslWebSocketBridge.js'

export default class SpyLslBridge extends LslWebSocketBridge {
    public constructor(options: LslBridgeConstructorOptions) {
        super(options)
    }
}
