<?php

include 'config.php';


function getTxWithHashes($txHashes){
	global $rpcPort;
	global $daemonAddress;
	$curl = curl_init();
	
	$body = json_encode(array(
		'txs_hashes'=>$txHashes,
		'decode_as_json'=>true
	));
	curl_setopt_array($curl, array(CURLOPT_RETURNTRANSFER => 1, CURLOPT_URL => 'http://'.$daemonAddress.':'.$rpcPort.'/gettransactions', CURLOPT_POST => 1, CURLOPT_POSTFIELDS => $body));
	
	$resp = curl_exec($curl);
	curl_close($curl);
	$array = json_decode($resp, true);
	
	return $array;
}

function getBlockchainHeight(){
	global $rpcPort;
	global $daemonAddress;
	$curl = curl_init();
	
	curl_setopt_array($curl, array(CURLOPT_RETURNTRANSFER => 1, CURLOPT_URL => 'http://'.$daemonAddress.':'.$rpcPort.'/getheight', CURLOPT_POST => 1, CURLOPT_POSTFIELDS => ''));
	
	$resp = curl_exec($curl);
	curl_close($curl);
	$array = json_decode($resp, true);
	return $array['height'];
}


$outCount = 0;//to start at 0

function createOptimizedBock($startHeight, $endHeight){
	global $outCount;
	global $rpcPort;
	global $daemonAddress;
	$txHashesPerBlock = array();
	$txHashes = array();
	$txHashesMap = array();
	$txOutCountMap = array();
	
	$finalTransactions = array();
	$curl = curl_init();
	
	$minerTxs = [];
	
	$blockTimes = array();
	
	//fetching all blocks in the range [startHeight;endHeight( and adding the txs+coinbase tx to the list of txs
	for($height = $startHeight; $height < $endHeight; ++$height){
		$body = json_encode(array("jsonrpc" => "2.0", "id" => "0", "method" => "get_block", "params" => array("height" => $height)));
		
		curl_setopt_array($curl, array(CURLOPT_RETURNTRANSFER => 1, CURLOPT_URL => 'http://'.$daemonAddress.':'.$rpcPort.'/json_rpc', CURLOPT_POST => 1, CURLOPT_POSTFIELDS => $body));
		
		$resp = curl_exec($curl);
		$array = json_decode($resp, true);
		
		$blockJson = json_decode($array['result']['json'], true);
		$minerTx = $blockJson['miner_tx'];
		$minerTx['height'] = $height;
		$minerTx['hash'] = $array['result']['miner_tx_hash'];
		$minerTx['vin'] = [];
		$minerTxs[] = $minerTx;
		
		$blockTimes[$height] = $blockJson['timestamp'];
		
		$blockTxHashes = ($blockJson['tx_hashes']);
		
		$txHashesPerBlock[$height] = $blockTxHashes;
		foreach($blockTxHashes as $txHash){
			$txHashesMap[$txHash] = $height;
			$txHashes[] = $txHash;
			$txOutCountMap[$txHash] = $outCount;
		}
	}
	
	for($height = $startHeight; $height < $endHeight; ++$height){
		foreach($minerTxs as $minerTx){
			if($minerTx['height'] === $height){
				$minerTx['global_index_start'] = $outCount;
				$minerTx['ts'] = $blockTimes[$height];
				$finalTransactions[] = $minerTx;
				$voutCount = count($minerTx['vout']);
				$outCount += $voutCount;
				break;
			}
		}
		
		$body = json_encode(array(
			'txs_hashes'=>$txHashesPerBlock[$height],
			'decode_as_json'=>true
		));
		
		curl_setopt_array($curl, array(CURLOPT_RETURNTRANSFER => 1, CURLOPT_URL => 'http://'.$daemonAddress.':'.$rpcPort.'/gettransactions', CURLOPT_POST => 1, CURLOPT_POSTFIELDS => $body));
		
		$resp = curl_exec($curl);
		$decodedJson = json_decode($resp, true);
		if(isset($decodedJson['txs_as_json'])){
			$rawTransactionsJson = $decodedJson['txs_as_json'];
			$rawTransactions = $decodedJson['txs'];
		} else if(isset($decodedJson['txs']) && count($decodedJson['txs']) > 0){
			$rawTransactionsJson = [];
			foreach($decodedJson['txs'] as $tx){
				$rawTransactionsJson[] = $tx['as_json'];
			}
			$rawTransactions = $decodedJson['txs'];
		} else{
			$rawTransactionsJson = [];
			$rawTransactions = [];
		}
		
		for($iTransaction = 0; $iTransaction < count($rawTransactionsJson); ++$iTransaction){
			$rawTransactionJson = $rawTransactionsJson[$iTransaction];
			$rawTransaction = $rawTransactions[$iTransaction];
			$finalTransaction = json_decode($rawTransactionJson, true);
			unset($finalTransaction['rctsig_prunable']);
			$finalTransaction['global_index_start'] = $outCount;
			$finalTransaction['ts'] = $rawTransaction['block_timestamp'];
			$finalTransaction['height'] = $height;
			$finalTransaction['hash'] = $rawTransaction['tx_hash'];
			$finalTransactions[] = $finalTransaction;
			
			
			$voutCount = count($finalTransaction['vout']);
			$outCount += $voutCount;
		}
	}
	
	
	curl_close($curl);
	
	return $finalTransactions;
}

