import { generateId } from '@sprucelabs/test-utils'

export default class LslInlet implements StreamInlet {
    public static Class?: LslInletConstructor

    protected name: string
    protected type: string
    protected sourceId: string

    protected constructor(options?: LslInletOptions) {
        const {
            name = this.defaultName,
            type = this.defaultType,
            sourceId = this.defaultSourceId,
        } = options ?? {}

        this.name = name
        this.type = type
        this.sourceId = sourceId
    }

    public static Create(options?: LslInletOptions) {
        return new (this.Class ?? this)(options)
    }

    private readonly defaultName = `lsl-inlet-${generateId()}`
    private readonly defaultType = generateId()
    private readonly defaultSourceId = generateId()
}

export interface StreamInlet {}

export type LslInletConstructor = new () => StreamInlet

export interface LslInletOptions {
    name?: string
    type?: string
    sourceId?: string
}
