import { SchemaRegistry } from '@sprucelabs/schema'
import { SpruceErrors } from '../errors.types'



const failedToLoadLiblslSchema: SpruceErrors.NodeLsl.FailedToLoadLiblslSchema  = {
	id: 'failedToLoadLiblsl',
	namespace: 'NodeLsl',
	name: 'FAILED_TO_LOAD_LIBLSL',
	    fields: {
	            /** . */
	            'liblslPath': {
	                type: 'text',
	                isRequired: true,
	                options: undefined
	            },
	    }
}

SchemaRegistry.getInstance().trackSchema(failedToLoadLiblslSchema)

export default failedToLoadLiblslSchema
