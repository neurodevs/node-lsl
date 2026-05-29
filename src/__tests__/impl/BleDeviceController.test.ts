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
    private static readonly characteristicUuid = this.generateId()
    private static readonly characteristicValueToWrite = this.generateId()
    private static readonly fakeError = this.generateId()

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
    protected static async createBleBackendThrowsOn400() {
        this.setFake400Error()

        assert.doesThrowAsync(
            async () => await this.connect(),
            this.fakeError,
            'Did not throw error!'
        )
    }

    @test()
    protected static async createBleBackendThrowsOn500() {
        this.setFake500Error()

        assert.doesThrowAsync(
            async () => await this.connect(),
            this.fakeError,
            'Did not throw error!'
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
    protected static async startBleBackendThrowsOn400() {
        //@ts-ignore
        this.instance.createBleBackend = () => {}

        this.setFake400Error()

        assert.doesThrowAsync(
            async () => await this.connect(),
            this.fakeError,
            'Did not throw error!'
        )
    }

    @test()
    protected static async startBleBackendThrowsOn500() {
        //@ts-ignore
        this.instance.createBleBackend = () => {}

        this.setFake500Error()

        assert.doesThrowAsync(
            async () => await this.connect(),
            this.fakeError,
            'Did not throw error!'
        )
    }

    @test()
    protected static async writeCharacteristicCallsLibndxBinding() {
        await this.writeCharacteristic()

        assert.isEqualDeep(
            FakeLibndx.callsToWriteBle[0],
            {
                deviceUuid: this.uuid,
                characteristicUuid: this.characteristicUuid,
                value: this.characteristicValueToWrite,
            },
            'Did not call writeBleCharacteristic!'
        )
    }

    @test()
    protected static async writeCharacteristicThrowsOn400() {
        this.setFake400Error()

        assert.doesThrowAsync(
            async () => await this.writeCharacteristic(),
            this.fakeError,
            'Did not throw error!'
        )
    }

    @test()
    protected static async writeCharacteristicThrowsOn500() {
        this.setFake500Error()

        assert.doesThrowAsync(
            async () => await this.writeCharacteristic(),
            this.fakeError,
            'Did not throw error!'
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

    @test()
    protected static async disconnectThrowsOn400() {
        this.setFake400Error()

        assert.doesThrowAsync(
            async () => await this.disconnect(),
            this.fakeError,
            'Did not throw error!'
        )
    }

    private static async connect() {
        await this.instance.connect()
    }

    private static async writeCharacteristic() {
        await this.instance.writeCharacteristic(
            this.characteristicUuid,
            this.characteristicValueToWrite
        )
    }

    private static async disconnect() {
        await this.instance.disconnect()
    }

    private static setFake400Error() {
        FakeLibndx.fakeResult = JSON.stringify({
            status: 400,
            error: this.fakeError,
        })
    }

    private static setFake500Error() {
        FakeLibndx.fakeResult = JSON.stringify({
            status: 500,
            error: this.fakeError,
        })
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
