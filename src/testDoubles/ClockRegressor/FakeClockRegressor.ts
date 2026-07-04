import {
    ClockRegressor,
    WindowedClockRegressorOptions,
} from '../../impl/WindowedClockRegressor.js'

export default class FakeClockRegressor implements ClockRegressor {
    public static callsToConstructor: {
        nominalHz: number
        options?: WindowedClockRegressorOptions
    }[] = []
    public static callsToDeriveTimestamps: {
        deviceTime: number
        earliestLslTime: number
        chunkSize: number
    }[] = []

    public static fakeResultValue = 0

    public readonly nominalHz: number

    public constructor(
        nominalHz: number,
        options?: WindowedClockRegressorOptions
    ) {
        FakeClockRegressor.callsToConstructor.push({ nominalHz, options })
        this.nominalHz = nominalHz
    }

    public deriveTimestamps(
        deviceTime: number,
        earliestLslTime: number,
        chunkSize: number
    ) {
        FakeClockRegressor.callsToDeriveTimestamps.push({
            deviceTime,
            earliestLslTime,
            chunkSize,
        })
        return Array(chunkSize).fill(FakeClockRegressor.fakeResultValue)
    }

    public static resetTestDouble() {
        FakeClockRegressor.callsToConstructor = []
        FakeClockRegressor.callsToDeriveTimestamps = []
    }
}
