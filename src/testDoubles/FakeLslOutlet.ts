import { LslOutlet, LslOutletOptions } from '../components/LslOutlet'
import { LslSample } from '../nodeLsl.types'

export default class FakeLslOutlet implements LslOutlet {
    public static constructorOptions?: LslOutletOptions
    public static callsToPushSample: LslSample[] = []
    public static numCallsToDestroy = 0

    public constructor(options: LslOutletOptions) {
        FakeLslOutlet.constructorOptions = options
    }

    public destroy() {
        FakeLslOutlet.numCallsToDestroy++
    }

    public pushSample(sample: LslSample) {
        FakeLslOutlet.callsToPushSample.push(sample)
    }

    public static resetTestDouble() {
        FakeLslOutlet.constructorOptions = undefined
        FakeLslOutlet.callsToPushSample = []
        FakeLslOutlet.numCallsToDestroy = 0
    }
}
