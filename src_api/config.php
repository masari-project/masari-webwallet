<?php

$cacheLocation = getenv('cache_location') !== false ? getenv('cache_location') : __DIR__.'/cache';
$daemonAddress = getenv('daemon_address') !== false ? getenv('daemon_address') : 'localhost';
$rpcPort = getenv('daemon_rpc_port') !== false ? (int)getenv('daemon_rpc_port') : 38081;
$coinSymbol = 'msr';