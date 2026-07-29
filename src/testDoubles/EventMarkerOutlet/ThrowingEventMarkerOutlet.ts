import {
    EventMarkerOutlet,
    EmitOptions,
    TimedEventMarker,
} from '../../impl/LslEventMarkerOutlet.js'

export default class ThrowingEventMarkerOutlet implements EventMarkerOutlet {
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
