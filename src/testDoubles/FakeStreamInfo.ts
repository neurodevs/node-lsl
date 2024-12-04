import { StreamInfo, StreamInfoOptions } from '../components/LslStreamInfo'
import { BoundStreamInfo } from '../nodeLsl.types'

export default class FakeStreamInfo implements StreamInfo {
    public static callsToConstructor: StreamInfoOptions[] = []

    public constructor(options: StreamInfoOptions) {
        FakeStreamInfo.callsToConstructor.push(options)
    }

    public get boundStreamInfo() {
        return {} as BoundStreamInfo
    }
}
