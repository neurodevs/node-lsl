import { LslTransportBridge } from '../../impl/LslWebSocketBridge'

export default class FakeLslTransportBridge implements LslTransportBridge {
    public static numCallsToConstructor = 0

    public constructor() {
        FakeLslTransportBridge.numCallsToConstructor++
    }

    public static resetTestDouble() {
        FakeLslTransportBridge.numCallsToConstructor = 0
    }
}
