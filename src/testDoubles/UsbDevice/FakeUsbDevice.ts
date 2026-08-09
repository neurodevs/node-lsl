import {
    UsbDevice,
    UsbDeviceOptions,
} from '../../impl/controllers/UsbDeviceController.js'

export default class FakeUsbDevice implements UsbDevice {
    public static callsToConstructor: (UsbDeviceOptions | undefined)[] = []
    public static numCallsToConnect = 0
    public static callsToWriteUsb: string[] = []
    public static numCallsToDisconnect = 0

    public constructor(options?: UsbDeviceOptions) {
        FakeUsbDevice.callsToConstructor.push(options)
    }

    public async connect() {
        FakeUsbDevice.numCallsToConnect++
    }

    public async writeUsb(value: string) {
        FakeUsbDevice.callsToWriteUsb.push(value)
    }

    public async disconnect() {
        FakeUsbDevice.numCallsToDisconnect++
    }

    public static resetTestDouble() {
        FakeUsbDevice.callsToConstructor.length = 0
        FakeUsbDevice.numCallsToConnect = 0
        FakeUsbDevice.callsToWriteUsb.length = 0
        FakeUsbDevice.numCallsToDisconnect = 0
    }
}
