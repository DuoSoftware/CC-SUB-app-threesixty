////////////////////////////////
// App : 360
// File : AdvanceViewAdjustmentController
// Owner  : GihanHerath
// Last changed date : 2016/12/06
// Version : 6.0.0.3
/////////////////////////////////

(function ()
{
    'use strict';

    angular
        .module('app.threesixty')
        .controller('AdvanceViewAdjustmentController', AdvanceViewAdjustmentController);

    /** @ngInject */
    function AdvanceViewAdjustmentController($mdDialog, $scope, selectedAdjustment, selectedInvoice, $charge,isTimelineDialogLoaded,currentTemplateView,docType)
    {
        var vm = this;
		$scope.currentTemplateView=currentTemplateView;
		$scope.isTimelineDialogLoaded = isTimelineDialogLoaded;
		$scope.docType = docType;

      vm.selectedAdjustment = selectedAdjustment;
      $scope.SelectedInvoice = selectedInvoice;

        //$scope.printDiv = function(divName) {
        //  var printContents = document.getElementById(divName).innerHTML;
        //  var popupWin = window.open('', '_blank', 'width=1800,height=700');
        //  popupWin.document.open();
        //  popupWin.document.write('<html><head><link href="https://fonts.googleapis.com/css?family=Roboto" rel="stylesheet" type="text/css"><link href="app/main/payment/views/read/print-view.css" rel="stylesheet" type="text/css"></head><body onload="window.print()">' + printContents + '</body></html>');
        //  popupWin.document.close();
        //}

        $scope.printDiv = function(divName) {

            if(vm.selectedAdjustment.companyLogo == undefined || vm.selectedAdjustment.companyLogo == ''){
                var printContents = document.getElementById(divName).innerHTML;
                var popupWin = window.open('', '_blank', 'width=1800,height=700');
                popupWin.document.open();
                popupWin.document.write('<html><head>' +
                "<link href='app/main/360/dialogs/compose/print-view.css' rel='stylesheet' type='text/css'><link href='https://fonts.googleapis.com/css?family=Roboto' rel='stylesheet' type='text/css'>"+
                '</head><body>' + printContents + '<script src="https://code.jquery.com/jquery-3.1.1.min.js"></script><script>$(document).ready(function (){window.print()});</script></body></html>');
                //window.print();
                popupWin.document.close();
            }else{
                var printContents = document.getElementById(divName).innerHTML;
                //console.log(printContents);
                var popupWin = window.open('', '_blank', 'width=1800,height=700');
                popupWin.document.open();
                popupWin.document.write('<html><head>' +
                "<link href='https://fonts.googleapis.com/css?family=Roboto' rel='stylesheet' type='text/css'>"+
                "<link href='app/main/360/dialogs/compose/print-view2.css' rel='stylesheet' type='text/css'>"+
                '</head><body>' + printContents + '<script src="https://code.jquery.com/jquery-3.1.1.min.js"></script><script>$(document).ready(function (){window.print()});</script></body></html>');
                //window.print();
                popupWin.document.close();
            }
        }

        $charge.commondata().getDuobaseFieldDetailsByTableNameAndFieldName("CTS_GeneralAttributes","DecimalPointLength").success(function(data) {
          $scope.decimalPoint=parseInt(data[0].RecordFieldData);
          //
          //
        }).error(function(data) {
          //console.log(data);
        });

        $charge.commondata().getDuobaseValuesByTableName("CTS_FooterAttributes").success(function(data) {
          vm.FooterData=data;
          vm.FooterGreeting=data[0].RecordFieldData;
          vm.FooterDisclaimer=data[1].RecordFieldData!=""?atob(data[1].RecordFieldData):"";
        }).error(function(data) {
        })

        // Methods
        vm.closeDialog = closeDialog;

        //////////

        function closeDialog()
        {
          $scope.isTimelineDialogLoaded=true;
          $mdDialog.hide();
        }
    }
})();
