import { ChannelFormat } from './LiblslAdapter.js'
import LslStreamInlet from './LslStreamInlet.js'

export default class LslWebSocketBridge implements StreamTransportBridge {
    public static Class?: StreamTransportBridgeConstructor

    protected constructor(_options: StreamTransportBridgeOptions) {}

    public static Create(options: StreamTransportBridgeOptions) {
        this.LslStreamInlet(options)
        return new (this.Class ?? this)(options)
    }

    private static LslStreamInlet(options: StreamTransportBridgeOptions) {
        return LslStreamInlet.Create({
            ...options,
            onData: (_samples: Float32Array, _timestamps: Float64Array) => {},
        })
    }
}

export interface StreamTransportBridge {}

export type StreamTransportBridgeConstructor = new () => StreamTransportBridge

export interface StreamTransportBridgeOptions {
    channelNames: string[]
    channelFormat: ChannelFormat
    sampleRateHz: number
    chunkSize: number
}
