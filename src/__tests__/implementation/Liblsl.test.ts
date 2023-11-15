import { test, assert } from '@sprucelabs/test-utils'
import { Liblsl, LiblslBindings } from '../../Liblsl'
import AbstractNodeLslTest from '../AbstractNodeLslTest'

export default class LiblslTest extends AbstractNodeLslTest {
	private static liblsl: SpyLiblsl
	private static bindings: LiblslBindings

	private static defaultInfo: any
	private static defaultDesc: any
	private static defaultOutlet: any

	private static envCache: any

	protected static async beforeAll() {
		this.envCache = process.env

		assert.isTruthy(
			process.env.LIBLSL_PATH,
			'Add LIBLSL_PATH="path/to/liblsl.dylib" in your environment'
		)
	}

	protected static async afterAll() {
		process.env = this.envCache
	}

	protected static async beforeEach() {
		await super.beforeEach()

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

	// protected static async afterEach() {
	// 	this.defaultInfo.close()
	// }

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
		this.liblsl.createOutlet(this.defaultInfo, 0, 360)
	}

	@test()
	protected static async liblslCanGetLocalClock() {
		this.liblsl.getLocalClock()
	}

	@test()
	protected static async liblslCanPushSample() {
		this.liblsl.pushSample(this.defaultOutlet, [1, 2, 3])
	}

	// Must be at bottom of tests since it modifies env
	@test()
	protected static async liblslThrowsWithMissingOrInvalidPath() {
		assert.doesThrow(() => {
			delete process.env.LIBLSL_PATH
			new Liblsl()
		})
		assert.doesThrow(() => {
			process.env.LIBLSL_PATH = '/some/invalid/path'
			new Liblsl()
		})
	}
}

class SpyLiblsl extends Liblsl {
	public getBindings() {
		return this.bindings
	}
}
