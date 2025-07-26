import { StreamInfo, StreamInfoOptions } from '../../modules/LslStreamInfo'
import { BoundStreamInfo } from '../../types'

export default class FakeStreamInfo implements StreamInfo {
    public static callsToConstructor: StreamInfoOptions[] = []
    public static boundStreamInfo = {} as BoundStreamInfo

    public constructor(options: StreamInfoOptions) {
        FakeStreamInfo.callsToConstructor.push(options)
    }

    public get boundStreamInfo() {
        return FakeStreamInfo.boundStreamInfo
    }

    public static resetTestDouble() {
        FakeStreamInfo.callsToConstructor = []
    }
}
