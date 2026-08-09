import { LibndxAdapter } from '@neurodevs/ndx-native'

export default class BleObserverController implements BleObserver {
    public static Class?: BleObserverConstructor

    private readonly deviceUuid: string
    private readonly onAdvertisement?: OnAdvertisement
    private readonly ndx = LibndxAdapter.getInstance()

    protected constructor(options: BleObserverOptions) {
        const { deviceUuid, onAdvertisement } = options

        this.deviceUuid = deviceUuid ?? ''
        this.onAdvertisement = onAdvertisement
    }

    public static Create(options: BleObserverOptions) {
        return new (this.Class ?? this)(options)
    }

    public async startObserving() {
        this.createBleObserverBackend()
        this.startBleObserverBackend()
    }

    private createBleObserverBackend() {
        const { status, error } = this.ndx.createBleObserverBackend({
            deviceUuid: this.deviceUuid,
        })

        this.throwIfError(status, error)
    }

    private startBleObserverBackend() {
        const { status, error } = this.ndx.startBleObserverBackend({
            deviceUuid: this.deviceUuid,
            onAdvertisement: (
                data: Buffer,
                length: number,
                timestampSec: number
            ) => {
                this.onAdvertisement?.(data, length, timestampSec)
            },
        })

        this.throwIfError(status, error)
    }

    public async stopObserving() {
        this.stopBleObserverBackend()
    }

    private stopBleObserverBackend() {
        const { status, error } = this.ndx.stopBleObserverBackend({
            deviceUuid: this.deviceUuid,
        })

        this.throwIfError(status, error)
    }

    private throwIfError(status: number, error: string | undefined) {
        if (status !== 200) {
            throw new Error(`${status} error: ${error ?? 'Unknown error'}`)
        }
    }
}
export interface BleObserver {
    startObserving(): Promise<void>
    stopObserving(): Promise<void>
}

export type BleObserverConstructor = new (
    options: BleObserverOptions
) => BleObserver

export type BleObserverOptions = {
    deviceUuid: string
    onAdvertisement?: OnAdvertisement
}

export type OnAdvertisement = (
    data: Buffer,
    length: number,
    timestampSec: number
) => void
