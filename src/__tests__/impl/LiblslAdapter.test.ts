import { randomInt } from 'crypto'
import { test, assert } from '@neurodevs/node-tdd'
import {
    createPointer,
    DataType,
    FieldType,
    FuncObj,
    OpenParams,
    unwrapPointer,
} from 'ffi-rs'

import {
    BoundChild,
    BoundDescription,
    BoundInlet,
    BoundOutlet,
    BoundStreamInfo,
    Liblsl,
    LiblslBindings,
    LslChannel,
} from 'impl/LiblslAdapter.js'
import LiblslAdapter from '../../impl/LiblslAdapter.js'
import FakeLiblsl from '../../testDoubles/Liblsl/FakeLiblsl.js'
import AbstractPackageTest from '../AbstractPackageTest.js'

export default class LiblslAdapterTest extends AbstractPackageTest {
    private static instance: Liblsl
    private static libraryPath?: string
    private static libraryOptions?: Record<string, any>
    private static fakeBindings: LiblslBindings
    private static fakeStreamInfo: BoundStreamInfo
    private static fakeOutlet: BoundOutlet
    private static fakeInlet: BoundInlet = {}
    private static fakeDesc: BoundDescription
    private static fakeChildNamedChannels: BoundChild

    private static createStreamInfoParams?: any[]
    private static destroyStreamInfoParams?: any[]
    private static resolveByPropParams?: any[]
    private static appendChildParams: any[] = []
    private static createOutletParams?: any[]
    private static destroyOutletParams?: any[]
    private static createInletParams?: any[]
    private static flushInletParams?: any[]
    private static destroyInletParams?: any[]
    private static localClockParams?: any[]
    private static pushSampleFloatTimestampParams?: any[]
    private static pushSampleStringTimestampParams?: any[]
    private static appendChildValueParams: any[]
    private static shouldThrowWhenCreatingBindings: boolean
    private static getDescriptionParams?: [BoundStreamInfo]
    private static fakeChildNamedChannel: BoundChild
    private static appendChildHitCount: number
    private static ffiRsOpenOptions?: OpenParams
    private static ffiRsDefineOptions: FfiRsDefineOptions
    private static ffiRsLoadOptions?: Record<string, any>

    protected static async beforeEach() {
        await super.beforeEach()

        delete this.libraryPath
        delete this.libraryOptions
        delete this.createStreamInfoParams
        delete this.createOutletParams
        delete this.destroyOutletParams
        delete this.createInletParams
        delete this.destroyInletParams
        delete this.pushSampleFloatTimestampParams
        delete this.getDescriptionParams
        this.appendChildParams = []
        this.appendChildValueParams = []

        process.env.LIBLSL_PATH = this.generateId()

        this.fakeStreamInfo = {}
        this.fakeDesc = {}
        this.fakeOutlet = {}
        this.fakeChildNamedChannels = {}
        this.fakeChildNamedChannel = {}
        this.fakeBindings = this.FakeBindings()

        this.shouldThrowWhenCreatingBindings = false

        this.appendChildHitCount = 0

        delete this.ffiRsOpenOptions
        LiblslAdapter.open = (options) => {
            this.ffiRsOpenOptions = options
        }

        LiblslAdapter.define = (options) => {
            this.ffiRsDefineOptions = options as FfiRsDefineOptions
            if (this.shouldThrowWhenCreatingBindings) {
                throw new Error('Failed to create bindings!')
            }
            return this.fakeBindings as any
        }

        LiblslAdapter.load = (options) => {
            this.ffiRsLoadOptions = options
            return {} as any
        }

        LiblslAdapter.resetInstance()
        this.instance = LiblslAdapter.getInstance()
    }

    @test()
    protected static async createsInstance() {
        assert.isTruthy(this.instance, 'Failed to create instance!')
    }

    @test()
    protected static async throwsWhenBindingsFailToLoad() {
        this.shouldThrowWhenCreatingBindings = true
        LiblslAdapter.resetInstance()

        const err = assert.doesThrow(() => LiblslAdapter.getInstance())

        assert.isTrue(
            err.message.includes(this.generateFailedMessage()),
            'Did not receive the expected error!'
        )
    }

    @test()
    protected static async callsOpenOnFfiRs() {
        assert.isEqualDeep(this.ffiRsOpenOptions, {
            library: 'lsl',
            path: process.env.LIBLSL_PATH,
        })
    }

