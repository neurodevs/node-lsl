import LslWebSocketBridge, {
    LslWsBridgeConstructorOptions,
} from '../../impl/LslWebSocketBridge.js'

export default class SpyLslWsBridge extends LslWebSocketBridge {
    public constructor(options: LslWsBridgeConstructorOptions) {
        super(options)
    }
}
