import { StreamInfo } from '../../impl/LslStreamInfo.js'
import { StreamInlet, StreamInletOptions } from '../../impl/LslStreamInlet.js'

export default class FakeStreamInlet implements StreamInlet {
    public static callsToConstructor: {
        info?: StreamInfo
        options?: StreamInletOptions
    }[] = []

    public static numCallsToStartPulling = 0
    public static numCallsToStopPulling = 0
    public static numCallsToFlushSamples = 0
    public static numCallsToDestroy = 0

    public isRunning = false

    public constructor(info?: StreamInfo, options?: StreamInletOptions) {
        FakeStreamInlet.callsToConstructor.push({
            info,
            options,
        })
    }

    public startPulling() {
        FakeStreamInlet.numCallsToStartPulling++
        this.isRunning = true
    }

    public stopPulling() {
        FakeStreamInlet.numCallsToStopPulling++
        this.isRunning = false
    }

    public flushSamples() {
        FakeStreamInlet.numCallsToFlushSamples++
    }

    public destroy() {
        FakeStreamInlet.numCallsToDestroy++
    }

    public static resetTestDouble() {
        FakeStreamInlet.callsToConstructor = []
        FakeStreamInlet.numCallsToStartPulling = 0
        FakeStreamInlet.numCallsToFlushSamples = 0
        FakeStreamInlet.numCallsToDestroy = 0
    }
}
