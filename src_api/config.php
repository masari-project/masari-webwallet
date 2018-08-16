<?php

$testnet = false;
$cacheLocation = __DIR__.'/'.($testnet ? 'cache-testnet' : 'cache');
$daemonAddress = 'localhost';
$rpcPort = $testnet ? 48081 : 38081;
$coinSymbol = 'msr';