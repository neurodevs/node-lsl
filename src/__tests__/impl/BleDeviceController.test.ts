import { test, assert } from '@neurodevs/node-tdd'
import { FakeLibndx } from '@neurodevs/ndx-native'

import SpyBleController from '../../testDoubles/BleController/SpyBleController.js'
import AbstractPackageTest from '../AbstractPackageTest.js'
import BleDeviceController, {
    BleControllerOptions,
} from '../../impl/BleDeviceController.js'

export default class BleDeviceControllerTest extends AbstractPackageTest {
    private static instance: SpyBleController

    private static readonly uuid = this.generateId()

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

        assert.isEqualDeep(
            FakeLibndx.callsToStartBleBackend[0],
            {
                deviceUuid: this.uuid,
            },
            'Did not call startBleBackend!'
        )
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
            characteristicCallbacks: {},
            ...options,
        })) as SpyBleController
    }
}
