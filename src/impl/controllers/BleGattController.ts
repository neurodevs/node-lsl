import { LibndxAdapter, NativePeripheral } from '@neurodevs/ndx-native'

export default class BleGattController implements BleGatt {
    public static Class?: BleGattConstructor
    public static setTimeout = setTimeout
    public static connectTimeoutMs = 30000
    public static checkIntervalMs = 100

    protected charCallbacks: CharacteristicCallbacks
    protected rssiIntervalMs?: number
    protected state: BleGattState = { status: 'disconnected' }
    protected log = console

    private deviceNamePrefix?: string
    private onConnected?: (peripheral: NativePeripheral) => void
    private onLost?: () => void
    private onReconnect?: () => void
    private onDisconnected?: () => void
    private isDisconnecting = false
    private wasDisconnectConfirmed = false

    private readonly ndx = LibndxAdapter.getInstance()

    protected constructor(options: BleGattOptions) {
        const {
            deviceUuid,
            deviceNamePrefix,
            charCallbacks,
            onConnected,
            onLost,
            onReconnect,
            onDisconnected,
            rssiIntervalMs,
        } = options

        if (deviceUuid && deviceNamePrefix) {
            this.throwTooManyParams()
        }

        this.state = { status: 'disconnected', uuid: deviceUuid }
        this.deviceNamePrefix = deviceNamePrefix
        this.charCallbacks = charCallbacks
        this.onConnected = onConnected
        this.onLost = onLost
        this.onReconnect = onReconnect
        this.onDisconnected = onDisconnected
        this.rssiIntervalMs = rssiIntervalMs
    }

    public static Create(options: BleGattOptions) {
        return new (this.Class ?? this)(options)
    }

    private throwTooManyParams() {
        throw new Error(
            'Cannot pass both deviceUuid and deviceNamePrefix! Please pass only one.'
        )
    }

    public async connect() {
        if (!this.state.uuid) {
            await this.discoverUuid()
        }

        this.isDisconnecting = false
        this.state = { status: 'connecting', uuid: this.uuid }

        this.createBleGattBackend()
        this.startBleGattBackend()

        await this.waitForOnConnected()

        this.startBleGattRssiPolling()
    }

    private async discoverUuid() {
        const { status, error } = this.ndx.discoverBleUuid({
            namePrefix: this.deviceNamePrefix as string,
            onDiscovered: (uuid: string) => {
                this.state = { status: 'disconnected', uuid }
            },
        })

        this.throwIfError(status, error)

        await this.waitForDiscoveredUuid()
    }

    private throwIfError(status: number, error: string | undefined) {
        if (status !== 200) {
            throw new Error(`${status} error: ${error ?? 'Unknown error'}`)
        }
    }

    private async waitForDiscoveredUuid() {
        const wasDiscovered = await this.waitUntil(() => Boolean(this.uuid))

        if (!wasDiscovered) {
            throw new Error(
                `Could not find a Bluetooth device whose name starts with "${this.deviceNamePrefix}" within ${this.connectTimeoutSeconds} seconds! Please make sure it is on, charged and in range.`
            )
        }
    }

    private createBleGattBackend() {
        const { status, error } = this.ndx.createBleGattBackend({
            deviceUuid: this.uuid,
        })

        this.throwIfError(status, error)
    }

    private startBleGattBackend() {
        const { status, error } = this.ndx.startBleGattBackend({
            deviceUuid: this.uuid,
            onConnected: (peripheral: NativePeripheral) => {
                this.handleConnected(peripheral)
            },
            onLost: () => this.handleLost(),
            onReconnect: () => this.handleReconnect(),
            onDisconnected: () => this.handleDisconnected(),
            charCallbacks: [...this.charCallbacks],
        })

        this.throwIfError(status, error)
    }

    private handleConnected(peripheral: NativePeripheral) {
        if (this.isDisconnecting) {
            return
        }

        const { name } = peripheral

        this.state = { status: 'connected', uuid: this.uuid, name }
        this.log.info(`Connected to device ${this.uuid}!`)
        this.onConnected?.(peripheral)
    }

    private handleLost() {
        if (this.isDisconnecting) {
            return
        }

        this.state.status = 'connecting'
        this.log.warn(`Lost connection to device ${this.uuid}! Reconnecting...`)
        this.onLost?.()
    }

    private handleReconnect() {
        if (this.isDisconnecting) {
            return
        }

        this.state.status = 'connected'
        this.log.info(`Reconnected to device ${this.uuid}!`)
        this.onReconnect?.()
    }

