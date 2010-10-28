<?php
$conn = oci_connect('system', '********', '********');
if (!$conn) {
    $e = oci_error();
    trigger_error(htmlentities($e['message'], ENT_QUOTES), E_USER_ERROR);
}

    $sql = "SELECT * FROM scott.dept WHERE ROWNUM<10";
    $sql = "UPDATE scott.dept SET LOC='Somewhere' WHERE DEPTNO=50";
    $stid = oci_parse($conn, $sql);
    if(oci_execute($stid)){
            $num_fields = oci_num_fields($stid);

            for($i=1;$i<=$num_fields;$i++){
                if($i>1){
                    $field_str .= ",";
                    $col_str .= ",";
                }
                $akt_col_name = oci_field_name($stid,$i);
            }
            $ret_arr = array();
        /*    $row_arr = array();

            while($row_arr = oci_fetch_assoc($stid)){
                $ret_arr[]=$row_arr;
            }*/
//	    $num_rows =  oci_fetch_all($stid, $ret_arr, $paramStart, $paramLimit, OCI_FETCHSTATEMENT_BY_ROW + OCI_ASSOC);
//            $rows = json_encode($ret_arr);
    }
print($num_fields."<br/>");
print($num_rows."<br/>");
print_r($ret_arr);
print("<br/>".$rows);
?>