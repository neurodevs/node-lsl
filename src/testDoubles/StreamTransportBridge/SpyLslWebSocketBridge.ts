import LslWebSocketBridge, {
    StreamTransportBridgeConstructorOptions,
} from '../../impl/LslWebSocketBridge.js'

export default class SpyLslWebSocketBridge extends LslWebSocketBridge {
    public constructor(options: StreamTransportBridgeConstructorOptions) {
        super(options)
    }
}
