import { FuncObj, FieldType } from 'ffi-rs'

import { CHANNEL_FORMATS } from './consts.js'
import { StreamInlet } from './impl/LslStreamInlet.js'
import { StreamOutlet } from './impl/LslStreamOutlet.js'

export type StreamFixuture = StreamOutlet | StreamInlet

export type ChannelFormat = (typeof CHANNEL_FORMATS)[number]

export interface DurationMarker {
    name: string
    durationMs: number
}

export interface Liblsl {
    createStreamInfo(options: CreateStreamInfoOptions): BoundStreamInfo
    appendChannelsToStreamInfo(options: AppendChannelsToStreamInfoOptions): void
    createOutlet(options: CreateOutletOptions): BoundOutlet
    pushSampleFloatTimestamp(options: PushSampleFloatTimestampOptions): void
    pushSampleStringTimestamp(options: PushSampleStringTimestampOptions): void
    destroyOutlet(options: DestroyOutletOptions): void
    createInlet(options: CreateInletOptions): BoundInlet
    pullChunk(options: PullChunkOptions): number
    flushInlet(options: FlushInletOptions): void
    destroyInlet(options: DestroyInletOptions): void
    localClock(): number
}

export interface CreateStreamInfoOptions {
    name: string
    type: string
    channelCount: number
    sampleRate: number
    channelFormat: number
    sourceId: string
    manufacturer?: string
    unit?: string
}

export interface AppendChannelsToStreamInfoOptions {
    info: BoundStreamInfo
    channels: LslChannel[]
}

export interface LslChannel {
    label: string
    unit: string
    type: string
}

export type LslSample = (number | string | undefined)[]

export interface CreateOutletOptions {
    info: BoundStreamInfo
    chunkSize: number
    maxBuffered: number
}

export interface PushSampleFloatTimestampOptions {
    outlet: BoundOutlet
    sample: number[]
    timestamp: number
}

export interface PushSampleStringTimestampOptions {
    outlet: BoundOutlet
    sample: string[]
    timestamp: number
}

export interface DestroyOutletOptions {
    outlet: BoundOutlet
}

export interface CreateInletOptions {
    info: BoundStreamInfo
    chunkSize: number
    maxBuffered: number
}

export interface PullChunkOptions {
    inlet: BoundInlet
    dataBuffer: Buffer<ArrayBuffer>
    timestampBuffer: Buffer<ArrayBuffer>
    dataBufferElements: number
    timestampBufferElements: number
    timeout: number
    errcode: number
}

export interface FlushInletOptions {
    inlet: BoundInlet
}

export interface DestroyInletOptions {
    inlet: BoundInlet
}

export interface LiblslBindings {
    lsl_create_streaminfo(
        args: [string, string, number, number, number, string]
    ): BoundStreamInfo

    lsl_create_outlet(args: [BoundStreamInfo, number, number]): BoundOutlet
    lsl_push_sample_ft(args: [BoundOutlet, LslSample, number]): void
    lsl_push_sample_strt(args: [BoundOutlet, LslSample, number]): void
    lsl_destroy_outlet(args: [BoundOutlet]): void
    lsl_create_inlet(args: any): BoundInlet
    lsl_pull_chunk_f(args: any): number
    lsl_flush_inlet(args: [BoundInlet]): void
    lsl_destroy_inlet(args: any): void
    lsl_local_clock(args: []): number
    lsl_get_desc(args: [BoundStreamInfo]): BoundDescription
    lsl_append_child(args: [BoundDescription, string]): BoundChild
    lsl_append_child_value(args: [BoundChild, string, string]): void
}

export interface BoundStreamInfo {}
export interface BoundOutlet {}
export interface BoundInlet {}
export interface BoundDescription {}
export interface BoundChild {}

export type FfiRsDefineOptions = FuncObj<FieldType, boolean | undefined>
