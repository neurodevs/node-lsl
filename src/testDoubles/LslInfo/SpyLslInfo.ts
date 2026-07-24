import LslStreamInfo, { LslInfoOptions } from '../../impl/LslStreamInfo.js'

export default class SpyLslInfo extends LslStreamInfo {
    public static numCallsToConstructor = 0

    public constructor(options: LslInfoOptions) {
        super(options)
        SpyLslInfo.numCallsToConstructor++
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
        SpyLslInfo.numCallsToConstructor = 0
    }
}
