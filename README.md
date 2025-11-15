# node-lsl
Lab Streaming Layer (LSL) for synchronized streaming of multi-modal, time-series data over a network.

## Table of Contents
- [Overview](#overview)
- [Installation](#installation)
- [Usage](#usage)
  - [LslStreamOutlet](#lslstreamoutlet)
  - [LslEventMarkerOutlet](#lsleventmarkeroutlet) 
- [Test Doubles](#test-doubles)

## Overview

This package is a Node wrapper around the C++ [liblsl](https://github.com/sccn/liblsl) library. It was developed and tested on a MacOS system with an M2 chip. It should work with any M-series chip: M1, M2, M3. There are known issues for this package with x86 MacOS architectures. It's untested for Windows or Linux.

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

### LslStreamOutlet

LSL is often used to stream EEG data over a network. For example, to instantiate an LSL outlet for the [Muse S 2nd generation](https://choosemuse.com/products/muse-s-gen-2) headband:

```typescript
import { LslStreamOutlet } from '@neurodevs/node-lsl'

const outlet = await LslStreamOutlet.Create({
    name: 'Muse S (2nd gen)',
    type: 'EEG',
    channelNames: ['TP9', 'AF7', 'AF8', 'TP10', 'AUX'],
    sampleRateHz: 256,
    channelFormat: 'float32',
    sourceId: 'muse-s-eeg',
    manufacturer: 'Interaxon Inc.',
    unit: 'microvolt',
    chunkSize: 12,
})

outlet.pushSample([1, 2, 3, 4, 5])
```

### LslEventMarkerOutlet

LSL is also often used to push event markers that mark different phases of an experiment or session. The `pushMarkers` method pushes an event marker, waits for a specified duration, then pushes the next marker. I recommend that each event marker has a duration of at least 100 ms so that LSL receives the markers in the right order.

```typescript
import { LslEventMarkerOutlet } from '@neurodevs/node-lsl'

const outlet = await LslEventMarkerOutlet.Create()

const markers = [
    { name: 'phase-1-begin', durationMs: 1000 },
    { name: 'phase-1-end', durationMs: 100 },
]

// Hangs until complete
await outlet.pushMarkers(markers)

// Void promise, does not hang
void outlet.pushMarkers(markers)

// Interrupts the above pushMarkers process
outlet.stop()
```

## Test Doubles

This package was developed using test-driven development (TDD). If you also follow TDD, you'll likely want test doubles to fake or mock certain behaviors for these classes.

For example, the `MockEventMarkerOutlet` class lets you test whether your application appropriately calls its methods without actually doing anything. Set this mock in your test code like this:

```typescript
import { LslEventMarkerOutlet, MockEventMarkerOutlet } from '@neurodevs/node-lsl'

// In your tests / beforeEach
LslEventMarkerOutlet.Class = MockEventMarkerOutlet
const mock = await LslEventMarkerOutlet.Create()

// Do something in your application that should start the outlet

const expectedMarkers = ['phase-1-begin', ...]
mock.assertDidPushSamples(expectedMarkers)
```

Now, you'll have a failing test. There will be a helpful error message to guide you towards the solution. Basically, you just need to call the `pushSample` method in your application with the expected markers. See examples above for how to do so.
