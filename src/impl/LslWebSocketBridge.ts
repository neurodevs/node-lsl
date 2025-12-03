import WebSocket, { WebSocketServer } from 'ws'
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
    private localServer?: WebSocketServer
    private remoteSockets?: WebSocket[]
    private isDestroyed = false

    protected constructor(options: WebSocketBridgeConstructorOptions) {
        const { inlet, localServer, remoteSockets } = options

        this.inlet = inlet
        this.localServer = localServer
        this.remoteSockets = remoteSockets
    }

    public static Create(options: WebSocketBridgeOptions) {
        const { localWebSocketPort, remoteWebSocketUrls, ...rest } = options
        const inletOptions: StreamInletOptions = rest

        const localServer = this.WebSocketServer(localWebSocketPort)
        const remoteSockets = this.createSocketsFrom(remoteWebSocketUrls)

        const inlet = this.LslStreamInlet(
            inletOptions,
            localServer,
            remoteSockets
        )

        return new (this.Class ?? this)({
            ...options,
            inlet,
            localServer,
            remoteSockets,
        })
    }

    public activate() {
        this.throwIfBridgeIsDestroyed(this.cannotActivateMessage)
        this.startPullingData()
    }

    private throwIfBridgeIsDestroyed(err: string) {
        if (this.isDestroyed) {
            throw new Error(err)
        }
    }

    private readonly cannotActivateMessage = `\n\n Cannot activate bridge after destroying it! \n\n Please create and activate a new instance. \n`

    private startPullingData() {
        this.inlet.startPulling()
    }

    public deactivate() {
        this.throwIfBridgeIsDestroyed(this.cannotDeactivateMessage)
        this.stopPullingData()
    }

    private readonly cannotDeactivateMessage = `\n\n Cannot deactivate bridge after destroying it! \n\n Please create and activate a new instance. \n`

    private stopPullingData() {
        this.inlet.stopPulling()
    }

    public destroy() {
        this.destroyBoundInlet()
        this.closeLocalServerIfExists()
        this.closeRemoteSocketsIfExists()
        this.isDestroyed = true
    }

    private destroyBoundInlet() {
        this.inlet.destroy()
    }

    private closeLocalServerIfExists() {
        this.localServer?.close()
    }

    private closeRemoteSocketsIfExists() {
        this.remoteSockets?.forEach((socket) => socket.close())
    }

    private static createOnDataCallback(
        localServer?: WebSocketServer,
        remoteSockets?: WebSocket[]
    ) {
        return (samples: Float32Array, timestamps: Float64Array) => {
            const payload = JSON.stringify({ samples, timestamps })

            if (localServer) {
                this.broadcastToClients(localServer, payload)
            }

            if (remoteSockets) {
                this.sendToSockets(remoteSockets, payload)
            }
        }
    }

    private static broadcastToClients(
        localServer: WebSocketServer,
        payload: string
    ) {
        for (const client of localServer.clients) {
            if (client.readyState === WebSocket.OPEN) {
                client.send(payload)
            }
        }
    }

    private static sendToSockets(remoteSockets: WebSocket[], payload: string) {
        for (const socket of remoteSockets) {
            if (socket.readyState === WebSocket.OPEN) {
                socket.send(payload)
            }
        }
    }

    private static createSocketsFrom(remoteWebSocketUrls?: string | string[]) {
        return remoteWebSocketUrls
            ? (Array.isArray(remoteWebSocketUrls)
                  ? remoteWebSocketUrls
                  : [remoteWebSocketUrls]
              ).map((url) => this.WebSocket(url))
            : undefined
    }

    private static WebSocket(url: string) {
        return new this.WS(url)
    }

    private static WebSocketServer(localWebSocketPort?: number) {
        return localWebSocketPort
            ? new this.WSS({ port: localWebSocketPort })
            : undefined
    }

    private static LslStreamInlet(
        options: StreamInletOptions,
        localServer?: WebSocketServer,
        remoteSockets?: WebSocket[]
    ) {
        const onData = this.createOnDataCallback(localServer, remoteSockets)
        return LslStreamInlet.Create(options, onData)
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
    remoteWebSocketUrls?: string | string[]
}

export interface WebSocketBridgeConstructorOptions
    extends WebSocketBridgeOptions {
    inlet: StreamInlet
    localServer?: WebSocketServer
    remoteSockets?: WebSocket[]
}
