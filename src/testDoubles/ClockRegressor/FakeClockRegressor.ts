import { ClockRegressor } from '../../impl/WindowedClockRegressor.js'

export default class FakeClockRegressor implements ClockRegressor {
    public static numCallsToConstructor = 0

    public constructor() {
        FakeClockRegressor.numCallsToConstructor++
    }

    public static resetTestDouble() {
        FakeClockRegressor.numCallsToConstructor = 0
    }
}
