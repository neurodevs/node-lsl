import { randomInt } from 'crypto'
import { test, assert } from '@neurodevs/node-tdd'

import LslWebSocketBridge, {
    StreamTransportBridge,
    StreamTransportBridgeOptions,
} from '../../impl/LslWebSocketBridge.js'
import FakeStreamInlet from '../../testDoubles/StreamInlet/FakeStreamInlet.js'
import AbstractPackageTest from '../AbstractPackageTest.js'

export default class LslWebSocketBridgeTest extends AbstractPackageTest {
    private static instance: StreamTransportBridge

    protected static async beforeEach() {
        await super.beforeEach()

        this.setFakeStreamInlet()

        this.instance = this.LslWebSocketBridge()
    }

    @test()
    protected static async createsInstance() {
        assert.isTruthy(this.instance, 'Failed to create instance!')
    }

    @test()
    protected static async createsLslStreamInlet() {
        const { channelNames, channelFormat, sampleRateHz, chunkSize } =
            FakeStreamInlet.callsToConstructor[0]?.options ?? {}

        assert.isEqualDeep(
            {
                channelNames,
                channelFormat,
                sampleRateHz,
                chunkSize,
            },
            this.baseOptions
        )
    }

    private static readonly baseOptions = {
        channelNames: this.channelNames,
        channelFormat: 'float32' as const,
        sampleRateHz: 100 * Math.random(),
        chunkSize: randomInt(1, 100),
    }

    private static LslWebSocketBridge(
        options?: Partial<StreamTransportBridgeOptions>
    ) {
        return LslWebSocketBridge.Create({ ...this.baseOptions, ...options })
    }
}
