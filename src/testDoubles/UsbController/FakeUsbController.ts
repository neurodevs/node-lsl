import { UsbController } from '../../impl/UsbDeviceController.js'

export default class FakeUsbController implements UsbController {
    public static numCallsToConstructor = 0

    public constructor() {
        FakeUsbController.numCallsToConstructor++
    }

    public static resetTestDouble() {
        FakeUsbController.numCallsToConstructor = 0
    }
}
