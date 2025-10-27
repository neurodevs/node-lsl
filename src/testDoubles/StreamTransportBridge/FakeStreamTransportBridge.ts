import { StreamTransportBridge } from '../../impl/LslWebSocketBridge'

export default class FakeStreamTransportBridge
    implements StreamTransportBridge
{
    public static numCallsToConstructor = 0

    public constructor() {
        FakeStreamTransportBridge.numCallsToConstructor++
    }

    public static resetTestDouble() {
        FakeStreamTransportBridge.numCallsToConstructor = 0
    }
}
