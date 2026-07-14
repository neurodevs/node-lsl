import { LibndxAdapter } from '@neurodevs/ndx-native'

export default class UsbDeviceController implements UsbController {
    public static Class?: UsbControllerConstructor

    private onData: (data: Buffer, length: number, timestampSec: number) => void
    private serialNumber: string

    private ndx = LibndxAdapter.getInstance()

    protected constructor(options: UsbControllerOptions) {
        const { onData, serialNumber } = options ?? {}

        this.onData = onData
        this.serialNumber = serialNumber ?? ''
    }

    public static Create(options: UsbControllerOptions) {
        return new (this.Class ?? this)(options)
    }

    public async connect() {
        this.ndx.createUsbBackend(this.usbControllerOptions)
        this.ndx.startUsbBackend(this.startUsbControllerOptions)
    }

    private get usbControllerOptions() {
        return {
            serialNumber: this.serialNumber,
        }
    }

    private get startUsbControllerOptions() {
        return {
            ...this.usbControllerOptions,
            onData: this.onData,
        }
    }

    public async writeUsb(value: string) {
        this.ndx.writeUsbBackend({
            ...this.usbControllerOptions,
            value,
        })
    }

    public async disconnect() {
        this.ndx.stopUsbBackend(this.usbControllerOptions)
    }
}

export interface UsbController {
    connect(): Promise<void>
    writeUsb(value: string): Promise<void>
    disconnect(): Promise<void>
}

export interface UsbControllerOptions {
    onData: (data: Buffer, length: number, timestampSec: number) => void
    serialNumber?: string
}

export type UsbControllerConstructor = new (
    options?: UsbControllerOptions
) => UsbController
