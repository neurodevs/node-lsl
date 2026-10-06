import { LibndxAdapter } from '@neurodevs/ndx-native'

export default class UsbDeviceController implements UsbDevice {
    public static Class?: UsbDeviceConstructor

    private onData: (data: Buffer, length: number, timestampSec: number) => void
    private serialNumber: string
    private portSettings: { baudRate?: number; usesRtsCts?: boolean }

    private ndx = LibndxAdapter.getInstance()

    protected constructor(options: UsbDeviceOptions) {
        const { onData, serialNumber, ...portSettings } = options ?? {}

        this.onData = onData
        this.serialNumber = serialNumber ?? ''
        this.portSettings = portSettings
    }

    public static Create(options: UsbDeviceOptions) {
        return new (this.Class ?? this)(options)
    }

    public async connect() {
        if (!this.serialNumber) {
            this.serialNumber = this.discoverSerialNumber()
        }

        this.createUsbBackend()
        this.startUsbBackend()
    }

    private discoverSerialNumber() {
        const {
            status,
            error,
            serialNumbers = [],
        } = this.ndx.discoverUsbSerialNumbers()

        this.throwIfError(status, error)

        if (serialNumbers.length === 0) {
            throw new Error(this.noDeviceFoundMessage)
        }

        if (serialNumbers.length > 1) {
            throw new Error(this.severalDevicesFoundMessage(serialNumbers))
        }

        return serialNumbers[0]
    }

    private readonly noDeviceFoundMessage =
        'No USB serial device found! Please plug it in, or pass its serial number.'

    private severalDevicesFoundMessage(serialNumbers: string[]) {
        return `Found ${serialNumbers.length} USB serial devices (${serialNumbers.join(', ')})! Please pass the serial number of the one to use.`
    }

    private createUsbBackend() {
        const { status, error } = this.ndx.createUsbBackend({
            ...this.usbDeviceOptions,
            ...this.portSettings,
        })

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
    baudRate?: number
    usesRtsCts?: boolean
}

export type UsbDeviceConstructor = new (options?: UsbDeviceOptions) => UsbDevice
