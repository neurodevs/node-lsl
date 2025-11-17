import { StreamTransportBridge } from '../../impl/LslWebSocketBridge.js'

export default class FakeStreamTransportBridge
    implements StreamTransportBridge
{
    public static numCallsToConstructor = 0
    public static numCallsToActivate = 0
    public static numCallsToDeactivate = 0
    public static numCallsToDestroy = 0

    public constructor() {
        FakeStreamTransportBridge.numCallsToConstructor++
    }

    public activate() {
        FakeStreamTransportBridge.numCallsToActivate++
    }

    public deactivate() {
        FakeStreamTransportBridge.numCallsToDeactivate++
    }

    public destroy() {
        FakeStreamTransportBridge.numCallsToDestroy++
    }

    public static resetTestDouble() {
        FakeStreamTransportBridge.numCallsToConstructor = 0
        FakeStreamTransportBridge.numCallsToActivate = 0
        FakeStreamTransportBridge.numCallsToDeactivate = 0
        FakeStreamTransportBridge.numCallsToDestroy = 0
    }
}
