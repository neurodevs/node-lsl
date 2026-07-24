import WebSocket, { WebSocketServer } from 'ws'
import LslWebSocketBridge, {
    LslBridge,
    LslBridgeConstructorOptions,
} from '../../impl/LslWebSocketBridge.js'
import FakeWebSocket from '../WebSockets/FakeWebSocket.js'
import FakeWebSocketServer from '../WebSockets/FakeWebSocketServer.js'

export default class FakeLslBridge implements LslBridge {
    public static callsToConstructor: (
        LslBridgeConstructorOptions | undefined
    )[] = []

    public static numCallsToActivate = 0
    public static numCallsToDeactivate = 0
    public static numCallsToDestroy = 0

    public constructor(options?: LslBridgeConstructorOptions) {
        FakeLslBridge.callsToConstructor.push(options)
    }

    public async activate() {
        FakeLslBridge.numCallsToActivate++
    }

    public deactivate() {
        FakeLslBridge.numCallsToDeactivate++
    }

    public destroy() {
        FakeLslBridge.numCallsToDestroy++
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
