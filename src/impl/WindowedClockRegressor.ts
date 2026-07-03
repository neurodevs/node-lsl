export default class WindowedClockRegressor implements ClockRegressor {
    public static Class?: ClockRegressorConstructor

    private readonly nominalHz: number

    protected constructor(nominalHz: number) {
        this.nominalHz = nominalHz
    }

    public static Create(nominalHz: number) {
        return new (this.Class ?? this)(nominalHz)
    }

    public deriveTimestamps(
        _deviceTime: number,
        earliestLslTime: number,
        chunkSize: number
    ) {
        const timestamps = Array(chunkSize).fill(0)

        for (let i = 0; i < chunkSize; i++) {
            const interpolatedTime = (chunkSize - 1 - i) / this.nominalHz
            timestamps[i] = earliestLslTime - interpolatedTime
        }

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

export type ClockRegressorConstructor = new (
    nominalHz: number
) => ClockRegressor
