import LslStreamInfo, { StreamInfoOptions } from '../../impl/LslStreamInfo.js'

export default class SpyStreamInfo extends LslStreamInfo {
    public constructor(options: StreamInfoOptions) {
        super(options)
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
}
