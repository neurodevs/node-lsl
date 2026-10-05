import { LibndxAdapter, NativeAdvertisement } from '@neurodevs/ndx-native'

export default class BleObserverController implements BleObserver {
    public static Class?: BleObserverConstructor

    private readonly deviceNamePrefix?: string
    private readonly onAdvertisement?: OnAdvertisement
    private readonly ndx = LibndxAdapter.getInstance()

    private deviceUuid: string

    protected constructor(options: BleObserverOptions) {
        const { deviceUuid, deviceNamePrefix, onAdvertisement } = options

        if (deviceUuid && deviceNamePrefix) {
            this.throwTooManyParams()
        }

        this.deviceUuid = deviceUuid ?? ''
        this.deviceNamePrefix = deviceNamePrefix
        this.onAdvertisement = onAdvertisement
    }

    public static Create(options: BleObserverOptions) {
        return new (this.Class ?? this)(options)
    }

    private throwTooManyParams() {
        throw new Error(
            'Cannot pass both deviceUuid and deviceNamePrefix! Please pass only one.'
        )
    }

    public async startObserving() {
        if (!this.deviceUuid && this.deviceNamePrefix) {
            await this.discoverUuid(this.deviceNamePrefix)
        }

        this.createBleObserverBackend()
        this.startBleObserverBackend()
    }

    private discoverUuid(namePrefix: string) {
        return new Promise<void>((resolve) => {
            const { status, error } = this.ndx.discoverBleUuid({
                namePrefix,
                onDiscovered: (uuid: string) => {
                    this.deviceUuid = uuid
                    resolve()
                },
            })

            this.throwIfError(status, error)
        })
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
            onAdvertisement: (advertisement: NativeAdvertisement) => {
                this.onAdvertisement?.(advertisement)
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
    onAdvertisement?: OnAdvertisement
} & (
    | { deviceUuid: string; deviceNamePrefix?: string }
    | { deviceUuid?: string; deviceNamePrefix: string }
)

export type BleAdvertisement = NativeAdvertisement

export type OnAdvertisement = (advertisement: BleAdvertisement) => void
