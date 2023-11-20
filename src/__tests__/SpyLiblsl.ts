import {
	CreateOutletOptions,
	CreateStreamInfoOptions,
	Liblsl,
	BoundOutlet,
	BoundStreamInfo,
	AppendChannelsToStreamInfoOptions,
	PushSampleOptions,
} from '../Liblsl'

export class SpyLiblsl implements Liblsl {
	public lastCreateStreamInfoOptions?: CreateStreamInfoOptions
	public lastAppendChannelsToStreamInfoOptions?: AppendChannelsToStreamInfoOptions
	public lastCreateOutletOptions?: CreateOutletOptions
	public lastPushSampleOptions?: PushSampleOptions

	public outlet: BoundOutlet = {} as BoundOutlet
	public streamInfo: BoundStreamInfo = {} as BoundStreamInfo
	public createStreamInfoHitCount = 0

	public createStreamInfo(options: CreateStreamInfoOptions): BoundStreamInfo {
		this.createStreamInfoHitCount++
		this.lastCreateStreamInfoOptions = options
		return this.streamInfo
	}

	public appendChannelsToStreamInfo(
		options: AppendChannelsToStreamInfoOptions
	): void {
		this.lastAppendChannelsToStreamInfoOptions = options
	}

	public createOutlet(options: CreateOutletOptions): BoundOutlet {
		this.lastCreateOutletOptions = options
		return this.outlet
	}

	public pushSample(options: PushSampleOptions): void {
		this.lastPushSampleOptions = options
	}
}
