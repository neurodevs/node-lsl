import { LibndxAdapter } from '@neurodevs/ndx-native'

export default class BleObserverController implements BleObserver {
    public static Class?: BleObserverConstructor

    private readonly deviceUuid: string
    private readonly ndx = LibndxAdapter.getInstance()

    protected constructor(options: BleObserverOptions) {
        const { deviceUuid } = options

        this.deviceUuid = deviceUuid ?? ''
    }

    public static Create(options: BleObserverOptions) {
        return new (this.Class ?? this)(options)
    }

    public async startObserving() {
        this.createBleObserverBackend()
    }

    private createBleObserverBackend() {
        this.ndx.createBleObserverBackend({
            deviceUuid: this.deviceUuid,
        })
    }
}
export interface BleObserver {
    startObserving(): Promise<void>
}

export type BleObserverConstructor = new (
    options: BleObserverOptions
) => BleObserver

export type BleObserverOptions = {
    deviceUuid: string
}