    @test()
    protected static async worksAsASingleton() {
        const liblsl = LiblslAdapter.getInstance()
        //@ts-ignore
        assert.isInstanceOf(liblsl, LiblslAdapter)
    }

    @test()
    protected static async singletonIsTheSame() {
        assert.isEqual(LiblslAdapter.getInstance(), LiblslAdapter.getInstance())
    }

    @test()
    protected static canSetInstance() {
        const fake = new FakeLiblsl()
        LiblslAdapter.setInstance(fake)
        assert.isEqual(LiblslAdapter.getInstance(), fake)
    }

    @test()
    protected static async createsExpectedBindingsWithFfiRs() {
        assert.isEqualDeep(this.ffiRsDefineOptions, {
            lsl_create_streaminfo: {
                library: 'lsl',
                retType: DataType.External,
                paramsType: [
                    DataType.String,
                    DataType.String,
                    DataType.I32,
                    DataType.Double,
                    DataType.I32,
                    DataType.String,
                ],
            },
            lsl_destroy_streaminfo: {
                library: 'lsl',
                retType: DataType.Void,
                paramsType: [DataType.External],
            },
            lsl_resolve_byprop: {
                library: 'lsl',
                retType: DataType.I32,
                paramsType: [
                    DataType.External,
                    DataType.I32,
                    DataType.String,
                    DataType.String,
                    DataType.I32,
                    DataType.Double,
                ],
            },
            lsl_create_outlet: {
                library: 'lsl',
                retType: DataType.External,
                paramsType: [DataType.External, DataType.I32, DataType.I32],
            },
            lsl_push_sample_ft: {
                library: 'lsl',
                retType: DataType.I32,
                paramsType: [
                    DataType.External,
                    DataType.FloatArray,
                    DataType.Double,
                ],
            },
            lsl_push_sample_strt: {
                library: 'lsl',
                retType: DataType.I32,
                paramsType: [
                    DataType.External,
                    DataType.StringArray,
                    DataType.Double,
                ],
            },
            lsl_destroy_outlet: {
                library: 'lsl',
                retType: DataType.Void,
                paramsType: [DataType.External],
            },
            lsl_create_inlet: {
                library: 'lsl',
                retType: DataType.External,
                paramsType: [
                    DataType.External,
                    DataType.I32,
                    DataType.I32,
                    DataType.I32,
                ],
            },
            lsl_flush_inlet: {
                library: 'lsl',
                retType: DataType.I32,
                paramsType: [DataType.External],
            },
            lsl_destroy_inlet: {
                library: 'lsl',
                retType: DataType.Void,
                paramsType: [DataType.External],
            },
            lsl_get_desc: {
                library: 'lsl',
                retType: DataType.External,
                paramsType: [DataType.External],
            },
            lsl_append_child: {
                library: 'lsl',
                retType: DataType.External,
                paramsType: [DataType.External, DataType.String],
            },
            lsl_append_child_value: {
                library: 'lsl',
                retType: DataType.External,
                paramsType: [
                    DataType.External,
                    DataType.String,
                    DataType.String,
                ],
            },
            lsl_local_clock: {
                library: 'lsl',
                retType: DataType.Double,
                paramsType: [],
            },
        })
    }

    @test()
    protected static async createsStreamInfoWithRequiredParams() {
        const options = this.generateRandomCreateStreamInfoOptions()
        const actual = this.instance.createStreamInfo(options)

        assert.isEqual(actual, this.fakeStreamInfo)
        assert.isEqualDeep(this.createStreamInfoParams, Object.values(options))
    }

    @test()
    protected static async destroysStreamInfoWithBoundInfo() {
        const info = this.createRandomStreamInfo()
        this.instance.destroyStreamInfo({ info })

        assert.isEqualDeep(
            this.destroyStreamInfoParams,
            [info],
            'Did not call destroyStreamInfo with expected params!'
        )
    }

    @test()
    protected static async resolvesStreamInfoByProp() {
        const resultsBufferElements = 1024
        const resultsBufferPtr = Buffer.alloc(resultsBufferElements)

        const minResults = 1
        const timeoutMs = 1000

        this.instance.resolveByProp({
            prop: this.prop,
            value: this.value,
            minResults,
            timeoutMs,
        })

        assert.isEqualDeep(
            this.resolveByPropParams,
            [
                resultsBufferPtr,
                resultsBufferElements,
                this.prop,
                this.value,
                minResults,
                timeoutMs / 1000,
            ],
            'Did not call resolveByProp with expected params!'
        )
    }

