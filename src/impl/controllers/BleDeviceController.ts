import { LibndxAdapter, Libndx, NativePeripheral } from '@neurodevs/ndx-native'

export default class BleDeviceController implements BleController {
    public static Class?: BleControllerConstructor
    public static setTimeout = setTimeout
    public static waitAfterMs = 1000

    private static _ndx?: Libndx

    public static get ndx() {
        if (!this._ndx) {
            this._ndx = LibndxAdapter.getInstance()
        }
        return this._ndx
    }

    public static set ndx(value: Libndx) {
        this._ndx = value
    }

    protected charCallbacks: CharacteristicCallbacks
    protected rssiIntervalMs?: number
    protected connected = false
    protected log = console

    private deviceUuid?: string
    private deviceNamePrefix?: string
    private deviceName?: string
    private onConnected?: (peripheral: NativePeripheral) => void

    protected constructor(options: BleControllerOptions) {
        const {
            deviceUuid,
            deviceNamePrefix,
            charCallbacks,
            onConnected,
            rssiIntervalMs,
        } = options

        this.deviceUuid = deviceUuid
        this.deviceNamePrefix = deviceNamePrefix
        this.charCallbacks = charCallbacks
        this.onConnected = onConnected
        this.rssiIntervalMs = rssiIntervalMs
    }

    public static async Create(options: BleControllerOptions) {
        return new (this.Class ?? this)(options)
    }

    public async connect() {
        if (!this.deviceUuid) {
            await this.discoverUuid()
        }

        this.createBleBackend()
        this.startBleBackend()

        await this.waitForOnConnected()
        await this.waitToDiscoverServices()

        this.setBleRssiInterval()
    }

    private async discoverUuid() {
        const { status, error } = this.ndx.discoverBleUuid({
            namePrefix: this.deviceNamePrefix as string,
            onDiscovered: (uuid: string) => {
                this.deviceUuid = uuid
            },
        })

        this.throwIfError(status, error)

        await this.waitForDiscoveredUuid()
    }

    private async waitForDiscoveredUuid() {
        await new Promise<void>((resolve) => {
            const checkDiscovered = () => {
                if (this.deviceUuid) {
                    resolve()
                } else {
                    BleDeviceController.setTimeout(checkDiscovered, 100)
                }
            }
            checkDiscovered()
        })
    }

    private createBleBackend() {
        const { status, error } = this.ndx.createBleBackend({
            deviceUuid: this.uuid,
        })

        this.throwIfError(status, error)
    }

    private throwIfError(status: number, error: string | undefined) {
        if (status !== 200) {
            throw new Error(`${status} error: ${error ?? 'Unknown error'}`)
        }
    }

    private setBleRssiInterval() {
        if (this.rssiIntervalMs) {
            this.ndx.setBleRssiInterval({
                deviceUuid: this.uuid,
                intervalMs: this.rssiIntervalMs,
                onRssi: (rssi: number) => {
                    this.log.info(`[RSSI=${rssi}]`)
                },
            })
        }
    }

    private startBleBackend() {
        const { status, error } = this.ndx.startBleBackend({
            deviceUuid: this.uuid,
            onConnected: (peripheral: NativePeripheral) => {
                const { name } = peripheral
                this.deviceName = name
                this.connected = true
                this.log.info(`Connected to device ${this.uuid}!`)
                this.onConnected?.(peripheral)
            },
            charCallbacks: this.charCallbacks,
        })

        this.throwIfError(status, error)
    }

    private async waitForOnConnected() {
        await new Promise<void>((resolve) => {
            const checkConnected = () => {
                if (this.connected) {
                    resolve()
                } else {
                    BleDeviceController.setTimeout(checkConnected, 100)
                }
            }
            checkConnected()
        })
    }

    private async waitToDiscoverServices() {
        await new Promise<void>((resolve) =>
            BleDeviceController.setTimeout(
                resolve,
                BleDeviceController.waitAfterMs
            )
        )
    }

    public async writeCharacteristic(
        charUuid: CharacteristicUuid,
        value: string
    ) {
        const { status, error } = this.ndx.writeBleCharacteristic({
            deviceUuid: this.uuid,
            charUuid,
            value,
        })

        this.throwIfError(status, error)
    }

    public async subscribeCharacteristics(
        charCallbacks: CharacteristicCallbacks
    ) {
        const { status, error } = this.ndx.addBleCharCallbacks({
            deviceUuid: this.uuid,
            charCallbacks,
        })

        this.throwIfError(status, error)

        this.charCallbacks = [...this.charCallbacks, ...charCallbacks]
    }

    public async disconnect() {
        const { status, error } = this.ndx.stopBleBackend({
            deviceUuid: this.uuid,
        })

        this.throwIfError(status, error)
        this.connected = false
    }

    public get uuid() {
        return this.deviceUuid ?? ''
    }

    public get name() {
        return this.deviceName ?? 'N/A'
    }

    private get ndx() {
        return BleDeviceController.ndx
    }
}

export interface BleController {
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

export type BleControllerOptions = {
    charCallbacks: CharacteristicCallbacks
    onConnected?: (peripheral: NativePeripheral) => void
    rssiIntervalMs?: number
} & (
    | { deviceUuid: string; deviceNamePrefix?: string }
    | { deviceUuid?: string; deviceNamePrefix: string }
)

export type BleControllerConstructor = new (
    options: BleControllerOptions
) => BleController

export type CharacteristicCallbacks = {
    charUuid: string
    charName?: string
    onData: (data: Buffer, length: number, timestampSec: number) => void
}[]

export type CharacteristicUuid = string
