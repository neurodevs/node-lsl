import { generateId } from '@sprucelabs/test-utils'

export default class LslInlet implements StreamInlet {
    public static Class?: LslInletConstructor

    protected name: string
    protected type: string
    protected sourceId: string
    protected manufacturer: string
    protected units: string

    protected constructor(options?: LslInletOptions) {
        const {
            name = this.defaultName,
            type = this.defaultType,
            sourceId = this.defaultSourceId,
            manufacturer = this.defaultManufacturer,
        } = options ?? {}

        this.name = name
        this.type = type
        this.sourceId = sourceId
        this.manufacturer = manufacturer
        this.units = 'N/A'
    }

    public static Create(options?: LslInletOptions) {
        return new (this.Class ?? this)(options)
    }

    private readonly defaultName = `lsl-inlet-${generateId()}`
    private readonly defaultType = generateId()
    private readonly defaultSourceId = generateId()
    private readonly defaultManufacturer = 'N/A'
}

export interface StreamInlet {}

export type LslInletConstructor = new () => StreamInlet

export interface LslInletOptions {
    name?: string
    type?: string
    sourceId?: string
    manufacturer?: string
}
