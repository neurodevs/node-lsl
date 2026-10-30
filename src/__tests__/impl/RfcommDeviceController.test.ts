import { test, assert } from '@neurodevs/node-tdd'

import RfcommDeviceController, {
    RfcommDevice,
} from '../../impl/controllers/RfcommDeviceController.js'
import AbstractPackageTest from '../AbstractPackageTest.js'
import { FakeLibndx } from '@neurodevs/ndx-native'

export default class RfcommDeviceControllerTest extends AbstractPackageTest {
    private static instance: RfcommDevice

    private static readonly address = this.generateId()
    private static readonly namePrefix = this.generateId()
    private static readonly dataToWrite = Buffer.from([0x02, 0x23, 0x00, 0x00])

    private static readonly onData = (
        _data: Buffer,
        _length: number,
        _timestampSec: number
    ) => {}

    protected static async beforeEach() {
        await super.beforeEach()

        this.instance = this.RfcommDeviceController()
    }

    @test()
    protected static async createsInstance() {
        assert.isTruthy(this.instance, 'Failed to create instance!')
    }

    @test()
    protected static async connectCallsLibndxCreateRfcommBackend() {
        await this.connect()

        assert.isEqualDeep(
            FakeLibndx.callsToCreateRfcommBackend[0],
            { address: this.address },
            'Did not call create_rfcomm_backend!'
        )
    }

    @test()
    protected static async connectPassesPortToCreateRfcommBackend() {
        const rfcomm = RfcommDeviceController.Create({
            onData: this.onData,
            address: this.address,
            port: 3,
        })

        await rfcomm.connect()

        assert.isEqualDeep(
            FakeLibndx.callsToCreateRfcommBackend[0],
            { address: this.address, port: 3 },
            'Did not pass port to create_rfcomm_backend!'
        )
    }

    @test()
    protected static async connectCallsLibndxStartRfcommBackend() {
        await this.connect()

        assert.isEqualDeep(
            FakeLibndx.callsToStartRfcommBackend[0],
            { address: this.address, onData: this.onData },
            'Did not call start_rfcomm_backend!'
        )
    }

    @test()
    protected static async passesPortOnlyWhenCreatingRfcommBackend() {
        const rfcomm = RfcommDeviceController.Create({
            onData: this.onData,
            address: this.address,
            port: 3,
        })

        await rfcomm.connect()
        await rfcomm.write(this.dataToWrite)
        await rfcomm.disconnect()

        assert.isEqualDeep(
            [
                FakeLibndx.callsToStartRfcommBackend[0],
                FakeLibndx.callsToWriteRfcommBackend[0],
                FakeLibndx.callsToStopRfcommBackend[0],
            ],
            [
                { address: this.address, onData: this.onData },
                { address: this.address, data: this.dataToWrite },
                { address: this.address },
            ],
            'Passed port to more than create_rfcomm_backend!'
        )
    }

    @test()
    protected static async writeCallsLibndxWriteRfcommBackend() {
        await this.instance.write(this.dataToWrite)

        assert.isEqualDeep(
            FakeLibndx.callsToWriteRfcommBackend[0],
            { address: this.address, data: this.dataToWrite },
            'Did not call write_rfcomm_backend!'
        )
    }

    @test()
    protected static async disconnectCallsLibndxStopRfcommBackend() {
        await this.connect()
        await this.disconnect()

        assert.isEqualDeep(
            FakeLibndx.callsToStopRfcommBackend[0],
            { address: this.address },
            'Did not call stop_rfcomm_backend!'
        )
    }

    @test()
    protected static async exposesAddress() {
        assert.isEqual(
            this.instance.address,
            this.address,
            'Did not expose address!'
        )
    }

    @test()
    protected static async doesNotDiscoverAddressWhenGiven() {
        await this.connect()

        assert.isLength(
            FakeLibndx.callsToDiscoverRfcommAddresses,
            0,
            'Should not discover address when one is given!'
        )
    }

    @test()
    protected static async discoversAddressByNamePrefix() {
        FakeLibndx.fakeRfcommAddresses = [this.discoveredAddress]

        await this.RfcommDeviceWithoutAddress().connect()

        assert.isEqualDeep(
            FakeLibndx.callsToDiscoverRfcommAddresses[0],
            { namePrefix: this.namePrefix },
            'Did not discover address by name prefix!'
        )
    }

