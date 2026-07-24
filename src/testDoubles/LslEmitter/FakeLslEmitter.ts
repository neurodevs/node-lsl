import {
    LslEmitter,
    EmitOptions,
    TimedEventMarker,
} from '../../impl/LslEventMarkerEmitter.js'

export default class FakeLslEmitter implements LslEmitter {
    public static numCallsToConstructor = 0

    public static callsToEmit: {
        markerName: string
        options?: EmitOptions
    }[] = []

    public static callsToEmitMany: TimedEventMarker[][] = []
    public static numCallsToInterrupt = 0
    public static numCallsToDestroy = 0

    public constructor() {
        FakeLslEmitter.numCallsToConstructor++
    }

    public async emit(markerName: string, options?: EmitOptions) {
        FakeLslEmitter.callsToEmit.push({ markerName, options })
    }

    public async emitMany(markers: TimedEventMarker[]) {
        FakeLslEmitter.callsToEmitMany.push(markers)
    }

    public interrupt() {
        FakeLslEmitter.numCallsToInterrupt++
    }

    public destroy() {
        FakeLslEmitter.numCallsToDestroy++
    }

    public static resetTestDouble() {
        this.numCallsToConstructor = 0
        this.callsToEmit = []
        this.callsToEmitMany = []
        this.numCallsToInterrupt = 0
        this.numCallsToDestroy = 0
    }
}
