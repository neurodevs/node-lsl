import AbstractSpruceTest, { generateId } from '@sprucelabs/test-utils'
import EventMarkerOutlet from '../components/EventMarkerOutlet'
import LiblslAdapter from '../components/LiblslAdapter'
import LslStreamInfo from '../components/LslStreamInfo'
import LslStreamInlet from '../components/LslStreamInlet'

import LslStreamOutlet from '../components/LslStreamOutlet'
import FakeLiblsl from '../testDoubles/Liblsl/FakeLiblsl'
import { SpyLslInlet } from '../testDoubles/LslInlet/SpyLslInlet'
import FakeLslOutlet from '../testDoubles/LslOutlet/FakeLslOutlet'
import SpyMarkerOutlet from '../testDoubles/MarkerOutlet/SpyMarkerOutlet'
import FakeStreamInfo from '../testDoubles/StreamInfo/FakeStreamInfo'
import SpyStreamInfo from '../testDoubles/StreamInfo/SpyStreamInfo'

export default class AbstractLslTest extends AbstractSpruceTest {
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

    protected static setSpyLslInlet() {
        LslStreamInlet.Class = SpyLslInlet
    }

    protected static setFakeLslOutlet() {
        LslStreamOutlet.Class = FakeLslOutlet
        FakeLslOutlet.resetTestDouble()
    }

    protected static setSpyMarkerOutlet() {
        EventMarkerOutlet.Class = SpyMarkerOutlet
    }

    protected static readonly name_ = generateId()
    protected static readonly type = generateId()
    protected static readonly sourceId = generateId()
    protected static readonly units = generateId()
    protected static readonly channelNames = [generateId(), generateId()]
    protected static readonly chunkSize = Math.floor(Math.random() * 100)
    protected static readonly maxBuffered = Math.floor(Math.random() * 100)
}
