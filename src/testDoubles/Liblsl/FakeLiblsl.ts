import generateId from '@neurodevs/generate-id'

import {
    BoundOutlet,
    BoundStreamInfo,
    CreateStreamInfoOptions,
    AppendChannelsToStreamInfoOptions,
    CreateOutletOptions,
    PushSampleFloatTimestampOptions,
    PushSampleStringTimestampOptions,
    Liblsl,
    CreateInletOptions,
    DestroyInletOptions,
    BoundInlet,
    FlushInletOptions,
    PullChunkOptions,
    PullSampleOptions,
    DestroyStreamInfoOptions,
    ResolveByPropOptions,
    DestroyOutletOptions,
} from 'impl/LiblslAdapter.js'

export default class FakeLiblsl implements Liblsl {
    public static fakeStreamInfoHandles: BoundStreamInfo[] = []

    public static fakeSamples: Float32Array[] = [
        new Float32Array([1, 2, 3]),
        new Float32Array([4, 5, 6]),
    ]

    public static fakeChunks: Float32Array[] = [
        new Float32Array([1, 2, 3, 4, 5, 6]),
        new Float32Array([1, 2, 3, 4, 5, 6]),
    ]

    public static fakeTimestamps: Float64Array[] = [
        new Float64Array([7, 8]),
        new Float64Array([7, 8]),
    ]

    public static fakeErrorCode = 0

    public liblslPath: string = generateId()

    public fakeSamples = FakeLiblsl.fakeSamples.slice()
    public fakeChunks = FakeLiblsl.fakeChunks.slice()
    public fakeTimestamps = FakeLiblsl.fakeTimestamps.slice()

    public outlet: BoundOutlet = {} as BoundOutlet
    public streamInfo: BoundStreamInfo = {} as BoundStreamInfo

    public lastCreateStreamInfoOptions?: CreateStreamInfoOptions
    public lastAppendChannelsToStreamInfoOptions?: AppendChannelsToStreamInfoOptions
    public lastDestroyStreamInfoOptions?: DestroyStreamInfoOptions
    public lastResolveByPropOptions?: ResolveByPropOptions
    public lastCreateOutletOptions?: CreateOutletOptions
    public lastPushSampleFloatTimestampOptions?: PushSampleFloatTimestampOptions
    public lastPushSampleStringTimestampOptions?: PushSampleStringTimestampOptions
    public lastDestroyOutletOptions?: DestroyOutletOptions
    public lastCreateInletOptions?: CreateInletOptions
    public lastPullSampleOptions?: PullSampleOptions
    public lastPullChunkOptions?: PullChunkOptions
    public lastFlushInletOptions?: FlushInletOptions
    public lastDestroyInletOptions?: DestroyInletOptions

    public createStreamInfoHitCount = 0
    public createOutletHitCount = 0
    public destroyOutletHitCount = 0
    public createInletHitCount = 0
    public flushInletHitCount = 0
    public destroyInletHitCount = 0
    public localClockHitCount = 0
    public pushSampleStringTimestampHitCount = 0

    public createStreamInfo(options: CreateStreamInfoOptions) {
        this.createStreamInfoHitCount++
        this.lastCreateStreamInfoOptions = options
        return this.streamInfo
    }

    public appendChannelsToStreamInfo(
        options: AppendChannelsToStreamInfoOptions
    ) {
        this.lastAppendChannelsToStreamInfoOptions = options
    }

    public destroyStreamInfo(options: DestroyStreamInfoOptions) {
        this.lastDestroyStreamInfoOptions = options
    }

    public async resolveByProp(options: ResolveByPropOptions) {
        this.lastResolveByPropOptions = options
        return FakeLiblsl.fakeStreamInfoHandles as bigint[]
    }

    public pushSampleFloatTimestamp(options: PushSampleFloatTimestampOptions) {
        this.lastPushSampleFloatTimestampOptions = options
        return FakeLiblsl.fakeErrorCode
    }

    public pushSampleStringTimestamp(
        options: PushSampleStringTimestampOptions
    ) {
        this.lastPushSampleStringTimestampOptions = options
        this.pushSampleStringTimestampHitCount++
        return FakeLiblsl.fakeErrorCode
    }

    public createOutlet(options: CreateOutletOptions) {
        this.createOutletHitCount++
        this.lastCreateOutletOptions = options
        return this.outlet
    }

    public destroyOutlet(options: DestroyOutletOptions) {
        this.destroyOutletHitCount++
        this.lastDestroyOutletOptions = options
    }

    public createInlet(options: CreateInletOptions) {
        this.createInletHitCount++
        this.lastCreateInletOptions = options
        return {} as BoundInlet
    }

    public pullSample(options: PullSampleOptions) {
        this.lastPullSampleOptions = options

        const sample = this.fakeSamples.shift()

        if (sample) {
            return 1
        }

        return 0
    }

    public pullChunk(options: PullChunkOptions) {
        this.lastPullChunkOptions = options

        const chunk = this.fakeChunks.shift()
        const timestamps = this.fakeTimestamps.shift()

        if (chunk && timestamps) {
            return 1
        }

        return 0
    }

    public flushInlet(options: FlushInletOptions) {
        this.flushInletHitCount++
        this.lastFlushInletOptions = options
    }

    public destroyInlet(options: DestroyInletOptions) {
        this.destroyInletHitCount++
        this.lastDestroyInletOptions = options
    }

    public localClock() {
        this.localClockHitCount++
        return new Date().getTime()
    }

    public resetTestDouble() {
        this.lastCreateStreamInfoOptions = undefined
        this.lastAppendChannelsToStreamInfoOptions = undefined
        this.lastCreateOutletOptions = undefined
        this.lastPushSampleFloatTimestampOptions = undefined
        this.lastPushSampleStringTimestampOptions = undefined

        this.createStreamInfoHitCount = 0
        this.destroyOutletHitCount = 0
        this.localClockHitCount = 0
        this.pushSampleStringTimestampHitCount = 0

        this.fakeSamples = FakeLiblsl.fakeSamples.slice()
        this.fakeChunks = FakeLiblsl.fakeChunks.slice()
        this.fakeTimestamps = FakeLiblsl.fakeTimestamps.slice()
    }
}
