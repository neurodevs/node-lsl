export const TEST_CHANNEL_FORMATS = [
	'undefined',
	'float32',
	'double64',
	'string',
	'int32',
	'int16',
	'int8',
	'int64',
] as const

export type TestChannelFormat = (typeof TEST_CHANNEL_FORMATS)[number]
