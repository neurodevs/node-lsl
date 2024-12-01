import { assertOptions } from '@sprucelabs/schema'
import { generateId } from '@sprucelabs/test-utils'
import LiblslImpl from './Liblsl'

export default class LslInlet implements StreamInlet {
    public static Class?: LslInletConstructor

    protected name: string
    protected type: string
    protected sourceId: string
    protected manufacturer: string
    protected units: string
    private sampleRate: number
    private channelNames: string[]

    protected constructor(options: LslInletOptions) {
        const {
            sampleRate,
            channelNames,
            name = this.defaultName,
            type = this.defaultType,
            sourceId = this.defaultSourceId,
            manufacturer = this.defaultManufacturer,
            units = this.defaultUnits,
        } = options ?? {}

        this.sampleRate = sampleRate
        this.channelNames = channelNames
        this.name = name
        this.type = type
        this.sourceId = sourceId
        this.manufacturer = manufacturer
        this.units = units

        this.createStreamInfo()
    }

    public static Create(options: LslInletOptions) {
        assertOptions(options, ['sampleRate', 'channelNames', 'channelFormat'])
        return new (this.Class ?? this)(options)
    }

    private createStreamInfo() {
        this.lsl.createStreamInfo({
            name: this.name,
            type: this.type,
            channelCount: this.channelCount,
            sampleRate: this.sampleRate,
            channelFormat: 0,
            sourceId: this.sourceId,
        })
    }

    private get channelCount() {
        return this.channelNames.length
    }

    private get lsl() {
        return LiblslImpl.getInstance()
    }

    private readonly defaultName = `lsl-inlet-${generateId()}`
    private readonly defaultType = generateId()
    private readonly defaultSourceId = generateId()
    private readonly defaultManufacturer = 'N/A'
    private readonly defaultUnits = 'N/A'
}

export interface StreamInlet {}

export type LslInletConstructor = new (options: LslInletOptions) => StreamInlet

export interface LslInletOptions {
    sampleRate: number
    channelNames: string[]
    channelFormat: number
    name?: string
    type?: string
    sourceId?: string
    manufacturer?: string
    units?: string
}
