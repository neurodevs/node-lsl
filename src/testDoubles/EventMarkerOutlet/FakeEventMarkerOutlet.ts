import {
    DurationMarker,
    EventMarkerOutlet,
} from '../../impl/LslEventMarkerOutlet.js'

export default class FakeEventMarkerOutlet implements EventMarkerOutlet {
    public static numCallsToConstructor = 0
    public static callsToPushMarker: string[] = []
    public static callsToPushMarkers: DurationMarker[][] = []
    public static numCallsToStop = 0
    public static numCallsToDestroy = 0

    public constructor() {
        FakeEventMarkerOutlet.numCallsToConstructor++
    }

    public pushMarker(markerName: string) {
        FakeEventMarkerOutlet.callsToPushMarker.push(markerName)
    }

    public async pushMarkers(markers: DurationMarker[]) {
        FakeEventMarkerOutlet.callsToPushMarkers.push(markers)
    }

    public stop() {
        FakeEventMarkerOutlet.numCallsToStop++
    }

    public destroy() {
        FakeEventMarkerOutlet.numCallsToDestroy++
    }

    public static resetTestDouble() {
        this.numCallsToConstructor = 0
        this.callsToPushMarker = []
        this.callsToPushMarkers = []
        this.numCallsToStop = 0
        this.numCallsToDestroy = 0
    }
}
