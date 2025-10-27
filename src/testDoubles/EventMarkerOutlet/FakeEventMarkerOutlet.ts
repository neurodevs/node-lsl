import { EventMarkerOutlet } from '../../impl/LslEventMarkerOutlet'
import { DurationMarker } from '../../types'

export default class FakeEventMarkerOutlet implements EventMarkerOutlet {
    public static callsToPushMarker: string[] = []
    public static callsToPushMarkers: DurationMarker[][] = []
    public static numCallsToStop = 0
    public static numCallsToDestroy = 0

    public constructor() {}

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
        this.callsToPushMarker = []
        this.callsToPushMarkers = []
        this.numCallsToStop = 0
        this.numCallsToDestroy = 0
    }
}
