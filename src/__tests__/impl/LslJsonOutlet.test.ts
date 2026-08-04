import { test, assert } from '@neurodevs/node-tdd'

import LslJsonOutlet, {
    JsonOutlet,
    JsonOutletOptions,
} from '../../impl/LslJsonOutlet.js'
import FakeLslOutlet from '../../testDoubles/LslOutlet/FakeLslOutlet.js'
import AbstractPackageTest from '../AbstractPackageTest.js'

export default class LslJsonOutletTest extends AbstractPackageTest {
    private static instance: JsonOutlet

    protected static async beforeEach() {
        await super.beforeEach()

        this.setFakeLslOutlet()

        LslJsonOutlet.backupIdCounter = 0

        this.instance = await this.LslJsonOutlet()
    }

    @test()
    protected static async createsInstance() {
        assert.isTruthy(this.instance, 'Failed to create instance!')
    }

    @test()
    protected static async loadsWithJsonSpecificOptionsOnce() {
        assert.isEqualDeep(FakeLslOutlet.callsToConstructor[0], {
            name: `JSON (json-1)`,
            type: 'JSON',
            sourceId: 'json-1',
            channelNames: ['JSON'],
            channelFormat: 'string',
            sampleRateHz: 0,
            chunkSize: 1,
        })
    }

    @test()
    protected static async loadsWithJsonSpecificOptionsTwice() {
        await this.LslJsonOutlet()

        assert.isEqualDeep(FakeLslOutlet.callsToConstructor[1], {
            name: `JSON (json-2)`,
            type: 'JSON',
            sourceId: 'json-2',
            channelNames: ['JSON'],
            channelFormat: 'string',
            sampleRateHz: 0,
            chunkSize: 1,
        })
    }

    @test()
    protected static async canOverrideDefaultOptions() {
        const channelName = this.generateId()

        await this.LslJsonOutlet({
            name: this.name_,
            type: this.type,
            sourceId: this.sourceId,
            channelName,
            sampleRateHz: this.sampleRateHz,
            chunkSize: this.chunkSize,
        })

        assert.isEqualDeep(FakeLslOutlet.callsToConstructor[1], {
            name: this.name_,
            type: this.type,
            sourceId: this.sourceId,
            channelNames: [channelName],
            channelFormat: 'string',
            sampleRateHz: this.sampleRateHz,
            chunkSize: this.chunkSize,
        })
    }

    @test()
    protected static async pushJsonSerializesAndPushesToLslOutlet() {
        const data = { [this.generateId()]: this.generateId() }

        this.instance.pushJson(data)

        assert.isEqualDeep(FakeLslOutlet.callsToPushSample[0]?.sample, [
            JSON.stringify(data),
        ])
    }

    @test()
    protected static async destroyCallsDestroyOnLslOutlet() {
        this.instance.destroy()

        assert.isEqual(
            FakeLslOutlet.numCallsToDestroy,
            1,
            'Did not call destroy on outlet!'
        )
    }

    @test()
    protected static async pushJsonThrowsIfPayloadExceedsMaxBytesPerSample() {
        const maxBytesPerSample = 10

        const instance = await this.LslJsonOutlet({ maxBytesPerSample })
        const data = { [this.generateId()]: this.generateId() }

        assert.doesThrow(
            () => instance.pushJson(data),
            `Payload of ${JSON.stringify(data).length} bytes exceeds maxBytesPerSample of ${maxBytesPerSample}!`
        )
    }

    private static LslJsonOutlet(options?: JsonOutletOptions) {
        return LslJsonOutlet.Create(options)
    }
}