    @test()
    protected static async resolveByPropAcceptsOptionalArgs() {
        const minResults = randomInt(0, 10)
        const timeoutMs = Math.random() * 1000

        this.instance.resolveByProp({
            prop: this.prop,
            value: this.value,
            minResults,
            timeoutMs,
        })

        assert.isEqualDeep(
            {
                minResults: this.resolveByPropParams?.[4],
                timeoutMs: this.resolveByPropParams?.[5],
            },
            { minResults, timeoutMs: timeoutMs / 1000 },
            'Did not call resolveByProp with expected params!'
        )
    }

    @test()
    protected static async createsOutletWithRequiredParams() {
        const { options, outlet } = this.createRandomOutlet()

        const expected = {
            ...options,
            maxBufferedMs: options.maxBufferedMs / 1000,
        }

        assert.isEqualDeep(this.createOutletParams, Object.values(expected))
        assert.isEqual(outlet, this.fakeOutlet)
    }

    @test()
    protected static async pushesFloatSample() {
        const expected = [1.0, 2.0, 3.0]
        const timestamp = randomInt(100)
        const options = {
            outlet: this.fakeOutlet,
            sample: expected,
            timestamp,
        }
        this.instance.pushSampleFloatTimestamp(options)

        assert.isEqualDeep(this.pushSampleFloatTimestampParams, [
            this.fakeOutlet,
            expected,
            timestamp,
        ])
    }

    @test()
    protected static async pushesStringSample() {
        const expected = [this.generateId()]
        const timestamp = randomInt(100)
        const options = {
            outlet: this.fakeOutlet,
            sample: expected,
            timestamp,
        }
        this.instance.pushSampleStringTimestamp(options)
        assert.isEqual(
            this.pushSampleStringTimestampParams?.[0],
            this.fakeOutlet
        )
        assert.isEqualDeep(this.pushSampleStringTimestampParams?.[1], expected)
        assert.isEqual(this.pushSampleStringTimestampParams?.[2], timestamp)
    }

    @test()
    protected static async addingSingleChannelGetsDescription() {
        const info = this.createRandomStreamInfo()
        const channel: LslChannel = this.generateRandomChannelValues()

        this.instance.appendChannelsToStreamInfo({
            info,
            channels: [channel],
        })
        assert.isEqualDeep(this.getDescriptionParams?.[0], [info])

        assert.isEqual(this.appendChildParams?.[0][0], this.fakeDesc)
        assert.isEqual(this.appendChildParams?.[0][1], 'channels')

        assert.isEqual(
            this.appendChildParams?.[1][0],
            this.fakeChildNamedChannels
        )
        assert.isEqual(this.appendChildParams?.[1][1], 'channel')

        assert.isLength(this.appendChildValueParams, 3)

        for (let i = 0; i < 3; i++) {
            const param = this.appendChildValueParams[i]
            assert.isEqual(param[0], this.fakeChildNamedChannel)
        }

        assert.isEqual(this.appendChildValueParams[0][1], 'label')
        assert.isEqual(this.appendChildValueParams[1][1], 'unit')
        assert.isEqual(this.appendChildValueParams[2][1], 'type')

        assert.isEqual(this.appendChildValueParams[0][2], channel.label)
        assert.isEqual(this.appendChildValueParams[1][2], channel.units)
        assert.isEqual(this.appendChildValueParams[2][2], channel.type)
    }

    @test()
    protected static async addingMultpleChannelsAddsChildrenToChannelsChild() {
        const info = this.createRandomStreamInfo()
        const channel1 = this.generateRandomChannelValues()
        const channel2 = this.generateRandomChannelValues()

        this.instance.appendChannelsToStreamInfo({
            info,
            channels: [channel1, channel2],
        })

        assert.isEqual(
            this.appendChildParams?.[2][0],
            this.fakeChildNamedChannels
        )
        assert.isEqual(this.appendChildParams?.[2][1], 'channel')

        assert.isEqual(this.appendChildValueParams[3][2], channel2.label)
        assert.isEqual(this.appendChildValueParams[4][2], channel2.units)
        assert.isEqual(this.appendChildValueParams[5][2], channel2.type)
    }

