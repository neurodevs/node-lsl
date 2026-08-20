import {
    ChannelFormat,
    LiblslAdapter,
    LslErrorCode,
    LslSample,
    OutletHandle,
    handleLslError,
} from '@neurodevs/ndx-native'

import {
    assertValidChannelCount,
    assertValidChannelFormat,
    assertValidChunkSize,
    assertValidMaxBufferedMs,
    assertValidSampleRateHz,
} from '../assertions.js'
import LslStreamInfo, { LslInfo } from './LslStreamInfo.js'

export default class LslStreamOutlet implements LslOutlet {
    public static Class?: LslOutletConstructor
    public static setTimeout = setTimeout
    public static lsl = LiblslAdapter.getInstance()
    public static handleLslError = handleLslError

    public readonly name: string
    public readonly type: string
    public readonly sourceId: string
    public readonly channelNames: readonly string[]
    public readonly channelFormat: ChannelFormat
    public readonly channelCount: number
    public readonly sampleRateHz: number
    public readonly chunkSize: number
    public readonly maxBufferedMs = 360 * 1000
    public readonly manufacturer: string = 'N/A'
    public readonly units: string = 'N/A'

    private info!: LslInfo
    private handle!: OutletHandle
    private pushSampleToLsl!: (opts: unknown) => LslErrorCode

    protected constructor(options: LslOutletOptions) {
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
        this.createStreamOutlet()
    }

    public static async Create(options: LslOutletOptions) {
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

    private createStreamOutlet() {
        this.info = LslStreamInfo.Create({
            name: this.name,
            type: this.type,
            sourceId: this.sourceId,
            channelNames: this.channelNames,
            channelFormat: this.channelFormat,
            sampleRateHz: this.sampleRateHz,
            units: this.units,
        })

        this.handle = this.lsl.createOutlet({
            infoHandle: this.info.infoHandle,
            chunkSize: this.chunkSize,
            maxBufferedMs: this.maxBufferedMs,
        })

        this.pushSampleToLsl = (
            this.lsl[this.pushMethod] as (opts: unknown) => LslErrorCode
        ).bind(this.lsl)
    }

    private get lsl() {
        return LslStreamOutlet.lsl
    }

    private get pushMethod() {
        return this.methodMap[this.channelFormat]
    }

    private readonly methodMap: Record<
        string,
        'pushSampleFloatTimestamp' | 'pushSampleStringTimestamp'
    > = {
        float32: 'pushSampleFloatTimestamp',
        string: 'pushSampleStringTimestamp',
    }

    public pushSample(sample: LslSample, timestampSec = this.lsl.localClock()) {
        const errorCode = this.pushSampleToLsl({
            outletHandle: this.handle,
            sample,
            timestampSec,
        })

        LslStreamOutlet.handleLslError(errorCode)
    }

    public destroy() {
        this.lsl.destroyOutlet({ outletHandle: this.handle })
        this.lsl.destroyStreamInfo({ infoHandle: this.info.infoHandle })
    }

    private static async waitForSetup(waitAfterConstructionMs: number) {
        await new Promise((resolve) =>
            LslStreamOutlet.setTimeout(resolve, waitAfterConstructionMs)
        )
    }
}

export interface LslOutlet {
    pushSample(sample: LslSample, timestampSec?: number): void
    destroy(): void
    readonly name: string
    readonly type: string
    readonly sourceId: string
    readonly channelNames: readonly string[]
    readonly channelCount: number
    readonly channelFormat: ChannelFormat
    readonly sampleRateHz: number
    readonly units: string
    readonly chunkSize: number
    readonly maxBufferedMs: number
    readonly manufacturer: string
}

export type LslOutletConstructor = new (options: LslOutletOptions) => LslOutlet

export interface LslOutletOptions {
    name: string
    type: string
    sourceId: string
    channelNames: readonly string[]
    channelFormat: ChannelFormat
    sampleRateHz: number
    chunkSize: number
    maxBufferedMs?: number
    manufacturer?: string
    units?: string
    waitAfterConstructionMs?: number
}

export type LslOutletConstructorOptions = Omit<
    LslOutletOptions,
    'waitAfterConstructionMs'
>
