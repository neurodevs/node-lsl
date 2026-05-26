import { test, assert } from '@neurodevs/node-tdd'
import { FakeLibndx } from '@neurodevs/ndx-native'

import SpyBleController from '../../testDoubles/BleController/SpyBleController.js'
import AbstractPackageTest from '../AbstractPackageTest.js'
import BleDeviceController, {
    BleControllerOptions,
} from '../../impl/controllers/BleDeviceController.js'

export default class BleDeviceControllerTest extends AbstractPackageTest {
    private static instance: SpyBleController

    private static readonly uuid = this.generateId()

    private static readonly charCallbacks = [
        {
            charUuid: this.generateId(),
            charName: this.generateId(),
            onData: async () => {},
        },
        {
            charUuid: this.generateId(),
            charName: this.generateId(),
            onData: async () => {},
        },
    ]

    protected static async beforeEach() {
        await super.beforeEach()

        this.setFakeLibndx()
        BleDeviceController.Class = SpyBleController

        this.instance = await this.BleController()
    }

    @test()
    protected static async createsInstance() {
        assert.isTruthy(this.instance, 'Failed to create instance!')
    }

    @test()
    protected static async connectCallsLibndxCreateBleBackend() {
        await this.connect()

        assert.isEqualDeep(
            FakeLibndx.callsToCreateBleBackend[0],
            {
                deviceUuid: this.uuid,
            },
            'Did not call createBleBackend!'
        )
    }

    @test()
    protected static async connectCallsLibndxStartBleBackend() {
        await this.connect()

        const call = FakeLibndx.callsToStartBleBackend[0]

        assert.isEqual(
            call.deviceUuid,
            this.uuid,
            'Did not call startBleBackend with correct deviceUuid!'
        )

        assert.isEqual(
            call.charCallbacks.length,
            2,
            'Did not call startBleBackend with charCallbacks!'
        )

        let i = 0
        for (const charCallback of call.charCallbacks) {
            assert.isEqual(
                charCallback.charUuid,
                this.charCallbacks[i].charUuid,
                'Incorrect charUuid!'
            )

            assert.isEqual(
                charCallback.charName,
                this.charCallbacks[i].charName,
                'Incorrect charName!'
            )

            assert.isFunction(
                charCallback.onData,
                'Callback is not a function!'
            )
            i++
        }
    }

    @test()
    protected static async writeCharacteristicCallsLibndxBinding() {
        const characteristicUuid = this.generateId()
        const value = this.generateId()

        await this.instance.writeCharacteristic(characteristicUuid, value)

        assert.isEqualDeep(
            FakeLibndx.callsToWriteBle[0],
            {
                deviceUuid: this.uuid,
                characteristicUuid,
                value,
            },
            'Did not call writeBleCharacteristic!'
        )
    }

    @test()
    protected static async disconnectCallsLibndxDestroyBleBackend() {
        await this.disconnect()

        assert.isEqualDeep(
            FakeLibndx.callsToDestroyBleBackend[0],
            {
                deviceUuid: this.uuid,
            },
            'Did not call destroyBleBackend!'
        )
    }

    private static async connect() {
        await this.instance.connect()
    }

    private static async disconnect() {
        await this.instance.disconnect()
    }

    private static async BleController(
        options?: Partial<BleControllerOptions>
    ) {
        return (await BleDeviceController.Create({
            deviceUuid: this.uuid,
            charCallbacks: this.charCallbacks,
            ...options,
        })) as SpyBleController
    }
}
