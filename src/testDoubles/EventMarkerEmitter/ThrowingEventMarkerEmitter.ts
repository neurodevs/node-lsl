import {
    EventMarker,
    EventMarkerEmitter,
} from '../../impl/LslEventMarkerEmitter.js'

export default class ThrowingEventMarkerEmitter implements EventMarkerEmitter {
    private errorMsg = 'Intentional throwing: '

    public constructor() {
        throw new Error(this.errorMsg + 'constructor')
    }

    public async emit(_marker: EventMarker) {
        throw new Error(this.errorMsg + 'emit')
    }

    public async emitMany(_markers: Required<EventMarker>[]) {
        throw new Error(this.errorMsg + 'emitMany')
    }

    public interrupt() {
        throw new Error(this.errorMsg + 'interrupt')
    }

    public destroy() {
        throw new Error(this.errorMsg + 'destroy')
    }
}
