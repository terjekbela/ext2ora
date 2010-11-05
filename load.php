<?php
session_start();
$DEF_LIMIT = 30;
$MAX_READ_BASE = 500;

$paramStart  = $_REQUEST['start']   ? $_REQUEST['start']   : 0;
$paramLimit  = $_REQUEST['limit']   ? $_REQUEST['limit']   : $DEF_LIMIT;
$max_read = $MAX_READ_BASE;
$total =  $MAX_READ_BASE;

$conn = oci_connect('system', 'M1s1M0kus', 'bcdev1');
if (!$conn) {
    $e = oci_error();
    trigger_error(htmlentities($e['message'], ENT_QUOTES), E_USER_ERROR);
}

if(isset($_REQUEST['sql']) || isset($_REQUEST['table'])) {

    if(isset($_REQUEST['table'])){
	$sql = "SELECT * FROM ".$_REQUEST['schema'].".".$_REQUEST['table'];
    } else {
	$sql = stripcslashes($_REQUEST['sql']);
    }

    if(md5($sql) != $_SESSION['last_sql']){
	$paramStart  = 0;
	$paramLimit  = $DEF_LIMIT;
	$total = $MAX_READ_BASE;
    }

    $stid = oci_parse($conn, $sql);
    if(@oci_execute($stid)){
	//if(preg_match('/^\s*select/i',$sql)){
	$num_fields = oci_num_fields($stid);
	if($num_fields > 0){ //select
	    $field_str = ""; //mezoket itt taroljuk 
	    $col_str = ""; //oszlopokat itt taroljuk

	    for($i=1;$i<=$num_fields;$i++){
		if($i>1){
		    $field_str .= ",";
		    $col_str .= ",";
		}
		$akt_col_name = oci_field_name($stid,$i);
		$field_str .= '{"header" : "'.$akt_col_name.'","name" : "'.$akt_col_name.'","type" : "string"}';
		$col_str .= '{"header" : "'.$akt_col_name.'","dataIndex" : "'.$akt_col_name.'","editor" : "new Ext.form.TextField({allowBlank: false})"}';
	    }
	    $row_arr = array();
	    $row_num = oci_fetch_all($stid, $row_arr, $paramStart, $paramLimit, OCI_FETCHSTATEMENT_BY_ROW + OCI_ASSOC);
	    if($row_num < $paramLimit){
		$total = $paramStart+$row_num;
	    } else {
		$total = (floor(($paramStart+$paramLimit) / $MAX_READ_BASE)+1)*$MAX_READ_BASE;
	    }
	    $rows = json_encode($row_arr);

	} else { //update, insert, delete
	    $num_row = oci_num_rows($stid);
	    $rows = "[{\"message\" : 'Affected row: $num_row'}]";
	    $field_str .= '{"header" : "Message","name" : "message","type" : "string"}';
	    $col_str .= '{"header" : "Message","dataIndex" : "message"}';
	}
    } else {
	$error_arr = oci_error($stid);
	if($error_arr){
	    $error = json_encode($error_arr['message']);
	    $rows = "[{\"error\" : $error}]";
	    $field_str .= '{"header" : "Error","name" : "error","type" : "string"}';
	    $col_str .= '{"header" : "Error","dataIndex" : "error"}';
	}
    }
    $json_str = '
    {
    "metaData": {
    "totalProperty": "total",
    "root": "rows",
    "id": "id",
    "fields": ['.$field_str.']
    },
    "success": true,
    "total": '.$total.',
    "rows": '.$rows.'
    ,
    "columns": ['.$col_str.']
    }
    ';
    $_SESSION['last_sql'] = md5($sql);
    print($json_str);
    return;
}
/*
if(isset($_REQUEST['table'])) {
    $sql = "SELECT * FROM ".$_REQUEST['schema'].".".$_REQUEST['table']." WHERE rownum<50";
    //print($sql);
    $stid = oci_parse($conn, $sql);
    oci_execute($stid);

    $num_fields = oci_num_fields($stid);
    $field_str = ""; //mezoket itt taroljuk 
    $col_str = ""; //oszlopokat itt taroljuk

    for($i=1;$i<=$num_fields;$i++){
	if($i>1){
	    $field_str .= ",";
	    $col_str .= ",";
	}
	$akt_col_name = oci_field_name($stid,$i);
	$field_str .= '{"header" : "'.$akt_col_name.'","name" : "'.$akt_col_name.'","type" : "string"}';
	$col_str .= '{"header" : "'.$akt_col_name.'","dataIndex" : "'.$akt_col_name.'","editor" : "new Ext.form.TextField({allowBlank: false})"}';
    }

    $ret_arr = array();
    $row_arr = array();

    while($row_arr = oci_fetch_assoc($stid)){
	$ret_arr[]=$row_arr;
    }
    $rows = json_encode($ret_arr);
    
    oci_free_statement($stid);
    oci_close($conn);

    $json_str = '
    {
    "metaData": {
    "totalProperty": "total",
    "root": "rows",
    "id": "id",
    "fields": ['.$field_str.']
    },
    "success": true,
    "total": 50,
    "rows": '.$rows.'
    ,
    "columns": ['.$col_str.']
    }
    ';
    print($json_str);return;
}
*/

if(isset($_POST['schema'])){
    if(isset($_POST['view'])){
	$sql = "SELECT DISTINCT o.status,v.view_name FROM sys.all_views v INNER JOIN sys.dba_objects o ON(o.OWNER = v.OWNER AND o.OBJECT_NAME = v.VIEW_NAME) WHERE v.OWNER='".$_POST['schema']."' ORDER BY v.view_name";
    } else {
	$sql = "SELECT DISTINCT table_name FROM sys.all_tables WHERE OWNER='".$_POST['schema']."' ORDER BY table_name";
    }
    $stid = oci_parse($conn, $sql);
    oci_define_by_name($stid, 'OWNER', $owner);
} else {
    $sql = 'SELECT DISTINCT OWNER FROM sys.all_tables';
    $stid = oci_parse($conn, $sql);
    oci_define_by_name($stid, 'OWNER', $owner);
}
oci_execute($stid);

$ret_arr = array();
$row_arr = array();

while($row_arr = oci_fetch_assoc($stid)){
    //$ret_arr[]=array($row_arr['OWNER']);
    $ret_arr[]=$row_arr;
}


oci_free_statement($stid);
oci_close($conn);
            
$json_str = json_encode($ret_arr);
$json_str = "{ rows : ".$json_str."}";

print($json_str);

?>
