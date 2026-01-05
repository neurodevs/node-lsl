import { BackpressureMonitor } from '../../impl/LslBackpressureMonitor.js'

export default class FakeBackpressureMonitor implements BackpressureMonitor {
    public static numCallsToConstructor = 0

    public constructor() {
        FakeBackpressureMonitor.numCallsToConstructor++
    }

    public static resetTestDouble() {
        FakeBackpressureMonitor.numCallsToConstructor = 0
    }
}
