import {
    EventMarkerEmitter,
    EventMarkerOptions,
    TimedEventMarker,
} from '../../impl/LslEventMarkerEmitter.js'

export default class FakeEventMarkerEmitter implements EventMarkerEmitter {
    public static numCallsToConstructor = 0

    public static callsToEmit: {
        markerName: string
        options?: EventMarkerOptions
    }[] = []

    public static callsToEmitMany: TimedEventMarker[][] = []
    public static numCallsToInterrupt = 0
    public static numCallsToDestroy = 0

    public constructor() {
        FakeEventMarkerEmitter.numCallsToConstructor++
    }

    public async emit(markerName: string, options?: EventMarkerOptions) {
        FakeEventMarkerEmitter.callsToEmit.push({ markerName, options })
    }

    public async emitMany(markers: TimedEventMarker[]) {
        FakeEventMarkerEmitter.callsToEmitMany.push(markers)
    }

    public interrupt() {
        FakeEventMarkerEmitter.numCallsToInterrupt++
    }

    public destroy() {
        FakeEventMarkerEmitter.numCallsToDestroy++
    }

    public static resetTestDouble() {
        this.numCallsToConstructor = 0
        this.callsToEmit = []
        this.callsToEmitMany = []
        this.numCallsToInterrupt = 0
        this.numCallsToDestroy = 0
    }
}
