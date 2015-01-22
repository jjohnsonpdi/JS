/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

var htmldb_delete_message='"DELETE_CONFIRM_MSG"';

/*** Handson Table Global Variables ***/
var tableData; // to store the JSON formated data
var tableDataforSum = []; // To push the value and create an Array
var tableData2D = []; // Final version of 2D Array for Handsontable (required for Header Total) 
var headerData = []; // Table Header
var g_pco_estimate_initial = 0;
var g_pco_estimate_total = 0;
var g_handsontable_json; // Table Data in JSON Format
var ARR_ID = []; // Array of ID's for Delete function
var AllChecked = false; // Variable to support Delete function for entire table data/row
var isValidEntry = true; // Variable to support Save function validation
var AddTasksRender; // Most imp variable for all re renderings after Add Task, Delete Task
var isChecked; // Most imp variable to store table data on selectAll click/change
var materialVal = 0,
    laborVal = 0,
    generalVal = 0 // Variables to calculate column total
var renderBG = -1;
var isMaterialChanged = false,
    isLaborChanged = false,
    isGeneralChanged = false,
    isCommentChanged = false;
var rowNum = -1;
var isSaved = false;
var isNewRow = true;
var rowLen;
var isDelete = false;
    
/**************************************/

function updateShuttle() {
  var getopt = new htmldb_Get(null, $x('pFlowId').value, 'APPLICATION_PROCESS=get_tasks', 0);
  getopt.add('P10_TASK_SELECT', $v('P10_TASK_SELECT'));
  getopt.add('P10_PROJECT_ID', $v('P10_PROJECT_ID'));
  gMessage = getopt.get();
  $('#P10_TASKS_LEFT').html(gMessage);
  getopt = null;
}

function addComment(){
    if($('#P10_PCO_HEADER_COMMENT').val() == ""){
        alert('Please enter a comment.');
    }else{
        $('body').trigger('add_comment');
    }
}

function closeColorbox(){
    if ("&REQUEST.".toUpperCase() == "SAVE"){
        window.parent.$.colorbox.close();
    }
}

function calculateEstCost (){
    var l_total = 0;
    var l_amount = 0;

    var $priceDummy = $('<input type="hidden" />').autoNumeric('init',{mDec: 2, aSign: '$', vMin: '-9999999999.99999'});
    $('input.cost_breakdown_amount').each(function(){
        l_amount = 0;
        l_amount = Number($(this).autoNumeric('get'));

        l_total += l_amount;
    });
    
    if ($('#P10_COST_ESTIMATE_DISPLAY').length > 0){
        $('#P10_COST_ESTIMATE_DISPLAY').autoNumeric('set',l_total); 
    }else{
        $('#P10_COST_ESTIMATE').autoNumeric('set',l_total);
        $('#P10_COST_ESTIMATE').trigger('change');
    }  
    
}

// Jeff Johnson - Applications Developer (PDI)
// Description: Converts html marked collection to JSON string for handsontable 

