import { BleObserver } from '../../impl/BleObserverController.js'

export default class FakeBleObserver implements BleObserver {
    public static numCallsToConstructor = 0

    public constructor() {
        FakeBleObserver.numCallsToConstructor++
    }

    public static resetTestDouble() {
        FakeBleObserver.numCallsToConstructor = 0
    }
}
