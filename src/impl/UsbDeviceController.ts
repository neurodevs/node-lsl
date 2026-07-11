export default class UsbDeviceController implements UsbController {
    public static Class?: UsbControllerConstructor

    protected constructor() {}

    public static Create() {
        return new (this.Class ?? this)()
    }
}

export interface UsbController {}

export type UsbControllerConstructor = new () => UsbController
