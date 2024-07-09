# node-lsl
Lab Streaming Layer (LSL) for synchronized streaming of multi-modal, time-series data over a network.

This package is a Node wrapper around the C++ [liblsl](https://github.com/sccn/liblsl) library. It was developed and tested on a MacOS system with an M2 chip. It should work with any M-series chip: M1, M2, M3. There are known issues for this package with x86 MacOS architectures.

## Installation

First, you need to install the C++ [liblsl](https://github.com/sccn/liblsl) library. I personally use brew on MacOS to install it, and the provided link to it specifies alternatives:

`brew install labstreaminglayer/tap/lsl`

Then, you need to install the `node-lsl` package with your preferred package manager (make sure to be in the right directory for your Node project):

`npm install @neurodevs/node-lsl` 

or 

`yarn add @neurodevs/node-lsl`

## Usage

LSL is often used to stream EEG data over a network. For example, see below for how to instantiate an LSL outlet for the [Muse S 2nd generation](https://choosemuse.com/products/muse-s-gen-2) headband. You'll still need to separately pull data from the Muse and call `pushSample` accordingly.

```
import { LslOutletImpl } from '@neurodevs/node-lsl'

// Must be in async function
const outlet = await LslOutletImpl.Outlet({
    name: 'Muse S (2nd gen)',
    type: 'EEG',
    channelNames: ['TP9', 'AF7', 'AF8', 'TP10', 'AUX'],
    sampleRate: MUSE_EEG_SAMPLE_RATE_HZ,
    channelFormat: 'float32',
    sourceId: 'muse-s-eeg',
    manufacturer: 'Interaxon Inc.',
    unit: 'microvolt',
    chunkSize: 12,
    maxBuffered: 360,
})

// Must be in async function
await outlet.pushSample(0.5)
```
