import LslStreamInfo, { StreamInfoOptions } from '../../impl/LslStreamInfo.js'

export default class SpyStreamInfo extends LslStreamInfo {
    public static numCallsToConstructor = 0

    public constructor(options: StreamInfoOptions) {
        super(options)
        SpyStreamInfo.numCallsToConstructor++
    }

    public getBoundInfo() {
        return this.boundInfo
    }

    public getName() {
        return this.name
    }

    public getType() {
        return this.type
    }

    public getSourceId() {
        return this.sourceId
    }

    public getUnits() {
        return this.units
    }

    public static resetTestDouble() {
        SpyStreamInfo.numCallsToConstructor = 0
    }
}
