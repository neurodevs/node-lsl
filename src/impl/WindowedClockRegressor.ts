export default class WindowedClockRegressor implements ClockRegressor {
    public static Class?: ClockRegressorConstructor

    private readonly nominalHz: number
    private readonly windowLenSec: number
    private readonly defaultWindowLenSec = 30
    private readonly history: {
        deviceTime: number
        earliestLslTime: number
    }[] = []

    private slope = 1 // lsl-host-seconds per device-second

    protected constructor(
        nominalHz: number,
        options?: WindowedClockRegressorOptions
    ) {
        const { windowLenSec = this.defaultWindowLenSec } = options ?? {}

        this.nominalHz = nominalHz
        this.windowLenSec = windowLenSec
    }

    public static Create(
        nominalHz: number,
        options?: WindowedClockRegressorOptions
    ) {
        return new (this.Class ?? this)(nominalHz, options)
    }

    public deriveTimestamps(
        deviceTime: number,
        earliestLslTime: number,
        chunkSize: number
    ) {
        this.throwIfDeviceTimeDoesNotIncrease(deviceTime)

        this.history.push({ deviceTime, earliestLslTime })
        this.pruneHistoryOutsideWindow()
        this.refitSlope()

        const timestamps = Array(chunkSize).fill(0)

        for (let i = 0; i <= chunkSize - 1; i++) {
            const stepsFromLast = chunkSize - 1 - i
            const deviceTimeOffset = -stepsFromLast / this.nominalHz
            const lslTimeOffset = deviceTimeOffset * this.slope

            timestamps[i] = earliestLslTime + lslTimeOffset
        }

        return timestamps
    }

    private throwIfDeviceTimeDoesNotIncrease(deviceTime: number) {
        const last = this.history[this.history.length - 1]

        if (last && deviceTime <= last.deviceTime) {
            throw new Error(
                `\nDevice time (${deviceTime}) did not increase from the previous device time (${last.deviceTime})! Device time is expected to always increase between calls, so this likely indicates a bug in the calling code.\n`
            )
        }
    }

    private pruneHistoryOutsideWindow() {
        const { deviceTime: latest } = this.history[this.history.length - 1]
        const cutoff = latest - this.windowLenSec

        while (this.history.length > 0 && this.history[0].deviceTime < cutoff) {
            this.history.shift()
        }
    }

    private refitSlope() {
        if (this.history.length < 2) {
            return
        }

        const xMean = this.currentMeanDeviceTime
        const yMean = this.currentMeanLslTime

        let numerator = 0
        let denominator = 0

        for (const { deviceTime, earliestLslTime } of this.history) {
            const xCentered = deviceTime - xMean

            numerator += xCentered * (earliestLslTime - yMean)
            denominator += xCentered * xCentered
        }

        this.slope = numerator / denominator
    }

    private get currentMeanDeviceTime() {
        const totalDeviceTime = this.history.reduce(
            (sum, { deviceTime }) => sum + deviceTime,
            0
        )
        return totalDeviceTime / this.history.length
    }

    private get currentMeanLslTime() {
        const totalLslTime = this.history.reduce(
            (sum, { earliestLslTime }) => sum + earliestLslTime,
            0
        )
        return totalLslTime / this.history.length
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
    nominalHz: number,
    options?: WindowedClockRegressorOptions
) => ClockRegressor

export interface WindowedClockRegressorOptions {
    windowLenSec?: number
}
