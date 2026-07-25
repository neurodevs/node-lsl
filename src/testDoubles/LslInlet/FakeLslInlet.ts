import {
    OnDataCallback,
    LslInlet,
    LslInletOptions,
} from '../../impl/LslStreamInlet.js'

export default class FakeLslInlet implements LslInlet {
    public static callsToConstructor: {
        options?: LslInletOptions
        onData?: OnDataCallback
    }[] = []

    public static numCallsToStartPulling = 0
    public static numCallsToStopPulling = 0
    public static numCallsToFlushInlet = 0
    public static numCallsToDestroy = 0

    public isRunning = false

    protected onData!: OnDataCallback

    public constructor(options?: LslInletOptions, onData?: OnDataCallback) {
        this.onData = onData ?? (() => {})

        FakeLslInlet.callsToConstructor.push({
            options,
            onData: this.onData,
        })
    }

    public async startPulling() {
        FakeLslInlet.numCallsToStartPulling++
        this.isRunning = true
    }

    public stopPulling() {
        FakeLslInlet.numCallsToStopPulling++
        this.isRunning = false
    }

    public flushInlet() {
        FakeLslInlet.numCallsToFlushInlet++
    }

    public destroy() {
        FakeLslInlet.numCallsToDestroy++
    }

    public static resetTestDouble() {
        this.callsToConstructor = []
        this.numCallsToStartPulling = 0
        this.numCallsToStopPulling = 0
        this.numCallsToFlushInlet = 0
        this.numCallsToDestroy = 0
    }
}
