import {
    EventMarker,
    EventMarkerEmitter,
} from '../../impl/LslEventMarkerEmitter.js'

export default class FakeEventMarkerEmitter implements EventMarkerEmitter {
    public static numCallsToConstructor = 0
    public static callsToEmit: EventMarker[] = []
    public static callsToEmitMany: Required<EventMarker>[][] = []
    public static numCallsToInterrupt = 0
    public static numCallsToDestroy = 0

    public constructor() {
        FakeEventMarkerEmitter.numCallsToConstructor++
    }

    public emit(marker: EventMarker) {
        FakeEventMarkerEmitter.callsToEmit.push(marker)
    }

    public async emitMany(markers: Required<EventMarker>[]) {
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