function convertCollectionToJson()
{
   var l_json_string;
   var l_col1_arr = document.getElementsByClassName('checkbox');
   var l_col2_arr = document.getElementsByClassName('task_number');
   var l_col3_arr = document.getElementsByClassName('task');
   var l_col4_arr = document.getElementsByClassName('material');
   var l_col5_arr = document.getElementsByClassName('labor');
   var l_col6_arr = document.getElementsByClassName('general');
   var l_col7_arr = document.getElementsByClassName('comments');
   var l_col8_arr = document.getElementsByClassName('estimateid');

   l_json_string = '{';
      l_json_string += '"headers": {'  ;
         l_json_string += '"Checkbox":' + '""' + ',';
         l_json_string += '"Tasknum":'    + '"' + $('.hdTask_number').html()   + '"'  + ',';
         l_json_string += '"Task":'       + '"' + $('.hdTask').html()          + '"' + ',';
         l_json_string += '"Material":'   + '"' + $('.hdMaterial').html()      + '"' + ',';
         l_json_string += '"Labor":'      + '"' + $('.hdLabor').html()        + '"' + ',';
         l_json_string += '"General":'    + '"' + $('.hdGeneral').html()       + '"' + ',';
         l_json_string += '"Comments":'   + '"' + $('.hdComments').html()     + '"' + ',';
         l_json_string += '"ID":'         + '"' + $('.hdEstimateId').html()    + '"';

      l_json_string += '},';
         l_json_string += '"data": [';
           for (var i=0; i < l_col1_arr.length; i++){
               l_json_string += '{';
              l_json_string += '"Checkbox":' + false + ',';
              l_json_string += '"Tasknum":'  + '"' + $(l_col2_arr[i]).html() + '",';
              l_json_string += '"Task":'     + '"' + $(l_col3_arr[i]).html() + '",'; 
              l_json_string += '"Material":' + '"' + $(l_col4_arr[i]).html() + '",';
              l_json_string += '"Labor":'    + '"' + $(l_col5_arr[i]).html() + '",';
              l_json_string += '"General":'  + '"' + $(l_col6_arr[i]).html() + '",'; 
              l_json_string += '"Comments":' + '"' + $(l_col7_arr[i]).html() + '",';
              l_json_string += '"ID":'       + '"' + $(l_col8_arr[i]).html() + '"';
              
               l_json_string += '}';
              if (i < l_col1_arr.length - 1){
                 l_json_string += ',';
             }
           }
         l_json_string += ']';
      l_json_string += '}';
   g_handsontable_json = JSON.parse(l_json_string);
    
   $.each(g_handsontable_json.headers, function(key, val) {
        headerData.push(val);
   });
           
   $.each(g_handsontable_json.data, function(key, val) {
       tableDataforSum = [];
       tableDataforSum.push(val.Checkbox, val.Tasknum, val.Task, val.Material, val.Labor, val.General, val.Comments, val.ID);
       tableData2D.push(tableDataforSum);  
   });
   
}

// Bhaumik Mehta - Front End Developer (Consultant)
// Description: Handsontable initiation and added functionalities

function GreeterPosition(){
    $('.gritter-notice-wrapper').css ({
        'top': $(window).scrollTop() + 20
    });
}

// Following functions are written seperately as to use in Delete, Update and Init.
function IsDataSourceNull(){
  var handsontable = $('#handsontable').data('handsontable');
      $('#handsontable .htContainer').hide();
        $('#handsontable .noDataError').remove();
        $('#handsontable').css({'top': '-27px'}).append('<span class="noDataError" style="font-weight: bold; color:gray">You do not have any task to view. Please add task(s) using the "Add Tasks" button.</span>');
        $('#delete_tasks, #save_ctrls_override').css({'pointer-events': 'none'}).attr('title', 'Add Task(s) to enable button');
        $('#delete_tasks').find('span').css({'color': 'gray'});
        $('#save_ctrls_override').find('span').css({'color': '#e7e7e6'});
        return false;
}

function IsDataSourceNotNull(DataSource) {
    var handsontable = $('#handsontable').data('handsontable');
        $('#handsontable').css({'top': ''});
        $('#handsontable .htContainer').show();
        $('#handsontable .noDataError').remove();
        $('#delete_tasks, #save_ctrls_override').css({'pointer-events': ''}).attr('title', '');
        $('#delete_tasks').find('span').css({'color': ''});
        $('#save_ctrls_override').find('span').css({'color': ''});
        handsontable.loadData(DataSource);  
}

