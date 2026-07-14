import UsbDeviceController, {
    UsbControllerOptions,
} from '../../impl/controllers/UsbDeviceController.js'

export default class SpyUsbController extends UsbDeviceController {
    public constructor(options?: UsbControllerOptions) {
        super(options)
    }

    public getOnData() {
        return this.onData
    }
}
