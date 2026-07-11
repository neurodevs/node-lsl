import { LibndxAdapter } from '@neurodevs/ndx-native'

export default class UsbDeviceController implements UsbController {
    public static Class?: UsbControllerConstructor

    private serialNumber: string

    private ndx = LibndxAdapter.getInstance()

    protected constructor(options?: UsbControllerOptions) {
        const { serialNumber } = options ?? {}

        this.serialNumber = serialNumber ?? ''
    }

    public static Create(options?: UsbControllerOptions) {
        return new (this.Class ?? this)(options)
    }

    public async connect() {
        this.ndx.createUsbBackend({ serialNumber: this.serialNumber })
    }
}

export interface UsbController {
    connect(): Promise<void>
}

export interface UsbControllerOptions {
    serialNumber: string
}

export type UsbControllerConstructor = new (
    options?: UsbControllerOptions
) => UsbController
