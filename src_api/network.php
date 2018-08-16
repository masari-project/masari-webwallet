<?php
/**
 * Copyright (c) 2018, Gnock
 * Copyright (c) 2018, The Masari Project
 *
 * Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:
 *
 * 1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.
 *
 * 2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.
 *
 * 3. Neither the name of the copyright holder nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

include 'config.php';

$curl = curl_init();

$body = json_encode(array("jsonrpc" => "2.0", "id" => "0", "method" => "get_last_block_header"));
curl_setopt_array($curl, array(CURLOPT_RETURNTRANSFER => 1, CURLOPT_URL => 'http://'.$daemonAddress.':'.$rpcPort.'/json_rpc', CURLOPT_POST => 1, CURLOPT_POSTFIELDS => $body));

$resp = curl_exec($curl);
curl_close($curl);
//var_dump($resp);
$array = json_decode($resp, true);
//var_dump($array);
if($array === null)
	http_response_code(400);
else{
	$blockHeader = $array['result']['block_header'];
	header('Content-Type: application/json');
	echo json_encode(array(
			'major_version'=>$blockHeader['major_version'],
			'hash'=>$blockHeader['hash'],
			'reward'=>$blockHeader['reward'],
			'height'=>$blockHeader['height'],
			'timestamp'=>$blockHeader['timestamp'],
			'difficulty'=>$blockHeader['difficulty'],
			'hashrate'=>$blockHeader['difficulty']*60*2,
	));
}



