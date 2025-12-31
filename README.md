# node-lsl
Lab Streaming Layer (LSL) for synchronized streaming of multi-modal, time-series data over a network.

## Table of Contents
- [Overview](#overview)
- [Installation](#installation)
- [Usage](#usage)
  - [LslStreamOutlet](#lslstreamoutlet)
  - [LslEventMarkerEmitter](#LslEventMarkerEmitter) 
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
    sourceId: 'muse-s-eeg',
    channelNames: ['TP9', 'AF7', 'AF8', 'TP10', 'AUX'],
    channelFormat: 'float32',
    sampleRateHz: 256,
    chunkSize: 12,
})

outlet.pushSample([1, 2, 3, 4, 5])
```

### LslEventMarkerEmitter

LSL is also often used to push event markers that mark different phases of an experiment or session. The `emitMany` method pushes an event marker, waits for a specified duration, then pushes the next marker. From experience, each event marker should have a `waitForMs` of at least 100 ms or so to ensure LSL receives the event markers in the right order.

```typescript
import { LslEventMarkerEmitter } from '@neurodevs/node-lsl'

const emitter = await LslEventMarkerEmitter.Create()

const markers = [
    { name: 'phase-1-begin', waitForMs: 1000 },
    { name: 'phase-1-end', waitForMs: 100 },
]

const promise = emitter.emitMany(markers)

emitter.interrupt()
```
