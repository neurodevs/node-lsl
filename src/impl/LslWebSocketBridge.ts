import { WebSocketServer } from 'ws'
import { ChannelFormat } from './LiblslAdapter.js'
import LslStreamInlet, { StreamInlet } from './LslStreamInlet.js'

export default class LslWebSocketBridge implements WebSocketBridge {
    public static Class?: WebSocketBridgeConstructor
    public static WSS = WebSocketServer

    private inlet: StreamInlet
    private wss: WebSocketServer
    private isDestroyed = false

    protected constructor(options: WebSocketBridgeConstructorOptions) {
        const { inlet, wss } = options

        this.inlet = inlet
        this.wss = wss
    }

    public static Create(options: WebSocketBridgeOptions) {
        const { wssPort = 8080 } = options ?? {}
        const wss = this.WebSocketServer(wssPort)
        const inlet = this.LslStreamInlet(options, wss)

        return new (this.Class ?? this)({ ...options, inlet, wss })
    }

    public activate() {
        this.throwIfBridgeIsDestroyed()
        this.startPullingData()
    }

    private throwIfBridgeIsDestroyed() {
        if (this.isDestroyed) {
            throw new Error(
                `\n\n Cannot re-activate bridge after destroying it! \n\n Please create and activate a new instance. \n`
            )
        }
    }

    private startPullingData() {
        this.inlet.startPulling()
    }

    public deactivate() {
        this.stopPullingData()
    }

    private stopPullingData() {
        this.inlet.stopPulling()
    }

    public destroy() {
        this.destroyCppBoundInlet()
        this.closeWebSocketServer()
        this.isDestroyed = true
    }

    private destroyCppBoundInlet() {
        this.inlet.destroy()
    }

    private closeWebSocketServer() {
        this.wss.close()
    }

    private static createOnDataCallback(wss: WebSocketServer) {
        return (samples: Float32Array, timestamps: Float64Array) => {
            this.broadcastToClients(wss, samples, timestamps)
        }
    }

    private static broadcastToClients(
        wss: WebSocketServer,
        samples: Float32Array<ArrayBufferLike>,
        timestamps: Float64Array<ArrayBufferLike>
    ) {
        for (const client of wss.clients) {
            if (client.readyState === WebSocket.OPEN) {
                client.send(
                    JSON.stringify({
                        samples,
                        timestamps,
                    })
                )
            }
        }
    }

    private static LslStreamInlet(
        options: WebSocketBridgeOptions,
        wss: WebSocketServer
    ) {
        const onData = this.createOnDataCallback(wss)
        return LslStreamInlet.Create(options, onData)
    }

    private static WebSocketServer(wssPort: number) {
        return new this.WSS({ port: wssPort })
    }
}

export interface WebSocketBridge {
    activate(): void
    deactivate(): void
    destroy(): void
}

export type WebSocketBridgeConstructor = new (
    options: WebSocketBridgeConstructorOptions
) => WebSocketBridge

export interface WebSocketBridgeOptions {
    channelNames: string[]
    channelFormat: ChannelFormat
    sampleRateHz: number
    chunkSize: number
    name?: string
    type?: string
    sourceId?: string
    wssPort?: number
}

export interface WebSocketBridgeConstructorOptions
    extends WebSocketBridgeOptions {
    inlet: StreamInlet
    wss: WebSocketServer
}
