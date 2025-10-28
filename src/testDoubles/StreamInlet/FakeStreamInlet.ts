import { StreamInfo } from '../../impl/LslStreamInfo'
import { StreamInlet, StreamInletOptions } from '../../impl/LslStreamInlet'

export default class FakeStreamInlet implements StreamInlet {
    public static callsToConstructor: {
        info?: StreamInfo
        options?: StreamInletOptions
    }[] = []

    public static numCallsToFlushSamples = 0

    public constructor(info?: StreamInfo, options?: StreamInletOptions) {
        FakeStreamInlet.callsToConstructor.push({
            info,
            options,
        })
    }

    public flushSamples() {
        FakeStreamInlet.numCallsToFlushSamples++
    }

    public static resetTestDouble() {
        FakeStreamInlet.callsToConstructor = []
        FakeStreamInlet.numCallsToFlushSamples = 0
    }
}
