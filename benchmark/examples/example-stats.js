exports.exampleStats = () => {
  return {
    date: new Date('2019-09-22T12:45:59.720Z'),
    count: 1000000,
    durationMicroSeconds: 32424549.001,
    averageOverheadMicroSeconds: 32.425,
    operationsPerSecond: 30840.83,
    cpu: {
      manufacturer: 'Intel®',
      brand: 'Xeon® E3-1225 v3',
      vendor: 'GenuineIntel',
      family: '6',
      model: '60',
      stepping: '3',
      revision: '',
      voltage: '',
      speed: '3.20',
      speedmin: '0.80',
      speedmax: '3.20',
      cores: 8,
      physicalCores: 4,
      processors: 1,
      socket: '',
      cache: { l1d: 32768, l1i: 32768, l2: 262144, l3: 8388608 }
    },
    os: {
      platform: 'linux',
      distro: 'Ubuntu',
      release: '18.04.3 LTS',
      kernel: '4.15.0-64-generic',
      arch: 'x64',
      servicepack: ''
    }
  }
}
