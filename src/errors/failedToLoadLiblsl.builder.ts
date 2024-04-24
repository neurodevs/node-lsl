import { buildErrorSchema } from '@sprucelabs/schema'

export default buildErrorSchema({
    id: 'failedToLoadLiblsl',
    name: 'FAILED_TO_LOAD_LIBLSL',
    fields: {
        liblslPath: {
            type: 'text',
            isRequired: true,
        },
    },
})
