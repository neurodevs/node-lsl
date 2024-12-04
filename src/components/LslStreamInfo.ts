export default class LslStreamInfo implements StreamInfo {
    public static Class?: StreamInfoConstructor

    protected constructor() {}

    public static Create() {
        return new (this.Class ?? this)()
    }
}

export interface StreamInfo {}

type StreamInfoConstructor = new () => LslStreamInfo
