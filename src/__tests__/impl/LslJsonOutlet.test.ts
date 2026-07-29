import { test, assert } from '@neurodevs/node-tdd'

import LslJsonOutlet, { JsonOutlet } from '../../impl/LslJsonOutlet.js'
import AbstractPackageTest from '../AbstractPackageTest.js'

export default class LslJsonOutletTest extends AbstractPackageTest {
    private static instance: JsonOutlet

    protected static async beforeEach() {
        await super.beforeEach()

        this.instance = this.LslJsonOutlet()
    }

    @test()
    protected static async createsInstance() {
        assert.isTruthy(this.instance, 'Failed to create instance!')
    }

    private static LslJsonOutlet() {
        return LslJsonOutlet.Create()
    }
}
