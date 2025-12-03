import { WebSocketServer } from 'ws'
import { ChannelFormat } from './LiblslAdapter.js'
import LslStreamInlet, {
    StreamInlet,
    StreamInletOptions,
} from './LslStreamInlet.js'

export default class LslWebSocketBridge implements WebSocketBridge {
    public static Class?: WebSocketBridgeConstructor
    public static WS = WebSocket
    public static WSS = WebSocketServer

    private inlet: StreamInlet
    private wss?: WebSocketServer
    private isDestroyed = false

    protected constructor(options: WebSocketBridgeConstructorOptions) {
        const { inlet, wss } = options

        this.inlet = inlet
        this.wss = wss
    }

    public static Create(options: WebSocketBridgeOptions) {
        const { localWebSocketPort, remoteWebSocketUrls, ...inletOptions } =
            options ?? {}

        const wss = this.WebSocketServer(localWebSocketPort)
        const sockets = this.createSocketsFrom(remoteWebSocketUrls)
        const inlet = this.LslStreamInlet(inletOptions, wss)

        return new (this.Class ?? this)({ ...options, inlet, wss, sockets })
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
        this.destroyBoundInlet()
        this.closeWebSocketServerIfEnabled()
        this.isDestroyed = true
    }

    private destroyBoundInlet() {
        this.inlet.destroy()
    }

    private closeWebSocketServerIfEnabled() {
        this.wss?.close()
    }

    private static createOnDataCallback(wss?: WebSocketServer) {
        return (samples: Float32Array, timestamps: Float64Array) => {
            if (wss) {
                this.broadcastToClients(wss, samples, timestamps)
            }
        }
    }

    private static broadcastToClients(
        wss: WebSocketServer,
        samples: Float32Array<ArrayBufferLike>,
        timestamps: Float64Array<ArrayBufferLike>
    ) {
        const paylod = JSON.stringify({ samples, timestamps })

        for (const client of wss.clients) {
            if (client.readyState === WebSocket.OPEN) {
                client.send(paylod)
            }
        }
    }

    private static createSocketsFrom(remoteWebSocketUrls?: string[]) {
        return remoteWebSocketUrls
            ? remoteWebSocketUrls.map((url) => this.WebSocket(url))
            : undefined
    }

    private static LslStreamInlet(
        options: StreamInletOptions,
        wss?: WebSocketServer
    ) {
        const onData = this.createOnDataCallback(wss)
        return LslStreamInlet.Create(options, onData)
    }

    private static WebSocket(url: string) {
        return new this.WS(url)
    }

    private static WebSocketServer(localWebSocketPort?: number) {
        return localWebSocketPort
            ? new this.WSS({ port: localWebSocketPort })
            : undefined
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
    localWebSocketPort?: number
    remoteWebSocketUrls?: string[]
}

export interface WebSocketBridgeConstructorOptions
    extends WebSocketBridgeOptions {
    inlet: StreamInlet
    wss?: WebSocketServer
    sockets?: WebSocket[]
}
