import { StreamInfo } from '../../impl/LslStreamInfo.js'
import { StreamInlet, StreamInletOptions } from '../../impl/LslStreamInlet.js'

export default class FakeStreamInlet implements StreamInlet {
    public static callsToConstructor: {
        info?: StreamInfo
        options?: StreamInletOptions
    }[] = []

    public static numCallsToFlushSamples = 0
    public static numCallsToDestroy = 0

    public constructor(info?: StreamInfo, options?: StreamInletOptions) {
        FakeStreamInlet.callsToConstructor.push({
            info,
            options,
        })
    }

    public flushSamples() {
        FakeStreamInlet.numCallsToFlushSamples++
    }

    public destroy() {
        FakeStreamInlet.numCallsToDestroy++
    }

    public static resetTestDouble() {
        FakeStreamInlet.callsToConstructor = []
        FakeStreamInlet.numCallsToFlushSamples = 0
        FakeStreamInlet.numCallsToDestroy = 0
    }
}
