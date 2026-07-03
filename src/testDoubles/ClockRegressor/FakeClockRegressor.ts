import { ClockRegressor } from '../../impl/WindowedClockRegressor.js'

export default class FakeClockRegressor implements ClockRegressor {
    public static callsToConstructor: { nominalHz: number }[] = []
    public static callsToDeriveTimestamps: {
        deviceTime: number
        earliestLslTime: number
        chunkSize: number
    }[] = []

    public readonly nominalHz: number

    public constructor(nominalHz: number) {
        FakeClockRegressor.callsToConstructor.push({ nominalHz })
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
        return Array(chunkSize).fill(0)
    }

    public static resetTestDouble() {
        FakeClockRegressor.callsToConstructor = []
        FakeClockRegressor.callsToDeriveTimestamps = []
    }
}
