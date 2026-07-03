import { test, assert } from '@neurodevs/node-tdd'

import WindowedClockRegressor, {
    ClockRegressor,
} from '../../impl/WindowedClockRegressor.js'
import AbstractPackageTest from '../AbstractPackageTest.js'

export default class WindowedClockRegressorTest extends AbstractPackageTest {
    private static instance: ClockRegressor

    private static readonly nominalHz = Math.random() * 100
    private static readonly deviceTime = Math.random()
    private static readonly earliestLslTime = Math.random()

    protected static async beforeEach() {
        await super.beforeEach()

        this.instance = this.WindowedClockRegressor()
    }

    @test()
    protected static async createsInstance() {
        assert.isTruthy(this.instance, 'Failed to create instance!')
    }

    @test()
    protected static async deriveTimestampsReturnsChunkSizeEntries() {
        const timestamps = this.deriveTimestamps()

        assert.isEqual(
            timestamps.length,
            this.chunkSize,
            'Should return an array with chunkSize entries!'
        )
    }

    @test()
    protected static async deriveSetsLastTimestampToEarliestLslTime() {
        const timestamps = this.deriveTimestamps()

        assert.isEqual(
            timestamps[timestamps.length - 1],
            this.earliestLslTime,
            'Last entry should be earliestLslTime!'
        )
    }

    @test()
    protected static async deriveTimestampsSpacesEntriesByNominalHz() {
        const timestamps = this.deriveTimestamps()

        const expected = Array(this.chunkSize)
            .fill(0)
            .map((_, i) => {
                return (
                    this.earliestLslTime -
                    (this.chunkSize - 1 - i) / this.nominalHz
                )
            })

        assert.isEqualDeep(
            timestamps,
            expected,
            'Entries should be spaced 1/nominalHz apart, working backward from earliestLslTime!'
        )
    }

    private static deriveTimestamps() {
        return this.instance.deriveTimestamps(
            this.deviceTime,
            this.earliestLslTime,
            this.chunkSize
        )
    }

    private static WindowedClockRegressor() {
        return WindowedClockRegressor.Create(this.nominalHz)
    }
}
