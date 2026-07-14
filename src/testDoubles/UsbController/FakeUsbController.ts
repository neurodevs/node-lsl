import { UsbController } from '../../impl/controllers/UsbDeviceController.js'

export default class FakeUsbController implements UsbController {
    public static numCallsToConstructor = 0
    public static numCallsToConnect = 0
    public static numCallsToDisconnect = 0

    public constructor() {
        FakeUsbController.numCallsToConstructor++
    }

    public async connect() {
        FakeUsbController.numCallsToConnect++
    }

    public async disconnect() {
        FakeUsbController.numCallsToDisconnect++
    }

    public static resetTestDouble() {
        FakeUsbController.numCallsToConstructor = 0
        FakeUsbController.numCallsToConnect = 0
        FakeUsbController.numCallsToDisconnect = 0
    }
}
