import { randomInt } from 'node:crypto'

import generateId from '@neurodevs/generate-id'
import { LslSample } from '@neurodevs/ndx-native'

import {
    StreamOutlet,
    StreamOutletOptions,
} from '../../impl/LslStreamOutlet.js'

export default class FakeStreamOutlet implements StreamOutlet {
    public static callsToConstructor: (StreamOutletOptions | undefined)[] = []

    public static callsToPushSample: {
        sample: LslSample
        timestamp?: number
    }[] = []

    public static numCallsToDestroy = 0

    public options?: StreamOutletOptions

    public constructor(options?: StreamOutletOptions) {
        FakeStreamOutlet.callsToConstructor.push(options)
        this.options = options
    }

    public destroy() {
        FakeStreamOutlet.numCallsToDestroy++
    }

    public pushSample(sample: LslSample, timestamp?: number) {
        FakeStreamOutlet.callsToPushSample.push({ sample, timestamp })
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
        FakeStreamOutlet.callsToConstructor = []
        FakeStreamOutlet.callsToPushSample = []
        FakeStreamOutlet.numCallsToDestroy = 0
    }
}
