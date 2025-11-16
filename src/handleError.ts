export default function handleError(errorCode: number) {
    switch (errorCode) {
        case 0:
            return
        case -1:
            throw new Error(`The liblsl operation failed due to a timeout!`)
        case -2:
            throw new Error(`The liblsl stream has been lost!`)
        case -3:
            throw new Error(`A liblsl argument was incorrectly specified!`)
        case -4:
            throw new Error(`An internal liblsl error has occurred!`)
        default:
            throw new Error(`An unknown liblsl error has occurred!`)
    }
}

export enum LslErrorCode {
    Ok = 0,
    Timeout = -1,
    Lost = -2,
    BadArgument = -3,
    InternalError = -4,
}
