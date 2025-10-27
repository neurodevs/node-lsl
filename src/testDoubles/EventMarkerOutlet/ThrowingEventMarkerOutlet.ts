import { EventMarkerOutlet } from '../../impl/LslEventMarkerOutlet'
import { DurationMarker } from '../../types'

export default class ThrowingEventMarkerOutlet implements EventMarkerOutlet {
    private errorMsg = 'Intentional throwing: '

    public constructor() {
        throw new Error(this.errorMsg + 'constructor')
    }

    public async pushMarker(_markerName: string) {
        throw new Error(this.errorMsg + 'pushMarker')
    }

    public async pushMarkers(_markers: DurationMarker[]) {
        throw new Error(this.errorMsg + 'pushMarkers')
    }

    public stop() {
        throw new Error(this.errorMsg + 'stop')
    }

    public destroy() {
        throw new Error(this.errorMsg + 'destroy')
    }
}
