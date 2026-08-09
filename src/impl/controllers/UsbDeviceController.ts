import { LibndxAdapter } from '@neurodevs/ndx-native'

export default class UsbDeviceController implements UsbDevice {
    public static Class?: UsbDeviceConstructor

    private onData: (data: Buffer, length: number, timestampSec: number) => void
    private serialNumber: string

    private ndx = LibndxAdapter.getInstance()

    protected constructor(options: UsbDeviceOptions) {
        const { onData, serialNumber } = options ?? {}

        this.onData = onData
        this.serialNumber = serialNumber ?? ''
    }

    public static Create(options: UsbDeviceOptions) {
        return new (this.Class ?? this)(options)
    }

    public async connect() {
        this.ndx.createUsbBackend(this.usbDeviceOptions)
        this.ndx.startUsbBackend(this.startUsbDeviceOptions)
    }

    private get usbDeviceOptions() {
        return {
            serialNumber: this.serialNumber,
        }
    }

    private get startUsbDeviceOptions() {
        return {
            ...this.usbDeviceOptions,
            onData: this.onData,
        }
    }

    public async writeUsb(value: string) {
        this.ndx.writeUsbBackend({
            ...this.usbDeviceOptions,
            value,
        })
    }

    public async disconnect() {
        this.ndx.stopUsbBackend(this.usbDeviceOptions)
    }
}

export interface UsbDevice {
    connect(): Promise<void>
    writeUsb(value: string): Promise<void>
    disconnect(): Promise<void>
}

export interface UsbDeviceOptions {
    onData: (data: Buffer, length: number, timestampSec: number) => void
    serialNumber?: string
}

export type UsbDeviceConstructor = new (options?: UsbDeviceOptions) => UsbDevice
