import { test, assert } from '@neurodevs/node-tdd'

import UsbDeviceController from '../../impl/UsbDeviceController.js'
import AbstractPackageTest from '../AbstractPackageTest.js'
import { FakeLibndx } from '@neurodevs/ndx-native'
import SpyUsbController from '../../testDoubles/UsbController/SpyUsbController.js'

export default class UsbDeviceControllerTest extends AbstractPackageTest {
    private static instance: SpyUsbController

    private static readonly serialNumber = this.generateId()

    protected static async beforeEach() {
        await super.beforeEach()

        UsbDeviceController.Class = SpyUsbController

        this.instance = this.UsbDeviceController()
    }

    @test()
    protected static async createsInstance() {
        assert.isTruthy(this.instance, 'Failed to create instance!')
    }

    @test()
    protected static async connectCallsLibndxCreateUsbBackend() {
        await this.connect()

        assert.isEqualDeep(
            FakeLibndx.callsToCreateUsbBackend[0],
            {
                serialNumber: this.serialNumber,
            },
            'Did not call create_usb_backend!'
        )
    }

    @test()
    protected static async connectCallsLibndxStartUsbBackend() {
        await this.connect()

        assert.isEqualDeep(
            FakeLibndx.callsToStartUsbBackend[0],
            {
                serialNumber: this.serialNumber,
                onData: this.instance.getOnData(),
            },
            'Did not call start_usb_backend!'
        )
    }

    @test()
    protected static async disconnectCallsLibndxStopUsbBackend() {
        await this.connect()
        await this.disconnect()

        assert.isEqualDeep(
            FakeLibndx.callsToStopUsbBackend[0],
            {
                serialNumber: this.serialNumber,
            },
            'Did not call stop_usb_backend!'
        )
    }

    private static async connect() {
        await this.instance.connect()
    }

    private static async disconnect() {
        await this.instance.disconnect()
    }

    private static UsbDeviceController() {
        return UsbDeviceController.Create({
            serialNumber: this.serialNumber,
        }) as SpyUsbController
    }
}
