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
    ChildHandle,
    DescriptionHandle,
    InletHandle,
    OutletHandle,
    InfoHandle,
    Liblsl,
    LiblslBindings,
    LslChannel,
    ResolveByPropOptions,
} from 'impl/LiblslAdapter.js'
import LiblslAdapter from '../../impl/LiblslAdapter.js'
import FakeLiblsl from '../../testDoubles/Liblsl/FakeLiblsl.js'
import AbstractPackageTest from '../AbstractPackageTest.js'

export default class LiblslAdapterTest extends AbstractPackageTest {
    private static instance: Liblsl
    private static libraryPath?: string
    private static libraryOptions?: Record<string, any>

    private static fakeBindings: LiblslBindings
    private static shouldThrowWhenCreatingBindings: boolean

    private static fakeInfoHandle: InfoHandle
    private static fakeOutletHandle: OutletHandle
    private static fakeInletHandle: InletHandle = {}
    private static fakeDescHandle: DescriptionHandle
    private static fakeChildHandle: ChildHandle
    private static fakeChildNamedChannel: ChildHandle

    private static createStreamInfoParams?: any[]
    private static destroyStreamInfoParams?: any[]
    private static appendChildParams: any[] = []
    private static appendChildValueParams: any[]
    private static appendChildHitCount: number
    private static getDescriptionParams?: [InfoHandle]
    private static getChannelCountParams?: [InfoHandle]

    private static createOutletParams?: any[]
    private static pushSampleFloatTimestampParams?: any[]
    private static pushSampleStringTimestampParams?: any[]
    private static destroyOutletParams?: any[]

    private static createInletParams?: any[]
    private static flushInletParams?: any[]
    private static destroyInletParams?: any[]

    private static localClockParams?: any[]

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
        delete this.getChannelCountParams

        this.appendChildParams = []
        this.appendChildValueParams = []

        process.env.LIBLSL_PATH = this.generateId()

