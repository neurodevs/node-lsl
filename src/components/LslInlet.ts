import { generateId } from '@sprucelabs/test-utils'

export default class LslInlet implements StreamInlet {
    public static Class?: LslInletConstructor

    protected name: string
    protected type: string

    protected constructor(options?: LslInletOptions) {
        const { name, type } = options ?? {}

        this.name = name ?? `lsl-inlet-${generateId()}`
        this.type = type ?? generateId()
    }

    public static Create(options?: LslInletOptions) {
        return new (this.Class ?? this)(options)
    }
}

export interface StreamInlet {}

export type LslInletConstructor = new () => StreamInlet

export interface LslInletOptions {
    name?: string
    type?: string
}
