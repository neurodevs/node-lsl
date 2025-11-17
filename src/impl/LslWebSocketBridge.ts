import { WebSocketServer } from 'ws'
import { ChannelFormat } from './LiblslAdapter.js'
import LslStreamInlet, { StreamInlet } from './LslStreamInlet.js'

export default class LslWebSocketBridge implements StreamTransportBridge {
    public static Class?: StreamTransportBridgeConstructor
    public static WSS = WebSocketServer

    private inlet: StreamInlet
    private wss: WebSocketServer

    protected constructor(options: StreamTransportBridgeConstructorOptions) {
        const { inlet, wss } = options

        this.inlet = inlet
        this.wss = wss
    }

    public static Create(options: StreamTransportBridgeOptions) {
        const inlet = this.LslStreamInlet(options)
        const wss = this.WebSocketServer()

        return new (this.Class ?? this)({ ...options, inlet, wss })
    }

    public activate() {
        this.inlet.startPulling()
    }

    public deactivate() {
        this.inlet.stopPulling()
    }

    public destroy() {
        this.destroyCppBoundInlet()
        this.closeWebSocketServer()
    }

    private destroyCppBoundInlet() {
        this.inlet.destroy()
    }

    private closeWebSocketServer() {
        this.wss.close()
    }

    private static LslStreamInlet(options: StreamTransportBridgeOptions) {
        return LslStreamInlet.Create({
            ...options,
            onData: (_samples: Float32Array, _timestamps: Float64Array) => {},
        })
    }

    private static WebSocketServer() {
        return new this.WSS({ port: 8080 })
    }
}

export interface StreamTransportBridge {
    activate(): void
    deactivate(): void
    destroy(): void
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
    wss: WebSocketServer
}
