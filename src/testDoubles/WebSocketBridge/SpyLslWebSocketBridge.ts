import LslWebSocketBridge, {
    WebSocketBridgeConstructorOptions,
} from '../../impl/LslWebSocketBridge.js'

export default class SpyLslWebSocketBridge extends LslWebSocketBridge {
    public constructor(options: WebSocketBridgeConstructorOptions) {
        super(options)
    }
}
