import { test, assert } from '@neurodevs/node-tdd'
import { FakeLibndx, NativePeripheral } from '@neurodevs/ndx-native'

import SpyBleController from '../../testDoubles/BleController/SpyBleController.js'
import AbstractPackageTest from '../AbstractPackageTest.js'
import BleDeviceController, {
    BleControllerOptions,
} from '../../impl/controllers/BleDeviceController.js'

export default class BleDeviceControllerTest extends AbstractPackageTest {
    private static instance: SpyBleController

    private static readonly uuid = this.generateId()
    private static readonly charUuid = this.generateId()
    private static readonly charValueToWrite = this.generateId()
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

    private static onConnected = (_peripheral: NativePeripheral) => {
        this.wasConnected = true
    }

    private static wasConnected: boolean

    private static nativePeripheral: NativePeripheral = {
        uuid: this.generateId(),
        name: this.generateId(),
    }

    protected static async beforeAll() {
        assert.isEqual(
            BleDeviceController.waitAfterMs,
            1000,
            'Set incorrect waitAfterMs!'
        )
    }

    protected static async beforeEach() {
        await super.beforeEach()

        BleDeviceController.waitAfterMs = 0

        this.setFakeLibndx()
        BleDeviceController.Class = SpyBleController

        this.wasConnected = false

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

        await assert.doesThrowAsync(
            async () => await this.instance.connect(),
            this.fakeError,
            'Did not throw error!'
        )
    }

    @test()
    protected static async createBleBackendThrowsOn500() {
        this.setFake500Error()

        await assert.doesThrowAsync(
            async () => await this.instance.connect(),
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

        await assert.doesThrowAsync(
            async () => await this.instance.connect(),
            this.fakeError,
            'Did not throw error!'
        )
    }

    @test()
    protected static async startBleBackendThrowsOn500() {
        //@ts-ignore
        this.instance.createBleBackend = () => {}

        this.setFake500Error()

        await assert.doesThrowAsync(
            async () => await this.instance.connect(),
            this.fakeError,
            'Did not throw error!'
        )
    }

    @test()
    protected static async connectWaitsForOnConnectedEvent() {
        await this.connect()

        assert.isTruthy(
            this.wasConnected,
            'Did not wait for onConnected event!'
        )
    }

    @test()
    protected static async waitsAfterOnConnectedToDiscoverServices() {
        const waitAfterMs = 20
        BleDeviceController.waitAfterMs = waitAfterMs

        const t0 = Date.now()
        await this.connect()
        const t1 = Date.now()

        assert.isAbove(
            t1 - t0,
            100 + waitAfterMs * 0.8,
            'Did not wait after on connected!'
        )
    }

    @test()
    protected static async writeCharacteristicCallsLibndxBinding() {
        await this.writeCharacteristic()

        assert.isEqualDeep(
            FakeLibndx.callsToWriteBleChar[0],
            {
                deviceUuid: this.uuid,
                charUuid: this.charUuid,
                value: this.charValueToWrite,
            },
            'Did not call writeBleCharacteristic as expected!'
        )
    }

    @test()
    protected static async writeCharacteristicThrowsOn400() {
        this.setFake400Error()

        await assert.doesThrowAsync(
            async () => await this.writeCharacteristic(),
            this.fakeError,
            'Did not throw error!'
        )
    }

    @test()
    protected static async writeCharacteristicThrowsOn500() {
        this.setFake500Error()

        await assert.doesThrowAsync(
            async () => await this.writeCharacteristic(),
            this.fakeError,
            'Did not throw error!'
        )
    }

    @test()
    protected static async disconnectCallsLibndxStopBleBackend() {
        await this.disconnect()

        assert.isEqualDeep(
            FakeLibndx.callsToStopBleBackend[0],
            {
                deviceUuid: this.uuid,
            },
            'Did not call stopBleBackend!'
        )
    }

    @test()
    protected static async disconnectThrowsOn400() {
        this.setFake400Error()

        await assert.doesThrowAsync(
            async () => await this.disconnect(),
            this.fakeError,
            'Did not throw error!'
        )
    }

    @test()
    protected static async disconnectThrowsOn500() {
        this.setFake500Error()

        await assert.doesThrowAsync(
            async () => await this.disconnect(),
            this.fakeError,
            'Did not throw error!'
        )
    }

    private static async connect() {
        const promise = this.instance.connect()

        const startCall = FakeLibndx.callsToStartBleBackend[0]
        startCall?.onConnected(this.nativePeripheral)

        await promise
    }

    private static async writeCharacteristic() {
        await this.instance.writeCharacteristic(
            this.charUuid,
            this.charValueToWrite
        )
    }

    private static async disconnect() {
        await this.instance.disconnect()
    }

    private static setFake400Error() {
        FakeLibndx.fakeResult = {
            status: 400,
            error: this.fakeError,
        }
    }

    private static setFake500Error() {
        FakeLibndx.fakeResult = {
            status: 500,
            error: this.fakeError,
        }
    }

    private static async BleController(
        options?: Partial<BleControllerOptions>
    ) {
        return (await BleDeviceController.Create({
            deviceUuid: this.uuid,
            charCallbacks: this.charCallbacks,
            onConnected: this.onConnected,
            ...options,
        })) as SpyBleController
    }
}
