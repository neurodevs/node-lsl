import { InfoHandle, InletHandle, LiblslAdapter } from '@neurodevs/ndx-native'

export default class LslStreamInlet implements LslInlet {
    public static Class?: LslInletConstructor
    public static waitAfterOpenStreamMs = 100
    public static lsl = LiblslAdapter.getInstance()

    public isRunning = false

    private sourceId: string
    private chunkSize: number
    private maxBufferedMs: number
    private pullTimeoutMs: number
    private openStreamTimeoutMs: number
    private waitBetweenPullsMs: number
    private flushInletOnStop: boolean
    private onData: OnDataCallback

    private infoHandle!: InfoHandle
    private inletHandle?: InletHandle
    private pullMethod: () => PulledData | undefined

    private readonly sixMinutesInMs = 360 * 1000
    private readonly aboutOneYearInMs = 32000000 * 1000

    protected constructor(options: LslInletOptions, onData: OnDataCallback) {
        const {
            sourceId,
            chunkSize,
            maxBufferedMs,
            pullTimeoutMs,
            openStreamTimeoutMs,
            waitBetweenPullsMs,
            flushInletOnStop,
        } = options ?? {}

        this.sourceId = sourceId
        this.chunkSize = chunkSize
        this.maxBufferedMs = maxBufferedMs ?? this.sixMinutesInMs
        this.pullTimeoutMs = pullTimeoutMs ?? 0
        this.openStreamTimeoutMs = openStreamTimeoutMs ?? this.aboutOneYearInMs
        this.waitBetweenPullsMs = waitBetweenPullsMs ?? 1
        this.flushInletOnStop = flushInletOnStop ?? true
        this.onData = onData

        this.pullMethod = (
            chunkSize === 1 ? this.pullSample : this.pullChunk
        ).bind(this)
    }

    public static async Create(
        options: LslInletOptions,
        onData: OnDataCallback
    ) {
        return new (this.Class ?? this)(options, onData)
    }

    public async startPulling() {
        if (this.isRunning) {
            console.warn('Skipping startPulling: inlet is already running!')
            return
        }

        this.isRunning = true

        await this.createInlet()
        void this.pullLoop()
    }

    private async createInlet() {
        this.infoHandle = this.resolveInfoHandle()
        this.inletHandle = this.doCreateInlet()

        this.openStream()
    }

    private resolveInfoHandle() {
        const handles = this.resolveByProp()

        if (handles.length === 0) {
            this.throwNoStreamFound()
        } else if (handles.length > 1) {
            this.warnMultipleStreamsFound()
        }
        return handles[0]
    }

    private resolveByProp() {
        return this.lsl.resolveByProp({
            prop: 'source_id',
            value: this.sourceId,
        })
    }

    private throwNoStreamFound() {
        throw new Error(`No stream info for sourceId "${this.sourceId}"`)
    }

    private warnMultipleStreamsFound() {
        console.warn(
            `Multiple stream infos for sourceId "${this.sourceId}", using the first one.`
        )
    }

    private doCreateInlet() {
        return this.lsl.createInlet({
            infoHandle: this.infoHandle,
            maxBufferedMs: this.maxBufferedMs,
            chunkSize: this.chunkSize,
        })
    }

    private openStream() {
        this.lsl.openStream({
            inletHandle: this.inletHandle!,
            timeoutMs: this.openStreamTimeoutMs,
        })
    }

    private async pullLoop() {
        while (this.isRunning) {
            await this.pullDataOnce()
            await this.waitBetweenPulls()
        }
    }

    private async pullDataOnce() {
        const pulled = this.pullMethod()

        if (pulled) {
            this.onData(pulled.samples, pulled.timestamps)
        }
    }

    private pullSample() {
        return this.lsl.pullSample(this.pullOptions)
    }

    private pullChunk() {
        return this.lsl.pullChunk(this.pullOptions)
    }

    private get pullOptions() {
        return {
            inletHandle: this.inletHandle!,
            timeoutMs: this.pullTimeoutMs,
        }
    }

    private async waitBetweenPulls() {
        await new Promise((r) => setTimeout(r, this.waitBetweenPullsMs))
    }

    public flushInlet() {
        this.lsl.flushInlet({ inletHandle: this.inletHandle! })
    }

    public stopPulling() {
        this.isRunning = false
        this.closeStream()

        if (this.flushInletOnStop) {
            this.flushInlet()
        }
    }

    private closeStream() {
        this.lsl.closeStream({ inletHandle: this.inletHandle! })
    }

    public destroy() {
        if (this.isRunning) {
            this.stopPulling()
        }

        this.destroyInletIfCreated()
    }

    private destroyInletIfCreated() {
        if (this.inletHandle) {
            this.lsl.destroyInlet({ inletHandle: this.inletHandle })
            delete this.inletHandle
        }
    }

    private get lsl() {
        return LslStreamInlet.lsl
    }
}

export interface LslInlet {
    startPulling(): Promise<void>
    stopPulling(): void
    flushInlet(): void
    destroy(): void
    readonly isRunning: boolean
}

export type LslInletConstructor = new (
    options: LslInletOptions,
    onData: OnDataCallback
) => LslInlet

export interface LslInletOptions {
    sourceId: string
    chunkSize: number
    maxBufferedMs?: number
    openStreamTimeoutMs?: number
    pullTimeoutMs?: number
    waitBetweenPullsMs?: number
    flushInletOnStop?: boolean
}

export interface PulledData {
    samples: number[]
    timestamps: number[]
}

export type OnDataCallback = (samples: number[], timestamps: number[]) => void
