import { test, assert } from '@sprucelabs/test-utils'
import LslStreamInfo, { StreamInfo } from '../components/LslStreamInfo'
import AbstractNodeLslTest from './AbstractNodeLslTest'

export default class LslStreamInfoTest extends AbstractNodeLslTest {
    private static instance: StreamInfo

    protected static async beforeEach() {
        await super.beforeEach()

        this.instance = this.LslStreamInfo()
    }

    @test()
    protected static async canCreateLslInlet() {
        assert.isTruthy(this.instance, 'Instance should be created!')
    }

    private static LslStreamInfo() {
        return LslStreamInfo.Create()
    }
}
