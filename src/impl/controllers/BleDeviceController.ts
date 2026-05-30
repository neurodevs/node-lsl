import { LibndxAdapter, Libndx } from '@neurodevs/ndx-native'

export default class BleDeviceController implements BleController {
    public static Class?: BleControllerConstructor
    public static setInterval = setInterval
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

    protected constructor(options: BleControllerConstructorOptions) {
        const { deviceUuid, charCallbacks, rssiIntervalMs } = options

        this.deviceUuid = deviceUuid
        this.charCallbacks = charCallbacks
        this.rssiIntervalMs = rssiIntervalMs
    }

    public static async Create(options: BleControllerOptions) {
        return new (this.Class ?? this)(options)
    }

    public async connect() {
        this.createBleBackend()
        this.startBleBackend()
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
            charCallbacks: this.charCallbacks,
        })

        if (status !== 200) {
            throw new Error(error)
        }
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
        const { status, error } = this.ndx.destroyBleBackend({ deviceUuid: this.uuid })

        if (status !== 200) {
            throw new Error(error)
        }
    }

    public get uuid() {
        return this.deviceUuid
    }

    public get name() {
        return ''
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
    rssiIntervalMs?: number
}

export type BleControllerConstructor = new (
    options: BleControllerConstructorOptions
) => BleController

export interface BleControllerConstructorOptions {
    deviceUuid: string
    charCallbacks: CharacteristicCallbacks
    rssiIntervalMs?: number
}

export type CharacteristicCallbacks = {
    charUuid: string
    charName?: string
    onData: (data: Buffer, length: number, timestamp: number) => void
}[]

export type CharacteristicUuid = string
