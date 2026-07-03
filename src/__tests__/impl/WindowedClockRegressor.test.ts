import { test, assert } from '@neurodevs/node-tdd'

import WindowedClockRegressor, {
    ClockRegressor,
} from '../../impl/WindowedClockRegressor.js'
import AbstractPackageTest from '../AbstractPackageTest.js'

export default class WindowedClockRegressorTest extends AbstractPackageTest {
    private static instance: ClockRegressor

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
        const result = this.instance.deriveTimestamps(
            this.deviceTime,
            this.earliestLslTime,
            this.chunkSize
        )

        assert.isEqual(
            result.length,
            this.chunkSize,
            'Should return an array with chunkSize entries!'
        )
    }

    private static WindowedClockRegressor() {
        return WindowedClockRegressor.Create()
    }
}
