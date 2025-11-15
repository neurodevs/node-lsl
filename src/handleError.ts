import LiblslAdapter from './impl/LiblslAdapter.js'

const lsl = LiblslAdapter.getInstance()

export default function handleError(errorCode: number) {
    switch (errorCode) {
        case 0:
            return
        default:
            throw new Error(
                `An unspecified error occurred in the liblsl library! ${lsl.liblslPath}`
            )
    }
}
