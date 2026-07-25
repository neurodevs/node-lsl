import WebSocket, { WebSocketServer } from 'ws'
import LslWebSocketBridge, {
    LslWsBridge,
    LslWsBridgeConstructorOptions,
} from '../../impl/LslWebSocketBridge.js'
import FakeWebSocket from '../WebSockets/FakeWebSocket.js'
import FakeWebSocketServer from '../WebSockets/FakeWebSocketServer.js'

export default class FakeLslWsBridge implements LslWsBridge {
    public static callsToConstructor: (
        LslWsBridgeConstructorOptions | undefined
    )[] = []

    public static numCallsToActivate = 0
    public static numCallsToDeactivate = 0
    public static numCallsToDestroy = 0

    public constructor(options?: LslWsBridgeConstructorOptions) {
        FakeLslWsBridge.callsToConstructor.push(options)
    }

    public async activate() {
        FakeLslWsBridge.numCallsToActivate++
    }

    public deactivate() {
        FakeLslWsBridge.numCallsToDeactivate++
    }

    public destroy() {
        FakeLslWsBridge.numCallsToDestroy++
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

    public static resetTestDouble() {
        this.callsToConstructor = []
        this.numCallsToActivate = 0
        this.numCallsToDeactivate = 0
        this.numCallsToDestroy = 0

        this.setFakeWebSocket()
        this.setFakeWebSocketServer()
    }
}
