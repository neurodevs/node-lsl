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
        this.createUsbBackend()
        this.startUsbBackend()
    }

    private createUsbBackend() {
        const { status, error } = this.ndx.createUsbBackend(
            this.usbDeviceOptions
        )

        this.throwIfError(status, error)
    }

    private throwIfError(status: number, error: string | undefined) {
        if (status !== 200) {
            throw new Error(`${status} error: ${error ?? 'Unknown error'}`)
        }
    }

    private startUsbBackend() {
        const { status, error } = this.ndx.startUsbBackend(
            this.startUsbDeviceOptions
        )

        this.throwIfError(status, error)
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
        const { status, error } = this.ndx.writeUsbBackend({
            ...this.usbDeviceOptions,
            value,
        })

        this.throwIfError(status, error)
    }

    public async disconnect() {
        const { status, error } = this.ndx.stopUsbBackend(this.usbDeviceOptions)

        this.throwIfError(status, error)
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
