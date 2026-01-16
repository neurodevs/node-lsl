import { Worker } from 'node:worker_threads'

import {
    assertValidChannelCount,
    assertValidChannelFormat,
    assertValidChunkSize,
    assertValidMaxBufferedMs,
    assertValidSampleRateHz,
} from '../assertions.js'
import { ChannelFormat, Liblsl, LslSample } from './LiblslAdapter.js'

export default class LslStreamOutlet implements StreamOutlet {
    public static Class?: StreamOutletConstructor
    public static Worker = Worker

    public readonly name: string
    public readonly type: string
    public readonly sourceId: string
    public readonly channelNames: string[]
    public readonly channelFormat: ChannelFormat
    public readonly channelCount: number
    public readonly sampleRateHz: number
    public readonly chunkSize: number
    public readonly maxBufferedMs = 360 * 1000
    public readonly manufacturer: string = 'N/A'
    public readonly units: string = 'N/A'

    private worker!: Worker

    protected constructor(options: StreamOutletOptions) {
        const {
            name,
            type,
            sourceId,
            channelNames,
            channelFormat,
            sampleRateHz,
            chunkSize,
            maxBufferedMs,
            manufacturer,
            units,
        } = options

        this.name = name
        this.type = type
        this.sourceId = sourceId
        this.channelNames = channelNames
        this.channelFormat = channelFormat
        this.channelCount = channelNames.length
        this.sampleRateHz = sampleRateHz
        this.chunkSize = chunkSize
        this.maxBufferedMs = maxBufferedMs ?? this.maxBufferedMs
        this.manufacturer = manufacturer ?? this.manufacturer
        this.units = units ?? this.units

        this.validateOptions()
        this.createWorkerThread()
        this.createStreamOutlet()
    }

    public static async Create(options: StreamOutletOptions) {
        const { waitAfterConstructionMs = 10 } = options ?? {}

        const instance = new (this.Class ?? this)(options)
        await this.waitForSetup(waitAfterConstructionMs)

        return instance
    }

    private validateOptions() {
        assertValidChannelCount(this.channelCount)
        assertValidSampleRateHz(this.sampleRateHz)
        assertValidChannelFormat(this.channelFormat)
        assertValidChunkSize(this.chunkSize)
        assertValidMaxBufferedMs(this.maxBufferedMs)
        this.validateChannelFormat()
    }

    private validateChannelFormat() {
        if (!this.isChannelFormatSupported) {
            this.throwUnsupportedChannelFormat()
        }
    }

    private get isChannelFormatSupported() {
        return this.channelFormat in this.methodMap
    }

    private throwUnsupportedChannelFormat() {
        throw new Error(
            `This method currently does not support the ${this.channelFormat} type! Please implement it.`
        )
    }

    private createWorkerThread() {
        this.worker = new this.Worker(
            new URL('./workers/LslStreamOutlet.worker.js', import.meta.url)
        )
    }

    private createStreamOutlet() {
        this.worker.postMessage({
            type: 'createOutlet',
            payload: {
                infoOptions: {
                    name: this.name,
                    type: this.type,
                    sourceId: this.sourceId,
                    channelNames: this.channelNames,
                    channelFormat: this.channelFormat,
                    sampleRateHz: this.sampleRateHz,
                    units: this.units,
                },
                chunkSize: this.chunkSize,
                maxBufferedMs: this.maxBufferedMs,
                pushMethod: this.pushMethod,
            },
        })
    }

    private get pushMethod() {
        return this.methodMap[this.channelFormat]
    }

    private readonly methodMap: Record<string, keyof Liblsl> = {
        float32: 'pushSampleFloatTimestamp',
        string: 'pushSampleStringTimestamp',
    }

    public pushSample(sample: LslSample, timestamp?: number) {
        this.worker.postMessage({
            type: 'pushSample',
            payload: {
                sample,
                timestamp,
            },
        })
    }

    public destroy() {
        this.worker.postMessage({
            type: 'destroyOutlet',
        })
    }

    private get Worker() {
        return LslStreamOutlet.Worker
    }

    private static async waitForSetup(waitAfterConstructionMs: number) {
        await new Promise((resolve) =>
            setTimeout(resolve, waitAfterConstructionMs)
        )
    }
}

export interface StreamOutlet {
    pushSample(sample: LslSample, timestamp?: number): void
    destroy(): void
    readonly name: string
    readonly type: string
    readonly sourceId: string
    readonly channelNames: string[]
    readonly channelCount: number
    readonly channelFormat: ChannelFormat
    readonly sampleRateHz: number
    readonly units: string
    readonly chunkSize: number
    readonly maxBufferedMs: number
    readonly manufacturer: string
}

export type StreamOutletConstructor = new (
    options: StreamOutletOptions
) => StreamOutlet

export interface StreamOutletOptions extends StreamOutletConstructorOptions {
    waitAfterConstructionMs?: number
}

export interface StreamOutletConstructorOptions {
    name: string
    type: string
    sourceId: string
    channelNames: string[]
    channelFormat: ChannelFormat
    sampleRateHz: number
    chunkSize: number
    maxBufferedMs?: number
    manufacturer?: string
    units?: string
}
