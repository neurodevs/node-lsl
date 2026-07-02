export default class WindowedClockRegressor implements ClockRegressor {
    public static Class?: ClockRegressorConstructor

    protected constructor() {}

    public static Create() {
        return new (this.Class ?? this)()
    }
}

export interface ClockRegressor {}

export type ClockRegressorConstructor = new () => ClockRegressor