/**
 * Retrieve a cache file from disk
 * @param $startHeight
 * @param $endHeight
 * @param bool $decoded
 * @return bool|mixed|null|string
 */
function retrieveCache($startHeight, $endHeight, $decoded=true){
	global $cacheLocation;
	$content = @file_get_contents($cacheLocation.'/'.$startHeight.'-'.$endHeight);
	if($content === false)
		return null;
	if($decoded)
		$content = json_decode($content, true);
	return $content;
}

/**
 * Sache a cache file to disk
 * @param $startHeight int starting height of the cache file
 * @param $endHeight int last block height of the cache file
 * @param $content
 */
function saveCache($startHeight, $endHeight, $content){
	global $cacheLocation;
	$writeStatus = file_put_contents($cacheLocation.'/'.$startHeight.'-'.$endHeight, json_encode($content));
	if($writeStatus === false){
		echo 'Unable to save cache files';
		if(@mkdir($cacheLocation.'/') === false){
			echo 'Unable to create cache directory';
			exit;
		}
	}
}

//if the environment variable generate does NOT exist, only serve the cache file requested
if(getenv('generate') !== 'true'){
	if(!is_int($_GET['height']+0)){
		http_response_code(400);
		exit;
	}
	$startHeight = (int)$_GET['height'];
	$realStartHeight = $startHeight;
	$startHeight = floor($startHeight/100)*100;
	$endHeight = $startHeight + 100;
	if($startHeight < 0) $startHeight = 0;
	
	$blockchainHeight = getBlockchainHeight();
	if($blockchainHeight === null) $blockchainHeight = $endHeight+100;
	if($endHeight > $blockchainHeight){
		$endHeight = $blockchainHeight;
	}
	
	$cacheContent = retrieveCache($startHeight, $endHeight, false);
	if($cacheContent === null){
		http_response_code(400);
	}else{
		$cacheContent = json_decode($cacheContent, true);
		$txForUser = [];
		foreach($cacheContent as $tx){
			if($tx['height'] >= $realStartHeight){
				$txForUser[] = $tx;
			}
		}
		
		header('Content-Type: application/json');
		echo json_encode($txForUser);
	}
}else{//but if the env. variable exist, generate cache files
	$checkConcurrentRunsTimeout = getenv('concurrent_timeout') === false ? 60 : (int)getenv('concurrent_timeout');
	$maxExecutionTime = getenv('max_execution_time') === false ? 59 : (int)getenv('max_execution_time');//59 minutes
	
	if($checkConcurrentRunsTimeout > 0){//a negative or value equal to 0 disable the anti concurrency system
		//use a file to check for anti concurrency, only allow a new process if the last time is at least 60s old
		$lastRunStored = @file_get_contents($cacheLocation.'/lastRun.txt');
		if($lastRunStored === false) $lastRunStored = 0;else
			$lastRunStored = (int)$lastRunStored;
		
		if($lastRunStored + $checkConcurrentRunsTimeout >= time())//concurrent run, 1min lock
			exit;
		file_put_contents($cacheLocation.'/lastRun.txt', time());
	}
	
	//loop until the end of the times (59min), and create cache files
	$lastScanHeight = 0;
	$timeStart = time();
	$lastOutCount = 0;
	
	while($maxExecutionTime <= 0 || time() - $timeStart < $maxExecutionTime*60){//a maximum execution time of 0 or less disable the shutdown and makes a long living process
		$blockchainHeight = getBlockchainHeight();
		if($blockchainHeight === null){
			echo 'Cant connect to the daemon';
			exit;
		}
		
		$lastBlockCacheContent = null;
		for($startHeight = $lastScanHeight; $startHeight < $blockchainHeight; $startHeight += 100){
			
			$endHeight = $startHeight + 100;
			$realStartHeight = $startHeight;
			
			if($endHeight > $blockchainHeight){
				$endHeight = $blockchainHeight;
			}
			
			var_dump('scanning ' . $startHeight . ' to ' . $endHeight);
			
			$cacheContent = retrieveCache($realStartHeight, $endHeight, false);
			if($cacheContent === null){
				if($realStartHeight > 0){
					$lastBlockCacheContent = retrieveCache($realStartHeight-100, $realStartHeight, false);
					$decodedContent = json_decode($lastBlockCacheContent, true);
					if(count($decodedContent) > 0){
						$lastTr = $decodedContent[count($decodedContent) - 1];
						$outCount = $lastTr['global_index_start'] + count($lastTr['vout']);
						var_dump('out count='.$outCount.' '.$lastTr['global_index_start'].' '.count($lastTr['vout']));
					}else{
						var_dump('Missing compacted block file. Weird case');
						exit;
					}
					$lastBlockCacheContent = null;
				}
				
				var_dump("generating...");
				$cacheContent = createOptimizedBock($realStartHeight, $endHeight);
				saveCache($realStartHeight, $endHeight, $cacheContent);
				$cacheContent = json_encode($cacheContent);
			}
			
			var_dump($outCount);
		}
		
		$lastOutCount = $outCount;
		
		var_dump('cleaning ...');
		
		$allBlocksFiles = scandir($cacheLocation);
		foreach($allBlocksFiles as $filename){
			if($filename !== '.' && $filename !== '..'){
				$blocksNumbers = explode('-', $filename);
				if(count($blocksNumbers) === 2 && $blocksNumbers[1] % 100 !== 0){
					if($blocksNumbers[1]+1  < $blockchainHeight){//to be sure if other client are using the last one
						unlink($cacheLocation . '/' . $filename);
					}
				}
			}
		}
		
		$lastScanHeight = floor($blockchainHeight/100)*100;
		
		if($checkConcurrentRunsTimeout){
			file_put_contents($cacheLocation.'/lastRun.txt', time());
		}
		sleep(10);
	}
}

//$finalTransactions = createOptimizedBock($startHeight, $endHeight);
//ini_set('zlib.output_compression_level', 1);
//if (extension_loaded('zlib') && !ini_get('zlib.output_compression')){
//	header('Content-Encoding: gzip');
//	ob_start('ob_gzhandler');
//}
//ob_start("ob_gzhandler");
//$data = gzcompress($cacheContent,9);

//ob_end_clean();
//echo strlen($data);
//echo '|';
//echo strlen($cacheContent);
//ob_end_flush();