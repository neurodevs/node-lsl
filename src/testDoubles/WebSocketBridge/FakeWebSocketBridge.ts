import WebSocket, { WebSocketServer } from 'ws'
import LslWebSocketBridge, {
    WebSocketBridge,
} from '../../impl/LslWebSocketBridge.js'
import FakeWebSocket from '../WebSockets/FakeWebSocket.js'
import FakeWebSocketServer from '../WebSockets/FakeWebSocketServer.js'

export default class FakeWebSocketBridge implements WebSocketBridge {
    public static numCallsToConstructor = 0
    public static numCallsToActivate = 0
    public static numCallsToDeactivate = 0
    public static numCallsToDestroy = 0

    public constructor() {
        FakeWebSocketBridge.numCallsToConstructor++
    }

    public activate() {
        FakeWebSocketBridge.numCallsToActivate++
    }

    public deactivate() {
        FakeWebSocketBridge.numCallsToDeactivate++
    }

    public destroy() {
        FakeWebSocketBridge.numCallsToDestroy++
    }

    public static resetTestDouble() {
        this.numCallsToConstructor = 0
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
