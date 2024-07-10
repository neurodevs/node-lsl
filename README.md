# node-lsl
Lab Streaming Layer (LSL) for synchronized streaming of multi-modal, time-series data over a network.

This package is a Node wrapper around the C++ [liblsl](https://github.com/sccn/liblsl) library. It was developed and tested on a MacOS system with an M2 chip. It should work with any M-series chip: M1, M2, M3. There are known issues for this package with x86 MacOS architectures.

Please note that this package currently only supports LSL outlets, ie. sending data over a network. It does not yet support LSL inlets, ie. receiving data from a network.

## Installation

First, you need to install the C++ [liblsl](https://github.com/sccn/liblsl) library. I personally use brew on MacOS to install it, and the previous link to it specifies alternatives:

`brew install labstreaminglayer/tap/lsl`

Then, you need to install the package with your preferred package manager (make sure to be in the right directory for your Node project):

`npm install @neurodevs/node-lsl` 

or 

`yarn add @neurodevs/node-lsl`

Finally, you need to add the following to your `.env` file or otherwise make it an environmental variable. This path is just what happens to be on my system, so please update your path accordingly:

```.env
LIBLSL_PATH=/opt/homebrew/Cellar/lsl/1.16.2/lib/liblsl.1.16.2.dylib
```

## Usage

LSL is often used to stream EEG data over a network. For example, see below for how to instantiate an LSL outlet for the [Muse S 2nd generation](https://choosemuse.com/products/muse-s-gen-2) headband. You'll still need to separately pull data from the Muse and call `pushSample` accordingly.

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

LSL is also often used to push time markers for the beginning and end of different phases. Usually, the time marker is represented as a unique string and pushed at the precise time that some event happens. 

This package provides a default implementation for pushing time markers that should work for most use cases. It's basically just a regular LslOutlet with a set of preconfigured values that are appropriate for a time marker outlet:

```typescript
import { TimeMarkerOutletImpl } from '@neurodevs/node-lsl'

const outlet = TimeMarkerOutletImpl.Outlet()

// Must be in async function
await outlet.pushSample('phase-1-begin')

// Wait for phase to end

await outlet.pushSample('phase-1-end')
```

You can also optionally pass any LslOutlet options to the time marker outlet. For example if you want to override the type:

```typescript
import { TimeMarkerOutletImpl } from '@neurodevs/node-lsl'

const outlet = TimeMarkerOutletImpl.Outlet({
    type: 'custom-type'
})
