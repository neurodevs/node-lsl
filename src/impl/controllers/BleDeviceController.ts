import { LibndxAdapter } from '@neurodevs/ndx-native'

export default class BleDeviceController implements BleController {
    public static Class?: BleControllerConstructor
    public static setInterval = setInterval
    public static ndx = LibndxAdapter.getInstance()

    protected characteristicCallbacks: CharacteristicCallbacks
    protected rssiIntervalMs?: number
    protected log = console

    private deviceUuid: string

    protected constructor(options: BleControllerConstructorOptions) {
        const { deviceUuid, characteristicCallbacks, rssiIntervalMs } = options

        this.deviceUuid = deviceUuid
        this.characteristicCallbacks = characteristicCallbacks
        this.rssiIntervalMs = rssiIntervalMs
    }

    public static async Create(options: BleControllerOptions) {
        return new (this.Class ?? this)(options)
    }

    public async connect() {
        this.ndx.createBleBackend({ deviceUuid: this.uuid })
        this.ndx.startBleBackend({ deviceUuid: this.uuid })
    }

    public async writeCharacteristic(
        characteristicUuid: CharacteristicUuid,
        value: string
    ) {
        this.ndx.writeBleCharacteristic({
            deviceUuid: this.uuid,
            characteristicUuid,
            value,
        })
    }

    public async disconnect() {
        this.ndx.destroyBleBackend({ deviceUuid: this.uuid })
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
        characteristicUuid: CharacteristicUuid,
        value: string
    ): Promise<void>

    disconnect(): Promise<void>
}

export interface BleControllerOptions {
    deviceUuid: string
    characteristicCallbacks: CharacteristicCallbacks
    rssiIntervalMs?: number
}

export type BleControllerConstructor = new (
    options: BleControllerConstructorOptions
) => BleController

export interface BleControllerConstructorOptions {
    deviceUuid: string
    characteristicCallbacks: CharacteristicCallbacks
    rssiIntervalMs?: number
}

export type CharacteristicCallbacks = Record<
    CharacteristicUuid,
    (data: Buffer, characteristic: unknown) => void
>

export type CharacteristicUuid = string
