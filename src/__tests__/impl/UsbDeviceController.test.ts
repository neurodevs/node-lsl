import { test, assert } from '@neurodevs/node-tdd'

import UsbDeviceController, {
    UsbController,
} from '../../impl/controllers/UsbDeviceController.js'
import AbstractPackageTest from '../AbstractPackageTest.js'
import { FakeLibndx } from '@neurodevs/ndx-native'

export default class UsbDeviceControllerTest extends AbstractPackageTest {
    private static instance: UsbController

    private static readonly serialNumber = this.generateId()
    private static readonly valueToWrite = this.generateId()

    private static readonly callsToOnData: {
        data: Buffer
        length: number
        timestampSec: number
    }[] = []

    private static readonly onData = (
        data: Buffer,
        length: number,
        timestampSec: number
    ) => {
        this.callsToOnData.push({ data, length, timestampSec })
    }

    protected static async beforeEach() {
        await super.beforeEach()

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
                onData: this.onData,
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

    @test()
    protected static async writeUsbCallsLibndxWriteUsbBackend() {
        await this.instance.writeUsb(this.valueToWrite)

        assert.isEqualDeep(
            FakeLibndx.callsToWriteUsbBackend[0],
            {
                serialNumber: this.serialNumber,
                value: this.valueToWrite,
            },
            'Did not call write_usb_backend!'
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
            onData: this.onData,
            serialNumber: this.serialNumber,
        })
    }
}
