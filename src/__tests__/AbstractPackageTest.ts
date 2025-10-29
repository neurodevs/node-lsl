import generateId from '@neurodevs/generate-id'
import AbstractModuleTest from '@neurodevs/node-tdd'

import LiblslAdapter from '../impl/LiblslAdapter.js'
import LslEventMarkerOutlet from '../impl/LslEventMarkerOutlet.js'
import LslStreamInfo from '../impl/LslStreamInfo.js'
import LslStreamInlet from '../impl/LslStreamInlet.js'

import LslStreamOutlet from '../impl/LslStreamOutlet.js'
import SpyEventMarkerOutlet from '../testDoubles/EventMarkerOutlet/SpyEventMarkerOutlet.js'
import FakeLiblsl from '../testDoubles/Liblsl/FakeLiblsl.js'
import FakeStreamInfo from '../testDoubles/StreamInfo/FakeStreamInfo.js'
import SpyStreamInfo from '../testDoubles/StreamInfo/SpyStreamInfo.js'
import { SpyStreamInlet } from '../testDoubles/StreamInlet/SpyStreamInlet.js'
import FakeStreamOutlet from '../testDoubles/StreamOutlet/FakeStreamOutlet.js'

export default class AbstractPackageTest extends AbstractModuleTest {
    protected static fakeLiblsl: FakeLiblsl

    protected static async beforeEach() {
        await super.beforeEach()

        this.setFakeLiblsl()
    }

    protected static setFakeLiblsl() {
        this.fakeLiblsl = new FakeLiblsl()
        LiblslAdapter.setInstance(this.fakeLiblsl)
    }

    protected static setSpyStreamInfo() {
        LslStreamInfo.Class = SpyStreamInfo
    }

    protected static setFakeStreamInfo() {
        LslStreamInfo.Class = FakeStreamInfo
        FakeStreamInfo.resetTestDouble()
    }

    protected static setSpyStreamInlet() {
        LslStreamInlet.Class = SpyStreamInlet
    }

    protected static setFakeStreamOutlet() {
        LslStreamOutlet.Class = FakeStreamOutlet
        FakeStreamOutlet.resetTestDouble()
    }

    protected static setSpyEventMarkerOutlet() {
        LslEventMarkerOutlet.Class = SpyEventMarkerOutlet
    }

    protected static generateId() {
        return generateId()
    }

    protected static readonly name_ = generateId()
    protected static readonly type = generateId()
    protected static readonly sourceId = generateId()
    protected static readonly units = generateId()
    protected static readonly channelNames = [generateId(), generateId()]
    protected static readonly chunkSize = Math.floor(Math.random() * 100)
    protected static readonly maxBuffered = Math.floor(Math.random() * 100)
    protected static readonly sampleRate = Math.floor(Math.random() * 100)
}
