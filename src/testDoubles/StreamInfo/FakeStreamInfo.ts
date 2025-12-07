import generateId from '@neurodevs/generate-id'

import { BoundStreamInfo } from 'impl/LiblslAdapter.js'
import { StreamInfo, StreamInfoOptions } from '../../impl/LslStreamInfo.js'

export default class FakeStreamInfo implements StreamInfo {
    public static callsToConstructor: (StreamInfoOptions | undefined)[] = []
    public static numCallsToDestroy = 0

    public static boundInfo = {} as BoundStreamInfo

    public name = generateId()
    public type = generateId()
    public sourceId = generateId()
    public channelNames: string[] = [generateId(), generateId(), generateId()]
    public channelFormat = 'float32' as const
    public sampleRateHz = 0
    public units = 'N/A'

    public constructor(options?: StreamInfoOptions) {
        FakeStreamInfo.callsToConstructor.push(options)
    }

    public destroy() {
        FakeStreamInfo.numCallsToDestroy++
    }

    public get channelCount() {
        return this.channelNames.length
    }

    public get boundInfo() {
        return FakeStreamInfo.boundInfo
    }

    public static resetTestDouble() {
        FakeStreamInfo.callsToConstructor = []
        FakeStreamInfo.numCallsToDestroy = 0
    }
}
