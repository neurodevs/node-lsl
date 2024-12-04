import AbstractSpruceTest, { generateId } from '@sprucelabs/test-utils'
import LiblslImpl from '../components/Liblsl'
import LslInlet from '../components/LslInlet'
import LslStreamInfo from '../components/LslStreamInfo'
import TimeMarkerOutletImpl from '../components/TimeMarkerOutlet'
import FakeLiblsl from '../testDoubles/FakeLiblsl'
import FakeStreamInfo from '../testDoubles/FakeStreamInfo'
import { SpyLslInlet } from '../testDoubles/SpyLslInlet'
import SpyLslStreamInfo from '../testDoubles/SpyLslStreamInfo'
import SpyTimeMarkerOutlet from '../testDoubles/SpyTimeMarkerOutlet'

export default class AbstractNodeLslTest extends AbstractSpruceTest {
    protected static fakeLiblsl: FakeLiblsl

    protected static async beforeEach() {
        await super.beforeEach()

        this.setFakeLiblsl()
    }

    protected static setFakeLiblsl() {
        this.fakeLiblsl = new FakeLiblsl()
        LiblslImpl.setInstance(this.fakeLiblsl)
    }

    protected static setSpyLslStreamInfo() {
        LslStreamInfo.Class = SpyLslStreamInfo
    }

    protected static setFakeStreamInfo() {
        LslStreamInfo.Class = FakeStreamInfo
    }

    protected static setSpyLslInlet() {
        LslInlet.Class = SpyLslInlet
    }

    protected static setSpyTimeMarkerOutlet() {
        TimeMarkerOutletImpl.Class = SpyTimeMarkerOutlet
    }

    protected static readonly channelNames = [generateId(), generateId()]
    protected static readonly infoName = generateId()
    protected static readonly type = generateId()
    protected static readonly sourceId = generateId()
    protected static readonly units = generateId()
    protected static readonly chunkSize = Math.floor(Math.random() * 100)
    protected static readonly maxBuffered = Math.floor(Math.random() * 100)
}
