import BleGattController, {
    BleGattOptions,
} from '../../impl/controllers/BleGattController.js'

export default class SpyBleGatt extends BleGattController {
    public infoLogs: string[] = []
    public warnLogs: string[] = []
    public errorLogs: string[] = []

    public constructor(options: BleGattOptions) {
        super(options)
    }

    public getCharacteristicCallbacks() {
        return this.charCallbacks
    }

    public getRssiIntervalMs() {
        return this.rssiIntervalMs
    }

    public getConnected() {
        return this.connected
    }

    public setLogInfoSpy() {
        this.infoLogs = []

        this.log.info = (...args: unknown[]) => {
            const message = args.join(' ')
            this.infoLogs.push(message)
            return message
        }
    }

    public setLogWarnSpy() {
        this.warnLogs = []

        this.log.warn = (...args: unknown[]) => {
            const message = args.join(' ')
            this.warnLogs.push(message)
            return message
        }
    }

    public setLogErrorSpy() {
        this.errorLogs = []

        this.log.error = (...args: unknown[]) => {
            const message = args.join(' ')
            this.errorLogs.push(message)
            return message
        }
    }

    public resetTestDouble() {
        this.infoLogs = []
        this.warnLogs = []
        this.errorLogs = []
    }
}
