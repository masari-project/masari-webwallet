<?php
/**
 * Created by IntelliJ IDEA.
 * User: Cedric
 * Date: 14/04/2018
 * Time: 10:34
 */

include 'config.php';


function getTxWithHashes($txHashes){
	global $rpcPort;
	$curl = curl_init();
	
	$body = json_encode(array(
		'txs_hashes'=>$txHashes,
		'decode_as_json'=>true
	));
	curl_setopt_array($curl, array(CURLOPT_RETURNTRANSFER => 1, CURLOPT_URL => 'http://localhost:'.$rpcPort.'/gettransactions', CURLOPT_POST => 1, CURLOPT_POSTFIELDS => $body));
	
	$resp = curl_exec($curl);
	curl_close($curl);
	$array = json_decode($resp, true);
	
	return $array;
}

function getBlockchainHeight(){
	global $rpcPort;
	$curl = curl_init();
	
	curl_setopt_array($curl, array(CURLOPT_RETURNTRANSFER => 1, CURLOPT_URL => 'http://localhost:'.$rpcPort.'/getheight', CURLOPT_POST => 1, CURLOPT_POSTFIELDS => ''));
	
	$resp = curl_exec($curl);
	curl_close($curl);
	$array = json_decode($resp, true);
	return $array['height'];
}


$outCount = 0;//to start at 0

