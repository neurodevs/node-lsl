import { randomInt } from 'crypto'

import { test, assert } from '@neurodevs/node-tdd'

import LslWebSocketBridge, {
    WebSocketBridgeOptions,
} from '../../impl/LslWebSocketBridge.js'
import FakeStreamInlet from '../../testDoubles/StreamInlet/FakeStreamInlet.js'
import SpyLslWebSocketBridge from '../../testDoubles/WebSocketBridge/SpyLslWebSocketBridge.js'
import FakeWebSocket from '../../testDoubles/WebSockets/FakeWebSocket.js'
import FakeWebSocketServer from '../../testDoubles/WebSockets/FakeWebSocketServer.js'
import AbstractPackageTest from '../AbstractPackageTest.js'

export default class LslWebSocketBridgeTest extends AbstractPackageTest {
    private static instance: SpyLslWebSocketBridge

    protected static async beforeEach() {
        await super.beforeEach()

        this.setFakeStreamInlet()
        this.setFakeWebSocketServer()
        this.setSpyLslWebSocketBridge()

        this.instance = this.LslWebSocketBridge() as SpyLslWebSocketBridge
    }

    @test()
    protected static async createsInstance() {
        assert.isTruthy(this.instance, 'Failed to create instance!')
    }

    @test()
    protected static async createsLslStreamInlet() {
        const {
            channelNames,
            channelFormat,
            sampleRateHz,
            chunkSize,
            name,
            type,
            sourceId,
        } = FakeStreamInlet.callsToConstructor[0]?.options ?? {}

        assert.isEqualDeep(
            {
                channelNames,
                channelFormat,
                sampleRateHz,
                chunkSize,
                name,
                type,
                sourceId,
            },
            this.inletOptions
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
    protected static async activateSendsDataToWebSocketClients() {
        this.activate()

        const { samples, timestamps } = this.simulateOnDataCallback()

        for (const client of FakeWebSocketServer.clients) {
            const callToClient = FakeWebSocket.callsToSend.filter(
                (c) => c.id === client.id
            )[0]

            assert.isEqualDeep(
                callToClient?.data,
                JSON.stringify({
                    samples,
                    timestamps,
                }),
                'Did not send data to client!'
            )
        }
    }

    @test()
    protected static async doesNotSendToClientsThatAreNotReady() {
        for (const client of FakeWebSocketServer.clients) {
            client.readyState = WebSocket.CONNECTING
        }

        this.activate()
        this.simulateOnDataCallback()

        assert.isEqual(
            FakeWebSocket.callsToSend.length,
            0,
            'Sent data to clients that are not ready!'
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
        }, `\n\n Cannot re-activate bridge after destroying it! \n\n Please create and activate a new instance. \n`)
    }

    @test()
    protected static async acceptsOptionalWssPort() {
        FakeWebSocketServer.resetTestDouble()

        const wssPort = randomInt(1000, 9999)

        this.LslWebSocketBridge({ wssPort })

        assert.isEqual(
            FakeWebSocketServer.callsToConstructor[0]?.port,
            wssPort,
            'Did not set port for WebSocketServer!'
        )
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

    private static simulateOnDataCallback() {
        const samples = new Float32Array([1, 2, 3, 4, 5, 6])
        const timestamps = new Float64Array([7, 8])

        FakeStreamInlet.callsToConstructor[0]?.onData!(samples, timestamps)
        return { samples, timestamps }
    }

    private static readonly wssPort = randomInt(1000, 5000)

    private static readonly inletOptions = {
        channelNames: this.channelNames,
        channelFormat: 'float32' as const,
        sampleRateHz: 100 * Math.random(),
        chunkSize: randomInt(1, 100),
        name: this.generateId(),
        type: this.generateId(),
        sourceId: this.generateId(),
    }

    private static readonly baseOptions = {
        ...this.inletOptions,
        wssPort: this.wssPort,
    }

    private static LslWebSocketBridge(
        options?: Partial<WebSocketBridgeOptions>
    ) {
        return LslWebSocketBridge.Create({ ...this.baseOptions, ...options })
    }
}
