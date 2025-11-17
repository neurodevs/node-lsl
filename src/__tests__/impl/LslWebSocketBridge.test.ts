import { randomInt } from 'crypto'

import { test, assert } from '@neurodevs/node-tdd'

import LslWebSocketBridge, {
    StreamTransportBridge,
    StreamTransportBridgeOptions,
} from '../../impl/LslWebSocketBridge.js'
import FakeStreamInlet from '../../testDoubles/StreamInlet/FakeStreamInlet.js'
import FakeWebSocketServer from '../../testDoubles/WebSockets/FakeWebSocketServer.js'
import AbstractPackageTest from '../AbstractPackageTest.js'

export default class LslWebSocketBridgeTest extends AbstractPackageTest {
    private static instance: StreamTransportBridge

    protected static async beforeEach() {
        await super.beforeEach()

        this.setFakeStreamInlet()
        this.setFakeWebSocketServer()

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

    @test()
    protected static async activateCallsStartPullingOnInlet() {
        this.activate()

        assert.isEqual(
            FakeStreamInlet.numCallsToStartPulling,
            1,
            'Did not call startPulling on inlet!'
        )
    }

    @test()
    protected static async deactivateCallsStopPullingOnInlet() {
        this.activate()
        this.deactivate()

        assert.isEqual(
            FakeStreamInlet.numCallsToStopPulling,
            1,
            'Did not call stopPulling on inlet!'
        )
    }

    @test()
    protected static async destroyCallsDestroyOnInlet() {
        this.destroy()

        assert.isEqual(
            FakeStreamInlet.numCallsToDestroy,
            1,
            'Did not call destroy on inlet!'
        )
    }

    @test()
    protected static async createsWebSocketServer() {
        assert.isEqualDeep(
            FakeWebSocketServer.callsToConstructor[0],
            { port: this.wssPort },
            'Did not create WebSocketServer!'
        )
    }

    @test()
    protected static async destroyClosesWebSocketServer() {
        this.destroy()

        assert.isEqual(
            FakeWebSocketServer.numCallsToClose,
            1,
            'Did not call close on WebSocketServer!'
        )
    }

    @test()
    protected static async throwsIfActivateIsCalledAfterDestroy() {
        this.destroy()

        assert.doesThrow(() => {
            this.activate()
        }, `\n\n Cannot re-activate bridge after destroying! \n\n Please create and activate a new instance. \n`)
    }

    private static activate() {
        this.instance.activate()
    }

    private static deactivate() {
        this.instance.deactivate()
    }

    private static destroy() {
        this.instance.destroy()
    }

    private static readonly wssPort = 8080

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
