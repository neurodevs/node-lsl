import generateId from '@neurodevs/generate-id'
import {
    BleController,
    BleControllerConstructorOptions,
} from '../../impl/BleDeviceController.js'

export default class FakeBleController implements BleController {
    public static callsToConstructor: (
        | BleControllerConstructorOptions
        | undefined
    )[] = []

    public static numCallsToConnect = 0

    public static callsToWriteCharacteristic: {
        characteristicUuid: string
        value: string
    }[] = []

    public static numCallsToDisconnect = 0
    public static callsToGetCharacteristic: string[] = []

    public static fakeCharacteristics: Record<string, unknown> = {}

    private _uuid: string
    private _name: string

    public constructor(options?: BleControllerConstructorOptions) {
        const { deviceUuid } = options ?? {}

        this._uuid = deviceUuid ?? generateId()
        this._name = `fake-${generateId()}`

        FakeBleController.callsToConstructor.push(options)
    }

    public async connect() {
        FakeBleController.numCallsToConnect++
    }

    public async writeCharacteristic(
        characteristicUuid: string,
        value: string
    ) {
        FakeBleController.callsToWriteCharacteristic.push({
            characteristicUuid,
            value,
        })
    }

    public async disconnect() {
        FakeBleController.numCallsToDisconnect++
    }

    public get uuid() {
        return this._uuid
    }

    public get name() {
        return this._name
    }

    public static resetTestDouble() {
        this.callsToConstructor = []
        this.numCallsToConnect = 0
        this.numCallsToDisconnect = 0
        this.callsToGetCharacteristic = []
    }
}

export interface CallToBleControllerConstructor {
    options: BleControllerConstructorOptions
}
