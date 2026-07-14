import UsbDeviceController, {
    UsbControllerOptions,
} from '../../impl/UsbDeviceController.js'

export default class SpyUsbController extends UsbDeviceController {
    public constructor(options?: UsbControllerOptions) {
        super(options)
    }

    public getOnData() {
        return this.onData
    }
}
