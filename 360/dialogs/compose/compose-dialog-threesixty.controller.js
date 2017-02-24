(function ()
{
    'use strict';

    angular
        .module('app.threesixty')
        .controller('AddThreeSixtyController', AddThreeSixtyController);

    /** @ngInject */
    function AddThreeSixtyController($mdDialog, selectedInvoice,$scope)
    {
        var vm = this;


        vm.hiddenCC = true;
        vm.hiddenBCC = true;

        $scope.selectedInvoice=selectedInvoice;
        // Methods
        vm.closeDialog = closeDialog;

        //////////

        function closeDialog()
        {
            $mdDialog.hide();
        }
    }
})();