    @test()
    protected static async canDestroyOutlet() {
        const outlet = this.createRandomOutlet()
        const options = { outlet }
        this.instance.destroyOutlet(options)

        assert.isEqualDeep(this.destroyOutletParams, Object.values(options))
    }

    @test()
    protected static async callingLocalClockTwiceReturnsDifferentTimestamps() {
        const t1 = this.instance.localClock()
        await this.wait(10)
        const t2 = this.instance.localClock()
        assert.isNotEqual(t1, t2)
    }

    @test()
    protected static async localClockBindingReceivesEmptyArray() {
        delete this.localClockParams
        this.instance.localClock()
        assert.isEqualDeep(this.localClockParams, [])
    }

    @test()
    protected static async defaultsToMacOsPath() {
        delete process.env.LIBLSL_PATH

        LiblslAdapter.resetInstance()
        this.instance = LiblslAdapter.getInstance()

        assert.isEqual(
            this.ffiRsOpenOptions?.path,
            '/opt/homebrew/Cellar/lsl/1.16.2/lib/liblsl.1.16.2.dylib'
        )
    }

    @test()
    protected static async createInletWithRequiredParams() {
        const { options, inlet } = this.createRandomInlet()
        const { maxBufferedMs } = options

        const expected = {
            ...options,
            maxBufferedMs: maxBufferedMs / 1000,
        }

        const maxChunkSize = 0
        const shouldRecover = 1

        assert.isEqualDeep(
            this.createInletParams,
            [...Object.values(expected), maxChunkSize, shouldRecover],
            'Did not call createInlet with expected params!'
        )

        assert.isEqual(inlet, this.fakeInlet, 'Did not receive expected inlet!')
    }

    @test()
    protected static async pullSampleCallsBinding() {
        const { inlet } = this.createRandomInlet()

        const dataBuffer = Buffer.alloc(4 * this.channelCount)
        const dataBufferElements = this.channelCount
        const timeout = 0.0

        const dataBufferPtr = unwrapPointer(
            createPointer({
                paramsType: [DataType.U8Array],
                paramsValue: [dataBuffer],
            })
        )[0]

        const errcodePtr = unwrapPointer(
            createPointer({
                paramsType: [DataType.U8Array],
                paramsValue: [new Int32Array(1)],
            })
        )[0]

        this.instance.pullSample({
            inlet,
            dataBufferPtr,
            dataBufferElements,
            timeout,
            errcodePtr,
        })

        assert.isEqualDeep(
            this.ffiRsLoadOptions,
            {
                library: 'lsl',
                funcName: 'lsl_pull_sample_f',
                retType: DataType.Double,
                paramsType: [
                    DataType.External,
                    DataType.External,
                    DataType.I32,
                    DataType.Double,
                    DataType.External,
                ],
                paramsValue: [
                    inlet,
                    dataBufferPtr,
                    dataBufferElements,
                    timeout,
                    errcodePtr,
                ],
            },
            'Did not call pullSample with expected options!'
        )
    }

    @test()
    protected static async pullChunkCallsBinding() {
        const { inlet } = this.createRandomInlet()

        const dataBuffer = Buffer.alloc(4 * this.chunkSize * this.channelCount)
        const timestampBuffer = Buffer.alloc(8 * this.chunkSize)
        const dataBufferElements = this.chunkSize * this.channelCount
        const timestampBufferElements = this.chunkSize
        const timeout = 0.0

        const dataBufferPtr = unwrapPointer(
            createPointer({
                paramsType: [DataType.U8Array],
                paramsValue: [dataBuffer],
            })
        )[0]

        const timestampBufferPtr = unwrapPointer(
            createPointer({
                paramsType: [DataType.U8Array],
                paramsValue: [timestampBuffer],
            })
        )[0]

        const errcodePtr = unwrapPointer(
            createPointer({
                paramsType: [DataType.U8Array],
                paramsValue: [new Int32Array(1)],
            })
        )[0]

        this.instance.pullChunk({
            inlet,
            dataBufferPtr,
            timestampBufferPtr,
            dataBufferElements,
            timestampBufferElements,
            timeout,
            errcodePtr,
        })

        assert.isEqualDeep(
            this.ffiRsLoadOptions,
            {
                library: 'lsl',
                funcName: 'lsl_pull_chunk_f',
                retType: DataType.Double,
                paramsType: [
                    DataType.External,
                    DataType.External,
                    DataType.External,
                    DataType.I32,
                    DataType.I32,
                    DataType.Double,
                    DataType.External,
                ],
                paramsValue: [
                    inlet,
                    dataBufferPtr,
                    timestampBufferPtr,
                    dataBufferElements,
                    timestampBufferElements,
                    timeout,
                    errcodePtr,
                ],
            },
            'Did not call pullChunk with expected options!'
        )
    }

