import { Worker } from 'node:worker_threads'

export default class LslStreamInlet implements StreamInlet {
    public static Class?: StreamInletConstructor
    public static Worker = Worker
    public static waitAfterOpenStreamMs = 100

    private sourceId: string
    private chunkSize: number
    private maxBufferedMs: number
    private pullTimeoutMs: number
    private openStreamTimeoutMs: number
    private waitAfterOpenStreamMs: number
    private waitBetweenPullsMs: number
    private flushInletOnStop: boolean
    private onData: OnDataCallback

    private worker!: Worker
    private workerReady = false

    private readonly sixMinutesInMs = 360 * 1000
    private readonly aboutOneYearInMs = 32000000 * 1000

    public isRunning = false

    protected constructor(options: StreamInletOptions, onData: OnDataCallback) {
        const {
            sourceId,
            chunkSize,
            maxBufferedMs,
            pullTimeoutMs,
            openStreamTimeoutMs,
            waitAfterOpenStreamMs,
            waitBetweenPullsMs,
            flushInletOnStop,
        } = options ?? {}

        this.sourceId = sourceId
        this.chunkSize = chunkSize
        this.maxBufferedMs = maxBufferedMs ?? this.sixMinutesInMs
        this.pullTimeoutMs = pullTimeoutMs ?? 0
        this.openStreamTimeoutMs = openStreamTimeoutMs ?? this.aboutOneYearInMs
        this.waitAfterOpenStreamMs = waitAfterOpenStreamMs ?? this.defaultWaitMs
        this.waitBetweenPullsMs = waitBetweenPullsMs ?? 1
        this.flushInletOnStop = flushInletOnStop ?? true
        this.onData = onData

        this.createWorkerThread()
    }

    public static async Create(
        options: StreamInletOptions,
        onData: OnDataCallback
    ) {
        return new (this.Class ?? this)(options, onData)
    }

    private createWorkerThread() {
        this.worker = new this.Worker(
            new URL('./workers/inlet/LslStreamInlet.worker.js', import.meta.url)
        )

        this.worker.on('message', (msg) => {
            const { type } = msg

            switch (type) {
                case 'ready': {
                    this.workerReady = true
                    break
                }
                case 'data': {
                    const { payload } = msg
                    const { samples, timestamps } = payload

                    this.onData(samples, timestamps)
                    break
                }
                case 'error': {
                    const { error } = msg
                    throw new Error(error)
                }
                default:
                    throw new Error(`Unknown message type: ${type}`)
            }
        })
    }

    public async startPulling() {
        if (!this.isRunning) {
            this.isRunning = true
            this.postCreate()

            while (!this.workerReady) {
                await new Promise((resolve) => setTimeout(resolve, 10))
            }

            this.postStartPulling()
        } else {
            console.warn('Skipping startPulling: inlet is already running!')
        }
    }

    private postCreate() {
        this.worker.postMessage({
            type: 'createInlet',
            payload: {
                sourceId: this.sourceId,
                chunkSize: this.chunkSize,
                maxBufferedMs: this.maxBufferedMs,
                openStreamTimeoutMs: this.openStreamTimeoutMs,
                waitAfterOpenStreamMs: this.waitAfterOpenStreamMs,
                pullTimeoutMs: this.pullTimeoutMs,
                waitBetweenPullsMs: this.waitBetweenPullsMs,
                flushInletOnStop: this.flushInletOnStop,
            },
        })
    }

    private postStartPulling() {
        this.worker.postMessage({ type: 'startPulling' })
    }

    public stopPulling() {
        this.isRunning = false
        this.worker.postMessage({ type: 'stopPulling' })
    }

    public flushInlet() {
        this.worker.postMessage({ type: 'flushInlet' })
    }

    public destroy() {
        if (this.isRunning) {
            this.stopPulling()
        }
        this.worker.postMessage({ type: 'destroyInlet' })
    }

    private get defaultWaitMs() {
        return LslStreamInlet.waitAfterOpenStreamMs
    }

    private get Worker() {
        return LslStreamInlet.Worker
    }
}

export interface StreamInlet {
    startPulling(): Promise<void>
    stopPulling(): void
    flushInlet(): void
    destroy(): void
    readonly isRunning: boolean
}

export type StreamInletConstructor = new (
    options: StreamInletOptions,
    onData: OnDataCallback
) => StreamInlet

export interface StreamInletOptions {
    sourceId: string
    chunkSize: number
    maxBufferedMs?: number
    openStreamTimeoutMs?: number
    waitAfterOpenStreamMs?: number
    pullTimeoutMs?: number
    waitBetweenPullsMs?: number
    flushInletOnStop?: boolean
}

export type OnDataCallback = (samples: number[], timestamps: number[]) => void