        this.fakeInfoHandle = {}
        this.fakeDescHandle = {}
        this.fakeOutletHandle = {}
        this.fakeChildHandle = {}
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
            return this.fakeNumResolveResults as any
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
            lsl_inlet_flush: {
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
            lsl_get_channel_count: {
                library: 'lsl',
                retType: DataType.I32,
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

        assert.isEqual(actual, this.fakeInfoHandle)
        assert.isEqualDeep(this.createStreamInfoParams, Object.values(options))
    }

    @test()
    protected static async destroyStreamInfoPasses() {
        const infoHandle = this.createRandomInfoHandle()
        this.instance.destroyStreamInfo({ infoHandle })

        assert.isEqualDeep(
            this.destroyStreamInfoParams,
            [infoHandle],
            'Did not call destroyStreamInfo with expected params!'
        )
    }

    @test()
    protected static async resolvesStreamInfoByProp() {
        await this.resolveByProp()

        assert.isEqualDeep(
            this.ffiRsLoadOptions,
            {
                library: 'lsl',
                funcName: 'lsl_resolve_byprop',
                retType: DataType.I32,
                paramsType: [
                    DataType.External,
                    DataType.I32,
                    DataType.String,
                    DataType.String,
                    DataType.I32,
                    DataType.Double,
                ],
                paramsValue: [
                    this.resultsBufferPtr,
                    this.maxResults,
                    this.prop,
                    this.value,
                    this.minResults,
                    this.timeoutMs / 1000,
                ],
                runInNewThread: true,
            },
            'Did not call resolveByProp with expected params!'
        )
    }

    @test()
    protected static async resolveByPropAcceptsOptionalArgs() {
        const minResults = randomInt(0, 10)
        const timeoutMs = Math.random() * 1000

        await this.resolveByProp({
            minResults,
            timeoutMs,
        })

        assert.isEqualDeep(
            {
                minResults: this.ffiRsLoadOptions?.['paramsValue']?.[4],
                timeoutMs: this.ffiRsLoadOptions?.['paramsValue']?.[5],
            },
            { minResults, timeoutMs: timeoutMs / 1000 },
            'Did not call resolveByProp with expected params!'
        )
    }

    @test()
    protected static async returnsHandlesForResolvedStreamInfos() {
        LiblslAdapter.alloc = (size: number) => {
            const buffer = Buffer.alloc(size)

            for (let i = 0; i < this.fakeNumResolveResults; i++) {
                const offset = i * this.bytesPerPointer
                buffer.writeBigUInt64LE(BigInt(i + 1), offset)
            }

            return buffer
        }

        const expectedHandles: bigint[] = []

        for (let i = 0; i < this.fakeNumResolveResults; i++) {
            expectedHandles.push(BigInt(i + 1))
        }

        const actualHandles = await this.resolveByProp()

        const actual = actualHandles.map((h) => h.toString())
        const expected = expectedHandles.map((h) => h.toString())

        assert.isEqualDeep(
            actual,
            expected,
            'Did not receive expected resolved stream info handles!'
        )
    }

    @test()
    protected static async createsOutletWithRequiredParams() {
        const { options, outletHandle } = this.createRandomOutlet()

        const expected = {
            ...options,
            maxBufferedMs: options.maxBufferedMs / 1000,
        }

        assert.isEqualDeep(this.createOutletParams, Object.values(expected))
        assert.isEqual(outletHandle, this.fakeOutletHandle)
    }

    @test()
    protected static async pushesFloatSample() {
        const expected = [1.0, 2.0, 3.0]
        const timestamp = randomInt(100)

        const options = {
            outletHandle: this.fakeOutletHandle,
            sample: expected,
            timestamp,
        }

        this.instance.pushSampleFloatTimestamp(options)

        assert.isEqualDeep(this.pushSampleFloatTimestampParams, [
            this.fakeOutletHandle,
            expected,
            timestamp,
        ])
    }

    @test()
    protected static async pushesStringSample() {
        const expected = [this.generateId()]
        const timestamp = randomInt(100)

        const options = {
            outletHandle: this.fakeOutletHandle,
            sample: expected,
            timestamp,
        }

        this.instance.pushSampleStringTimestamp(options)
        assert.isEqual(
            this.pushSampleStringTimestampParams?.[0],
            this.fakeOutletHandle
        )
        assert.isEqualDeep(this.pushSampleStringTimestampParams?.[1], expected)
        assert.isEqual(this.pushSampleStringTimestampParams?.[2], timestamp)
    }

    @test()
    protected static async addingSingleChannelGetsDescription() {
        const infoHandle = this.createRandomInfoHandle()
        const channel: LslChannel = this.generateRandomChannelValues()

        this.instance.appendChannelsToStreamInfo({
            infoHandle,
            channels: [channel],
        })
        assert.isEqualDeep(this.getDescriptionParams?.[0], [infoHandle])

        assert.isEqual(this.appendChildParams?.[0][0], this.fakeDescHandle)
        assert.isEqual(this.appendChildParams?.[0][1], 'channels')

        assert.isEqual(this.appendChildParams?.[1][0], this.fakeChildHandle)
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
        const infoHandle = this.createRandomInfoHandle()
        const channel1 = this.generateRandomChannelValues()
        const channel2 = this.generateRandomChannelValues()

        this.instance.appendChannelsToStreamInfo({
            infoHandle,
            channels: [channel1, channel2],
        })

        assert.isEqual(this.appendChildParams?.[2][0], this.fakeChildHandle)
        assert.isEqual(this.appendChildParams?.[2][1], 'channel')

        assert.isEqual(this.appendChildValueParams[3][2], channel2.label)
        assert.isEqual(this.appendChildValueParams[4][2], channel2.units)
        assert.isEqual(this.appendChildValueParams[5][2], channel2.type)
    }

    @test()
    protected static async canDestroyOutlet() {
        const { outletHandle } = this.createRandomOutlet()
        const options = { outletHandle }
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
        this.instance = LiblslAdapter.getInstance() as FakeLiblsl

        assert.isEqual(
            this.ffiRsOpenOptions?.path,
            '/opt/homebrew/Cellar/lsl/1.16.2/lib/liblsl.1.16.2.dylib'
        )
    }

    @test()
    protected static async createInletWithRequiredParams() {
        const { options, inletHandle } = this.createRandomInlet()
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

        assert.isEqual(
            inletHandle,
            this.fakeInletHandle,
            'Did not receive expected inlet!'
        )
    }

    @test()
    protected static async getsChannelCountFromInfoHandle() {
        const infoHandle = this.createRandomInfoHandle()

        const channelCount = this.instance.getChannelCount({ infoHandle })
        assert.isEqual(channelCount, this.channelCount)
    }

    @test()
    protected static async openStreamCallsBinding() {
        const { inletHandle } = this.createRandomInlet()

        const timeoutMs = randomInt(1000)

        const errorCodePtr = unwrapPointer(
            createPointer({
                paramsType: [DataType.U8Array],
                paramsValue: [new Int32Array(1)],
            })
        )[0]

        await this.instance.openStream({
            inletHandle,
            timeoutMs,
            errorCodePtr,
        })

        assert.isEqualDeep(
            this.ffiRsLoadOptions,
            {
                library: 'lsl',
                funcName: 'lsl_open_stream',
                retType: DataType.Void,
                paramsType: [
                    DataType.External,
                    DataType.Double,
                    DataType.External,
                ],
                paramsValue: [inletHandle, timeoutMs / 1000, errorCodePtr],
                runInNewThread: true,
            },
            'Did not call openStream with expected options!'
        )
    }

    @test()
    protected static async closeStreamCallsBinding() {
        const { inletHandle } = this.createRandomInlet()

        this.instance.closeStream({
            inletHandle,
        })

        assert.isEqualDeep(
            this.ffiRsLoadOptions,
            {
                library: 'lsl',
                funcName: 'lsl_close_stream',
                retType: DataType.Void,
                paramsType: [DataType.External],
                paramsValue: [inletHandle],
            },
            'Did not call closeStream with expected options!'
        )
    }

    @test()
    protected static async pullSampleCallsBinding() {
        const { inletHandle } = this.createRandomInlet()

        const dataBuffer = Buffer.alloc(4 * this.channelCount)
        const dataBufferElements = this.channelCount
        const timeoutMs = 0.0

        const dataBufferPtr = unwrapPointer(
            createPointer({
                paramsType: [DataType.U8Array],
                paramsValue: [dataBuffer],
            })
        )[0]

        const errorCodePtr = unwrapPointer(
            createPointer({
                paramsType: [DataType.U8Array],
                paramsValue: [new Int32Array(1)],
            })
        )[0]

        this.instance.pullSample({
            inletHandle,
            dataBufferPtr,
            dataBufferElements,
            timeoutMs,
            errorCodePtr,
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
                    inletHandle,
                    dataBufferPtr,
                    dataBufferElements,
                    timeoutMs,
                    errorCodePtr,
                ],
            },
            'Did not call pullSample with expected options!'
        )
    }

