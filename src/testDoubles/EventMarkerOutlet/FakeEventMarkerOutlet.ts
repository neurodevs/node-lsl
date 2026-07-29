import {
    EventMarkerOutlet,
    EmitOptions,
    TimedEventMarker,
} from '../../impl/LslEventMarkerOutlet.js'

export default class FakeEventMarkerOutlet implements EventMarkerOutlet {
    public static numCallsToConstructor = 0

    public static callsToEmit: {
        markerName: string
        options?: EmitOptions
    }[] = []

    public static callsToEmitMany: TimedEventMarker[][] = []
    public static numCallsToInterrupt = 0
    public static numCallsToDestroy = 0

    public constructor() {
        FakeEventMarkerOutlet.numCallsToConstructor++
    }

    public async emit(markerName: string, options?: EmitOptions) {
        FakeEventMarkerOutlet.callsToEmit.push({ markerName, options })
    }

    public async emitMany(markers: TimedEventMarker[]) {
        FakeEventMarkerOutlet.callsToEmitMany.push(markers)
    }

    public interrupt() {
        FakeEventMarkerOutlet.numCallsToInterrupt++
    }

    public destroy() {
        FakeEventMarkerOutlet.numCallsToDestroy++
    }

    public static resetTestDouble() {
        this.numCallsToConstructor = 0
        this.callsToEmit = []
        this.callsToEmitMany = []
        this.numCallsToInterrupt = 0
        this.numCallsToDestroy = 0
    }
}
