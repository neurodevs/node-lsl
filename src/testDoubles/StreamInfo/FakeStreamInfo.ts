import { BoundStreamInfo } from 'impl/LiblslAdapter.js'
import { StreamInfo, StreamInfoOptions } from '../../impl/LslStreamInfo.js'

export default class FakeStreamInfo implements StreamInfo {
    public static callsToConstructor: StreamInfoOptions[] = []
    public static numCallsToDestroy = 0

    public static boundStreamInfo = {} as BoundStreamInfo

    public constructor(options: StreamInfoOptions) {
        FakeStreamInfo.callsToConstructor.push(options)
    }

    public destroy() {
        FakeStreamInfo.numCallsToDestroy++
    }

    public get boundStreamInfo() {
        return FakeStreamInfo.boundStreamInfo
    }

    public static resetTestDouble() {
        FakeStreamInfo.callsToConstructor = []
        FakeStreamInfo.numCallsToDestroy = 0
    }
}
