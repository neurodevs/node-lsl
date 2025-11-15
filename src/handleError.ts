import LiblslAdapter from './impl/LiblslAdapter.js'

export default function handleError(errorCode: number) {
    switch (errorCode) {
        case 0:
            return
        case -1:
            throw new Error(`The operation failed due to a timeout!`)
        case -2:
            throw new Error(`The stream has been lost!`)
        default:
            throw new Error(
                `An unknown error occurred in the liblsl library! ${LiblslAdapter.getInstance().liblslPath}`
            )
    }
}
