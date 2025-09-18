import { StreamInfo } from '../../modules/LslStreamInfo'
import { LslOutlet, LslOutletOptions } from '../../modules/LslStreamOutlet'
import { LslSample } from '../../types'

export default class FakeLslOutlet implements LslOutlet {
    public static callsToConstructor: CallToOutletConstructor[] = []
    public static callsToPushSample: LslSample[] = []
    public static numCallsToDestroy = 0

    public options: LslOutletOptions

    public constructor(info: StreamInfo, options: LslOutletOptions) {
        FakeLslOutlet.callsToConstructor.push({ info, options })
        this.options = options
    }

    public destroy() {
        FakeLslOutlet.numCallsToDestroy++
    }

    public pushSample(sample: LslSample) {
        FakeLslOutlet.callsToPushSample.push(sample)
    }

    public get name() {
        return this.options.name
    }

    public get type() {
        return this.options.type
    }

    public get sourceId() {
        return this.options.sourceId
    }

    public get channelNames() {
        return this.options.channelNames
    }

    public get channelCount() {
        return this.channelNames.length
    }

    public get channelFormat() {
        return this.options.channelFormat
    }

    public get sampleRate() {
        return this.options.sampleRate
    }

    public get chunkSize() {
        return this.options.chunkSize
    }

    public get maxBuffered() {
        return this.options.maxBuffered
    }

    public get manufacturer() {
        return this.options.manufacturer
    }

    public get unit() {
        return this.options.unit
    }

    public static resetTestDouble() {
        FakeLslOutlet.callsToConstructor = []
        FakeLslOutlet.callsToPushSample = []
        FakeLslOutlet.numCallsToDestroy = 0
    }
}

export interface CallToOutletConstructor {
    info: StreamInfo
    options: LslOutletOptions
}
