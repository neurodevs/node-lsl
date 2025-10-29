import LslStreamInfo, { StreamInfoOptions } from '../../impl/LslStreamInfo.js'

export default class SpyStreamInfo extends LslStreamInfo {
    public constructor(options: StreamInfoOptions) {
        super(options)
    }

    public getStreamInfo() {
        return this.streamInfo
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
