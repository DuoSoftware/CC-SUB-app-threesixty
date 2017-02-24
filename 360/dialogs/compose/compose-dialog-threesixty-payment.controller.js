(function ()
{
    'use strict';

    angular
        .module('app.threesixty')
        .controller('AddThreeSixtyPaymentController', AddThreeSixtyPaymentController);

    /** @ngInject */
    function AddThreeSixtyPaymentController($mdDialog, selectedPayment, $scope)
    {
        var vm = this;


        vm.hiddenCC = true;
        vm.hiddenBCC = true;

        vm.selectedPayment=selectedPayment;
        // Methods
        vm.closeDialog = closeDialog;

        //////////

        function closeDialog()
        {
            $mdDialog.hide();
        }
    }
})();