    @test()
    protected static async usesDiscoveredAddressWhenNoneGiven() {
        FakeLibndx.fakeRfcommAddresses = [this.discoveredAddress]

        const rfcomm = this.RfcommDeviceWithoutAddress()

        await rfcomm.connect()
        await rfcomm.write(this.dataToWrite)
        await rfcomm.disconnect()

        assert.isEqualDeep(
            [
                FakeLibndx.callsToCreateRfcommBackend[0]?.address,
                FakeLibndx.callsToStartRfcommBackend[0]?.address,
                FakeLibndx.callsToWriteRfcommBackend[0]?.address,
                FakeLibndx.callsToStopRfcommBackend[0]?.address,
                rfcomm.address,
            ],
            Array(5).fill(this.discoveredAddress),
            'Did not use discovered address when none was given!'
        )
    }

    @test()
    protected static async discoversAddressOnlyOnce() {
        FakeLibndx.fakeRfcommAddresses = [this.discoveredAddress]

        const rfcomm = this.RfcommDeviceWithoutAddress()

        await rfcomm.connect()
        await rfcomm.disconnect()
        await rfcomm.connect()

        assert.isLength(
            FakeLibndx.callsToDiscoverRfcommAddresses,
            1,
            'Should have discovered address only once!'
        )
    }

    @test()
    protected static async connectThrowsWhenNoPairedDeviceIsFound() {
        FakeLibndx.fakeRfcommAddresses = []

        await assert.doesThrowAsync(
            async () => await this.RfcommDeviceWithoutAddress().connect(),
            `No paired Bluetooth device found whose name starts with "${this.namePrefix}"!`
        )
    }

    @test()
    protected static async connectThrowsNamingEachDeviceWhenSeveralAreFound() {
        FakeLibndx.fakeRfcommAddresses = [
            'a0-e6-f8-a5-60-bf',
            'a0-e6-f8-a5-69-9a',
        ]

        await assert.doesThrowAsync(
            async () => await this.RfcommDeviceWithoutAddress().connect(),
            'Found 2 paired Bluetooth devices (a0-e6-f8-a5-60-bf, a0-e6-f8-a5-69-9a)!'
        )
    }

    @test()
    protected static async doesNotCreateBackendWhenDiscoveryFindsSeveral() {
        FakeLibndx.fakeRfcommAddresses = [
            'a0-e6-f8-a5-60-bf',
            'a0-e6-f8-a5-69-9a',
        ]

        await assert.doesThrowAsync(
            async () => await this.RfcommDeviceWithoutAddress().connect()
        )

        assert.isLength(
            FakeLibndx.callsToCreateRfcommBackend,
            0,
            'Created a RFCOMM backend without knowing which device to use!'
        )
    }

    @test()
    protected static async connectThrowsWhenDiscoveryFails() {
        this.setFakeErrorResult()

        await assert.doesThrowAsync(
            async () => await this.RfcommDeviceWithoutAddress().connect(),
            `400 error: ${this.fakeError}`
        )
    }

    @test()
    protected static async connectThrowsWhenBackendCannotBeCreated() {
        this.setFakeErrorResult()

        await assert.doesThrowAsync(
            async () => await this.connect(),
            `400 error: ${this.fakeError}`,
            'Did not throw when RFCOMM backend could not be created!'
        )
    }

    @test()
    protected static async doesNotStartBackendThatCouldNotBeCreated() {
        this.setFakeErrorResult()

        await assert.doesThrowAsync(async () => await this.connect())

        assert.isLength(
            FakeLibndx.callsToStartRfcommBackend,
            0,
            'Started a RFCOMM backend that could not be created!'
        )
    }

    @test()
    protected static async connectThrowsWhenBackendCannotBeStarted() {
        this.setFakeErrorResult()

        //@ts-ignore
        this.instance.createRfcommBackend = () => {}

        await assert.doesThrowAsync(
            async () => await this.connect(),
            `400 error: ${this.fakeError}`,
            'Did not throw when RFCOMM backend could not be started!'
        )
    }

    @test()
    protected static async writeThrowsOnError() {
        this.setFakeErrorResult()

        await assert.doesThrowAsync(
            async () => await this.instance.write(this.dataToWrite),
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

    private static readonly discoveredAddress = this.generateId()

    private static RfcommDeviceWithoutAddress() {
        return RfcommDeviceController.Create({
            onData: this.onData,
            namePrefix: this.namePrefix,
        })
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

    private static RfcommDeviceController() {
        return RfcommDeviceController.Create({
            onData: this.onData,
            address: this.address,
        })
    }
}
