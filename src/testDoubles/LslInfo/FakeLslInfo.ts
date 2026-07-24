import generateId from '@neurodevs/generate-id'
import { InfoHandle } from '@neurodevs/ndx-native'

import { LslInfo, LslInfoOptions } from '../../impl/LslStreamInfo.js'

export default class FakeLslInfo implements LslInfo {
    public static callsToConstructor: (LslInfoOptions | undefined)[] = []
    public static numCallsToDestroy = 0

    public static infoHandle = {} as InfoHandle

    public name = generateId()
    public type = generateId()
    public sourceId = generateId()
    public channelNames: string[] = [generateId(), generateId(), generateId()]
    public channelFormat = 'float32' as const
    public sampleRateHz = 0
    public units = 'N/A'

    public constructor(options?: LslInfoOptions) {
        FakeLslInfo.callsToConstructor.push(options)
    }

    public destroy() {
        FakeLslInfo.numCallsToDestroy++
    }

    public get channelCount() {
        return this.channelNames.length
    }

    public get infoHandle() {
        return FakeLslInfo.infoHandle
    }

    public static resetTestDouble() {
        FakeLslInfo.callsToConstructor = []
        FakeLslInfo.numCallsToDestroy = 0
    }
}
