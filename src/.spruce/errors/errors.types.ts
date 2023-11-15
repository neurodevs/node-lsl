/* eslint-disable @typescript-eslint/no-namespace */
/* eslint-disable no-redeclare */

import { default as SchemaEntity } from '@sprucelabs/schema'
import * as SpruceSchema from '@sprucelabs/schema'





export declare namespace SpruceErrors.NodeLsl {

	
	export interface FailedToLoadLiblsl {
		
			
			'liblslPath': string
	}

	export interface FailedToLoadLiblslSchema extends SpruceSchema.Schema {
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

	export type FailedToLoadLiblslEntity = SchemaEntity<SpruceErrors.NodeLsl.FailedToLoadLiblslSchema>

}




