import { test, assert } from '@neurodevs/node-tdd'

import UsbDeviceController, {
    UsbDevice,
} from '../../impl/controllers/UsbDeviceController.js'
import AbstractPackageTest from '../AbstractPackageTest.js'
import { FakeLibndx } from '@neurodevs/ndx-native'

export default class UsbDeviceControllerTest extends AbstractPackageTest {
    private static instance: UsbDevice

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

    @test()
    protected static async connectPassesPortSettingsToCreateUsbBackend() {
        const usb = UsbDeviceController.Create({
            onData: this.onData,
            serialNumber: this.serialNumber,
            baudRate: 1000000,
            usesRtsCts: true,
        })

        await usb.connect()

        assert.isEqualDeep(
            FakeLibndx.callsToCreateUsbBackend[0],
            {
                serialNumber: this.serialNumber,
                baudRate: 1000000,
                usesRtsCts: true,
            },
            'Did not pass port settings to create_usb_backend!'
        )
    }

    @test()
    protected static async passesPortSettingsOnlyWhenCreatingUsbBackend() {
        const usb = UsbDeviceController.Create({
            onData: this.onData,
            serialNumber: this.serialNumber,
            baudRate: 1000000,
            usesRtsCts: true,
        })

        await usb.connect()
        await usb.disconnect()

        assert.isEqualDeep(
            [
                FakeLibndx.callsToStartUsbBackend[0],
                FakeLibndx.callsToStopUsbBackend[0],
            ],
            [
                { serialNumber: this.serialNumber, onData: this.onData },
                { serialNumber: this.serialNumber },
            ],
            'Passed port settings to more than create_usb_backend!'
        )
    }

    @test()
    protected static async doesNotDiscoverSerialNumberWhenGiven() {
        await this.connect()

        assert.isEqual(
            FakeLibndx.numCallsToDiscoverUsbSerialNumbers,
            0,
            'Should not discover serial number when one is given!'
        )
    }

    @test()
    protected static async usesDiscoveredSerialNumberWhenNoneGiven() {
        FakeLibndx.fakeUsbSerialNumbers = [this.discoveredSerialNumber]

        const usb = this.UsbDeviceWithoutSerialNumber()

        await usb.connect()
        await usb.writeUsb(this.valueToWrite)
        await usb.disconnect()

        assert.isEqualDeep(
            [
                FakeLibndx.callsToCreateUsbBackend[0]?.serialNumber,
                FakeLibndx.callsToStartUsbBackend[0]?.serialNumber,
                FakeLibndx.callsToWriteUsbBackend[0]?.serialNumber,
                FakeLibndx.callsToStopUsbBackend[0]?.serialNumber,
            ],
            Array(4).fill(this.discoveredSerialNumber),
            'Did not use discovered serial number when none was given!'
        )
    }

    @test()
    protected static async discoversSerialNumberOnlyOnce() {
        FakeLibndx.fakeUsbSerialNumbers = [this.discoveredSerialNumber]

        const usb = this.UsbDeviceWithoutSerialNumber()

        await usb.connect()
        await usb.disconnect()
        await usb.connect()

        assert.isEqual(
            FakeLibndx.numCallsToDiscoverUsbSerialNumbers,
            1,
            'Should have discovered serial number only once!'
        )
    }

    @test()
    protected static async connectThrowsWhenNoUsbSerialDeviceIsFound() {
        FakeLibndx.fakeUsbSerialNumbers = []

        await assert.doesThrowAsync(
            async () => await this.UsbDeviceWithoutSerialNumber().connect(),
            'No USB serial device found!'
        )
    }

    @test()
    protected static async connectThrowsNamingEachDeviceWhenSeveralAreFound() {
        FakeLibndx.fakeUsbSerialNumbers = ['AAAA1111', 'ZZZZ9999']

        await assert.doesThrowAsync(
            async () => await this.UsbDeviceWithoutSerialNumber().connect(),
            'Found 2 USB serial devices (AAAA1111, ZZZZ9999)!'
        )
    }

    @test()
    protected static async doesNotCreateUsbBackendWhenDiscoveryFindsSeveral() {
        FakeLibndx.fakeUsbSerialNumbers = ['AAAA1111', 'ZZZZ9999']

        await assert.doesThrowAsync(
            async () => await this.UsbDeviceWithoutSerialNumber().connect()
        )

        assert.isLength(
            FakeLibndx.callsToCreateUsbBackend,
            0,
            'Created a USB backend without knowing which device to use!'
        )
    }

    @test()
    protected static async connectThrowsWhenDiscoveryFails() {
        this.setFakeErrorResult()

        await assert.doesThrowAsync(
            async () => await this.UsbDeviceWithoutSerialNumber().connect(),
            `400 error: ${this.fakeError}`
        )
    }

    @test()
    protected static async connectThrowsWhenUsbBackendCannotBeCreated() {
        this.setFakeErrorResult()

        await assert.doesThrowAsync(
            async () => await this.connect(),
            `400 error: ${this.fakeError}`,
            'Did not throw when USB backend could not be created!'
        )
    }

    @test()
    protected static async doesNotStartUsbBackendThatCouldNotBeCreated() {
        this.setFakeErrorResult()

        await assert.doesThrowAsync(async () => await this.connect())

        assert.isLength(
            FakeLibndx.callsToStartUsbBackend,
            0,
            'Started a USB backend that could not be created!'
        )
    }

    @test()
    protected static async connectThrowsWhenUsbBackendCannotBeStarted() {
        this.setFakeErrorResult()

        //@ts-ignore
        this.instance.createUsbBackend = () => {}

        await assert.doesThrowAsync(
            async () => await this.connect(),
            `400 error: ${this.fakeError}`,
            'Did not throw when USB backend could not be started!'
        )
    }

    @test()
    protected static async writeUsbThrowsOnError() {
        this.setFakeErrorResult()

        await assert.doesThrowAsync(
            async () => await this.instance.writeUsb(this.valueToWrite),
            `400 error: ${this.fakeError}`,
            'Did not throw when writing failed!'
        )
    }

    @test()
    protected static async disconnectThrowsOnError() {
        await this.connect()
        this.setFakeErrorResult()

        await assert.doesThrowAsync(
            async () => await this.disconnect(),
            `400 error: ${this.fakeError}`,
            'Did not throw when stopping failed!'
        )
    }

    private static readonly discoveredSerialNumber = this.generateId()

    private static UsbDeviceWithoutSerialNumber() {
        return UsbDeviceController.Create({ onData: this.onData })
    }

    private static readonly fakeError = this.generateId()

    private static setFakeErrorResult() {
        FakeLibndx.fakeResult = { status: 400, error: this.fakeError }
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
