import { test, assert } from '@neurodevs/node-tdd'

import UsbDeviceController, {
    UsbController,
} from '../../impl/UsbDeviceController.js'
import AbstractPackageTest from '../AbstractPackageTest.js'

export default class UsbDeviceControllerTest extends AbstractPackageTest {
    private static instance: UsbController

    protected static async beforeEach() {
        await super.beforeEach()

        this.instance = this.UsbDeviceController()
    }

    @test()
    protected static async createsInstance() {
        assert.isTruthy(this.instance, 'Failed to create instance!')
    }

    private static UsbDeviceController() {
        return UsbDeviceController.Create()
    }
}