    @test()
    protected static async pullChunkCallsBinding() {
        const { inletHandle } = this.createRandomInlet()

        const dataBuffer = Buffer.alloc(4 * this.chunkSize * this.channelCount)
        const timestampBuffer = Buffer.alloc(8 * this.chunkSize)
        const dataBufferElements = this.chunkSize * this.channelCount
        const timestampBufferElements = this.chunkSize
        const timeoutMs = 0.0

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

        const errorCodePtr = unwrapPointer(
            createPointer({
                paramsType: [DataType.U8Array],
                paramsValue: [new Int32Array(1)],
            })
        )[0]

        this.instance.pullChunk({
            inletHandle,
            dataBufferPtr,
            timestampBufferPtr,
            dataBufferElements,
            timestampBufferElements,
            timeoutMs,
            errorCodePtr,
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
                    inletHandle,
                    dataBufferPtr,
                    timestampBufferPtr,
                    dataBufferElements,
                    timestampBufferElements,
                    timeoutMs,
                    errorCodePtr,
                ],
            },
            'Did not call pullChunk with expected options!'
        )
    }

    @test()
    protected static async flushInletCallsBinding() {
        const { inletHandle } = this.createRandomInlet()
        this.instance.flushInlet({ inletHandle })

        assert.isEqualDeep(
            this.flushInletParams,
            [inletHandle],
            'Should have called flushInlet with expected params!'
        )
    }

    @test()
    protected static async destroyInletCallsBinding() {
        const { inletHandle } = this.createRandomInlet()
        this.instance.destroyInlet({ inletHandle })

        assert.isEqualDeep(
            this.destroyInletParams,
            [inletHandle],
            'Should have called destroyInlet with expected params!'
        )
    }

    private static createRandomInfoHandle() {
        return this.instance.createStreamInfo(
            this.generateRandomCreateStreamInfoOptions()
        )
    }

    private static async resolveByProp(
        options?: Partial<ResolveByPropOptions>
    ) {
        return this.instance.resolveByProp({
            prop: this.prop,
            value: this.value,
            minResults: this.minResults,
            timeoutMs: this.timeoutMs,
            ...options,
        })
    }

    private static createRandomOutlet() {
        const options = this.createRandomOutletOptions()
        const outletHandle = this.instance.createOutlet(options)
        return { options, outletHandle }
    }

    private static createRandomOutletOptions() {
        const infoHandle = this.createRandomInfoHandle()

        return {
            infoHandle,
            chunkSize: randomInt(10),
            maxBufferedMs: randomInt(10),
        }
    }

    private static createRandomInlet() {
        const options = this.createRandomInletOptions()
        const inletHandle = this.instance.createInlet(options)
        return { options, inletHandle }
    }

    private static createRandomInletOptions() {
        const infoHandle = this.createRandomInfoHandle()

        return {
            infoHandle,
            maxBufferedMs: randomInt(10),
        }
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

    // resolveByProp
    private static readonly maxResults = 1024
    private static readonly bytesPerPointer = 8
    private static readonly minResults = 1
    private static readonly timeoutMs = 1000
    private static readonly prop = this.generateId()
    private static readonly value = this.generateId()
    private static readonly fakeNumResolveResults = 2

    private static readonly resultsBuffer = Buffer.alloc(
        this.maxResults * this.bytesPerPointer
    )

    private static readonly resultsBufferRef = createPointer({
        paramsType: [DataType.U8Array],
        paramsValue: [this.resultsBuffer],
    })

    private static readonly resultsBufferPtr = unwrapPointer(
        this.resultsBufferRef
    )[0]

    private static generateFailedMessage() {
        return `Loading the liblsl dylib failed! I tried to load it from ${process.env.LIBLSL_PATH}.`
    }

    private static FakeBindings() {
        return {
            lsl_create_streaminfo: (params: any[]) => {
                this.createStreamInfoParams = params
                return this.fakeInfoHandle
            },
            lsl_destroy_streaminfo: (params: any[]) => {
                this.destroyStreamInfoParams = params
            },
            lsl_create_outlet: (params: any[]) => {
                this.createOutletParams = params
                return this.fakeOutletHandle
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
                return this.fakeInletHandle
            },
            lsl_inlet_flush: (params: any[]) => {
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
            lsl_get_channel_count: (info: InfoHandle) => {
                this.getChannelCountParams = [info]
                return this.channelCount
            },
            lsl_get_desc: (info: InfoHandle) => {
                this.getDescriptionParams = [info]
                return this.fakeDescHandle
            },
            lsl_append_child: (params: any) => {
                this.appendChildParams.push(params)
                if (this.appendChildHitCount === 0) {
                    this.appendChildHitCount++
                    return this.fakeChildHandle
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
