import {
    BoundOutlet,
    BoundStreamInfo,
    CreateStreamInfoOptions,
    AppendChannelsToStreamInfoOptions,
    CreateOutletOptions,
    PushSampleFloatTimestampOptions,
    PushSampleStringTimestampOptions,
    Liblsl,
} from '../nodeLsl.types'

export default class FakeLiblsl implements Liblsl {
    public outlet: BoundOutlet = {} as BoundOutlet
    public streamInfo: BoundStreamInfo = {} as BoundStreamInfo

    public lastCreateStreamInfoOptions?: CreateStreamInfoOptions
    public lastAppendChannelsToStreamInfoOptions?: AppendChannelsToStreamInfoOptions
    public lastCreateOutletOptions?: CreateOutletOptions
    public lastPushSampleFloatTimestampOptions?: PushSampleFloatTimestampOptions
    public lastPushSampleStringTimestampOptions?: PushSampleStringTimestampOptions

    public createStreamInfoHitCount = 0
    public destroyOutletHitCount = 0
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

    public createOutlet(options: CreateOutletOptions) {
        this.lastCreateOutletOptions = options
        return this.outlet
    }

    public destroyOutlet() {
        this.destroyOutletHitCount++
    }

    public pushSampleFloatTimestamp(options: PushSampleFloatTimestampOptions) {
        this.lastPushSampleFloatTimestampOptions = options
    }

    public pushSampleStringTimestamp(
        options: PushSampleStringTimestampOptions
    ) {
        this.lastPushSampleStringTimestampOptions = options
        this.pushSampleStringTimestampHitCount++
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
    }
}
