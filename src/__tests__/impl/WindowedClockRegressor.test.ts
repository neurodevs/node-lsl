import { randomInt } from 'node:crypto'

import { test, assert } from '@neurodevs/node-tdd'

import WindowedClockRegressor, {
    ClockRegressor,
} from '../../impl/WindowedClockRegressor.js'
import AbstractPackageTest from '../AbstractPackageTest.js'

export default class WindowedClockRegressorTest extends AbstractPackageTest {
    private static instance: ClockRegressor

    protected static readonly chunkSize = randomInt(10, 20)

    private static readonly nominalHz = 50 + Math.random() * 50
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
    protected static async deriveReturnsChunkSizeEntries() {
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
    protected static async deriveSpacesEntriesByNominalHz() {
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

    @test()
    protected static async deriveUsesFittedSlopeOnceHistoryAccumulates() {
        const trueSlope = 2
        const nominalStep = this.chunkSize / this.nominalHz
        const lslStep = nominalStep * trueSlope

        let deviceTime = this.deviceTime
        let earliestLslTime = this.earliestLslTime

        for (let i = 0; i < 50; i++) {
            deviceTime += nominalStep
            earliestLslTime += lslStep

            this.deriveTimestamps(deviceTime, earliestLslTime)
        }

        deviceTime += nominalStep
        earliestLslTime += lslStep

        const timestamps = this.deriveTimestamps(deviceTime, earliestLslTime)

        const expectedSpacing = trueSlope / this.nominalHz

        for (let i = 1; i < timestamps.length; i++) {
            const actualSpacing = timestamps[i] - timestamps[i - 1]

            assert.isBetweenInclusive(
                actualSpacing,
                expectedSpacing * 0.99,
                expectedSpacing * 1.01,
                `Spacing at index ${i} should reflect the fitted slope once history has accumulated!`
            )
        }
    }

    @test()
    protected static async deriveThrowsWhenDeviceTimeDoesNotIncreaseMonotonically() {
        this.deriveTimestamps()

        assert.doesThrow(
            () =>
                this.deriveTimestamps(
                    this.deviceTime,
                    this.earliestLslTime + Math.random()
                ),
            `\nDevice time (${this.deviceTime}) did not increase from the previous device time (${this.deviceTime})! Device time is expected to always increase between calls, so this likely indicates a bug in the calling code.\n`
        )
    }

    @test()
    protected static async deriveForgetsHistoryOutsideWindowLenSec() {
        const nominalChunkStep = this.chunkSize / this.nominalHz

        // With chunkSize in [10, 20) and nominalHz in [50, 100), nominalChunkStep
        // stays within [0.1, 0.4). A fixed 700 iterations always spans at least
        // 70 device-seconds — comfortably more than 2x the 30s windowLenSec.
        const oldPhaseCount = 700
        const newPhaseCount = 700

        let deviceTime = this.deviceTime
        let earliestLslTime = this.earliestLslTime

        const oldSlope = 2

        for (let i = 0; i < oldPhaseCount; i++) {
            deviceTime += nominalChunkStep
            earliestLslTime += nominalChunkStep * oldSlope

            this.deriveTimestamps(deviceTime, earliestLslTime)
        }

        const newSlope = 5
        let timestamps: number[] = []

        for (let i = 0; i < newPhaseCount; i++) {
            deviceTime += nominalChunkStep
            earliestLslTime += nominalChunkStep * newSlope

            timestamps = this.deriveTimestamps(deviceTime, earliestLslTime)
        }

        const expectedSpacing = newSlope / this.nominalHz

        for (let i = 1; i < timestamps.length; i++) {
            const actualSpacing = timestamps[i] - timestamps[i - 1]

            assert.isBetweenInclusive(
                actualSpacing,
                expectedSpacing * 0.99,
                expectedSpacing * 1.01,
                `Spacing at index ${i} should reflect the new slope once old history falls outside windowLenSec!`
            )
        }
    }

    private static deriveTimestamps(
        deviceTime = this.deviceTime,
        earliestLslTime = this.earliestLslTime
    ) {
        return this.instance.deriveTimestamps(
            deviceTime,
            earliestLslTime,
            this.chunkSize
        )
    }

    private static WindowedClockRegressor() {
        return WindowedClockRegressor.Create(this.nominalHz)
    }
}
