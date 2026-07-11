import { UsbController } from '../../impl/UsbDeviceController.js'

export default class FakeUsbController implements UsbController {
    public static numCallsToConstructor = 0
    public static numCallsToConnect = 0

    public constructor() {
        FakeUsbController.numCallsToConstructor++
    }

    public async connect() {
        FakeUsbController.numCallsToConnect++
    }

    public static resetTestDouble() {
        FakeUsbController.numCallsToConstructor = 0
        FakeUsbController.numCallsToConnect = 0
    }
}
