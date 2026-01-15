import { test, assert } from '@neurodevs/node-tdd'

import LslBackpressureMonitor, {
    BackpressureMonitor,
} from '../../impl/LslBackpressureMonitor.js'
import AbstractPackageTest from '../AbstractPackageTest.js'

export default class LslBackpressureMonitorTest extends AbstractPackageTest {
    private static instance: BackpressureMonitor

    protected static async beforeEach() {
        await super.beforeEach()

        this.instance = this.LslBackpressureMonitor()
    }

    @test()
    protected static async createsInstance() {
        assert.isTruthy(this.instance, 'Failed to create instance!')
    }

    private static LslBackpressureMonitor() {
        return LslBackpressureMonitor.Create()
    }
}
