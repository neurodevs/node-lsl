import {
    OnDataCallback,
    StreamInlet,
    StreamInletOptions,
} from '../../impl/LslStreamInlet.js'

export default class FakeStreamInlet implements StreamInlet {
    public static callsToConstructor: {
        options?: StreamInletOptions
        onData?: OnDataCallback
    }[] = []

    public static numCallsToStartPulling = 0
    public static numCallsToStopPulling = 0
    public static numCallsToFlushInlet = 0
    public static numCallsToDestroy = 0

    public isRunning = false

    protected onData!: OnDataCallback

    public constructor(options?: StreamInletOptions, onData?: OnDataCallback) {
        this.onData = onData ?? (() => {})

        FakeStreamInlet.callsToConstructor.push({
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

    public flushInlet() {
        FakeStreamInlet.numCallsToFlushInlet++
    }

    public destroy() {
        FakeStreamInlet.numCallsToDestroy++
    }

    public static resetTestDouble() {
        FakeStreamInlet.callsToConstructor = []
        FakeStreamInlet.numCallsToStartPulling = 0
        FakeStreamInlet.numCallsToFlushInlet = 0
        FakeStreamInlet.numCallsToDestroy = 0
    }
}
