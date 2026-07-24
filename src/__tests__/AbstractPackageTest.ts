import { randomInt } from 'node:crypto'

import WebSocket, { Server } from 'ws'
import {
    FakeLiblsl,
    FakeLibndx,
    InfoHandle,
    LiblslAdapter,
    LibndxAdapter,
} from '@neurodevs/ndx-native'
import AbstractModuleTest from '@neurodevs/node-tdd'

import SpyLslEmitter from '../testDoubles/LslEmitter/SpyLslEmitter.js'
import FakeLslInfo from '../testDoubles/LslInfo/FakeLslInfo.js'
import SpyLslInfo from '../testDoubles/LslInfo/SpyLslInfo.js'
import FakeLslInlet from '../testDoubles/LslInlet/FakeLslInlet.js'
import { SpyLslInlet } from '../testDoubles/LslInlet/SpyLslInlet.js'
import FakeLslOutlet from '../testDoubles/LslOutlet/FakeLslOutlet.js'
import SpyLslWebSocketBridge from '../testDoubles/LslBridge/SpyLslBridge.js'
import FakeWebSocket from '../testDoubles/WebSockets/FakeWebSocket.js'
import FakeWebSocketServer from '../testDoubles/WebSockets/FakeWebSocketServer.js'
import LslWebSocketBridge from '../impl/LslWebSocketBridge.js'
import BleDeviceController from '../impl/controllers/BleDeviceController.js'
import LslEventMarkerEmitter from '../impl/LslEventMarkerEmitter.js'
import LslStreamInfo from '../impl/LslStreamInfo.js'
import LslStreamInlet, {
    OnDataCallback,
    LslInletOptions,
} from '../impl/LslStreamInlet.js'
import LslStreamOutlet from '../impl/LslStreamOutlet.js'

export default class AbstractPackageTest extends AbstractModuleTest {
    protected static fakeLiblsl: FakeLiblsl
    protected static fakeLibndx: FakeLibndx

    protected static readonly fakeLslInfo = new FakeLslInfo()

    protected static readonly name_ = this.generateId()
    protected static readonly type = this.generateId()
    protected static readonly sourceId = this.generateId()
    protected static readonly units = this.generateId()

    protected static readonly channelNames = [
        this.generateId(),
        this.generateId(),
        this.generateId(),
    ]

    protected static readonly channelCount = this.channelNames.length

    protected static readonly chunkSize = randomInt(2, 100)
    protected static readonly sampleRateHz = Math.floor(Math.random() * 100)
    protected static readonly maxBufferedMs = Math.floor(Math.random() * 1000)

    protected static async beforeEach() {
        await super.beforeEach()

        this.setImmediateTimeouts()

        this.setFakeLibndx()
    }

    protected static setFakeLiblsl() {
        this.fakeLiblsl = new FakeLiblsl()
        LiblslAdapter.setInstance(this.fakeLiblsl)

        FakeLiblsl.fakeErrorCode = 0
        FakeLiblsl.fakeInfoHandles = [{} as InfoHandle]
    }

    protected static callsToSetTimeout: number[] = []

    protected static setImmediateTimeouts() {
        this.callsToSetTimeout = []

        BleDeviceController.setTimeout = ((
            callback: (...args: unknown[]) => void,
            delayMs?: number,
            ...args: unknown[]
        ) => {
            this.callsToSetTimeout.push(delayMs ?? 0)
            return setTimeout(callback, 0, ...args)
        }) as unknown as typeof setTimeout

        LslStreamOutlet.setTimeout = ((
            callback: (...args: unknown[]) => void,
            delayMs?: number,
            ...args: unknown[]
        ) => {
            this.callsToSetTimeout.push(delayMs ?? 0)
            return setTimeout(callback, 0, ...args)
        }) as unknown as typeof setTimeout

        LslStreamInlet.setTimeout = ((
            callback: (...args: unknown[]) => void,
            delayMs?: number,
            ...args: unknown[]
        ) => {
            this.callsToSetTimeout.push(delayMs ?? 0)
            return setTimeout(callback, 0, ...args)
        }) as unknown as typeof setTimeout
    }

    protected static setFakeLibndx() {
        this.fakeLibndx = new FakeLibndx()
        LibndxAdapter.setInstance(this.fakeLibndx)

        FakeLibndx.resetTestDouble()
        FakeLibndx.fakeResult = { status: 200 }

        BleDeviceController.ndx = this.fakeLibndx
    }

    protected static setSpyLslInfo() {
        LslStreamInfo.Class = SpyLslInfo
        SpyLslInfo.resetTestDouble()
    }

    protected static setFakeLslInfo() {
        LslStreamInfo.Class = FakeLslInfo
        FakeLslInfo.resetTestDouble()
    }

    protected static setSpyLslInlet() {
        LslStreamInlet.Class = SpyLslInlet
    }

    protected static setFakeLslInlet() {
        LslStreamInlet.Class = FakeLslInlet
        FakeLslInlet.resetTestDouble()
    }

    protected static setFakeLslOutlet() {
        LslStreamOutlet.Class = FakeLslOutlet
        FakeLslOutlet.resetTestDouble()
    }

    protected static setSpyLslEmitter() {
        LslEventMarkerEmitter.Class = SpyLslEmitter
    }

    protected static setSpyLslBridge() {
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

    protected static async LslStreamInlet(
        options: Partial<LslInletOptions>,
        onData: OnDataCallback
    ) {
        const defaultOptions: LslInletOptions = {
            sourceId: this.sourceId,
            chunkSize: this.chunkSize,
            maxBufferedMs: this.maxBufferedMs,
            ...options,
        }

        return LslStreamInlet.Create(defaultOptions, onData)
    }
}
