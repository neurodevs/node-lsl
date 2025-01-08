import { StreamInfo } from '../../components/LslStreamInfo'
import { LslOutlet, LslOutletOptions } from '../../components/LslStreamOutlet'
import { LslSample } from '../../types'

export default class FakeLslOutlet implements LslOutlet {
    public static callsToConstructor: CallToConstructor[] = []
    public static callsToPushSample: LslSample[] = []
    public static numCallsToDestroy = 0

    public constructor(info: StreamInfo, options: LslOutletOptions) {
        FakeLslOutlet.callsToConstructor.push({ info, options })
    }

    public destroy() {
        FakeLslOutlet.numCallsToDestroy++
    }

    public pushSample(sample: LslSample) {
        FakeLslOutlet.callsToPushSample.push(sample)
    }

    public static resetTestDouble() {
        FakeLslOutlet.callsToConstructor = []
        FakeLslOutlet.callsToPushSample = []
        FakeLslOutlet.numCallsToDestroy = 0
    }
}

export interface CallToConstructor {
    info: StreamInfo
    options: LslOutletOptions
}
