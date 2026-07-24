import { randomInt } from 'node:crypto'

import generateId from '@neurodevs/generate-id'
import { LslSample } from '@neurodevs/ndx-native'

import { LslOutlet, LslOutletOptions } from '../../impl/LslStreamOutlet.js'

export default class FakeLslOutlet implements LslOutlet {
    public static callsToConstructor: (LslOutletOptions | undefined)[] = []

    public static callsToPushSample: {
        sample: LslSample
        timestampSec?: number
    }[] = []

    public static numCallsToDestroy = 0

    public options?: LslOutletOptions

    public constructor(options?: LslOutletOptions) {
        FakeLslOutlet.callsToConstructor.push(options)
        this.options = options
    }

    public destroy() {
        FakeLslOutlet.numCallsToDestroy++
    }

    public pushSample(sample: LslSample, timestampSec?: number) {
        FakeLslOutlet.callsToPushSample.push({
            sample,
            timestampSec,
        })
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

    public get sampleRateHz() {
        return this.options?.sampleRateHz ?? randomInt(1, 1000)
    }

    public get chunkSize() {
        return this.options?.chunkSize ?? randomInt(1, 1000)
    }

    public get maxBufferedMs() {
        return this.options?.maxBufferedMs ?? randomInt(1, 1000)
    }

    public get manufacturer() {
        return this.options?.manufacturer ?? generateId()
    }

    public get units() {
        return this.options?.units ?? generateId()
    }

    public static resetTestDouble() {
        FakeLslOutlet.callsToConstructor = []
        FakeLslOutlet.callsToPushSample = []
        FakeLslOutlet.numCallsToDestroy = 0
    }
}
