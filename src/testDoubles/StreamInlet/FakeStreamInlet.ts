import { StreamInfo } from '../../impl/LslStreamInfo.js'
import {
    StreamInlet,
    StreamInletConstructorOptions,
} from '../../impl/LslStreamInlet.js'

export default class FakeStreamInlet implements StreamInlet {
    public static callsToConstructor: {
        info?: StreamInfo
        options?: StreamInletConstructorOptions
        onData?: (samples: Float32Array, timestamps: Float64Array) => void
    }[] = []

    public static numCallsToStartPulling = 0
    public static numCallsToStopPulling = 0
    public static numCallsToFlushQueue = 0
    public static numCallsToDestroy = 0

    public isRunning = false

    protected onData!: (samples: Float32Array, timestamps: Float64Array) => void

    public constructor(
        info?: StreamInfo,
        options?: StreamInletConstructorOptions,
        onData?: (samples: Float32Array, timestamps: Float64Array) => void
    ) {
        this.onData = onData ?? (() => {})

        FakeStreamInlet.callsToConstructor.push({
            info,
            options,
            onData: this.onData,
        })
    }

    public async startPulling() {
        FakeStreamInlet.numCallsToStartPulling++
        this.isRunning = true
    }

    public stopPulling() {
        FakeStreamInlet.numCallsToStopPulling++
        this.isRunning = false
    }

    public flushQueue() {
        FakeStreamInlet.numCallsToFlushQueue++
    }

    public destroy() {
        FakeStreamInlet.numCallsToDestroy++
    }

    public static resetTestDouble() {
        FakeStreamInlet.callsToConstructor = []
        FakeStreamInlet.numCallsToStartPulling = 0
        FakeStreamInlet.numCallsToFlushQueue = 0
        FakeStreamInlet.numCallsToDestroy = 0
    }
}
