import { StreamInfo } from '../../impl/LslStreamInfo'
import { StreamInlet, StreamInletOptions } from '../../impl/LslStreamInlet'

export default class FakeStreamInlet implements StreamInlet {
    public static callsToConstructor: {
        info?: StreamInfo
        options?: StreamInletOptions
    }[] = []

    public constructor(info?: StreamInfo, options?: StreamInletOptions) {
        FakeStreamInlet.callsToConstructor.push({
            info,
            options,
        })
    }

    public static resetTestDouble() {
        FakeStreamInlet.callsToConstructor = []
    }
}
