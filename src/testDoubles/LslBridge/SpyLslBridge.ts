import LslWebSocketBridge, {
    LslBridgeConstructorOptions,
} from '../../impl/LslWebSocketBridge.js'

export default class SpyLslWebSocketBridge extends LslWebSocketBridge {
    public constructor(options: LslBridgeConstructorOptions) {
        super(options)
    }
}
