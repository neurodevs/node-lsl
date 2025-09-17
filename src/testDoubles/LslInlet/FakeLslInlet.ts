import { StreamInfo } from '../../modules/LslStreamInfo'
import { LslInlet, LslInletOptions } from '../../modules/LslStreamInlet'

export default class FakeLslInlet implements LslInlet {
    public static callsToConstructor: CallToInletConstructor[] = []

    public constructor(info?: StreamInfo, options?: LslInletOptions) {
        FakeLslInlet.callsToConstructor.push({
            info,
            options,
        })
    }

    public static resetTestDouble() {
        FakeLslInlet.callsToConstructor = []
    }
}

export interface CallToInletConstructor {
    info?: StreamInfo
    options?: LslInletOptions
}
