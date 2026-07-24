import { randomInt } from 'node:crypto'

import generateId from '@neurodevs/generate-id'

import { LslOutletOptions } from '../impl/LslStreamOutlet.js'
import { TEST_SUPPORTED_CHANNEL_FORMATS } from './consts.js'

export default function generateRandomOutletOptions() {
    const randomChannelIdx = randomInt(TEST_SUPPORTED_CHANNEL_FORMATS.length)

    return {
        name: generateId(),
        type: generateId(),
        channelNames: new Array(randomInt(1, 10)).fill(generateId()),
        sampleRateHz: Math.random() * 10,
        channelFormat: TEST_SUPPORTED_CHANNEL_FORMATS[randomChannelIdx],
        sourceId: generateId(),
        manufacturer: generateId(),
        units: generateId(),
        chunkSize: randomInt(0, 10),
        maxBufferedMs: randomInt(0, 10),
    } as LslOutletOptions
}
