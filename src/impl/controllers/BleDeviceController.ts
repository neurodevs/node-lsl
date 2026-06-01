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
    protected log = console

    private deviceUuid: string
    private deviceName?: string
    private onConnected?: (peripheral: NativePeripheral) => void
    private connected = false

    protected constructor(options: BleControllerOptions) {
        const { deviceUuid, charCallbacks, onConnected, rssiIntervalMs } =
            options

        this.deviceUuid = deviceUuid
        this.charCallbacks = charCallbacks
        this.onConnected = onConnected
        this.rssiIntervalMs = rssiIntervalMs
    }

    public static async Create(options: BleControllerOptions) {
        return new (this.Class ?? this)(options)
    }

    public async connect() {
        this.createBleBackend()
        this.startBleBackend()

        await this.waitForOnConnected()
        await this.waitToDiscoverServices()
    }

    private createBleBackend() {
        const { status, error } = this.ndx.createBleBackend({
            deviceUuid: this.uuid,
        })

        if (status !== 200) {
            throw new Error(error)
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

        if (status !== 200) {
            throw new Error(error)
        }
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

        if (status !== 200) {
            throw new Error(error)
        }
    }

    public async disconnect() {
        const { status, error } = this.ndx.stopBleBackend({
            deviceUuid: this.uuid,
        })

        if (status !== 200) {
            throw new Error(error)
        }
    }

    public get uuid() {
        return this.deviceUuid
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

    writeCharacteristic(
        charUuid: CharacteristicUuid,
        value: string
    ): Promise<void>

    disconnect(): Promise<void>
}

export interface BleControllerOptions {
    deviceUuid: string
    charCallbacks: CharacteristicCallbacks
    onConnected?: (peripheral: NativePeripheral) => void
    rssiIntervalMs?: number
}

export type BleControllerConstructor = new (
    options: BleControllerOptions
) => BleController

export type CharacteristicCallbacks = {
    charUuid: string
    charName?: string
    onData: (data: Buffer, length: number, timestamp: number) => void
}[]

export type CharacteristicUuid = string
