import AbstractSpruceTest from '@sprucelabs/test-utils'
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
}
