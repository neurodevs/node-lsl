import AbstractModuleTest from '@neurodevs/node-tdd'
import WebSocket from 'ws'

import { Server } from 'ws'
import LiblslAdapter from '../impl/LiblslAdapter.js'
import LslEventMarkerOutlet from '../impl/LslEventMarkerOutlet.js'
import LslStreamInfo from '../impl/LslStreamInfo.js'
import LslStreamInlet, {
    OnDataCallback,
    StreamInletOptions,
} from '../impl/LslStreamInlet.js'
import LslStreamOutlet from '../impl/LslStreamOutlet.js'
import LslWebSocketBridge from '../impl/LslWebSocketBridge.js'
import SpyEventMarkerOutlet from '../testDoubles/EventMarkerOutlet/SpyEventMarkerOutlet.js'
import FakeLiblsl from '../testDoubles/Liblsl/FakeLiblsl.js'
import FakeStreamInfo from '../testDoubles/StreamInfo/FakeStreamInfo.js'
import SpyStreamInfo from '../testDoubles/StreamInfo/SpyStreamInfo.js'
import FakeStreamInlet from '../testDoubles/StreamInlet/FakeStreamInlet.js'
import { SpyStreamInlet } from '../testDoubles/StreamInlet/SpyStreamInlet.js'
import FakeStreamOutlet from '../testDoubles/StreamOutlet/FakeStreamOutlet.js'
import SpyLslWebSocketBridge from '../testDoubles/WebSocketBridge/SpyLslWebSocketBridge.js'
import FakeWebSocket from '../testDoubles/WebSockets/FakeWebSocket.js'
import FakeWebSocketServer from '../testDoubles/WebSockets/FakeWebSocketServer.js'

export default class AbstractPackageTest extends AbstractModuleTest {
    protected static fakeLiblsl: FakeLiblsl

    protected static async beforeEach() {
        await super.beforeEach()
    }

    protected static setFakeLiblsl() {
        this.fakeLiblsl = new FakeLiblsl()
        LiblslAdapter.setInstance(this.fakeLiblsl)

        FakeLiblsl.fakeErrorCode = 0
    }

    protected static setSpyStreamInfo() {
        LslStreamInfo.Class = SpyStreamInfo
        SpyStreamInfo.resetTestDouble()
    }

    protected static setFakeStreamInfo() {
        LslStreamInfo.Class = FakeStreamInfo
        FakeStreamInfo.resetTestDouble()
    }

    protected static setSpyStreamInlet() {
        LslStreamInlet.Class = SpyStreamInlet
    }

    protected static setFakeStreamInlet() {
        LslStreamInlet.Class = FakeStreamInlet
        FakeStreamInlet.resetTestDouble()
    }

    protected static setFakeStreamOutlet() {
        LslStreamOutlet.Class = FakeStreamOutlet
        FakeStreamOutlet.resetTestDouble()
    }

    protected static setSpyEventMarkerOutlet() {
        LslEventMarkerOutlet.Class = SpyEventMarkerOutlet
    }

    protected static setSpyLslWebSocketBridge() {
        LslWebSocketBridge.Class = SpyLslWebSocketBridge
    }

    protected static setFakeWebSocket() {
        LslWebSocketBridge.WS = FakeWebSocket as unknown as typeof WebSocket
        FakeWebSocket.resetTestDouble()
    }

    protected static setFakeWebSocketServer() {
        LslWebSocketBridge.WSS = FakeWebSocketServer as unknown as typeof Server
        FakeWebSocketServer.resetTestDouble()
    }

    protected static readonly name_ = this.generateId()
    protected static readonly type = this.generateId()
    protected static readonly sourceId = this.generateId()
    protected static readonly units = this.generateId()

    protected static readonly channelNames = [
        this.generateId(),
        this.generateId(),
        this.generateId(),
    ]

    protected static get channelCount() {
        return this.channelNames.length
    }

    protected static readonly chunkSize = 2
    protected static readonly sampleRateHz = Math.floor(Math.random() * 100)
    protected static readonly maxBufferedMs = Math.floor(Math.random() * 1000)

    protected static LslStreamInlet(
        options: Partial<StreamInletOptions>,
        onData: OnDataCallback
    ) {
        const defaultOptions = {
            sampleRateHz: 0,
            channelNames: this.channelNames,
            channelFormat: 'float32',
            chunkSize: this.chunkSize,
            maxBufferedMs: this.maxBufferedMs,
            name: this.name_,
            type: this.type,
            sourceId: this.sourceId,
            ...options,
        } as StreamInletOptions

        return LslStreamInlet.Create(defaultOptions, onData)
    }
}
