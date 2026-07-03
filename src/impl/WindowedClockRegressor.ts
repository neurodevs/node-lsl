export default class WindowedClockRegressor implements ClockRegressor {
    public static Class?: ClockRegressorConstructor

    protected constructor() {}

    public static Create() {
        return new (this.Class ?? this)()
    }

    public deriveTimestamps(
        _deviceTime: number,
        earliestLslTime: number,
        chunkSize: number
    ) {
        const timestamps = Array(chunkSize).fill(0)
        timestamps[chunkSize - 1] = earliestLslTime
        return timestamps
    }
}

export interface ClockRegressor {
    deriveTimestamps(
        deviceTime: number,
        earliestLslTime: number,
        chunkSize: number
    ): number[]
}

export type ClockRegressorConstructor = new () => ClockRegressor
