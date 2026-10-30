import {
    RfcommDevice,
    RfcommDeviceOptions,
} from '../../impl/controllers/RfcommDeviceController.js'

export default class FakeRfcommDevice implements RfcommDevice {
    public static callsToConstructor: (RfcommDeviceOptions | undefined)[] = []
    public static numCallsToConnect = 0
    public static callsToWrite: Buffer[] = []
    public static numCallsToDisconnect = 0
    public static fakeAddress = ''

    private readonly options?: RfcommDeviceOptions

    public constructor(options?: RfcommDeviceOptions) {
        this.options = options
        FakeRfcommDevice.callsToConstructor.push(options)
    }

    public async connect() {
        FakeRfcommDevice.numCallsToConnect++
    }

    public async write(data: Buffer) {
        FakeRfcommDevice.callsToWrite.push(data)
    }

    public async disconnect() {
        FakeRfcommDevice.numCallsToDisconnect++
    }

    public get address() {
        return this.options?.address ?? FakeRfcommDevice.fakeAddress
    }

    public static resetTestDouble() {
        FakeRfcommDevice.callsToConstructor.length = 0
        FakeRfcommDevice.numCallsToConnect = 0
        FakeRfcommDevice.callsToWrite.length = 0
        FakeRfcommDevice.numCallsToDisconnect = 0
        FakeRfcommDevice.fakeAddress = ''
    }
}
