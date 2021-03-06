////////////////////////////////
// App : 360
// File : AdvanceViewInvoiceController
// Owner  : GihanHerath
// Last changed date : 2016/12/23
// Version : 6.0.0.6
/////////////////////////////////

(function ()
{
    'use strict';

    angular
        .module('app.threesixty')
        .controller('AdvanceViewInvoiceController', AdvanceViewInvoiceController);

    /** @ngInject */
    function AdvanceViewInvoiceController($mdDialog, $scope, $charge,isTimelineDialogLoaded,selectedInvoice, currentTemplateView,docType, selectedDoc)
    {
        var vm = this;

        $scope.selectedInvoice=selectedInvoice;
        $scope.currentTemplateView=currentTemplateView;
        $scope.isTimelineDialogLoaded = isTimelineDialogLoaded;
        $scope.docType = docType;
        $scope.selectedDoc = selectedDoc;

        $scope.printDiv = function () {
			var printContent = document.getElementById('print-content');
			var popupWin = window.open('', '_blank', 'width=1000,height=700');
			popupWin.document.open();
			popupWin.document.write('<html><head><link href="https://fonts.googleapis.com/css?family=Roboto" rel="stylesheet" type="text/css"><link href="app/main/360/dialogs/compose/print-view.css" rel="stylesheet" type="text/css"></head><body style="margin: 30px;">' + printContent.innerHTML + '<script src="https://code.jquery.com/jquery-3.1.1.min.js"></script><script>$(document).ready(function (){window.print()});</script></body></html>');
			popupWin.document.close();
		};

        // $scope.printDiv = function(divName) {
		//
		//   if($scope.selectedInvoice.companyLogo == undefined || $scope.selectedInvoice.companyLogo == ''){
		//     var printContents = document.getElementById(divName).innerHTML;
		//     var popupWin = window.open('', '_blank', 'width=1800,height=700');
		//     popupWin.document.open();
		//     popupWin.document.write('<html><head>' +
		//       "<link href='app/main/360/dialogs/compose/print-view.css' rel='stylesheet' type='text/css'><link href='https://fonts.googleapis.com/css?family=Roboto' rel='stylesheet' type='text/css'>"+
		//       '</head><body>' + printContents + '<script src="https://code.jquery.com/jquery-3.1.1.min.js"></script><script>$(document).ready(function (){window.print()});</script></body></html>');
		//     //window.print();
		//     popupWin.document.close();
		//   }else{
		//     var printContents = document.getElementById(divName).innerHTML;
		//     console.log(printContents);
		//     var popupWin = window.open('', '_blank', 'width=1800,height=700');
		//     popupWin.document.open();
		//     popupWin.document.write('<html><head>' +
		//       "<link href='https://fonts.googleapis.com/css?family=Roboto' rel='stylesheet' type='text/css'>"+
		//       "<link href='app/main/360/dialogs/compose/print-view2.css' rel='stylesheet' type='text/css'>"+
		//       '</head><body>' + printContents + '<script src="https://code.jquery.com/jquery-3.1.1.min.js"></script><script>$(document).ready(function (){window.print()});</script></body></html>');
		//     //window.print();
		//     popupWin.document.close();
		//   }
		// }

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
          $scope.isTimelineDialogLoaded=false;
          $mdDialog.hide();
        }

		// Kasun_Wijeratne_12_06_2017
		$scope.adminData=null;
		$scope.getAdminUser= function () {
			$charge.commondetails().getAdminInfo().success(function(data){
				$scope.adminData=data;
			}).error(function (data) {

			})
		}

		$scope.getAdminUser();
		$scope.emailInvoice= function (ev,divName) {
			var printContents = document.getElementById(divName).innerHTML;
			var base64Conversion=window.btoa(unescape(encodeURIComponent(printContents)));
			$scope.emailTemplateInit(ev,base64Conversion);
		}
		$scope.emailTemplateInit = function(ev,base64Conversion){
			$mdDialog.hide();

        	$mdDialog.show({
				controller: 'AddInvoiceController',
				templateUrl: 'app/main/invoice/dialogs/compose/mailTemplate.html',
				parent: angular.element(document.body),
				targetEvent: ev,
				clickOutsideToClose:true,
				locals : {
					selectedInvoice: $scope.selectedInvoice,
					base64Content:base64Conversion,
					adminData:$scope.adminData
				},
				fullscreen: true // Only for -xs, -sm breakpoints.
			})
			//

		}
		// Kasun_Wijeratne_12_06_2017
    }
})();
