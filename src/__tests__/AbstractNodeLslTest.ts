import AbstractSpruceTest, { generateId } from '@sprucelabs/test-utils'
import LiblslImpl from '../components/Liblsl'
import FakeLiblsl from '../testDoubles/FakeLiblsl'

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

    protected static readonly channelNames = [generateId(), generateId()]
    protected static readonly infoName = generateId()
    protected static readonly type = generateId()
    protected static readonly sourceId = generateId()
    protected static readonly units = generateId()
    protected static readonly chunkSize = Math.floor(Math.random() * 100)
    protected static readonly maxBuffered = Math.floor(Math.random() * 100)
}
