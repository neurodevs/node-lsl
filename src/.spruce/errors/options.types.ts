import { SpruceErrors } from "#spruce/errors/errors.types"
import { ErrorOptions as ISpruceErrorOptions} from "@sprucelabs/error"

export interface FailedToLoadLiblslErrorOptions extends SpruceErrors.NodeLsl.FailedToLoadLiblsl, ISpruceErrorOptions {
	code: 'FAILED_TO_LOAD_LIBLSL'
}

type ErrorOptions =  | FailedToLoadLiblslErrorOptions 

export default ErrorOptions