var handsonTable = {
    Init: function() {
        
       var isCostEstExist;
        
       if ($("#P10_COST_ESTIMATE").length > 0) {
           isCostEstExist = $("#P10_COST_ESTIMATE").is(':hidden');
       }
       else { isCostEstExist = true; }
     
       convertCollectionToJson(); /** this function creates the DATASET for the HandsonTable **/
        
       var $container = $("#handsontable");
        
            $container.handsontable({
                width: 1251,
                height: 300,
                minRows: 2,
                startRows: 0,
              startCols: 0,
                colWidths:[40,150,250,130,130,130,400,1],
                fixedColumnsLeft: 3,
                maxRows: $("#handsonTable").handsontable('countRows'),
                autoWrapCol: true,
                autoWrapRow: true,
                nativeScrollbars: true,
                observeChanges: false,
                columnSorting: false,
                colHeaders: function(col) {
                var i=1;
              var colCount = $("#handsontable").handsontable('countCols');
                
                switch (col) {
                    case 0:
                      var check = '<input type="checkbox" class="checker" ';
                        check += isChecked() ? 'checked="checked"' : '';
                        check += '><br /><div style="height: 20px;"></div>';
                        return check;
                        
                    case 3:
                        return '<span class="handsonTableHeader">' + headerData[3] + '<br /> ($' + materialVal.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,') + ')</span>';
                    case 4:
                      return '<span class="handsonTableHeader">' + headerData[4] + '<br /> ($' + laborVal.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,') + ')</span>';
                    case 5:
                      return '<span class="handsonTableHeader">' + headerData[5] + '<br /> ($' + generalVal.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,') + ')</span>';
                }
                
                do {
                switch (col) {
                  case i:
                        return '<span class="handsonTableHeader">' + headerData[i] + '</span><br /><div style="height: 20px;"></div>';
                }
                i++
                } while (i<colCount) 
                
            },
            
            columns: [
                
            {
              type: "checkbox"
              
            },
                
            {
              readOnly: true
            },
                
            {
              readOnly: true
            },
                
            {
               type: "numeric",
                format: '$0,0.00',
              language: 'en',
                allowInvalid: false,
                renderer: function(instance, td, row, col, prop, value){
                    materialVal = getTotalMaterial();
                    
                    if (col > 0 && row >= renderBG && renderBG >= 0) { $(td).addClass('changeInput'); }
                   
                   /* if (isDelete == true) {
                      if (col > 0 && row >= renderBG && renderBG >= 0) { $(td).css({'background': 'rgba(253, 253, 2, 0.3)'}); }
                    } */
                   
                    if($(td).data('change') && isSaved == false){
                        $(td).addClass('changeInput');
                    }    
    
                  Handsontable.NumericRenderer.apply(this, arguments);
                },
                readOnly: false /* isCostEstExist */
            },
                
            {
                type: "numeric",
                format: '$0,0.00',
              language: 'en',
                allowInvalid: false,
            renderer: function(instance, td, row, col, prop, value){
                    laborVal = getTotalLabor();
                    
                    if (col > 0 && row >= renderBG && renderBG >= 0) { $(td).addClass('changeInput'); }      
                    
                    /*if (isDelete == true) {
                      if (col > 0 && row >= renderBG && renderBG >= 0) { $(td).css({'background': 'rgba(253, 253, 2, 0.3)'}); }
                    } */
                    
                    if($(td).data('change') && isSaved == false){
                        $(td).addClass('changeInput');
                    }  
                    
                    Handsontable.NumericRenderer.apply(this, arguments);
              },
              readOnly: false /* isCostEstExist */
            },
                
            {
                type: "numeric",
                format: '$0,0.00',
              language: 'en',
                allowInvalid: false,
                renderer: function(instance, td, row, col, prop, value){
                    generalVal = getTotalGeneral();
                    
                    if (col > 0 && row >= renderBG && renderBG >= 0) { $(td).addClass('changeInput'); }      
                    
                     /*if (isDelete == true) {
                      if (col > 0 && row >= renderBG && renderBG >= 0) { $(td).css({'background': 'rgba(253, 253, 2, 0.3)'}); }
                     } */
                    
                    if($(td).data('change') && isSaved == false){
                        $(td).addClass('changeInput');
                    } 
                    
                    Handsontable.NumericRenderer.apply(this, arguments);
                },
                readOnly: false /* isCostEstExist */
            },
                
            {
              renderer: function(instance, td, row, col, prop, value){
                    if (col > 0 && row >= renderBG && renderBG >= 0) { $(td).addClass('changeInput'); }
                    
                     /*if (isDelete == true) {
                      if (col > 0 && row >= renderBG && renderBG >= 0) { $(td).css({'background': 'rgba(253, 253, 2, 0.3)'}); }
                    }*/
                    
                    if($(td).data('change') && isSaved == false){
                        $(td).addClass('changeInput');
                    } 
                    
                    Handsontable.NumericRenderer.apply(this, arguments);
                }
            },
                
            {
              readOnly: true
            }
          ],
            afterCreateRow: function (index, amount) {
              //alert(index);
            },
            beforeRender: function() {
              $('#handsontable td.changeInput').each(function(){
                  alert('Hola');
                  console.log('Nearest TR: ' + $(this).closest('tr').index()); 
              });
            },
            afterRender: function() {
              $('#handsontable td').each(function(){
                if ($(this).hasClass('changeInput')) { $(this).css('color', 'green'); }
              });
              //alert($('#handsontable').data('handsontable').countRows());
              //renderBG = $('#handsontable').data('handsontable').countRows();
            },
            afterChange: function (change, source) {
                
                if (source === 'loadData') {
                    return; 
                }
                
                var ele=this;
                  $.each(change, function (index, element) {
                    $(ele.getCell(element[0],element[1])).addClass('changeInput').data("change",true);
                     isSaved = false;
                });          
                
                if((change[0][1]) !== 0 ) {
                    $('#P10_DATA_CHANGES').val(change[0][0] + ':' + change[0][1] + ':' + change[0][2] + ':' + change[0][3]);
                    isValidEntry = true;
                    g_pco_estimate_total = parseFloat(+g_pco_estimate_initial + materialVal + laborVal + generalVal);
                     $("#P10_COST_ESTIMATE").val('$' + parseFloat(+g_pco_estimate_initial + materialVal + laborVal + generalVal).toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,')); 
                    $("#P10_COST_ESTIMATE_DISPLAY").text('$' + parseFloat(+g_pco_estimate_initial + materialVal + laborVal + generalVal).toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,'));
                    $('#P10_COST_ESTIMATE').trigger('change');  
                }
                           
          },
            afterValidate: function( isValid, value, row, prop, source ) {
              isValidEntry = isValid;
            }
                   
           });
            
            
          // Functions and Event Handlers to support the Application Functionality
          
            if (tableData2D.length > 0) {
            IsDataSourceNotNull(tableData2D);  
            } else {
              IsDataSourceNull();                       
            }
              
            var handsontable = $container.data('handsontable');
    
            renderBG = handsontable.getData().length;
    
          rowLen = $('#handsontable').data('handsontable').countRows();
        
              // Functions responsible for the checkbox behavior
        $container.on('mouseup', 'input.checker', function (event) {
                var current = !$('input.checker').is(':checked');
                for (var i = 0, ilen = tableData2D.length; i < ilen; i++) {
                  tableData2D[i][0] = current;  
              }
                
                $container.handsontable('render');
                applyBackgroundToRow();
            });
        
            function isChecked() {
                for (var i = 0, ilen = tableData2D.length; i < ilen; i++) {
                    if (!tableData2D[i][0]) {
                        applyBackgroundToRow();
                        return false;
                    } else {
                        $('#handsontable td').each(function(){
                          
                        });
                    }      
                }
                applyBackgroundToRow();
                return true;
            }    
    
            // Resize the table width    
            $(window).resize(function(){
                $('#handsontable').width($(window).width() - 40);
                applyBackgroundToRow();
             });
        
        
          $('#P10_COST_ESTIMATE').on('keydown', function(e){
                if (e.which == 13) {
                  $(this).trigger('blur');
                }                
            });
    
      // Apply the background on select
        function applyBackgroundToRow() {
                $('#handsontable .htCheckboxRendererInput').filter(":checked").each(function() {
                    var TR = $(this).closest('tr');
                    $(TR).find('td').css('background', 'rgba(255,204,204,1)');
                });
                
            }; applyBackgroundToRow();
      
      
      /** Functions to calculate the Column Total ***/
      function getTotalMaterial(){
                return tableData2D.reduce(function(sum, row){
                   var x = +row[3];
                    return sum + x;
                }, 0);
            }
            
      
      function getTotalLabor(){
                return tableData2D.reduce(function(sum, row){
                   var y = +row[4];
                   return sum + y; 
                }, 0);
            }

      
      function getTotalGeneral(){
                return tableData2D.reduce(function(sum, row){
                   var z = +row[5];
                   return sum + z; 
                }, 0);
            }
  },
    
    DeleteTask: function() {
       var TotalChecked = [];
       var handsontable = $('#handsontable').data('handsontable');
       tempData = handsontable.getData();
        
        if (AllChecked == true) {
          for (var i=0; i<tempData.length; i++) {
              TotalChecked.push([tempData[i][0], tempData[i][1], tempData[i][2], tempData[i][3], tempData[i][4], tempData[i][5], tempData[i][6], tempData[i][7]]);
          
          }
        } else {
            
          for (var i=0; i<tempData.length; i++) {
                if (tempData[i][0] == true) {
                    TotalChecked.push([tempData[i][0], tempData[i][1], tempData[i][2], tempData[i][3], tempData[i][4], tempData[i][5], tempData[i][6], tempData[i][7]]);
                }
          }
        }
                 
        var TotalCheckedLength = TotalChecked.length;
 
        if (TotalCheckedLength > 0) {
            var tableHeader = '<thead><tr>';
            
            $.each(g_handsontable_json.headers, function(key, val) {
              tableHeader += '<th>' + val + '</th>';
          });
              
            tableHeader += '</tr></thead>';
            var Deleted_Rows = '<table class="Deleted_Rows">' + tableHeader + '<tbody>';
            ARR_ID = [];
          
          var Total_Rows = '';
            for (var j=0; j<TotalCheckedLength; j++) {
                var material, labor, general;
                
                if ($.trim(TotalChecked[j][3]) == '' || TotalChecked[j][3] == null) {
                    material = 0;
                } else { material = parseFloat(TotalChecked[j][3]); }
                
                if ($.trim(TotalChecked[j][4]) == '' || TotalChecked[j][4] == null) {
                    labor = 0;
                } else { labor = parseFloat(TotalChecked[j][4]); }
                
                if ($.trim(TotalChecked[j][5]) == '' || TotalChecked[j][5] == null) {
                    general = 0;
                } else { general = parseFloat(TotalChecked[j][5]); }
                
                material = '$' + parseFloat(material).toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
                labor = '$' + parseFloat(labor).toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
                general = '$' + parseFloat(general).toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
                
                Deleted_Rows += '<tr>';
                Deleted_Rows += '<td>'+ TotalChecked[j][1] + '</td>';
                Deleted_Rows += '<td>'+ TotalChecked[j][2] + '</td>';
                Deleted_Rows += '<td>'+ material + '</td>';
                Deleted_Rows += '<td>'+ labor + '</td>';
                Deleted_Rows += '<td>'+ general + '</td>';
                Deleted_Rows += '<td>'+ TotalChecked[j][6] + '</td>';
                Deleted_Rows += '</tr>';
            }
            
            Deleted_Rows += '</tbody></table>';
            
            if (TotalCheckedLength <= 1) { 
              Total_Rows = 'record';
            } else { Total_Rows = 'records' }
            
            $('<div id="Delete_Confirm"><span class="Dialog_Error_Msg">Following ' + TotalCheckedLength + ' ' + Total_Rows +' will be deleted!!</span><br /><br />'+ Deleted_Rows +'</div>').dialog({
                    modal: true,
                    dialogClass: 'DeleteModel',
                  resizable: false,
                    width: 'auto',
                  buttons :  { 
                     "CancelButton" : {
                         text: "Cancel",
                         id: "btnCancel",
                         click: function(){
                             $(this).dialog( "close" );
                         }   
                      },
                        "OkayButton" : {
                            text: "Ok",
                            id: "btnOkay",
                            click: function(){
                                var ID_String = '';
                                for (var j=0; j<TotalCheckedLength; j++) {
                                    ARR_ID.push([TotalChecked[j][7]]);
                                    ID_String += TotalChecked[j][7] + ':';
                                } 
                                ID_String = ID_String.slice(0,-1);
                                AddTasksRender = null;
                                
                                apex.server.process(
                                    'Delete Tasks', {x01: ID_String}, 
                                  {dataType: 'text',
                            
                                    success: function(pData) { 


                                        console.log(pData);
                                        if (pData != '-1') {
                                            console.log(pData);
                                            $("#P10_CHANGE_SHUTTLE").val(pData);      
                                            $("#P10_CHANGE_SHUTTLE").trigger('change');
                      $("#P10_TASK_SELECT").trigger('change');
                                            isDelete = true;
                                            //alert(TotalCheckedLength);
                                            //renderBG = ($('#handsontable').data('handsontable').countRows() - 1) - TotalCheckedLength;
                                            var DeleteData = tempData;
                                            for (var x=0; x<ARR_ID.length; x++) {
                                                for (var b=0; b<DeleteData.length; b++) {
                                                    if (ARR_ID[x][0] == DeleteData[b][7]) {
                                                        DeleteData.splice(b, 1);
                                                    }
                                                }
                                            }
                                            
                                            if (DeleteData.length > 0) {
                                                IsDataSourceNotNull(DeleteData);
                                                //renderBG = $('#handsontable').data('handsontable').countRows();
                                                $("#P10_COST_ESTIMATE").val('$' + parseFloat(+g_pco_estimate_initial + materialVal + laborVal + generalVal).toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,')); 
                                                $("#P10_COST_ESTIMATE_DISPLAY").text('$' + parseFloat(+g_pco_estimate_initial + materialVal + laborVal + generalVal).toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,'));
                                                $('#P10_COST_ESTIMATE').trigger('change'); 
                                            }
                                            else {
                                                IsDataSourceNull();
                                                //renderBG = -1;
                                                $("#P10_COST_ESTIMATE").val('$' + parseFloat(+g_pco_estimate_initial).toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,')); 
                                                $("#P10_COST_ESTIMATE_DISPLAY").text('$' + parseFloat(+g_pco_estimate_initial).toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,'));
                                                $('#P10_COST_ESTIMATE').trigger('change'); 
                                            }
                                              $("#P10_CHANGE_SHUTTLE").trigger('change'); 
                                        }
                                    }
                                
                               });
                                
                                $(this).dialog( "close" );
                                
                            }
                        }
                   },
                    title: "Warning"
                });
        } else {
          $('<div>Please check at least one record to delete.</div>').dialog({
                modal: true,
                resizable: false,
                buttons: {
                    Ok: function() {
                        $(this).dialog( "close" );
                    }
                },
                title: "Error"
            });
        }
   },
       UpdatePCO: function(handsontable) {
        var handsontable = $('#handsontable').data('handsontable');
        var tempSaveData = handsontable.getData();
        var tempData = []
        var SaveData = '[';
           
           for (var i=0; i<tempSaveData.length; i++) {
            
            SaveData += '{' + tempSaveData[i][1] + ',' +  tempSaveData[i][2] + ',' + tempSaveData[i][3] + ',' + tempSaveData[i][4] + ',' + tempSaveData[i][5] + ',' + tempSaveData[i][6] + ',' + tempSaveData[i][7] +'},';
        };
           
        SaveData = SaveData.slice(0, -1) + ']';
   
           apex.server.process(
               'GET JSON DATA', {x01: SaveData}, 
               {dataType: 'text', 
                success: function(pData) {
                   console.log(SaveData + ' ' + pData);
                   if (!isNaN(pData) && pData == 1) {
                       if (isValidEntry == true) {
                            $.gritter.add({
                                title: 'Changes saved'
                                ,text: 'Cost Breakdown changes have been saved.'
                                    ,class_name: 'gritter-css'
                                ,time: 4000
                                ,position: ''
                            });
                            isDelete = false;
                            renderBG = $('#handsontable').data('handsontable').countRows();
                            //$('#handsontable').data('handsontable').render();
                           $('#handsontable td, #handsontable .handsontableInput').addClass('ignore-save-before-exit').removeClass('changeInput').css({'background': ''});
                           isSaved = true;
                       } else if( SaveData.length > 0 && isValidEntry == false ) {
                                $.gritter.add({
                                    title: 'Entry Error'
                                    ,text: 'Please check your entry for an error.'
                                    ,class_name: 'gritter-css-error'
                                    ,time: 1000
                                    ,position: 'bottom-right'
                                });
                       }
                       GreeterPosition(); 
                    } 
                    
                    else if (!isNaN(pData) && pData == 2) {
                      
                        $('<div id="Unexpected_Error"><span class="Dialog_Error_Msg">Unexpected data error has occured!!</span></div>').dialog({
                            modal: true,
                            dialogClass: 'UnexpectedErrorModel',
                            resizable: false,
                            width: 'auto',
                            buttons: {
                                "OkayButton": {
                                    text: "OK",
                                    id: "btnOkay_Unexpected",
                                    click: function() {
                                      $(this).dialog("close");
                                    }
                                }
                            }
                        });
                    }
                    
                    else if (!isNaN(pData) && pData == 0) {
                          
                      $('<div id="Validation_Error"><span class="Dialog_Error_Msg">Your data could not be saved because another user has saved before you. <br />Please reload the page to retrieve the new data.</span></div>').dialog({
                            modal: true,
                            dialogClass: 'validationErrorModel',
                            resizable: false,
                            width: 'auto',
                            buttons :  { 
                                "CancelButton" : {
                                    text: "Cancel",
                                    id: "btnCancel_validation",
                                    click: function(){
                                       $(this).dialog("close"); 
                                    }
                                },
                                "ReloadButton" : {
                                    text: "Reload the Page",
                                    id: "btnReload_validation",
                                    click: function() {
                                      location.reload();
                                    }
                                }
                           },
                            title: "Error"
                      });
                        
                    }
                },
                error: function(){
                  alert('There was an error saving the changes');
                }
           });          
       },
    
      CreateTempCollection: function(){ 
          var handsontable = $('#handsontable').data('handsontable');
          AddTasksRender = handsontable.getData();
      },
      
      AddNewTask: function () {
            tableData2D = [];
            
            convertCollectionToJson();
          
            var handsontable = $('#handsontable').data('handsontable');
            isDelete = false;
            var currentData = tableData2D;
              
          if (typeof AddTasksRender !== 'undefined' || AddTasksRender.length > 0) {
          
              for (var i=0; i<AddTasksRender.length; i++) {
                currentData[i] = AddTasksRender[i]; 
              }
          }
          
          
          if (currentData.length > 0) {
                    IsDataSourceNotNull(currentData);
             
           }
          
        } 
};

/*** handsonTable Initialization and extended functions end here ***/  
function arrayToParsingTable(){  
  var l_delete_row_parsing_line = '';
   for (i = 0; i < ARR_ID.length; i++){
    l_delete_row_parsing_line += ARR_ID[i] + ':';
   }
   $("#P10_DELETE_FIRE").val(l_delete_row_parsing_line.substring(0,l_delete_row_parsing_line.length - 1));
}