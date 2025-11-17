import { ChannelFormat } from './LiblslAdapter.js'
import LslStreamInlet, { StreamInlet } from './LslStreamInlet.js'

export default class LslWebSocketBridge implements StreamTransportBridge {
    public static Class?: StreamTransportBridgeConstructor

    private inlet: StreamInlet

    protected constructor(options: StreamTransportBridgeConstructorOptions) {
        const { inlet } = options

        this.inlet = inlet
    }

    public static Create(options: StreamTransportBridgeOptions) {
        const inlet = this.LslStreamInlet(options)
        return new (this.Class ?? this)({ ...options, inlet })
    }

    public activate() {
        this.inlet.startPulling()
    }

    public deactivate() {
        this.inlet.stopPulling()
    }

    private static LslStreamInlet(options: StreamTransportBridgeOptions) {
        return LslStreamInlet.Create({
            ...options,
            onData: (_samples: Float32Array, _timestamps: Float64Array) => {},
        })
    }
}

export interface StreamTransportBridge {
    activate(): void
    deactivate(): void
}

export type StreamTransportBridgeConstructor = new () => StreamTransportBridge

export interface StreamTransportBridgeOptions {
    channelNames: string[]
    channelFormat: ChannelFormat
    sampleRateHz: number
    chunkSize: number
}

export interface StreamTransportBridgeConstructorOptions
    extends StreamTransportBridgeOptions {
    inlet: StreamInlet
}
