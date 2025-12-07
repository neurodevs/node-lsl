import { test, assert } from '@neurodevs/node-tdd'

import { CHANNEL_FORMATS } from '../../consts.js'
import LslStreamInfo, { StreamInfoOptions } from '../../impl/LslStreamInfo.js'
import SpyStreamInfo from '../../testDoubles/StreamInfo/SpyStreamInfo.js'
import AbstractPackageTest from '../AbstractPackageTest.js'

export default class LslStreamInfoTest extends AbstractPackageTest {
    private static instance: SpyStreamInfo

    protected static async beforeEach() {
        await super.beforeEach()

        this.setFakeLiblsl()
        this.setSpyStreamInfo()

        this.instance = this.LslStreamInfo()
    }

    @test()
    protected static async createsInstance() {
        assert.isTruthy(this.instance, 'Failed to create instance!')
    }

    @test()
    protected static async generatesUniqueNameIfNotProvided() {
        const instance1 = this.LslStreamInfo({
            name: undefined,
            type: this.generateId(),
        })

        const instance2 = this.LslStreamInfo({
            name: undefined,
            type: this.generateId(),
        })

        assert.isNotEqual(
            instance1.getName(),
            instance2.getName(),
            'Inlet names should be unique!'
        )
    }

    @test()
    protected static async uniqueNameHasSetPrefix() {
        const instance = this.LslStreamInfo({ name: undefined })

        assert.doesInclude(
            instance.getName(),
            'lsl-stream-info-',
            'Name should have set prefix!'
        )
    }

    @test()
    protected static async canManuallySetName() {
        const name = this.generateId()
        const instance = this.LslStreamInfo({ name })

        assert.isEqual(
            instance.getName(),
            name,
            'Name should be set to provided value!'
        )
    }

    @test()
    protected static async generatesUniqueTypeIfNotProvided() {
        const instance1 = this.LslStreamInfo({
            type: undefined,
            name: this.generateId(),
        })

        const instance2 = this.LslStreamInfo({
            type: undefined,
            name: this.generateId(),
        })

        assert.isNotEqual(
            instance1.getType(),
            instance2.getType(),
            'Inlet types should be unique!'
        )
    }

    @test()
    protected static async canManuallySetType() {
        const type = this.generateId()
        const instance = this.LslStreamInfo({ type })

        assert.isEqual(
            instance.getType(),
            type,
            'Type should be set to provided value!'
        )
    }

    @test()
    protected static async generatesUniqueSourceIdIfNotProvided() {
        const instance1 = this.LslStreamInfo({
            sourceId: undefined,
            name: this.generateId(),
        })

        const instance2 = this.LslStreamInfo({
            sourceId: undefined,
            name: this.generateId(),
        })

        assert.isNotEqual(
            instance1.getSourceId(),
            instance2.getSourceId(),
            'Inlet sourceIds should be unique!'
        )
    }

    @test()
    protected static async canManuallySetSourceId() {
        const sourceId = this.generateId()
        const instance = this.LslStreamInfo({ sourceId })

        assert.isEqual(
            instance.getSourceId(),
            sourceId,
            'SourceId should be set to provided value!'
        )
    }

    @test()
    protected static async setsUnitsToNAIfNotProvided() {
        assert.isEqual(
            this.instance.getUnits(),
            'N/A',
            'Units should be set to "N/A"!'
        )
    }

    @test()
    protected static async canManuallySetUnits() {
        const units = this.generateId()

        const instance = this.LslStreamInfo({
            units,
            sourceId: this.generateId(),
        })

        assert.isEqual(
            instance.getUnits(),
            units,
            'Units should be set to provided value!'
        )
    }

    @test()
    protected static async callsBindingsToCreateStreamInfo() {
        assert.isEqual(
            this.fakeLiblsl.createStreamInfoHitCount,
            1,
            'Should have called createStreamInfo!'
        )
    }

    @test()
    protected static async passesOptionsToStreamInfo() {
        const randomChannelIdx = Math.floor(
            Math.random() * CHANNEL_FORMATS.length
        )

        const options = {
            name: this.generateId(),
            type: this.generateId(),
            sourceId: this.generateId(),
            channelCount: this.channelNames.length,
            channelFormat: CHANNEL_FORMATS[randomChannelIdx],
            sampleRateHz: 100 * Math.random(),
        }

        this.LslStreamInfo(options)

        const expected = {
            ...options,
            channelFormat: randomChannelIdx,
        }

        assert.isEqualDeep(
            this.fakeLiblsl.lastCreateStreamInfoOptions,
            expected,
            'Should have passed options to createStreamInfo!'
        )
    }

    @test()
    protected static async appendsChannelsToStreamInfo() {
        this.LslStreamInfo({ units: this.units, type: this.type })

        assert.isEqualDeep(
            this.fakeLiblsl.lastAppendChannelsToStreamInfoOptions,
            {
                info: this.instance.boundInfo,
                channels: this.channelNames.map((label: string) => ({
                    label,
                    units: this.units,
                    type: this.type,
                })),
            },
            'Should have called appendChannelsToStreamInfo!'
        )
    }

    @test()
    protected static async callsBindingsToDestroyStreamInfo() {
        this.instance.destroy()

        assert.isEqualDeep(
            this.fakeLiblsl.lastDestroyStreamInfoOptions?.info,
            this.instance.boundInfo,
            'Should have called destroyStreamInfo!'
        )
    }

    @test()
    protected static async doesNotCreateNewStreamInfoIfPassedBoundInfo() {
        this.LslStreamInfo({
            boundInfo: this.instance.boundInfo,
        })

        assert.isEqual(
            this.fakeLiblsl.createStreamInfoHitCount,
            1,
            'Should not have created new stream info!'
        )
    }

    @test()
    protected static async setsBoundInfoWhenPassed() {
        const instance = this.LslStreamInfo({
            boundInfo: this.instance.boundInfo,
        })

        assert.isEqualDeep(
            instance.boundInfo,
            this.instance.boundInfo,
            'Should have set bound stream info!'
        )
    }

    @test()
    protected static async cachesInfoAttributesByBoundInfo() {
        const cached = LslStreamInfo.From(this.instance.boundInfo)

        assert.isEqualDeep(
            cached,
            this.instance,
            'Should have set bound stream info!'
        )
    }

    private static readonly defaultOptions = {
        name: this.name,
        type: this.type,
        sourceId: this.sourceId,
        channelNames: this.channelNames,
        channelFormat: 'float32',
        sampleRateHz: 100 * Math.random(),
    } as StreamInfoOptions

    private static LslStreamInfo(options?: Partial<StreamInfoOptions>) {
        return LslStreamInfo.Create({
            ...this.defaultOptions,
            ...options,
        }) as SpyStreamInfo
    }
}
