import { FuncObj, FieldType } from 'ffi-rs'
import { CHANNEL_FORMATS } from './consts'

export type ChannelFormat = (typeof CHANNEL_FORMATS)[number]

export interface DurationMarker {
    name: string
    durationMs: number
}

export interface Liblsl {
    createStreamInfo(options: CreateStreamInfoOptions): BoundStreamInfo
    appendChannelsToStreamInfo(options: AppendChannelsToStreamInfoOptions): void
    createOutlet(options: CreateOutletOptions): BoundOutlet
    destroyOutlet(options: DestroyOutletOptions): void
    pushSampleFloatTimestamp(options: PushSampleFloatTimestampOptions): void
    pushSampleStringTimestamp(options: PushSampleStringTimestampOptions): void
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

export interface CreateOutletOptions {
    info: BoundStreamInfo
    chunkSize: number
    maxBuffered: number
}

export interface DestroyOutletOptions {
    outlet: BoundOutlet
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

export interface LslChannel {
    label: string
    unit: string
    type: string
}

export type LslSample = (number | string | undefined)[]

export interface LiblslBindings {
    lsl_create_streaminfo(
        options: [string, string, number, number, number, string]
    ): BoundStreamInfo

    lsl_create_outlet(options: [BoundStreamInfo, number, number]): BoundOutlet

    lsl_destroy_outlet(outlet: [BoundOutlet]): void

    lsl_push_sample_ft(options: [BoundOutlet, LslSample, number]): void

    lsl_push_sample_strt(options: [BoundOutlet, LslSample, number]): void

    lsl_local_clock(options: []): number
    lsl_get_desc(info: [BoundStreamInfo]): BoundDescription
    lsl_append_child(options: [BoundDescription, string]): BoundChild
    lsl_append_child_value(options: [BoundChild, string, string]): void
}

export interface BoundStreamInfo {}
export interface BoundOutlet {}
export interface BoundDescription {}
export interface BoundChild {}

export type FfiRsDefineOptions = FuncObj<FieldType, boolean | undefined>
