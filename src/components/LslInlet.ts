import { generateId } from '@sprucelabs/test-utils'

export default class LslInlet implements StreamInlet {
    public static Class?: LslInletConstructor

    protected name: string

    protected constructor() {
        this.name = `lsl-inlet-${generateId()}`
    }

    public static Create() {
        return new (this.Class ?? this)()
    }
}

export interface StreamInlet {}

export type LslInletConstructor = new () => StreamInlet
