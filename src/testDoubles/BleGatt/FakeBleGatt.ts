import generateId from '@neurodevs/generate-id'
import {
    BleGatt,
    BleGattOptions,
    CharacteristicCallbacks,
} from '../../impl/controllers/BleGattController.js'

export default class FakeBleGatt implements BleGatt {
    public static callsToConstructor: (BleGattOptions | undefined)[] = []

    public static numCallsToConnect = 0

    public static callsToWriteCharacteristic: {
        characteristicUuid: string
        value: string
    }[] = []

    public static callsToSubscribeCharacteristics: CharacteristicCallbacks[] =
        []

    public static numCallsToDisconnect = 0

    public static fakeCharacteristics: Record<string, unknown> = {}
    public static fakeName = `fake-${generateId()}`

    private _uuid: string
    private _name: string

    public constructor(options?: BleGattOptions) {
        const { deviceUuid } = options ?? {}

        this._uuid = deviceUuid ?? generateId()
        this._name = FakeBleGatt.fakeName

        FakeBleGatt.callsToConstructor.push(options)
    }

    public async connect() {
        FakeBleGatt.numCallsToConnect++
    }

    public async writeCharacteristic(
        characteristicUuid: string,
        value: string
    ) {
        FakeBleGatt.callsToWriteCharacteristic.push({
            characteristicUuid,
            value,
        })
    }

    public async subscribeCharacteristics(
        charCallbacks: CharacteristicCallbacks
    ) {
        FakeBleGatt.callsToSubscribeCharacteristics.push(charCallbacks)
    }

    public async disconnect() {
        FakeBleGatt.numCallsToDisconnect++
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
        this.callsToWriteCharacteristic = []
        this.callsToSubscribeCharacteristics = []
        this.numCallsToDisconnect = 0
    }
}

export interface CallToBleGattConstructor {
    options: BleGattOptions
}
