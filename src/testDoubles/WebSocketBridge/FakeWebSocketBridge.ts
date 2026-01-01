import WebSocket, { WebSocketServer } from 'ws'
import LslWebSocketBridge, {
    WebSocketBridge,
    WebSocketBridgeConstructorOptions,
} from '../../impl/LslWebSocketBridge.js'
import FakeWebSocket from '../WebSockets/FakeWebSocket.js'
import FakeWebSocketServer from '../WebSockets/FakeWebSocketServer.js'

export default class FakeWebSocketBridge implements WebSocketBridge {
    public static callsToConstructor: (
        | WebSocketBridgeConstructorOptions
        | undefined
    )[] = []

    public static numCallsToActivate = 0
    public static numCallsToDeactivate = 0
    public static numCallsToDestroy = 0

    public constructor(options?: WebSocketBridgeConstructorOptions) {
        FakeWebSocketBridge.callsToConstructor.push(options)
    }

    public async activate() {
        FakeWebSocketBridge.numCallsToActivate++
    }

    public deactivate() {
        FakeWebSocketBridge.numCallsToDeactivate++
    }

    public destroy() {
        FakeWebSocketBridge.numCallsToDestroy++
    }

    public static resetTestDouble() {
        this.callsToConstructor = []
        this.numCallsToActivate = 0
        this.numCallsToDeactivate = 0
        this.numCallsToDestroy = 0

        this.setFakeWebSocket()
        this.setFakeWebSocketServer()
    }

    private static setFakeWebSocket() {
        LslWebSocketBridge.WS = FakeWebSocket as unknown as typeof WebSocket
        FakeWebSocket.resetTestDouble()
    }

    private static setFakeWebSocketServer() {
        LslWebSocketBridge.WSS =
            FakeWebSocketServer as unknown as typeof WebSocketServer
        FakeWebSocketServer.resetTestDouble()
    }
}
