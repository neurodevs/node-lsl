import { LslOutlet, LslOutletOptions } from '../components/LslOutlet'
import { StreamInfo } from '../components/LslStreamInfo'
import { LslSample } from '../nodeLsl.types'

export default class FakeLslOutlet implements LslOutlet {
    public static constructorInfo?: StreamInfo
    public static constructorOptions?: LslOutletOptions
    public static callsToConstructor: CallToConstructor[] = []
    public static callsToPushSample: LslSample[] = []
    public static numCallsToDestroy = 0

    public constructor(info: StreamInfo, options: LslOutletOptions) {
        FakeLslOutlet.constructorInfo = info
        FakeLslOutlet.constructorOptions = options
        FakeLslOutlet.callsToConstructor.push({ info, options })
    }

    public destroy() {
        FakeLslOutlet.numCallsToDestroy++
    }

    public pushSample(sample: LslSample) {
        FakeLslOutlet.callsToPushSample.push(sample)
    }

    public static resetTestDouble() {
        FakeLslOutlet.constructorInfo = undefined
        FakeLslOutlet.constructorOptions = undefined
        FakeLslOutlet.callsToConstructor = []
        FakeLslOutlet.callsToPushSample = []
        FakeLslOutlet.numCallsToDestroy = 0
    }
}

export interface CallToConstructor {
    info: StreamInfo
    options: LslOutletOptions
}
