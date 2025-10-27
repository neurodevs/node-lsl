export default class LslWebSocketBridge implements LslTransportBridge {
    public static Class?: LslTransportBridgeConstructor

    protected constructor() {}

    public static Create() {
        return new (this.Class ?? this)()
    }
}

export interface LslTransportBridge {}

export type LslTransportBridgeConstructor = new () => LslTransportBridge
