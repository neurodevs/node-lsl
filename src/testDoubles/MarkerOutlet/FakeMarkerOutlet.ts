import { MarkerOutlet } from '../../components/EventMarkerOutlet'
import { DurationMarker } from '../../types'

export default class FakeMarkerOutlet implements MarkerOutlet {
    public static callsToPushMarker: string[] = []
    public static callsToPushMarkers: DurationMarker[][] = []
    public static numCallsToStop = 0
    public static numCallsToDestroy = 0

    public constructor() {}

    public pushMarker(markerName: string) {
        FakeMarkerOutlet.callsToPushMarker.push(markerName)
    }

    public async pushMarkers(markers: DurationMarker[]) {
        FakeMarkerOutlet.callsToPushMarkers.push(markers)
    }

    public stop() {
        FakeMarkerOutlet.numCallsToStop++
    }

    public destroy() {
        FakeMarkerOutlet.numCallsToDestroy++
    }

    public static resetTestDouble() {
        this.callsToPushMarker = []
        this.callsToPushMarkers = []
        this.numCallsToStop = 0
        this.numCallsToDestroy = 0
    }
}
