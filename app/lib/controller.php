<?php

//include the Fellowship One class
require($_SERVER['DOCUMENT_ROOT'] . '/coreLib/fellowshipOne/FellowshipOne.php');

//include the Fellowship One People class
require($_SERVER['DOCUMENT_ROOT'] . '/coreLib/fellowshipOne/FellowshipOne-People.php');

set_include_path(get_include_path() . PATH_SEPARATOR . 'phpseclib');
include('Net/SSH2.php');

//require db class for local lookup database
require 'db.php';

//set the F1 API settings here
/**/
$f1Settings = array(
'key'=>'XXX',
'secret'=>'XXX',
'username'=>'XXX',
'password'=>'XXX',
'baseUrl'=>'XXX',
'debug'=>false,
); 

//look at the IP address of the machine this site is running on. We have different IP addresses based on campuses
$clientIP = $_SERVER['REMOTE_ADDR'];

$ipArray = explode('.',$clientIP);

//check the third slot of the IP address. This will tell you the campus
if ($ipArray[2] >= 0 && $ipArray[2] <= 5) {
	$campus = 'Raleigh';
} else if ($ipArray[2] >= 10 && $ipArray[2] <= 15) {
	$campus = 'Morrisville';
} else {
	$campus = 'Raleigh';
}

//create the F1 object
if (!isset($_SESSION['f1Obj'])) {
	//if the F1Obj isn't created, create it
	session_start();
	$_SESSION['f1Obj'] = new FellowshipOne($f1Settings);
	
	if(($r = $_SESSION['f1Obj']->login()) === false){
		//send back error in JSON string
		$loginerror=json_encode(array('action'=>'f1Error'));
		echo $loginerror;
		exit;
		//die('Error logging in. Please try again later');		
	} 
}

switch ($_POST['method']) {

	case 'lookUp':

		$params = array(
			'fname'=>$_POST['fname'],
			'lname'=>$_POST['lname'],
			'userdobmonth' => $_POST['dobmonth'],
			'userdobday' => $_POST['dobday'],
			'userdobyear' => $_POST['dobyear']
		);

		if (isset($_POST['localdbserver'])) {
			//add in local db params if we're doing a local db lookup
			$params['dbserver'] = $_POST['localdbserver'];
			$params['dbuser'] = $_POST['localdbuser'];
			$params['dbpassword'] = $_POST['localdbpassword'];
			$params['dbname'] = $_POST['localdbname'];
			$params['dbtable'] = $_POST['localdbtable'];

			//find the person in the local database first
			$person = localLookUp($params);

		} else {
			//if no local db, look person up in F1 directly
			$person = f1LookUp($params);
		}


		if ($person['action'] == 'singleMatch') {

			//if there's only a single match, and they have a barcode, check them in
			doCheckIn($person['barcode']);

			//then set the correct action flag to trigger the success screen
			$json = json_encode(array('fname'=>$person['fname'],'lname'=>$person['lname'],'pid'=>$person['pid'],'action'=>'singleMatch'));			

		} else if ($person['action'] == 'noMatch') {

			//try direct lookup through F1 if no match found in local
			$f1Person = f1LookUp($params);
			
			if ($f1Person['action'] == 'singleMatch') {
				//single match, do check in
				doCheckIn($f1Person['barcode']);
				$json = json_encode(array('fname'=>$params['fname'],'lname'=>$params['lname'],'barcode'=>$f1Person['barcode'],'action'=>'singleMatch'));	
			} else if ($f1Person['action'] == 'noMatch') {
				$json = json_encode(array('fname'=>$params['fname'],'lname'=>$params['lname'],'dob'=>$params['userdobmonth'] . '/' . $params['userdobday'] . '/' . $params['userdobyear'],'action'=>'noMatch'));
			} else if ($f1Person['action'] == 'multipleMatch') {
				$json = json_encode(array('fname'=>$params['fname'],'lname'=>$params['lname'],'dob'=>$params['userdobmonth'] . '/' . $params['userdobday'] . '/' . $params['userdobyear'],'action'=>'multipleMatch'));
			}

		} else if ($person['action'] == 'multipleMatch') {
			//return multiple match
			$json = json_encode(array('fname'=>$params['fname'],'lname'=>$params['lname'],'dob'=>$params['userdobmonth'] . '/' . $params['userdobday'] . '/' . $params['userdobyear'],'action'=>'multipleMatch'));
		}

		echo $json;	

	break;
}

/**
	* Perform a person lookup on a local database for speed rather than going through F1 API
	* The param array here includes fname, lname, date of birth as well as local db info (server name, user, password, table_name)
	* HARD CODED ASSUMPTION: The query results should include a row for the date of birth called "txt_dob"
	* returns an array with user information as well as action (single match, no match, multiple) that then gets echoed back to the calling application
	* @param array $params
*/