function createOptimizedBock($startHeight, $endHeight){
	global $outCount;
	global $rpcPort;
	$txHashesPerBlock = array();
	$txHashes = array();
	$txHashesMap = array();
	$txOutCountMap = array();
	
	$finalTransactions = array();
	$curl = curl_init();
	
	$minerTxs = [];
	
	$blockTimes = array();
	
	for($height = $startHeight; $height < $endHeight; ++$height){
		$body = json_encode(array("jsonrpc" => "2.0", "id" => "0", "method" => "getblock", "params" => array("height" => $height)));
		
		curl_setopt_array($curl, array(CURLOPT_RETURNTRANSFER => 1, CURLOPT_URL => 'http://localhost:'.$rpcPort.'/json_rpc', CURLOPT_POST => 1, CURLOPT_POSTFIELDS => $body));
		
		$resp = curl_exec($curl);
		$array = json_decode($resp, true);
		
		
		
		//	var_dump($array);
		$blockJson = json_decode($array['result']['json'], true);
		$minerTx = $blockJson['miner_tx'];
		$minerTx['height'] = $height;
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
	
	
//	var_dump($txHashes);
	
	$body = json_encode(array(
		'txs_hashes'=>$txHashes,
		'decode_as_json'=>true
	));
	
	curl_setopt_array($curl, array(CURLOPT_RETURNTRANSFER => 1, CURLOPT_URL => 'http://localhost:'.$rpcPort.'/gettransactions', CURLOPT_POST => 1, CURLOPT_POSTFIELDS => $body));
	
	$resp = curl_exec($curl);
	$decodedJson = json_decode($resp, true);
	if(!isset(json_decode($resp, true)['txs_as_json']))
		$rawTransactions = [];
	else
		$rawTransactions = $decodedJson['txs_as_json'];
	
	
//	var_dump($txHashesMap);
//	var_dump($startHeight.' '.$endHeight);
	for($height = $startHeight; $height < $endHeight; ++$height){
		//++$outCount;//miner tx
		foreach($minerTxs as $minerTx){
			if($minerTx['height'] === $height){
				$minerTx['global_index_start'] = $outCount;
				$minerTx['ts'] = $blockTimes[$height];
				$finalTransactions[] = $minerTx;
				++$outCount;
				break;
			}
		}
		
		$iTransaction = 0;
		foreach($rawTransactions as $rawTransaction){
//			var_dump($txHashesMap[$txHashes[$iTransaction]].'<=>'.$height.'=>'.count($rawTransactions));
			if($txHashesMap[$txHashes[$iTransaction]] === $height){
//				++$outCount;
				$finalTransaction = json_decode($rawTransaction, true);
				unset($finalTransaction['rctsig_prunable']);
				$finalTransaction['global_index_start'] = $outCount;
				$finalTransaction['ts'] = $blockTimes[$height];
				$finalTransaction['height'] = $txHashesMap[$txHashes[$iTransaction]];
//				var_dump('-->'.$txHashesMap[$txHashes[$iTransaction]]);
				$finalTransactions[] = $finalTransaction;
				
				
				$voutCount = count($finalTransaction['vout']);
//				var_dump('vout of ' . $voutCount);
				$outCount += $voutCount;
			}
			++$iTransaction;
		}
//		var_dump($outCount);
	}
	
	
	curl_close($curl);
	
//	return array_merge($finalTransactions,$minerTxs);
	return $finalTransactions;
}

/*
function createOptimizedBock2($startHeight, $endHeight){
	global $rpcPort;
	global $outCount;
	$txHashesPerBlock = array();
	$txHashes = array();
	$txHashesMap = array();
	
	$finalTransactions = array();
	
	for($height = $startHeight; $height < $endHeight; ++$height){
		$body = json_encode(array("jsonrpc" => "2.0", "id" => "0", "method" => "getblock", "params" => array("height" => $height)));
		
		$curl = curl_init();
		
		curl_setopt_array($curl, array(CURLOPT_RETURNTRANSFER => 1, CURLOPT_URL => 'http://localhost:'.$rpcPort.'/json_rpc', CURLOPT_POST => 1, CURLOPT_POSTFIELDS => $body));
		
		$resp = curl_exec($curl);
		curl_close($curl);
		$array = json_decode($resp, true);
		
		//	var_dump($array);
		$blockJson = json_decode($array['result']['json'], true);
		$blockTxHashes = ($blockJson['tx_hashes']);
		
		$txHashesPerBlock[$height] = $blockTxHashes;
		foreach($blockTxHashes as $txHash){
			$txHashesMap[$txHash] = $height;
			$txHashes[] = $txHash;
		}
		
		++$outCount;//minx tx
		
		if(count($txHashesPerBlock[$height]) > 0){
			$rawTransactions = getTxWithHashes($txHashesPerBlock[$height])['txs_as_json'];
			$iTransaction = 0;
			foreach($rawTransactions as $rawTransaction){
				++$outCount;
				$finalTransaction = json_decode($rawTransaction, true);
				unset($finalTransaction['rctsig_prunable']);
				$finalTransaction['height'] = $txHashesPerBlock[$height];
				$finalTransaction['global_index_start'] = $outCount;
				$finalTransactions[] = $finalTransaction;
				++$iTransaction;
				$outCount+=count($finalTransaction['vout'])-1;
			}
		}
	}
	
	return $finalTransactions;
}
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

function saveCache($startHeight, $endHeight, $content){
	global $cacheLocation;
	file_put_contents($cacheLocation.'/'.$startHeight.'-'.$endHeight, json_encode($content));
}

if(getenv('generate') !== 'true'){
	if(!is_int($_GET['height']+0)){
		http_response_code(400);
		exit;
	}
	$startHeight = (int)$_GET['height'];
	$realStartHeight = $startHeight;
	$startHeight = floor($startHeight/100)*100;
	$endHeight = $startHeight + 100;
	if($startHeight < 1) $startHeight = 1;
	
	$blockchainHeight = getBlockchainHeight();
	if($blockchainHeight === null) $blockchainHeight = $endHeight+100;
	if($endHeight > $blockchainHeight){
		$endHeight = $blockchainHeight;
	}
	
//	var_dump($startHeight, $endHeight);
//	exit;
	$cacheContent = retrieveCache($startHeight, $endHeight, false);
	if($cacheContent === null){
		$startHeightLoad = floor($startHeight/100-1)*100;
		if($startHeightLoad >= 0){
			$cacheContentPrevious = retrieveCache($startHeightLoad, $startHeightLoad + 100, false);
			$decodedContent = json_decode($cacheContentPrevious, true);
			if(count($decodedContent) > 0){
				$lastTr = $decodedContent[count($decodedContent) - 1];
				$outCount = $lastTr['global_index_start'] + count($lastTr['vout']);
//				var_dump('out count', $outCount);
			}
		}
		
		$cacheContent = createOptimizedBock($startHeight, $endHeight);
		//	var_dump($cacheContent);
		saveCache($startHeight, $endHeight, $cacheContent);
//		$cacheContent = json_encode($cacheContent);
	}else{
		$cacheContent = json_decode($cacheContent, true);
	}
	
	
	$txForUser = [];
	foreach($cacheContent as $tx){
		if($tx['height'] >= $realStartHeight){
			$txForUser[] = $tx;
		}
	}
	
	header('Content-Type: application/json');
	echo json_encode($cacheContent);
	
//	echo $cacheContent;
//	$data = gzcompress($cacheContent,9);
//	var_dump(strlen($cacheContent));
//	var_dump(strlen($data));

}else{
	$blockchainHeight = getBlockchainHeight();
	
	$lastBlockCacheContent = null;
	for($startHeight = 0; $startHeight < $blockchainHeight; $startHeight += 100){
		
		$endHeight = $startHeight + 100;
		$realStartHeight = $startHeight;
		//	if($realStartHeight < 1) $realStartHeight = 1;
		
		if($endHeight > $blockchainHeight){
			$endHeight = $blockchainHeight;
		}
		
		var_dump('scanning ' . $startHeight . ' to ' . $endHeight);
		
		$cacheContent = retrieveCache($realStartHeight, $endHeight, false);
//		var_dump('==>',$lastBlockCacheContent,$cacheContent);
		if($cacheContent === null){
			if($lastBlockCacheContent !== null){
				$decodedContent = json_decode($lastBlockCacheContent, true);
				if(count($decodedContent) > 0){
					$lastTr = $decodedContent[count($decodedContent)-1];
					$outCount = $lastTr['global_index_start']+count($lastTr['vout']);
					var_dump('out count',$outCount);
				}
				$lastBlockCacheContent = null;
			}
			
			$cacheContent = createOptimizedBock($realStartHeight, $endHeight);
//			var_dump($cacheContent);
			saveCache($realStartHeight, $endHeight, $cacheContent);
			$cacheContent = json_encode($cacheContent);
		}else{
			if($cacheContent !== '[]' && $cacheContent !== null){
				$lastBlockCacheContent = $cacheContent;
			}
//			$decodedContent = json_decode($cacheContent, true);
//			if(count($decodedContent) > 0){
//				$lastTr = $decodedContent[count($decodedContent)-1];
//				$outCount = $lastTr['global_index_start']+count($lastTr['vout'])+1;
//				var_dump('=>'.$outCount);
//			}
		}
		
		var_dump($outCount);
		
		
		
	}
	
	var_dump('cleaning ...');
	
	$allBlocksFiles = scandir($cacheLocation);
	foreach($allBlocksFiles as $filename){
		if($filename !== '.' && $filename !== '..'){
			$blocksNumbers = explode('-', $filename);
			if($blocksNumbers[1] % 100 !== 0){
				if(ceil($blocksNumbers[1]/100)*100 < $blockchainHeight){
					unlink($cacheLocation.'/'.$filename);
				}
			}
		}
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