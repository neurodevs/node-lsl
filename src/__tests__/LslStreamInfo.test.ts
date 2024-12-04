import AbstractSpruceTest, { test, assert } from '@sprucelabs/test-utils'
import LslStreamInfo, { StreamInfo } from '../components/LslStreamInfo'

export default class LslStreamInfoTest extends AbstractSpruceTest {
    private static instance: StreamInfo

    protected static async beforeEach() {
        await super.beforeEach()

        this.instance = this.StreamInfo()
    }

    @test()
    protected static async canCreateLslInlet() {
        assert.isTruthy(this.instance, 'Instance should be created!')
    }

    private static StreamInfo() {
        return LslStreamInfo.Create()
    }
}