function localLookUp($params) {
	//create local DB object
	$localDBObj = new LocalDB (
		array(
			'server'=>$params['dbserver'],
			'user'=>$params['dbuser'],
			'dbpassword'=>$params['dbpassword'],
			'dbname'=>$params['dbname']
		)
	);

	if ($localDBObj) {
		$peopleQuery = $localDBObj->doQuery('SELECT * FROM ' .  $params['dbtable'] . ' WHERE (txt_fname LIKE "%' . $params['fname'] . '%" OR txt_goes_by LIKE "%' . $params['fname'] . '%") AND txt_lname LIKE "%' . $params['lname'] . '%"');
	} else {
		return false;
	}

	if (!$peopleQuery) {
		//if there's an error, return false
	    return false;
	} else {

		//create array for DOB filter
		$filteredResults = array();
					
		while($row = $peopleQuery->fetch_assoc()){
			//built out the jobs array
			if ($row['txt_dob'] != '') {
				$f1DOBarr = explode('/', date('m/d/Y',strtotime($row['txt_dob'])));
				$userDOBarr = explode('/',date('m/d/Y',strtotime($userdob)));
				//compare the month, day and year of each one separately.  Every piece must match for you to have a match
				if ($f1DOBarr[0] == $params['userdobmonth'] && $f1DOBarr[1] == $params['userdobday'] && $f1DOBarr[2] == $params['userdobyear']) {
					array_push($filteredResults, array('fname'=>$_POST['fname'],'lname'=>$_POST['lname'],'dob'=>$params['userdobmonth'] . '/' . $params['userdobday'] .  '/' . $params['userdobyear'], 'pid'=>$row['txt_id'], 'barcode'=>$row['txt_barcode']));
				}				
				
			}
					
		}	
		
		if (count($filteredResults) == 1) {
			//return the entire person obj back to the caller function
			return array('person'=>$filteredResults[0],'action'=>'singleMatch');												
		} else if (count($filteredResults) == 0) {
			//if you don't get any results, then go on to create a new person
			return array('fname'=>$params['fname'],'lname'=>$params['lname'],'dob'=>$params['userdobmonth'] . '/' . $params['userdobday'] .  '/' . $params['userdobyear'],'action'=>'noMatch');			
		} else {
			//if you have multiples, return back to calling function so it will alert the user
			return array('fname'=>$_POST['fname'],'lname'=>$_POST['lname'],'dob'=>$params['userdobmonth'] . '/' . $params['userdobday'] .  '/' . $params['userdobyear'],'action'=>'multipleMatch');									
		}		
		
	}	
}


/**
	* This function takes the first name, last name and barcode params and does a look up via the F1 API to find someone
	* @param array $params
*/
function f1LookUp($params) {

	$userdob = $params['userdobmonth'] . '/' . $params['userdobday'] . '/' . $params['userdobyear'];

	//create the sub-objects you're going to use (and pass it the core object)
	$_SESSION['f1PeopleObj'] = new FellowshipOnePeople($_SESSION['f1Obj']);

	//build the search params (via F1 API, you cannot search by DOB and something else)
	$searchParams = array('searchFor'=>stripslashes($params['fname']) . ' ' . stripslashes($params['lname']));

	//send call to F1
	$results = $_SESSION['f1PeopleObj']->searchPeople($searchParams);	
	
	//create array for DOB filter
	$filteredResults = array();
	
	if ($results['results']['@count'] > 0) {
		
		//do DOB comparison to send to the recordList page
		foreach($results['results']['person'] as $person) {
			//get the DOB that comes out of Fellowship One
			
			if ($person['dateOfBirth'] != '') {

				$f1DOBarr = explode('/', date('m/d/Y',strtotime($person['dateOfBirth'])));
				$userDOBarr = explode('/',date('m/d/Y',strtotime($userdob)));
				
				//compare the month, day and year of each one separately.  Every piece must match for you to have a match
				if ($f1DOBarr[0] == $userDOBarr[0] && $f1DOBarr[1] == $userDOBarr[1] && $f1DOBarr[2] == $userDOBarr[2]) {
					//we have a match! add to the array	
					array_push($filteredResults,$person);
				}
			}						
 		}

	}

	if (count($filteredResults) == 1) {
		//return the entire person obj back to caller function
		return array('barcode'=> $filteredResults[0]['person']['barCode'],'action'=>'singleMatch');
	} else if (count($filteredResults) == 0) {
		//no F1 match
		return array('action'=>'noMatch');
	} else {
		//multiple F1 match
		return array('action'=>'multipleMatch');
	}
}


/**
	* This function takes the barcode of the person and an optional IP address
	* It will attempt to do an SSH connection to either the local machine or an IP if one is specified
	* and then pass the barcode to the F1 Checkin Software
	* @param string $barcode
	* @param string $ip 
*/
function doCheckIn($barcode, $ip = NULL) {

	//send barcode over PHP here to actually check them in
	if (function_exists("ssh2_connect")) {
		
		// log in at server1.example.com on port 22
		//if an IP address is specified, SSH into that IP. Otherwise, assume just
		//SSH into the current machine
		if (is_null($ip)) {
			$clientIP = $_SERVER['REMOTE_ADDR'];
		} else {
			$clientIP = $ip;
		}

		$clientIP = $_SERVER['REMOTE_ADDR'];								
		$connection = ssh2_connect($clientIP, 22);		
		ssh2_auth_password($connection, 'f1checkin', 'f1checkin');			
		$stream = ssh2_exec($connection, 'winsendkeys -d scanningform ' . $barcode);					
		sleep(1);		
	}

}







?>