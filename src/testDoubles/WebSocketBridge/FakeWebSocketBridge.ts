import { WebSocketBridge } from '../../impl/LslWebSocketBridge.js'

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
        FakeWebSocketBridge.numCallsToConstructor = 0
        FakeWebSocketBridge.numCallsToActivate = 0
        FakeWebSocketBridge.numCallsToDeactivate = 0
        FakeWebSocketBridge.numCallsToDestroy = 0
    }
}
