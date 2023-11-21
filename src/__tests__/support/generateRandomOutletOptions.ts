import { randomInt } from 'crypto'
import { generateId } from '@sprucelabs/test-utils'
import { LslOutletOptions } from '../../LslOutlet'
import { TEST_CHANNEL_FORMATS } from './consts'

export default function generateRandomOutletOptions(randomChannelIdx: number) {
	return {
		name: generateId(),
		type: generateId(),
		channelNames: new Array(randomInt(1, 10)).fill(generateId()),
		sampleRate: Math.random() * 10,
		channelFormat: TEST_CHANNEL_FORMATS[randomChannelIdx],
		sourceId: generateId(),
		manufacturer: generateId(),
		unit: generateId(),
		chunkSize: randomInt(0, 10),
		maxBuffered: randomInt(0, 10),
	} as LslOutletOptions
}
