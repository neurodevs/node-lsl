import { LibndxAdapter } from '@neurodevs/ndx-native'

export default class RfcommDeviceController implements RfcommDevice {
    public static Class?: RfcommDeviceConstructor

    private onData: (data: Buffer, length: number, timestampSec: number) => void
    private address_: string
    private namePrefix: string
    private port?: number

    private ndx = LibndxAdapter.getInstance()

    protected constructor(options: RfcommDeviceOptions) {
        const { onData, address, namePrefix, port } = options ?? {}

        this.onData = onData
        this.address_ = address ?? ''
        this.namePrefix = namePrefix ?? ''
        this.port = port
    }

    public static Create(options: RfcommDeviceOptions) {
        return new (this.Class ?? this)(options)
    }

    public async connect() {
        if (!this.address_) {
            this.address_ = this.discoverAddress()
        }

        this.createRfcommBackend()
        this.startRfcommBackend()
    }

    private discoverAddress() {
        const {
            status,
            error,
            addresses = [],
        } = this.ndx.discoverRfcommAddresses({
            namePrefix: this.namePrefix,
        })

        this.throwIfError(status, error)

        if (addresses.length === 0) {
            throw new Error(this.noDeviceFoundMessage)
        }

        if (addresses.length > 1) {
            throw new Error(this.severalDevicesFoundMessage(addresses))
        }

        return addresses[0]
    }

    private get noDeviceFoundMessage() {
        return `No paired Bluetooth device found whose name starts with "${this.namePrefix}"! Please pair it first, or pass its address.`
    }

    private severalDevicesFoundMessage(addresses: string[]) {
        return `Found ${addresses.length} paired Bluetooth devices (${addresses.map(this.uppercaseWithColons).join(', ')})! Please pass the address of the one to use.`
    }

    private uppercaseWithColons(address: string) {
        return address.toUpperCase().replace(/-/g, ':')
    }

    private createRfcommBackend() {
        const { status, error } = this.ndx.createRfcommBackend({
            ...this.rfcommDeviceOptions,
            ...(this.port !== undefined ? { port: this.port } : {}),
        })

        this.throwIfError(status, error)
    }

    private throwIfError(status: number, error: string | undefined) {
        if (status !== 200) {
            throw new Error(`${status} error: ${error ?? 'Unknown error'}`)
        }
    }

    private startRfcommBackend() {
        const { status, error } = this.ndx.startRfcommBackend({
            ...this.rfcommDeviceOptions,
            onData: this.onData,
        })

        this.throwIfError(status, error)
    }

    private get rfcommDeviceOptions() {
        return {
            address: this.address_,
        }
    }

    public async write(data: Buffer) {
        const { status, error } = this.ndx.writeRfcommBackend({
            ...this.rfcommDeviceOptions,
            data,
        })

        this.throwIfError(status, error)
    }

    public async disconnect() {
        const { status, error } = this.ndx.stopRfcommBackend(
            this.rfcommDeviceOptions
        )

        this.throwIfError(status, error)
    }

    public get address() {
        return this.address_
    }
}

export interface RfcommDevice {
    connect(): Promise<void>
    write(data: Buffer): Promise<void>
    disconnect(): Promise<void>
    readonly address: string
}

export interface RfcommDeviceOptions {
    onData: (data: Buffer, length: number, timestampSec: number) => void
    address?: string
    namePrefix?: string
    port?: number
}

export type RfcommDeviceConstructor = new (
    options: RfcommDeviceOptions
) => RfcommDevice
