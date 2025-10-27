export default class LslWebSocketBridge implements StreamTransportBridge {
    public static Class?: StreamTransportBridgeConstructor

    protected constructor() {}

    public static Create() {
        return new (this.Class ?? this)()
    }
}

export interface StreamTransportBridge {}

export type StreamTransportBridgeConstructor = new () => StreamTransportBridge
