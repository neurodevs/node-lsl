import {
    BleObserver,
    BleObserverOptions,
} from '../../impl/controllers/BleObserverController.js'

export default class FakeBleObserver implements BleObserver {
    public static callsToConstructor: BleObserverOptions[] = []
    public static numCallsToStartObserving = 0

    public constructor(options: BleObserverOptions) {
        FakeBleObserver.callsToConstructor.push(options)
    }

    public async startObserving() {
        FakeBleObserver.numCallsToStartObserving++
    }

    public static resetTestDouble() {
        FakeBleObserver.callsToConstructor = []
        FakeBleObserver.numCallsToStartObserving = 0
    }
}
