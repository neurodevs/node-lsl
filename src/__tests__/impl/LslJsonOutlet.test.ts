import { test, assert } from '@neurodevs/node-tdd'

import LslJsonOutlet, { JsonOutlet } from '../../impl/LslJsonOutlet.js'
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

    private static LslJsonOutlet() {
        return LslJsonOutlet.Create()
    }
}