    @test()
    protected static async flushInletCallsBinding() {
        const { inlet } = this.createRandomInlet()
        this.instance.flushInlet({ inlet })

        assert.isEqualDeep(
            this.flushInletParams,
            [inlet],
            'Should have called flushInlet with expected params!'
        )
    }

    @test()
    protected static async destroyInletCallsBinding() {
        const { inlet } = this.createRandomInlet()
        this.instance.destroyInlet({ inlet })

        assert.isEqualDeep(
            this.destroyInletParams,
            [inlet],
            'Should have called destroyInlet with expected params!'
        )
    }

    private static createRandomStreamInfo() {
        return this.instance.createStreamInfo(
            this.generateRandomCreateStreamInfoOptions()
        )
    }

    private static createRandomOutlet() {
        const options = this.createRandomOutletOptions()
        const outlet = this.instance.createOutlet(options)
        return { options, outlet }
    }

    private static createRandomOutletOptions() {
        const info = this.createRandomStreamInfo()
        const options = {
            info,
            chunkSize: randomInt(10),
            maxBufferedMs: randomInt(10),
        }
        return options
    }

    private static createRandomInlet() {
        const options = this.createRandomInletOptions()
        const inlet = this.instance.createInlet(options)
        return { options, inlet }
    }

    private static createRandomInletOptions() {
        const info = this.createRandomStreamInfo()
        const options = {
            info,
            maxBufferedMs: randomInt(10),
        }
        return options
    }

    private static generateRandomChannelValues() {
        return {
            label: this.generateId(),
            type: this.generateId(),
            units: this.generateId(),
        }
    }

    private static generateRandomCreateStreamInfoOptions() {
        return {
            name: this.generateId(),
            type: this.generateId(),
            channelCount: randomInt(1, 10),
            sampleRateHz: randomInt(100),
            channelFormat: randomInt(7),
            sourceId: this.generateId(),
        }
    }

    private static readonly prop = this.generateId()
    private static readonly value = this.generateId()

    private static generateFailedMessage() {
        return `Loading the liblsl dylib failed! I tried to load it from ${process.env.LIBLSL_PATH}.`
    }

    private static FakeBindings() {
        return {
            lsl_create_streaminfo: (params: any[]) => {
                this.createStreamInfoParams = params
                return this.fakeStreamInfo
            },
            lsl_destroy_streaminfo: (params: any[]) => {
                this.destroyStreamInfoParams = params
            },
            lsl_resolve_byprop: (params: any[]) => {
                this.resolveByPropParams = params
                return 0
            },
            lsl_create_outlet: (params: any[]) => {
                this.createOutletParams = params
                return this.fakeOutlet
            },
            lsl_push_sample_ft: (params: any[]) => {
                this.pushSampleFloatTimestampParams = params
                return 0
            },
            lsl_push_sample_strt: (params: any[]) => {
                this.pushSampleStringTimestampParams = params
                return 0
            },
            lsl_destroy_outlet: (params: any[]) => {
                this.destroyOutletParams = params
            },
            lsl_create_inlet: (params: any[]) => {
                this.createInletParams = params
                return this.fakeInlet
            },
            lsl_flush_inlet: (params: any[]) => {
                this.flushInletParams = params
                return 0
            },
            lsl_destroy_inlet: (params: any[]) => {
                this.destroyInletParams = params
            },
            lsl_local_clock: (params: []) => {
                this.localClockParams = params
                return new Date().getTime()
            },
            lsl_get_desc: (info: BoundStreamInfo) => {
                this.getDescriptionParams = [info]
                return this.fakeDesc
            },
            lsl_append_child: (params: any) => {
                this.appendChildParams.push(params)
                if (this.appendChildHitCount === 0) {
                    this.appendChildHitCount++
                    return this.fakeChildNamedChannels
                }
                return this.fakeChildNamedChannel
            },
            lsl_append_child_value: (params: any[]) => {
                this.appendChildValueParams.push(params)
            },
        }
    }
}

export type FfiRsDefineOptions = FuncObj<FieldType, boolean | undefined>
