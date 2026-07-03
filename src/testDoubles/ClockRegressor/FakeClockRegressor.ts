import { ClockRegressor } from '../../impl/WindowedClockRegressor.js'

export default class FakeClockRegressor implements ClockRegressor {
    public static numCallsToConstructor = 0
    public static callsToDeriveTimestamps: {
        deviceTime: number
        earliestLslTime: number
        chunkSize: number
    }[] = []

    public constructor() {
        FakeClockRegressor.numCallsToConstructor++
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
        return Array(chunkSize).fill(0)
    }

    public static resetTestDouble() {
        FakeClockRegressor.numCallsToConstructor = 0
        FakeClockRegressor.callsToDeriveTimestamps = []
    }
}
