import {
    BleObserver,
    BleObserverOptions,
    OnAdvertisement,
} from '../../impl/controllers/BleObserverController.js'

export default class FakeBleObserver implements BleObserver {
    public static callsToConstructor: BleObserverOptions[] = []
    public static numCallsToStartObserving = 0
    public static numCallsToStopObserving = 0

    private readonly onAdvertisement?: OnAdvertisement

    public constructor(options: BleObserverOptions) {
        const { onAdvertisement } = options

        this.onAdvertisement = onAdvertisement

        FakeBleObserver.callsToConstructor.push(options)
    }

    public async startObserving() {
        FakeBleObserver.numCallsToStartObserving++
    }

    public async stopObserving() {
        FakeBleObserver.numCallsToStopObserving++
    }

    public simulateAdvertisement(
        data: Buffer,
        length: number,
        timestampSec: number
    ) {
        if (!this.onAdvertisement) {
            throw new Error(
                'Cannot simulate advertisement without passing onAdvertisement to the FakeBleObserver constructor!'
            )
        }
        this.onAdvertisement?.(data, length, timestampSec)
    }

    public static resetTestDouble() {
        FakeBleObserver.callsToConstructor = []
        FakeBleObserver.numCallsToStartObserving = 0
        FakeBleObserver.numCallsToStopObserving = 0
    }
}
