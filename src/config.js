"use strict";
var global = typeof window !== 'undefined' ? window : self;
global.config = {
    apiUrl: "http://127.0.0.1:1984/",
    mainnetExplorerUrl: "https://msrchain.net/",
    testnetExplorerUrl: "http://139.162.32.245:8082/",
    testnet: true,
    coinUnitPlaces: 12,
    txMinConfirms: 10,
    txCoinbaseMinConfirms: 60,
    coinSymbol: 'MSR',
    openAliasPrefix: "msr",
    coinName: 'Masari',
    coinUriPrefix: 'masari:',
    addressPrefix: 28,
    integratedAddressPrefix: 29,
    addressPrefixTestnet: 33,
    integratedAddressPrefixTestnet: 34,
    feePerKB: new JSBigInt('400000000'),
    dustThreshold: new JSBigInt('1000000000'),
    txChargeRatio: 0.5,
    defaultMixin: 4,
    txChargeAddress: '',
    idleTimeout: 30,
    idleWarningDuration: 20,
    maxBlockNumber: 500000000,
    avgBlockTime: 120,
    debugMode: false
};
//# sourceMappingURL=config.js.map