import { FakeLiblsl } from '@neurodevs/ndx-native'
import { assert, test } from '@neurodevs/node-tdd'
import handleError from '../../lib/handleError.js'
import AbstractPackageTest from '../AbstractPackageTest.js'

export default class HandleErrorTest extends AbstractPackageTest {
    @test()
    protected static async throwsWithUnknownErrorCode() {
        await this.assertThrowsWithErrorCode(
            -999,
            `An unknown liblsl error has occurred!`
        )
    }

    @test()
    protected static async throwsWithErrorCodeNegativeOne() {
        await this.assertThrowsWithErrorCode(
            -1,
            `The liblsl operation failed due to a timeout!`
        )
    }

    @test()
    protected static async throwsWithErrorCodeNegativeTwo() {
        await this.assertThrowsWithErrorCode(
            -2,
            `The liblsl stream has been lost!`
        )
    }

    @test()
    protected static async throwsWithErrorCodeNegativeThree() {
        await this.assertThrowsWithErrorCode(
            -3,
            'A liblsl argument was incorrectly specified!'
        )
    }

    @test()
    protected static async throwsWithErrorCodeNegativeFour() {
        await this.assertThrowsWithErrorCode(
            -4,
            'An internal liblsl error has occurred!'
        )
    }

    private static async assertThrowsWithErrorCode(
        errorCode: number,
        message: string
    ) {
        FakeLiblsl.fakeErrorCode = errorCode

        assert.doesThrow(() => {
            handleError(errorCode)
        }, message)
    }
}
