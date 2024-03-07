import {
	BoundOutlet,
	BoundStreamInfo,
	CreateStreamInfoOptions,
	AppendChannelsToStreamInfoOptions,
	CreateOutletOptions,
	PushSampleFtOptions,
	PushSampleStrtOptions,
	Liblsl,
} from '../nodeLsl.types'

export default class FakeLiblsl implements Liblsl {
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
	public pushSampleStrtHitCount = 0

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
		this.pushSampleStrtHitCount++
	}

	public localClock() {
		this.localClockHitCount++
		return new Date().getTime()
	}
}
