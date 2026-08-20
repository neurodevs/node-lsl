import { LibndxAdapter, NativePeripheral } from '@neurodevs/ndx-native'

export default class BleGattController implements BleGatt {
    public static Class?: BleGattConstructor
    public static setTimeout = setTimeout
    public static waitAfterMs = 1000

    protected charCallbacks: CharacteristicCallbacks
    protected rssiIntervalMs?: number
    protected state: BleGattState = { status: 'disconnected' }
    protected log = console

    private deviceNamePrefix?: string
    private onConnected?: (peripheral: NativePeripheral) => void

    private readonly ndx = LibndxAdapter.getInstance()

    protected constructor(options: BleGattOptions) {
        const {
            deviceUuid,
            deviceNamePrefix,
            charCallbacks,
            onConnected,
            rssiIntervalMs,
        } = options

        this.state = { status: 'disconnected', uuid: deviceUuid }
        this.deviceNamePrefix = deviceNamePrefix
        this.charCallbacks = charCallbacks
        this.onConnected = onConnected
        this.rssiIntervalMs = rssiIntervalMs
    }

    public static Create(options: BleGattOptions) {
        return new (this.Class ?? this)(options)
    }

    public async connect() {
        if (!this.state.uuid) {
            await this.discoverUuid()
        }

        this.state = { status: 'connecting', uuid: this.uuid }

        this.createBleGattBackend()
        this.startBleGattBackend()

        await this.waitForOnConnected()
        await this.waitToDiscoverServices()

        this.startBleGattRssiPolling()
    }

    private async discoverUuid() {
        const { status, error } = this.ndx.discoverBleUuid({
            namePrefix: this.deviceNamePrefix as string,
            onDiscovered: (uuid: string) => {
                this.state = { status: 'disconnected', uuid }
            },
        })

        this.throwIfError(status, error)

        await this.waitForDiscoveredUuid()
    }

    private async waitForDiscoveredUuid() {
        await new Promise<void>((resolve) => {
            const checkDiscovered = () => {
                if (this.uuid) {
                    resolve()
                } else {
                    BleGattController.setTimeout(checkDiscovered, 100)
                }
            }
            checkDiscovered()
        })
    }

    private createBleGattBackend() {
        const { status, error } = this.ndx.createBleGattBackend({
            deviceUuid: this.uuid,
        })

        this.throwIfError(status, error)
    }

    private throwIfError(status: number, error: string | undefined) {
        if (status !== 200) {
            throw new Error(`${status} error: ${error ?? 'Unknown error'}`)
        }
    }

    private startBleGattRssiPolling() {
        if (this.rssiIntervalMs) {
            this.ndx.startBleGattRssiPolling({
                deviceUuid: this.uuid,
                intervalMs: this.rssiIntervalMs,
                onRssi: (rssi: number) => {
                    this.log.info(`[RSSI=${rssi}]`)
                },
            })
        }
    }

    private startBleGattBackend() {
        const { status, error } = this.ndx.startBleGattBackend({
            deviceUuid: this.uuid,
            onConnected: (peripheral: NativePeripheral) => {
                const { name } = peripheral
                this.state = { status: 'connected', uuid: this.uuid, name }
                this.log.info(`Connected to device ${this.uuid}!`)
                this.onConnected?.(peripheral)
            },
            charCallbacks: [...this.charCallbacks],
        })

        this.throwIfError(status, error)
    }

    private async waitForOnConnected() {
        await new Promise<void>((resolve) => {
            const checkConnected = () => {
                if (this.state.status === 'connected') {
                    resolve()
                } else {
                    BleGattController.setTimeout(checkConnected, 100)
                }
            }
            checkConnected()
        })
    }

    private async waitToDiscoverServices() {
        await new Promise<void>((resolve) =>
            BleGattController.setTimeout(resolve, BleGattController.waitAfterMs)
        )
    }

    public async writeCharacteristic(
        charUuid: CharacteristicUuid,
        value: string
    ) {
        const { status, error } = this.ndx.writeBleGattChar({
            deviceUuid: this.requireUuid(),
            charUuid,
            value,
        })

        this.throwIfError(status, error)
    }

    public async subscribeCharacteristics(
        charCallbacks: CharacteristicCallbacks
    ) {
        const { status, error } = this.ndx.registerBleGattCharCallbacks({
            deviceUuid: this.requireUuid(),
            charCallbacks: [...charCallbacks],
        })

        this.throwIfError(status, error)

        this.charCallbacks = [...this.charCallbacks, ...charCallbacks]
    }

    public async disconnect() {
        const { status, error } = this.ndx.stopBleGattBackend({
            deviceUuid: this.requireUuid(),
        })

        this.throwIfError(status, error)
        this.state = { status: 'disconnected', uuid: this.state.uuid }
    }

    public get uuid() {
        return this.state.uuid ?? ''
    }

    public get name() {
        return this.state.name ?? 'N/A'
    }

    private requireUuid() {
        if (!this.uuid) {
            throw new Error(
                'Device uuid is not resolved yet! Must either pass as option to Create or call connect() first.'
            )
        }
        return this.uuid
    }
}

export interface BleGatt {
    uuid: string
    name: string

    connect(): Promise<void>

    subscribeCharacteristics(
        charCallbacks: CharacteristicCallbacks
    ): Promise<void>

    writeCharacteristic(
        charUuid: CharacteristicUuid,
        value: string
    ): Promise<void>

    disconnect(): Promise<void>
}

export type BleGattOptions = {
    charCallbacks: CharacteristicCallbacks
    onConnected?: (peripheral: NativePeripheral) => void
    rssiIntervalMs?: number
} & (
    | { deviceUuid: string; deviceNamePrefix?: string }
    | { deviceUuid?: string; deviceNamePrefix: string }
)

export type BleGattConstructor = new (options: BleGattOptions) => BleGatt

export type BleGattState =
    | { status: 'disconnected'; uuid?: string; name?: string }
    | { status: 'connecting'; uuid: string; name?: string }
    | { status: 'connected'; uuid: string; name: string }

export type CharacteristicCallbacks = readonly {
    charUuid: string
    charName?: string
    onData: (data: Buffer, length: number, timestampSec: number) => void
}[]

export type CharacteristicUuid = string
