import { MarkerOutlet } from '../../components/EventMarkerOutlet'
import { DurationMarker } from '../../nodeLsl.types'

export default class FakeMarkerOutlet implements MarkerOutlet {
    public static pushMarkersCalls: DurationMarker[][]
    public static numStopCalls: number
    public static numDestroyCalls: number

    public constructor() {
        FakeMarkerOutlet.pushMarkersCalls = []
        FakeMarkerOutlet.numStopCalls = 0
        FakeMarkerOutlet.numDestroyCalls = 0
    }

    public async pushMarkers(markers: DurationMarker[]) {
        FakeMarkerOutlet.pushMarkersCalls.push(markers)
    }

    public stop() {
        FakeMarkerOutlet.numStopCalls++
    }

    public destroy() {
        FakeMarkerOutlet.numDestroyCalls++
    }

    public static resetTestDouble() {
        this.pushMarkersCalls = []
        this.numStopCalls = 0
        this.numDestroyCalls = 0
    }
}
