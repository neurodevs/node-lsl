import LslStreamInfo, { StreamInfoOptions } from '../components/LslStreamInfo'

export default class SpyLslStreamInfo extends LslStreamInfo {
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
