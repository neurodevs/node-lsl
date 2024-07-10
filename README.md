# node-lsl
Lab Streaming Layer (LSL) for synchronized streaming of multi-modal, time-series data over a network.

This package is a Node wrapper around the C++ [liblsl](https://github.com/sccn/liblsl) library. It was developed and tested on a MacOS system with an M2 chip. It should work with any M-series chip: M1, M2, M3. There are known issues for this package with x86 MacOS architectures. Its performance on Linux or Windows machines is unknown.

Please note that this package currently only supports LSL outlets (sending data over a network). It does not yet support LSL inlets (receiving data from a network).

## Installation

First, you need to install the C++ [liblsl](https://github.com/sccn/liblsl) library. On MacOS, you can use Homebrew to install it, as specified in its [documentation](https://github.com/sccn/liblsl?tab=readme-ov-file#getting-and-using-liblsl):

`brew install labstreaminglayer/tap/lsl`

Then, install the package with your preferred package manager (make sure to be in the right directory for your Node project):

`npm install @neurodevs/node-lsl` 

or 

`yarn add @neurodevs/node-lsl`

Finally, add the following to your .env file or otherwise set it as an environmental variable. Update the path to match your system:

```.env
LIBLSL_PATH=/opt/homebrew/Cellar/lsl/1.16.2/lib/liblsl.1.16.2.dylib
```

## Usage

LSL is often used to stream EEG data over a network. For example, to instantiate an LSL outlet for the [Muse S 2nd generation](https://choosemuse.com/products/muse-s-gen-2) headband:

```typescript
import { LslOutletImpl } from '@neurodevs/node-lsl'

const outlet = LslOutletImpl.Outlet({
    name: 'Muse S (2nd gen)',
    type: 'EEG',
    channelNames: ['TP9', 'AF7', 'AF8', 'TP10', 'AUX'],
    sampleRate: 256,
    channelFormat: 'float32',
    sourceId: 'muse-s-eeg',
    manufacturer: 'Interaxon Inc.',
    unit: 'microvolt',
    chunkSize: 12,
    maxBuffered: 360,
})

// Must be in async function
await outlet.pushSample(...)
```

LSL is also often used to push time markers for different phases of an experiment or session:

```typescript
import { TimeMarkerOutletImpl } from '@neurodevs/node-lsl'

const outlet = TimeMarkerOutletImpl.Outlet()

// Must be in async function
await outlet.pushSample('phase-1-begin')

// Wait for phase to end

await outlet.pushSample('phase-1-end')
```

There is also a `pushMarkers` method that pushes a time marker, waits for a specified duration, then pushes the next marker. I recommend that each time marker has a duration of at least 100 ms so that LSL receives the markers in the right order.

```typescript
const markers = [
    { name: 'phase-1-begin', durationMs: 30 * 1000 },
    { name: 'phase-1-end', durationMs: 0.1 * 1000 },
    { name: 'phase-2-begin', durationMs: 60 * 1000 },
    ...
]

// Must be in async function, hangs until complete
await outlet.pushMarkers(markers)
```

If you then want to stop the time marker outlet early, you simply do:

```typescript
outlet.stop()
```

You can optionally pass any LslOutlet options to the time marker outlet during instantiation. For example, if you want to override the type:

```typescript
import { TimeMarkerOutletImpl } from '@neurodevs/node-lsl'

const outlet = TimeMarkerOutletImpl.Outlet({
    type: 'custom-type'
})
```

## Test Doubles

This package was developed using test-driven development (TDD). If you also follow TDD, you'll likely want test doubles to fake or mock certain behaviors for these classes.

For example, the `MockTimeMarkerOutlet` class lets you test whether your application appropriately calls its methods without actually doing anything. Set this mock in your test code like this:

```typescript
import { TimeMarkerOutletImpl, MockTimeMarkerOutlet } from '@neurodevs/node-lsl'

// In your tests / beforeEach
TimeMarkerOutletImpl.Class = MockTimeMarkerOutlet

const mock = TimeMarkerOutletImpl.Outlet()

// Do something in your application that should start the outlet

const expectedMarkers = ['phase-1-begin', ...]
mock.assertDidPushSamples(expectedMarkers)
```

Now, you'll have a failing test. There will be a helpful error message to guide you towards the solution. Basically, you just need to call the `pushSample` method in your application with the expected markers. See examples above for how to do so.
