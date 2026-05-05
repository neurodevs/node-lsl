import BleDeviceController, {
    BleControllerConstructorOptions,
} from '../../impl/BleDeviceController.js'

export default class SpyBleController extends BleDeviceController {
    public infoLogs: string[] = []
    public warnLogs: string[] = []
    public errorLogs: string[] = []

    public constructor(options: BleControllerConstructorOptions) {
        super(options)
    }

    public getCharacteristicCallbacks() {
        return this.characteristicCallbacks
    }

    public getRssiIntervalMs() {
        return this.rssiIntervalMs
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