    private handleDisconnected() {
        this.wasDisconnectConfirmed = true

        this.state.status = 'disconnected'
        this.log.info(`Disconnected from device ${this.uuid}!`)
        this.onDisconnected?.()
    }

    private async waitForOnConnected() {
        const didConnect = await this.waitUntil(
            () => this.state.status === 'connected'
        )

        if (!didConnect) {
            this.ndx.stopBleGattBackend({ deviceUuid: this.uuid })
            this.state = { status: 'disconnected', uuid: this.uuid }

            throw new Error(
                `Could not connect to Bluetooth device ${this.uuid} within ${this.connectTimeoutSeconds} seconds! Please make sure it is on, charged, in range and not connected to another app.`
            )
        }
    }

    private async waitUntil(isDone: () => boolean) {
        const maxChecks =
            BleGattController.connectTimeoutMs /
            BleGattController.checkIntervalMs

        for (let checks = 0; checks < maxChecks; checks++) {
            if (isDone()) {
                return true
            }

            await new Promise((resolve) =>
                BleGattController.setTimeout(
                    resolve,
                    BleGattController.checkIntervalMs
                )
            )
        }

        return isDone()
    }

    private get connectTimeoutSeconds() {
        return BleGattController.connectTimeoutMs / 1000
    }

    private startBleGattRssiPolling() {
        if (this.rssiIntervalMs) {
            this.ndx.startBleGattRssiPolling({
                deviceUuid: this.uuid,
                intervalMs: this.rssiIntervalMs,
                onRssi: (rssi: number) => {
                    this.log.info(`[RSSI=${rssi}]`)
                },
            })
        }
    }

    public async writeCharacteristic(
        charUuid: CharacteristicUuid,
        value: string
    ) {
        const { status, error } = this.ndx.writeBleGattChar({
            deviceUuid: this.requireUuid(),
            charUuid,
            value,
        })

        this.throwIfError(status, error)
    }

    public async subscribeCharacteristics(
        charCallbacks: CharacteristicCallbacks
    ) {
        const { status, error } = this.ndx.registerBleGattCharCallbacks({
            deviceUuid: this.requireUuid(),
            charCallbacks: [...charCallbacks],
        })

        this.throwIfError(status, error)

        this.charCallbacks = [...this.charCallbacks, ...charCallbacks]
    }

    public async disconnect() {
        if (!this.uuid) {
            return
        }

        const wasStarted = this.state.status !== 'disconnected'

        this.isDisconnecting = true
        this.wasDisconnectConfirmed = false

        const { status, error } = this.ndx.stopBleGattBackend({
            deviceUuid: this.uuid,
        })

        this.throwIfError(status, error)

        if (wasStarted) {
            await this.waitForDisconnectConfirmed()
        }
    }

    private async waitForDisconnectConfirmed() {
        const wasConfirmed = await this.waitUntil(
            () => this.wasDisconnectConfirmed
        )

        if (!wasConfirmed) {
            this.log.warn(
                `Could not confirm disconnecting from device ${this.uuid} within ${this.connectTimeoutSeconds} seconds!`
            )
        }
    }

    public get uuid() {
        return this.state.uuid ?? ''
    }

    public get name() {
        return this.state.name ?? 'N/A'
    }

    private requireUuid() {
        if (!this.uuid) {
            throw new Error(
                'Device uuid is not resolved yet! Must either pass as option to Create or call connect() first.'
            )
        }
        return this.uuid
    }
}

export interface BleGatt {
    readonly uuid: string
    readonly name: string

    connect(): Promise<void>

    subscribeCharacteristics(
        charCallbacks: CharacteristicCallbacks
    ): Promise<void>

    writeCharacteristic(
        charUuid: CharacteristicUuid,
        value: string
    ): Promise<void>

    disconnect(): Promise<void>
}

export type BleGattOptions = {
    charCallbacks: CharacteristicCallbacks
    onConnected?: (peripheral: NativePeripheral) => void
    onLost?: () => void
    onReconnect?: () => void
    onDisconnected?: () => void
    rssiIntervalMs?: number
} & (
    | { deviceUuid: string; deviceNamePrefix?: string }
    | { deviceUuid?: string; deviceNamePrefix: string }
)

export type BleGattConstructor = new (options: BleGattOptions) => BleGatt

export type BleGattState =
    | { status: 'disconnected'; uuid?: string; name?: string }
    | { status: 'connecting'; uuid: string; name?: string }
    | { status: 'connected'; uuid: string; name: string }

export type CharacteristicCallbacks = readonly {
    charUuid: string
    charName?: string
    onData: (data: Buffer, length: number, timestampSec: number) => void
}[]

export type CharacteristicUuid = string
