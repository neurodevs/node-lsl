import {
	Liblsl,
	BoundOutlet,
	BoundStreamInfo,
	CreateStreamInfoOptions,
	AppendChannelsToStreamInfoOptions,
	CreateOutletOptions,
	PushSampleFtOptions as PushSampleFtOptions,
	PushSampleStrtOptions,
} from '../../Liblsl'

export class SpyLiblsl implements Liblsl {
	public outlet: BoundOutlet = {} as BoundOutlet
	public streamInfo: BoundStreamInfo = {} as BoundStreamInfo

	public lastCreateStreamInfoOptions?: CreateStreamInfoOptions
	public lastAppendChannelsToStreamInfoOptions?: AppendChannelsToStreamInfoOptions
	public lastCreateOutletOptions?: CreateOutletOptions
	public lastPushSampleFtOptions?: PushSampleFtOptions
	public lastPushSampleStrtOptions?: PushSampleStrtOptions

	public createStreamInfoHitCount = 0
	public destroyOutletHitCount = 0
	public localClockHitCount = 0

	public createStreamInfo(options: CreateStreamInfoOptions): BoundStreamInfo {
		this.createStreamInfoHitCount++
		this.lastCreateStreamInfoOptions = options
		return this.streamInfo
	}

	public appendChannelsToStreamInfo(
		options: AppendChannelsToStreamInfoOptions
	) {
		this.lastAppendChannelsToStreamInfoOptions = options
	}

	public createOutlet(options: CreateOutletOptions): BoundOutlet {
		this.lastCreateOutletOptions = options
		return this.outlet
	}

	public destroyOutlet() {
		this.destroyOutletHitCount++
	}

	public pushSampleFt(options: PushSampleFtOptions) {
		this.lastPushSampleFtOptions = options
	}

	public pushSampleStrt(options: PushSampleStrtOptions) {
		this.lastPushSampleStrtOptions = options
	}

	public localClock() {
		this.localClockHitCount++
		return new Date().getTime()
	}
}
