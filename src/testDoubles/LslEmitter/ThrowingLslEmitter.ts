import {
    LslEmitter,
    EmitOptions,
    TimedEventMarker,
} from '../../impl/LslEventMarkerEmitter.js'

export default class ThrowingLslEmitter implements LslEmitter {
    private errorMsg = 'Intentional throwing: '

    public constructor() {
        throw new Error(this.errorMsg + 'constructor')
    }

    public async emit(_markerName: string, _options?: EmitOptions) {
        throw new Error(this.errorMsg + 'emit')
    }

    public async emitMany(_markers: TimedEventMarker[]) {
        throw new Error(this.errorMsg + 'emitMany')
    }

    public interrupt() {
        throw new Error(this.errorMsg + 'interrupt')
    }

    public destroy() {
        throw new Error(this.errorMsg + 'destroy')
    }
}
