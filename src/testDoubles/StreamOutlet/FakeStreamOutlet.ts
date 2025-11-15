import { randomInt } from 'crypto'
import generateId from '@neurodevs/generate-id'

import { StreamInfo } from '../../impl/LslStreamInfo.js'
import {
    StreamOutlet,
    StreamOutletOptions,
} from '../../impl/LslStreamOutlet.js'
import { LslSample } from 'impl/LiblslAdapter.js'

export default class FakeStreamOutlet implements StreamOutlet {
    public static callsToConstructor: {
        info?: StreamInfo
        options?: StreamOutletOptions
    }[] = []

    public static callsToPushSample: LslSample[] = []
    public static numCallsToDestroy = 0

    public options?: StreamOutletOptions

    public constructor(info?: StreamInfo, options?: StreamOutletOptions) {
        FakeStreamOutlet.callsToConstructor.push({ info, options })
        this.options = options
    }

    public destroy() {
        FakeStreamOutlet.numCallsToDestroy++
    }

    public pushSample(sample: LslSample) {
        FakeStreamOutlet.callsToPushSample.push(sample)
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
        FakeStreamOutlet.callsToConstructor = []
        FakeStreamOutlet.callsToPushSample = []
        FakeStreamOutlet.numCallsToDestroy = 0
    }
}
