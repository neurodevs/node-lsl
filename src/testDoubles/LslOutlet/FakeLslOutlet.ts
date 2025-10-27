import { randomInt } from 'crypto'
import generateId from '@neurodevs/generate-id'
import { StreamInfo } from '../../impl/LslStreamInfo'
import { LslOutlet, LslOutletOptions } from '../../impl/LslStreamOutlet'
import { LslSample } from '../../types'

export default class FakeLslOutlet implements LslOutlet {
    public static callsToConstructor: CallToOutletConstructor[] = []
    public static callsToPushSample: LslSample[] = []
    public static numCallsToDestroy = 0

    public options?: LslOutletOptions

    public constructor(info?: StreamInfo, options?: LslOutletOptions) {
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
        return this.options?.name ?? generateId()
    }

    public get type() {
        return this.options?.type ?? generateId()
    }

    public get sourceId() {
        return this.options?.sourceId ?? generateId()
    }

    public get channelNames() {
        return this.options?.channelNames ?? [generateId()]
    }

    public get channelCount() {
        return this.channelNames.length
    }

    public get channelFormat() {
        return this.options?.channelFormat ?? 'float32'
    }

    public get sampleRate() {
        return this.options?.sampleRate ?? randomInt(1, 1000)
    }

    public get chunkSize() {
        return this.options?.chunkSize ?? randomInt(1, 1000)
    }

    public get maxBuffered() {
        return this.options?.maxBuffered ?? randomInt(1, 1000)
    }

    public get manufacturer() {
        return this.options?.manufacturer ?? generateId()
    }

    public get unit() {
        return this.options?.unit ?? generateId()
    }

    public static resetTestDouble() {
        FakeLslOutlet.callsToConstructor = []
        FakeLslOutlet.callsToPushSample = []
        FakeLslOutlet.numCallsToDestroy = 0
    }
}

export interface CallToOutletConstructor {
    info?: StreamInfo
    options?: LslOutletOptions
}
