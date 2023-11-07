import AbstractSpruceTest, { test, assert } from '@sprucelabs/test-utils'
import { Liblsl, LiblslBindings } from '../../Liblsl'

export default class LiblslTest extends AbstractSpruceTest {
	private static liblsl: SpyLiblsl
	private static bindings: LiblslBindings

	private static defaultInfo: any // Make this reference XML node
	private static defaultDesc: any
	private static defaultOutlet: any

	protected static async beforeEach() {
		await super.beforeEach()
		process.env.LIBLSL_PATH =
			'/opt/homebrew/Cellar/lsl/1.16.2/lib/liblsl.1.16.2.dylib'
		this.liblsl = new SpyLiblsl()
		this.bindings = this.liblsl.getBindings()
		this.defaultInfo = this.liblsl.createStreamInfo({
			name: 'Dummy name',
			type: 'EEG',
			channelCount: 5,
			sampleRate: 256,
			channelFormat: 1,
			sourceId: 'dummy-id',
		})
		this.defaultDesc = this.liblsl.getDesc(this.defaultInfo)
		this.defaultOutlet = this.liblsl.createOutlet(this.defaultInfo, 0, 360)
	}

	@test()
	protected static async liblslThrowsWithUndefinedPath() {
		delete process.env.LIBLSL_PATH
		assert.doesThrow(() => new Liblsl())
	}

	@test()
	protected static async liblslThrowsWithInvalidPath() {
		process.env.LIBLSL_PATH = '/some/invalid/path'
		assert.doesThrow(() => new Liblsl())
	}

	@test()
	protected static async liblslCanLoadBindings() {
		assert.isTruthy(this.bindings)
	}

	@test()
	protected static async liblslBindingsHaveRequiredFunctions() {
		const requiredFunctions = [
			'lsl_create_streaminfo',
			'lsl_get_desc',
			'lsl_append_child_value',
			'lsl_append_child',
			'lsl_create_outlet',
			'lsl_local_clock',
			'lsl_push_sample_ft',
		]
		for (let requiredFunction of requiredFunctions) {
			assert.isFunction(
				this.bindings[requiredFunction],
				`Please define a binding for ${requiredFunction} in the FFI!`
			)
		}
	}

	@test()
	protected static async liblslCanCreateStreamInfo() {
		assert.isTruthy(this.defaultInfo)
	}

	@test()
	protected static async liblslCanGetInfoDescription() {
		assert.isTruthy(this.defaultDesc)
	}

	@test()
	protected static async liblslCanAppendChild() {
		this.liblsl.appendChild(this.defaultDesc, 'channels')
	}

	@test()
	protected static async liblslCanAppendChildValue() {
		this.liblsl.appendChildValue(
			this.defaultDesc,
			'manufacturer',
			'Lorem Ipsum Inc.'
		)
	}

	@test()
	protected static async liblslCanCreateOutlet() {
		return this.liblsl.createOutlet(this.defaultInfo, 0, 360)
	}

	@test()
	protected static async liblslCanGetLocalClock() {
		return this.liblsl.getLocalClock()
	}

	@test()
	protected static async liblslCanPushSample() {
		return this.liblsl.pushSample(this.defaultOutlet, [])
	}
}

class SpyLiblsl extends Liblsl {
	public getBindings() {
		return this.bindings
	}
}
