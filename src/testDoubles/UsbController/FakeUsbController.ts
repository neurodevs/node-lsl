import {
    UsbController,
    UsbControllerOptions,
} from '../../impl/controllers/UsbDeviceController.js'

export default class FakeUsbController implements UsbController {
    public static callsToConstructor: (UsbControllerOptions | undefined)[] = []
    public static numCallsToConnect = 0
    public static callsToWriteUsb: string[] = []
    public static numCallsToDisconnect = 0

    public constructor(options?: UsbControllerOptions) {
        FakeUsbController.callsToConstructor.push(options)
    }

    public async connect() {
        FakeUsbController.numCallsToConnect++
    }

    public async writeUsb(value: string) {
        FakeUsbController.callsToWriteUsb.push(value)
    }

    public async disconnect() {
        FakeUsbController.numCallsToDisconnect++
    }

    public static resetTestDouble() {
        FakeUsbController.callsToConstructor.length = 0
        FakeUsbController.numCallsToConnect = 0
        FakeUsbController.callsToWriteUsb.length = 0
        FakeUsbController.numCallsToDisconnect = 0
    }
}
