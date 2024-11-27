export default class LslInlet implements StreamInlet {
    public static Class?: LslInletConstructor

    protected constructor() {}

    public static Create() {
        return new (this.Class ?? this)()
    }
}

export interface StreamInlet {}

export type LslInletConstructor = new () => StreamInlet
