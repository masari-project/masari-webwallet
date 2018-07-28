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

ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

include 'config.php';

if(!isset($_GET['domain']) || !preg_match('/^(?!\-)(?:[a-zA-Z\d\-]{0,62}[a-zA-Z\d]\.){1,126}(?!\d+)[a-zA-Z\d]{1,63}$/m', $_GET['domain']))
	http_response_code(400);

$records = dns_get_record($_GET['domain'], DNS_TXT);

$recipient_address = null;
$recipient_name = null;

foreach($records as $record){
	if($record['class'] === 'IN' && $record['type'] === 'TXT'){
		foreach($record['entries'] as $entry){
			if(strpos($entry, 'oa1:'.$coinSymbol) !== false){
				$raw = str_replace('oa1:'.$coinSymbol,'', $entry);
				$parts = explode(';', $raw);
				foreach($parts as $part){
					$subparts = explode('=',trim($part));
					if(count($subparts) >= 1){
						if(trim($subparts[0]) === 'recipient_address'){
							$recipient_address = trim($subparts[1]);
						}else if(trim($subparts[0]) === 'recipient_name'){
							$recipient_name = trim($subparts[1]);
						}
					}
				}
			}
		}
	}
	
}
if($recipient_address !== null){
	header('Content-Type: application/json');
	echo json_encode(array(
		'address'=>$recipient_address,
		'name'=>$recipient_name,
	));
}else{
	http_response_code(404);
}