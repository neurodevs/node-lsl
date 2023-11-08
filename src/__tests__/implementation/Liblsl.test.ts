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
		// TAY 6.0 change to somethnig like
		// assert.isTruthy(process.env.LIBLSL_PATH, 'Add LIBLSL_PATH="path/to/liblsl.dylib" in your environment')
		// so we don't have to change this everytime we change machines or versions
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
		// TAY 2.2 to allow you to test the right things are passed to ffi
		// LibLsl.ffi = fakeFfi
		// you can yarn add -D @types/ffi-napi to get types to help you create the spy
	}

	@test()
	protected static async liblslThrowsWithUndefinedPath() {
		delete process.env.LIBLSL_PATH
		assert.doesThrow(() => new Liblsl())
	}

	// TAY 2.3 this is how you could test the corret things are passed to ffi
	/**
	 * @test()
	 * protected static async ffiSentExpectedParams() {
	 * 		const spyFfi = {...}
	 * 		this.libLsl.loadBindings()
	 * 		assert.isEqualDeep(spyFfi.libraryArgs, {
	 * 			path: process.env.LIBLSL_PATH,
	 * 			functions: {...}
	 * 		})
	 * }
	 */

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
		return this.liblsl.createOutlet(this.defaultInfo, 0, 360) // TAY 5.0 no need to return in tests
	}

	@test()
	protected static async liblslCanGetLocalClock() {
		return this.liblsl.getLocalClock() // TAY 5.1 no need to return in tests
	}

	@test()
	protected static async liblslCanPushSample() {
		return this.liblsl.pushSample(this.defaultOutlet, []) // TAY 5.2 no need to return in tests
	}
}

class SpyLiblsl extends Liblsl {
	public getBindings() {
		return this.bindings
	}
}
