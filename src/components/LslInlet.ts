export default class LslInlet implements Inlet {
    public static Class?: LslInletConstructor

    protected constructor() {}

    public static Create() {
        return new (this.Class ?? this)()
    }
}

export interface Inlet {}

export type LslInletConstructor = new () => Inlet
