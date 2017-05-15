////////////////////////////////
// App : 360
// File : Threesixty Controller
// Owner  : GihanHerath
// Last changed date : 2017/01/13
// Version : 6.0.0.12
/////////////////////////////////

(function ()
{
    'use strict';

    angular
        .module('app.threesixty')
        .controller('ThreeSixtyController', ThreeSixtyController);

    /** @ngInject */
    function ThreeSixtyController($scope, $rootScope, $document, $timeout, notifications, $mdDialog, $mdToast, $mdMedia, $mdSidenav,$charge,$filter)
    {
        var vm = this;

        vm.appInnerState = "default";
        vm.pageTitle="Create New";
        vm.checked = [];
        vm.colors = ['blue-bg', 'blue-grey-bg', 'orange-bg', 'pink-bg', 'purple-bg'];

        vm.selectedProfile = {};
        vm.toggleSidenav = toggleSidenav;

        vm.responsiveReadPane = undefined;
        vm.activeInvoicePaneIndex = 0;
        vm.dynamicHeight = false;

        vm.scrollPos = 0;
        vm.scrollEl = angular.element('#content');

        //vm.invoices = Invoice.data;
        //console.log(vm.invoices);
        //invoice data getter !
        //$scope.selectedDoc = vm.invoices[0];
        vm.selectedMailShowDetails = false;

        // Methods
        vm.checkAll = checkAll;
        vm.closeReadPane = closeReadPane;
        vm.addInvoice = toggleinnerView;
        vm.isChecked = isChecked;
        vm.selectThreeSixty = selectThreeSixty;
        vm.toggleStarred = toggleStarred;
        vm.toggleCheck = toggleCheck;
        vm.isLoaded = false;
        vm.isLedgerLoaded = false;
        vm.isListLoaded = false;
        vm.tlLoadMore = tlLoadMore;

        $scope.a={};
        $scope.customer_supplier={};
        $scope.tlLimit = 10;
        $scope.currLength = 0;
        $scope.moreLedgerLoaded = false;
        $scope.searchMoreInit = true;

      /////////
      function tlLoadMore(){
        $scope.currLength = vm.ledgerLength - 10;
        if($scope.currLength>10) {
          $scope.tlLimit += 10;
        }else{
          $scope.tlLimit += $scope.currLength;
          vm.isLedgerLoaded = false;
        }
      }

        // Watch screen size to activate responsive read pane
        $scope.$watch(function ()
        {
            return $mdMedia('gt-md');
        }, function (current)
        {
            vm.responsiveReadPane = !current;
        });

        // Watch screen size to activate dynamic height on tabs
        $scope.$watch(function ()
        {
            return $mdMedia('xs');
        }, function (current)
        {
            vm.dynamicHeight = current;
        });

        /**
         * Select product
         *
         * @param product
         */
        vm.selectedProfileOriginal="";

        function selectThreeSixty(threesixty)
        {
        	vm.isLoaded = false;
            vm.selectedProfile = threesixty;

            $scope.customer_supplier.profile=threesixty;

            if($scope.customer_supplier.profile.profile_type=='Business')
            {
              $scope.customer_supplier.profile.profilename = $scope.customer_supplier.profile.business_name;
              $scope.customer_supplier.profile.othername = $scope.customer_supplier.profile.business_contact_name;
              $scope.customer_supplier.profile.contact = $scope.customer_supplier.profile.business_contact_no;
              $scope.customer_supplier.profile.ssn_regno = $scope.customer_supplier.profile.business_reg_no;
            }
            else if($scope.customer_supplier.profile.profile_type=='Individual') {
              $scope.customer_supplier.profile.profilename = $scope.customer_supplier.profile.first_name;
              $scope.customer_supplier.profile.othername = $scope.customer_supplier.profile.last_name;
              $scope.customer_supplier.profile.contact = $scope.customer_supplier.profile.phone;
              $scope.customer_supplier.profile.ssn_regno = $scope.customer_supplier.profile.nic_ssn;
            }

            vm.selectedProfileOriginal=angular.copy(threesixty);

            vm.profileDetailSubmitted = false;
            $scope.editProfileInfoEnabled=false;

            skipAuditTrails=0;
            $scope.auditTrailList=[];
            vm.isAuditTrailLoaded = true;
            $scope.moreAuditTrailLoaded = false;

            $scope.userSelected(threesixty);
            $scope.getScheduledOrders(threesixty);
            $scope.getAuditTrailDetails(threesixty);
          //$scope.loadInvoiceByCustomerId(threesixty.guCustomerID);

            $timeout(function ()
            {
                //vm.activeInvoicePaneIndex = 1;
                $scope.showInpageReadpane = true;

                // Store the current scrollPos
                vm.scrollPos = vm.scrollEl.scrollTop();

                // Scroll to the top
                vm.scrollEl.scrollTop(0);
            });
        }

        /**
         * Close read pane
         */
        function closeReadPane()
        {
            vm.activeInvoicePaneIndex = 0;
          vm.isLoaded = false;

            $timeout(function ()
            {
                vm.scrollEl.scrollTop(vm.scrollPos);
            }, 650);

            $scope.customer_supplier.profile=[];
            $scope.ledgerlist=[];
            $scope.tlLimit = 10;
            vm.isLoaded = false;
            vm.isLedgerLoaded = false;
            $scope.currLength = 0;
        }

        /**
         * Toggle starred
         *
         * @param mail
         * @param event
         */
        function toggleStarred(mail, event)
        {
            event.stopPropagation();
            mail.starred = !mail.starred;
        }

        /**
         * Toggle checked status of the mail
         *
         * @param invoice
         * @param event
         */
        function toggleCheck(invoice, event)
        {
            if ( event )
            {
                event.stopPropagation();
            }

            var idx = vm.checked.indexOf(invoice);

            if ( idx > -1 )
            {
                vm.checked.splice(idx, 1);
            }
            else
            {
                vm.checked.push(invoice);
            }
        }

        /**
         * Return checked status of the invoice
         *
         * @param invoice
         * @returns {boolean}
         */
        function isChecked(invoice)
        {
            return vm.checked.indexOf(invoice) > -1;
        }

        /**
         * Check all
         */
        function checkAll()
        {
            if ( vm.allChecked )
            {
                vm.checked = [];
                vm.allChecked = false;
            }
            else
            {
                angular.forEach(vm.threesixty, function (invoice)
                {
                    if ( !isChecked(invoice) )
                    {
                        toggleCheck(invoice);
                    }
                });

                vm.allChecked = true;
            }
        }

        /**
         * Open compose dialog
         *
         * @param ev
         */
        function addThreeSixtyDialog(ev)
        {
            $mdDialog.show({
                controller         : 'AddThreeSixtyController',
                controllerAs       : 'vm',
                locals             : {
                    selectedMail: undefined
                },
                templateUrl        : 'app/main/360/dialogs/compose/compose-dialog.html',
                parent             : angular.element($document.body),
                targetEvent        : ev,
                clickOutsideToClose: true
            });
        }

        /**
         * Toggle sidenav
         *
         * @param sidenavId
         */
        function toggleSidenav(sidenavId)
        {
            $mdSidenav(sidenavId).toggle();
        }

        /**
         * Toggle innerview
         *
         */

        function toggleinnerView(){
            if(vm.appInnerState === "default"){
                vm.appInnerState = "add";
                vm.pageTitle="View 360";
            }else{
                vm.appInnerState = "default";
                vm.pageTitle="Create New";
            }
        }


      $charge.commondata().getDuobaseFieldDetailsByTableNameAndFieldName("CTS_GeneralAttributes","BaseCurrency").success(function(data) {
        $scope.BaseCurrency=data[0].RecordFieldData;
        console.log($scope.BaseCurrency);

      }).error(function(data) {
        console.log(data);
        $scope.BaseCurrency="USD";
      });

      $charge.commondata().getDuobaseValuesByTableName("CTS_CompanyAttributes").success(function(data) {
        $scope.CompanyProfile=data;
        $scope.companyName=data[0].RecordFieldData;
        $scope.companyAddress=data[1].RecordFieldData;
        $scope.companyPhone=data[2].RecordFieldData;
        $scope.companyEmail=data[3].RecordFieldData;
        $scope.companyLogo=data[4].RecordFieldData;
      }).error(function(data) {
        console.log(data);
      })

      $charge.commondata().getDuobaseFieldDetailsByTableNameAndFieldName("CTS_GeneralAttributes","DecimalPointLength").success(function(data) {
        $scope.decimalPoint=parseInt(data[0].RecordFieldData);
        //
        //
      }).error(function(data) {
        console.log(data);
      });

      vm.items = [];
      vm.isdataavailable=true;
      var editfalse = true;
      vm.editOff = editfalse;
      $scope.hideSearchMore=false;

      var skipUserProfile=0;
      var takeUserProfile=100;
      vm.loading = true;

      $rootScope.refreshpage = function(){
        vm.profiles = [];
        vm.items = [];
        skipUserProfile=0;
        vm.loading = true;
        $scope.searchMoreInit = true;
        $scope.hideSearchMore=false;
        $scope.more();
      }

      $scope.more = function(){
        //
        $charge.profile().all(skipUserProfile,takeUserProfile,'desc').success(function(data)
        {
          console.log(data);
          if(vm.loading)
          {
            skipUserProfile += takeUserProfile;
            //

            for (var i = 0; i < data.length; i++) {
              //
              if(data[i].status==0)
              {
                data[i].status=false;
              }
              else
              {
                data[i].status=true;
              }
              vm.items.push(data[i]);

            }

            vm.profiles = vm.items;
            $scope.searchMoreInit = false;
            vm.isListLoaded = true;
            //selectProfile(data[0]);
            vm.loading = false;
            vm.isLoading = false;
            vm.isdataavailable=true;
            if(data.length<takeUserProfile){
              vm.isdataavailable=false;
              $scope.searchMoreInit = false;
              $scope.hideSearchMore=true;
            }
          }

        }).error(function(data)
        {
          console.log(data);
          vm.isSpinnerShown=false;
          vm.isdataavailable=false;
          vm.isLoading = false;
          vm.isListLoaded = true;
          $scope.hideSearchMore=true;
        })

      };
      // we call the function twice to populate the list
      $scope.more();

      $scope.searchMoreProfileClick = function (){
        vm.loading = true;
        $scope.more();
      }

      $scope.searchKeyPress = function (event,keyword,length){
        if(event.keyCode === 13)
        {
          console.log("Function Reached!");
          $scope.loadByKeywordProfile(keyword,length);
        }
      }

      var skipProfileSearch, takeProfileSearch;
      var tempList;
      $scope.loadByKeywordProfile= function (keyword,length) {
        if(vm.items.length==100) {
          //
          if(length==undefined)
          {
            keyword="undefined";
            length=0;
          }
          var searchLength=length;
          //if(keyword.toLowerCase().startsWith($scope.expensePrefix.toLowerCase()))
          //{
          //  keyword=keyword.substr($scope.expensePrefix.length);
          //  console.log(keyword);
          //  searchLength=1;
          //}
          if (keyword.length == searchLength) {
            console.log(keyword);
            //
            skipProfileSearch = 0;
            takeProfileSearch = 100;
            tempList = [];
            $charge.profile().filterByKey(keyword, skipProfileSearch, takeProfileSearch).success(function (data) {
              for (var i = 0; i < data.length; i++) {
                if(data[i].status==0)
                {
                  data[i].status=false;
                }
                else
                {
                  data[i].status=true;
                }
                tempList.push(data[i]);
              }
              vm.profiles = tempList;
              //skipProfileSearch += takeProfileSearch;
              //$scope.loadPaging(keyword, skipProfileSearch, takeProfileSearch);
            }).error(function (data) {
              vm.profiles = [];
            });
          }
          else if (keyword.length == 0 || keyword == null) {
            vm.profiles = vm.items;
          }

          if(searchLength==0||searchLength==undefined)
          {
            vm.loading = true;
            $scope.more();
          }
        }
      }


      //--------------------------360readviewcontroller-----------------------------



      $scope.openProfile = function(profile)
      {

        $rootScope.selectedProfile = profile;
      }

      $scope.items = [];
      $scope.profilelist = [];
      $scope.invoicelist = [];
      $scope.ledgerlist = [];
      $rootScope.ledgerlist = [];
      vm.ledgerLength;
      $scope.orderScheduledList = [];
      $scope.orderScheduledLoaded = false;


      var self = this;
      // list of `state` value/display objects
      //self.tenants        = loadAll();
      self.selectedItem  = null;
      self.searchText    = "";
      self.querySearch   = querySearch;

      function querySearch (query) {

        //Custom Filter
        var results=[];
        var len=0;
        for (var i = 0, len = $scope.profilelist.length; i<len; ++i){
          //console.log($scope.allBanks[i].value.value);

          if($scope.profilelist[i].profilename.toLowerCase().indexOf(query.toLowerCase()) !=-1)
          {
            results.push($scope.profilelist[i]);
          }
          else if($scope.profilelist[i].othername.toLowerCase().indexOf(query.toLowerCase()) !=-1)
          {
            results.push($scope.profilelist[i]);
          }
          else if($scope.profilelist[i].bill_addr.toLowerCase().indexOf(query.toLowerCase()) !=-1)
          {
            results.push($scope.profilelist[i]);
          }
          else if($scope.profilelist[i].contact.toLowerCase().indexOf(query.toLowerCase()) !=-1)
          {
            results.push($scope.profilelist[i]);
          }
          else if($scope.profilelist[i].email_addr.toLowerCase().indexOf(query.toLowerCase()) !=-1)
          {
            results.push($scope.profilelist[i]);
          }
          else if($scope.profilelist[i].ssn_regno.toLowerCase().indexOf(query.toLowerCase()) !=-1)
          {
            results.push($scope.profilelist[i]);
          }

        }
        return results;
      }
      $scope.profilelist = [];

      var skipprofiles=0;
      var takeprofiles=100;

      function loadAll() {

        $charge.profile().all(skipprofiles,takeprofiles,'asc').success(function(data){
          console.log(data);
          skipprofiles+=takeprofiles;
          for (var i = 0; i < data.length; i++) {
            var obj=data[i];

            if(obj.profile_type=='Business')
            {
              $scope.profilelist.push({
                profilename : obj.business_name,
                profileId : obj.profileId,
                othername : obj.business_contact_name,
                profile_type : obj.profile_type,
                bill_addr : obj.bill_addr,
                ship_addr : obj.ship_addr,
                contact : obj.business_contact_no,
                email_addr : obj.email_addr,
                ssn_regno : obj.business_reg_no
              });
            }
            else if(obj.profile_type=='Individual')
            {
              $scope.profilelist.push({
                profilename : obj.first_name,
                profileId : obj.profileId,
                othername : obj.last_name,
                profile_type : obj.profile_type,
                bill_addr : obj.bill_addr,
                ship_addr : obj.ship_addr,
                contact : obj.phone,
                email_addr : obj.email_addr,
                ssn_regno : obj.nic_ssn
              });
            }

          }
          loadAll();

        }).error(function(data){
          //alert ("Error getting all banks");
        });

      }
      loadAll();

      var skip=0;
      var take=20;
      var totbalance=0;
      var invbalance=0;
      var recbalance=0;
      var adjustmentbalance=0;
      $scope.isdataavailable=false;

      $scope.ledgerlist=$rootScope.ledgerlist;

      $scope.userSelected = function (customer)
      {

        $rootScope.selectedProfile = customer;
        skip=0;
        var cusId=customer.profileId;

        $charge.ledger().getTotalAmounts(cusId,'in').success(function(data)
        {
          console.log(1);
          console.log(data);
          recbalance=parseFloat(data[0]['sum(amount)']);

          $charge.ledger().getTotalAmounts(cusId,'out').success(function(data)
          {
            console.log(2);
            console.log(data);
            invbalance=parseFloat(data[0]['sum(amount)']);

            $charge.ledger().getTotalAdjustment(cusId).success(function(data)
            {
              console.log(3);
              console.log(data);
              adjustmentbalance=parseFloat(data.sum);

              totbalance=invbalance+recbalance+adjustmentbalance;
              recbalance=-recbalance;

              $scope.ledgerlist = [];
              $scope.isdataavailable=true;
              $scope.loadLedger(customer);

            }).error(function(data)
            {
              console.log(data);
              vm.isLoaded = true;
            })

            //totbalance=invbalance+recbalance;
            //recbalance=-recbalance;
            //
            //$scope.ledgerlist = [];
            //$scope.isdataavailable=true;
            //$scope.loadLedger(customer);

          }).error(function(data)
          {
            console.log(data);
            vm.isLoaded = true;
          })

        }).error(function(data)
        {
          console.log(data);
          vm.isLoaded = true;
        })

        $charge.order().getByAccountID(cusId,0,5000).success(function(data)
        {
          console.log(data);

          for(var i = 0; i < data.OrderDetails.length; i++){
            var orderid=data.OrderDetails[i].guOrderId;
            var ordertype="";

            //
            var datalength=1;
            for(var j = 0; j < datalength; j++){
              datalength++;
              if(data[j].guOrderId==orderid)
              {
                ordertype=data[j].type;
                break;
              }
            }
            data.OrderDetails[i].ordertype=ordertype;

          }
          $rootScope.orderlist = data.OrderDetails;

        }).error(function(data)
        {
          console.log(data);
        })
      }

      $scope.loadLedger = function (customer)
      {
        //
        var cusId=customer.profileId;
        //$scope.ledgerlist = [];
        //console.log(cusId);
        $charge.ledger().getByAccountID(cusId,skip,take,'desc').success(function(data)
        {
          console.log(data);

          skip += take;


          for (var i = 0; i < data.length; i++) {
            var obj=data[i];
            //if(obj.accountId==cusId)
            //{
            if(obj.transactionType.toLowerCase()=="invoice")
            {
              //invbalance+=parseInt(obj.amount);
              //invbalance+=parseFloat(obj.amount);
            }
            else if(obj.transactionType.toLowerCase()=="receipt")
            {
              //recbalance+=parseInt(obj.amount);
              //recbalance+=parseFloat(obj.amount);
              obj.amount=-obj.amount;
            }
            var checkamount=parseFloat(obj.amount);
            if(checkamount<0)
            {
              obj.amount=-obj.amount;
            }

            $scope.ledgerlist.push(obj);
            //}
          }
          vm.ledgerLength = $scope.ledgerlist.length;
          $scope.moreLedgerLoaded = true;
          //$scope.ledgerlist.sort($scope.ledgerlist.createdDate);
          //totbalance=invbalance+recbalance;
          //recbalance=-recbalance;
          $scope.ledgerlist.invbalance=invbalance;
          $scope.ledgerlist.recbalance=recbalance;
          $scope.ledgerlist.adjustmentbalance=adjustmentbalance;
          $scope.ledgerlist.totalbal=totbalance;

          vm.isLoaded = true;
          vm.isLedgerLoaded = true;

          $rootScope.ledgerlist=$scope.ledgerlist;

          if(data.length<take)
          {
            $scope.isdataavailable=false;
            vm.isLedgerLoaded = false;
          }

        }).error(function(data)
        {
          console.log(data);
          if(data==204)
          {
            $scope.ledgerlist.invbalance=invbalance;
            $scope.ledgerlist.recbalance=recbalance;
            $scope.ledgerlist.adjustmentbalance=adjustmentbalance;
            $scope.ledgerlist.totalbal=totbalance;
            $scope.ledgerlist.isDialogLoading = false;
          }
          //$scope.ledgerlist=[];
          $scope.isdataavailable=false;
          vm.isLoaded = true;
          vm.isLedgerLoaded = false;
        })
      }


      $scope.noOrderScheduleLabel=false;

      $scope.getScheduledOrders = function (customer){

        var skipScheduledOrders=0;
        var takeScheduledOrders=100;
        var cusId=customer.profileId;
        $scope.noOrderScheduleLabel=false;
        $scope.orderScheduledList=[];
        $charge.order().getScheduledOrders(cusId,skipScheduledOrders,takeScheduledOrders).success(function(data)
        {
          console.log(data);
          for (var i = 0; i < data.length; i++) {
            var objOrderSchedule=data[i];
            objOrderSchedule.id=i+1;
            objOrderSchedule.createDate=objOrderSchedule.createDate.split(' ')[0];
            objOrderSchedule.scheduleActive=true;
            if(objOrderSchedule.type=='Recurring')
            {
              objOrderSchedule.occurences="No End Date";
            }
            $scope.orderScheduledList.push(objOrderSchedule);
            $scope.orderScheduledLoaded = true;
            $scope.addProceedsInventoryCount(objOrderSchedule.guOrderId,i);
            $scope.checkOrderStatus(objOrderSchedule.guOrderId,objOrderSchedule);

            //$charge.invoice().getInvoiceCount(objOrderSchedule.guOrderId).success(function(dataInvoice)
            //{
            //
            //  objOrderSchedule.proceedinvoices=dataInvoice[0].invoiceCount;
            //  $scope.orderScheduledList.push(objOrderSchedule);
            //}).error(function(dataErrorInvoice)
            //{
            //  console.log(dataErrorInvoice);
            //
            //  objOrderSchedule.proceedinvoices="0";
            //  $scope.orderScheduledList.push(objOrderSchedule);
            //})
          }

        }).error(function(data)
        {
          console.log(data);
          if(data==204)
          {
            $scope.noOrderScheduleLabel=true;
          }
          $scope.orderScheduledList=[];
        })
      }

      var skipAuditTrails=0;
      var takeAuditTrails=100;
      $scope.auditTrailList=[];
      vm.isAuditTrailLoaded = true;
      $scope.moreAuditTrailLoaded = false;

      $scope.getAuditTrailDetails = function (customer){


        var cusId=customer.profileId;
        $scope.noAuditTrailLabel=false;
        vm.isAuditTrailLoaded = true;
        $charge.audit().getByAccountId(cusId,skipAuditTrails,takeAuditTrails,'desc').success(function(data)
        {
          console.log(data);
          skipAuditTrails+=takeAuditTrails;
          //$scope.auditTrailList=data;
          for (var i = 0; i < data.length; i++) {
            var objAuditTrail=data[i];
            //objAuditTrail.id=i+1;
            //objAuditTrail.createdDate=objAuditTrail.createdDate.split(' ')[0];
            $scope.auditTrailList.push(objAuditTrail);

          }

          if(data.length<takeAuditTrails)
          {
            vm.isAuditTrailLoaded = false;
          }
          $scope.moreAuditTrailLoaded = true;

        }).error(function(data)
        {
          console.log(data);
          if(data==204)
          {
            $scope.noAuditTrailLabel=true;
          }
          $scope.moreAuditTrailLoaded = true;
          vm.isAuditTrailLoaded = false;
          //$scope.auditTrailList=[];
        })
      }

      $scope.searchmoreAuditTrails = function (customer){
        $scope.moreAuditTrailLoaded = false;
        $scope.getAuditTrailDetails(customer);
      }

      $scope.addProceedsInventoryCount = function (guOrderId,index){
        $charge.invoice().getInvoiceCount(guOrderId).success(function(dataInvoice)
        {
          //
          $scope.orderScheduledList[index].proceedinvoices=dataInvoice[0].invoiceCount;
          //$scope.orderScheduledList.push(objOrderSchedule);
        }).error(function(dataErrorInvoice)
        {
          console.log(dataErrorInvoice);

          $scope.orderScheduledList[index].proceedinvoices=0;
          //$scope.orderScheduledList.push(objOrderSchedule);
        })
      }

      $scope.disconnectOrder = function (orderId,detail)
      {

        $charge.job().disconnectJob(orderId).success(function(data){
          console.log(data);
          if(data.IsSuccess==true)
          {
            detail.scheduleActive=false;
            notifications.toast("Product Order has been Disconnected Successfully!","success");
          }
          else
          {
            notifications.toast("Product Order Disconnection failed!","error");
          }
        }).error(function(data){
          console.log(data);
          notifications.toast("Product Order Disconnection failed!","error");
        })
      }

      $scope.resumeOrder = function (orderId,detail)
      {

        $charge.job().resumeJob(orderId).success(function(data){
          console.log(data);
          if(data.IsSuccess==true)
          {
            detail.scheduleActive=true;
            notifications.toast("Product Order has been Resumed Successfully!","success");
          }
          else
          {
            notifications.toast("Product Order Resume failed!","error");
          }
        }).error(function(data){
          console.log(data);
          notifications.toast("Product Order Resume failed!","error");
        })
      }

      $scope.checkOrderStatus = function (orderId,detail)
      {
        //
        $charge.job().checkJobStatus(orderId).success(function(data){
          console.log(data);
          if(data.status=="Active")
          {
            detail.scheduleActive=true;
          }
          else
          {
            detail.scheduleActive=false;
          }
          detail.logic=data.logic;
          detail.logic=detail.logic.split('T')[0];
        }).error(function(data){
          console.log(data);
          detail.scheduleActive=true;
        })
      }

      $scope.searchmorebuttonclick = function (customer){
        $scope.moreLedgerLoaded = false;
        $scope.loading = true;
        $scope.loadLedger(customer);
      }

      $scope.showAdvancedInvoice = function(ev,invoice) {

        //$scope.openInvoiceLst(invoice);
        $mdDialog.show({
          controller         : 'AdvanceViewInvoiceController',
          controllerAs       : 'vm',
          templateUrl : 'app/main/360/views/customInvoiceThreesixty.html',
          parent: angular.element(document.body),
          locals             : {
            selectedDoc: invoice,
            isTimelineDialogLoaded : $scope.isTimelineDialogLoaded
          },
          targetEvent: ev,
          clickOutsideToClose:false
        })
          .then(function(answer) {
            $scope.isTimelineDialogLoaded = true;
          }, function() {
            $scope.isTimelineDialogLoaded = true;
          });
      };

      $scope.showAdvancedPayment = function(ev,payment) {

        //$scope.openInvoiceLst(payment);

        $mdDialog.show({
          controller         : 'AdvanceViewPaymentController',
          controllerAs       : 'vm',
          templateUrl: 'app/main/360/views/customPaymentThreesixty.html',
          parent: angular.element(document.body),
          locals             : {
            selectedPayment: payment,
            isTimelineDialogLoaded : $scope.isTimelineDialogLoaded
          },
          targetEvent: ev,
          clickOutsideToClose:false
        })
          .then(function(answer) {
            $scope.isTimelineDialogLoaded = true;
          }, function() {
            $scope.isTimelineDialogLoaded = true;
          });
      };

      $scope.isTimelineDialogLoaded = true;

      $scope.clickLedgerItem = function(ev,item) {
        $scope.isTimelineDialogLoaded = false;
        item.isDialogLoading = true;
        if(item.transactionType.toLowerCase()=="invoice"||item.transactionType.toLowerCase()=="invoice-cancelled")
        {
          $scope.openInvoiceLst(ev,item);
        }
        else if(item.transactionType.toLowerCase()=="receipt"||item.transactionType.toLowerCase()=="receipt-cancelled")
        {
          $scope.openPaymentLst(ev,item);
        }
        else if(item.transactionType.toLowerCase()=="creditnote"||item.transactionType.toLowerCase()=="debitnote")
        {
          $scope.openAdjustmentLst(ev,item);
        }
      }

      $scope.cancel = function($scope, $mdDialog) {
        $mdDialog.cancel();
      };

      var prefixLength="";
      var lenPrefix;
      $scope.prefixInvoice=localStorage.getItem("invoicePrefix");
      prefixLength=localStorage.getItem("prefixLength");
      $scope.lenPrefixInvoice=prefixLength!=0? parseInt(prefixLength):0;

      //$charge.commondata().getDuobaseFieldDetailsByTableNameAndFieldName("CTS_InvoiceAttributes","PrefixLength").success(function(data) {
      //  prefixLength=data[0];
      //  lenPrefix=prefixLength!=0? parseInt(prefixLength.RecordFieldData):0;
      //}).error(function(data) {
      //  console.log(data);
      //})

      $scope.openInvoiceLst = function(ev,invoice)
      {

        $charge.invoice().getByGuinvId(invoice.referenceID).success(function(data) {

          $scope.invProducts=[];
          var invoiceDetails=data[0].invoiceDetails;
          var count=invoiceDetails.length;
          var productName;
          var status=false;
          var totDiscount=0;
          //var address = $scope.GetAddress(invoice.person_name);
          //var address = $filter('filter')($scope.users, { profilename: invoice.person_name })[0];
          //$scope.prefix=prefixLength!=0? parseInt(prefixLength.RecordFieldData):0;
          //var prefixInvoice=invoicePrefix!=""?invoicePrefix.RecordFieldData:"INV";

          var exchangeRate=parseFloat(data[0].rate);
          $scope.selectedDoc={};
          $scope.selectedDoc = data[0];
          //$scope.selectedDoc.prefix=prefixLength!=0? parseInt(prefixLength.RecordFieldData):0;
          var invoiceNum=$filter('numberFixedLen')($scope.selectedDoc.invoiceNo,$scope.lenPrefixInvoice);
          $scope.selectedDoc.invoiceNo=$scope.prefixInvoice+invoiceNum;

          $scope.selectedDoc.bill_addr = data[0].bill_addr;
          $scope.selectedDoc.person_name = data[0].profile_type=="Individual"?data[0].first_name + " " + data[0].last_name:data[0].business_name;
          $scope.selectedDoc.email_addr = data[0].email_addr;
          $scope.selectedDoc.phone=data[0].phone;
          $scope.selectedDoc.subTotal=angular.copy(data[0].subTotal*exchangeRate);
          $scope.selectedDoc.discAmt=data[0].discAmt*exchangeRate;
          //$scope.selectedDoc.invoiceNo=prefixInvoice;

          $scope.selectedDoc.additionalcharge=data[0].additionalcharge*exchangeRate;
          $scope.selectedDoc.invoiceAmount=data[0].invoiceAmount*exchangeRate;
          $scope.selectedDoc.tax=data[0].tax*exchangeRate;
          $scope.selectedDoc.dueDate=moment(data[0].dueDate.toString()).format('LL');
          $scope.selectedDoc.logo=$rootScope.companyLogo;
          $scope.selectedDoc.currency=data[0].currency;
          $scope.selectedDoc.rate=exchangeRate;
          $scope.selectedDoc.invoiceDetails=invoiceDetails;
          $scope.selectedDoc.companyName=$scope.companyName;
          $scope.selectedDoc.companyAddress=$scope.companyAddress;
          $scope.selectedDoc.companyPhone=$scope.companyPhone;
          $scope.selectedDoc.companyEmail=$scope.companyEmail;
          $scope.selectedDoc.companyLogo=$scope.companyLogo;

          invoiceDetails.forEach(function(inv){
            inv.product_name= inv.product_name;
            inv.unitPrice= inv.unitPrice*exchangeRate;
            inv.gty= inv.gty;
            inv.totalPrice=inv.totalPrice*exchangeRate;
            totDiscount=totDiscount+inv.discount*exchangeRate;
            inv.promotion=totDiscount});
          $scope.selectedDoc.discount=totDiscount;
          $scope.selectedDoc=$scope.selectedDoc;
          $scope.selectedDoc.transactionType = invoice.transactionType;


          $scope.showAdvancedInvoice(ev,$scope.selectedDoc);
          invoice.isDialogLoading = false;

        }).error(function(data)
        {
          console.log(data);
          $scope.spinnerInvoice=false;

        });
      }

      //$charge.commondata().getDuobaseFieldDetailsByTableNameAndFieldName("CTS_PaymentAttributes","PaymentPrefix").success(function(data) {
      //  $scope.paymentPrefix=data[0].RecordFieldData;
      //  console.log($scope.paymentPrefix);
      //}).error(function(data) {
      //  console.log(data);
      //})
      $scope.paymentPrefix=localStorage.getItem("paymentPrefix");

      var prefixLengthPayment=localStorage.getItem("paymentPrefixLength");
      $scope.lenPrefixPayment=prefixLengthPayment!=0? parseInt(prefixLengthPayment):0;

      $scope.openPaymentLst = function(ev,payment)
      {

        $charge.payment().getByID(payment.referenceID).success(function(data) {

              //console.log(moment(data[i].paymentDate).format('LL'));
              data.paymentDate=moment(data.paymentDate).format('L');
              //data.paymentNo=$scope.paymentPrefix+data.paymentNo;
              var paymentNum=$filter('numberFixedLen')(data.paymentNo,$scope.lenPrefixPayment);
              data.paymentNo=$scope.paymentPrefix+paymentNum;
              //
              var insertedCurrency=data.currency;
              var insertedrate=1;
              if(data.rate!=null||data.rate!=""||data.rate!=undefined)
              {
                insertedrate=parseFloat(data.rate);
              }

              if(insertedCurrency!=$scope.BaseCurrency)
              {
                data.amount=Math.round((parseFloat(data.amount)*insertedrate)*100)/100;
                if(data.bankCharges!=null||data.bankCharges!=""||data.bankCharges!=undefined)
                {
                  data.bankCharges=Math.round((parseFloat(data.bankCharges)*insertedrate)*100)/100;
                }
                $scope.selectedDoc=data;
              }
              else
              {
                $scope.selectedDoc=data;
              }

              $scope.selectedDoc.companyName=$scope.companyName;
              $scope.selectedDoc.companyAddress=$scope.companyAddress;
              $scope.selectedDoc.companyPhone=$scope.companyPhone;
              $scope.selectedDoc.companyEmail=$scope.companyEmail;
              $scope.selectedDoc.companyLogo=$scope.companyLogo;

              if(data.profile_type=='Individual')
              {
                $scope.selectedDoc.UserName=data.first_name+" "+data.last_name;
                $scope.selectedDoc.UserAddress=data.bill_addr;
                $scope.selectedDoc.UserContact=data.phone;
                $scope.selectedDoc.UserEmail=data.email_addr;
              }
              else if(data.profile_type=='Business')
              {
                $scope.selectedDoc.UserName=data.business_contact_name; //business_name,business_contact_name
                $scope.selectedDoc.UserAddress=data.bill_addr;
                $scope.selectedDoc.UserContact=data.business_contact_no;
                $scope.selectedDoc.UserEmail=data.email_addr;
              }

              $scope.selectedDoc.transactionType = payment.transactionType;
              $scope.showAdvancedPayment(ev,$scope.selectedDoc);

          payment.isDialogLoading = false;

              //$scope.items.push(data[i]);  payment service Version - 6.1.0.5

            //vm.payments=$scope.selectedDoc;

        }).error(function(data)
        {
          console.log(data);
          $scope.spinnerInvoice=false;

        });
      }

      $scope.openAdjustmentLst = function (ev, adjustment) {

        $scope.selectedDoc=[];
        //adjustment.referenceID="91";
        $charge.adjustment().getByAdjustmentId(adjustment.referenceID).success(function(data) {

          $scope.selectedDoc=data[0];

          $scope.selectedDoc.companyName=$scope.companyName;
          $scope.selectedDoc.companyAddress=$scope.companyAddress;
          $scope.selectedDoc.companyPhone=$scope.companyPhone;
          $scope.selectedDoc.companyEmail=$scope.companyEmail;
          $scope.selectedDoc.companyLogo=$scope.companyLogo;

          if($scope.selectedDoc.amount!=undefined && $scope.selectedDoc.rate!=undefined){
            $scope.selectedDoc.amount = parseFloat($scope.selectedDoc.amount * $scope.selectedDoc.rate);
          }

          $scope.SelectedInvoiceForAdjustment=[];

          if(data[0].invoiceid && data[0].invoiceid != 0){

            //var invoiceId = data[0].invoiceid.split(' ');


            $charge.invoice().getByID(data[0].invoiceid).success(function(data) {

              //console.log(data);
              for(var i=0;i<data.length;i++)
              {
                var currencyAmount = data[i]["invoiceAmount"];

                //var c = $scope.baseCurrency+'_'+data[i]["currency"];
                //for(var iz=0;iz<$scope.AllCurrencies.length;iz++)
                //{
                //  if($scope.AllCurrencies[iz][c])
                //  {
                //    currencyAmount = (data[i]["invoiceAmount"] * $scope.AllCurrencies[iz][c].val);
                //    //console.log(data[i]["amount"] +"  -  "+(data[i]["amount"] * currencies[iz][c].val));
                //  }
                //
                //}

                $scope.SelectedInvoiceForAdjustment=({invoiceid : data[i]["invoiceNo"],invoiceno: $scope.prefixInvoice+' '+data[i]["invoiceNo"]
                  ,currencyAmount: currencyAmount,invoiceAmount: data[i]["invoiceAmount"],invoiceDate: data[i]["invoiceDate"],invoiceStatus: data[i]["invoiceStatus"]
                  ,currency: data[i]["currency"],invoiceType: data[i]["invoiceType"],paidAmount: data[i]["paidAmount"],subTotal: data[i]["subTotal"]});



              }
              $scope.showAdvancedAdjustment(ev,$scope.selectedDoc,$scope.SelectedInvoiceForAdjustment);
              adjustment.isDialogLoading = false;

              // $scope.isLoading = false;
            }).error(function(data) {
              console.log(data);
              $scope.showAdvancedAdjustment(ev,$scope.selectedDoc,$scope.SelectedInvoiceForAdjustment);
            })


            //$scope.customerAddress = $scope.customerPhone =  $scope.customerEmail = '';

            //$charge.profile().getByID(adjustment.customerId).success(function(data) {
            //
            //
            //  console.log(data);
            //  for(var i=0;i<data.length;i++)
            //  {
            //    $scope.customerAddress = data[i].bill_addr;
            //    $scope.customerPhone = data[i].phone;
            //    $scope.customerEmail = data[i].email_addr;
            //
            //  }
            //
            //  // $scope.isLoading = false;
            //}).error(function(data) {
            //  console.log(data);
            //})

          }
          else
          {
            $scope.showAdvancedAdjustment(ev,$scope.selectedDoc,$scope.SelectedInvoiceForAdjustment);
          }

        }).error(function(data)
        {
          console.log(data);
          $scope.spinnerInvoice=false;

        });

      }

      $scope.showAdvancedAdjustment = function (ev, adjustment, invoice) {

        $mdDialog.show({
          controller         : 'AdvanceViewAdjustmentController',
          controllerAs       : 'vm',
          templateUrl: 'app/main/360/views/customInvoiceThreesixty.html',
          parent: angular.element(document.body),
          locals             : {
            // selectedAdjustment: adjustment,
            selectedDoc:  adjustment,
            isTimelineDialogLoaded : $scope.isTimelineDialogLoaded
          },
          targetEvent: ev,
          clickOutsideToClose:false
        })
          .then(function(answer) {
            $scope.isTimelineDialogLoaded = true;
          }, function() {
            $scope.isTimelineDialogLoaded = true;
          });
      }

      $scope.editProfileInfoEnabled=false;
      $scope.editProfileInfo = function () {
        $scope.editProfileInfoEnabled=!$scope.editProfileInfoEnabled;
      }

      $scope.resetProfileInfo = function () {
        $scope.customer_supplier.profile=angular.copy(vm.selectedProfileOriginal);
      }

      $scope.cancelEditProfileInfo = function () {
        $scope.editProfileInfo();
        $scope.resetProfileInfo();
      }

      $scope.submitProfile = function () {

        if (vm.editProfileForm.$valid == true) {
          debugger;
          vm.profileDetailSubmitted = true;

          $scope.customer_supplier.profile.first_name = $scope.customer_supplier.profile.profilename;
          $scope.customer_supplier.profile.last_name = $scope.customer_supplier.profile.othername;
          $scope.customer_supplier.profile.phone = $scope.customer_supplier.profile.contact;
          $scope.customer_supplier.profile.bill_addr=document.getElementById('autocomplete').value;
          $scope.customer_supplier.profile.ship_addr=document.getElementById('autocomplete2').value;

          $charge.profile().update($scope.customer_supplier.profile).success(function(data){
            console.log(data);

            if(data.response=="succeeded")
            {
              notifications.toast("Successfully Updated the Profile","success");
              $scope.editProfileInfo();
              vm.selectedProfileOriginal=angular.copy($scope.customer_supplier.profile);
              vm.profileDetailSubmitted = false;
            }
            else
            {
              notifications.toast("Updating Profile Failed","error");
              vm.profileDetailSubmitted = false;
            }

          }).error(function(data){
            console.log(data);
            notifications.toast("Updating Profile Failed","error");
            vm.profileDetailSubmitted = false;
          })
        }
      }

      $scope.showInpageReadpane = false;
      $scope.switchInfoPane = function (state, profile) {
        if(state=='show'){
          $scope.showInpageReadpane = true;
          $scope.$watch(function () {
            vm.selectedProfile = profile;
          });
        }else if(state=='close'){
            $scope.showInpageReadpane = false;
            $scope.inpageReadPaneEdit=false;
        }
      }

      $scope.showMoreUserInfo=false;
      $scope.contentExpandHandler = function () {
        $scope.reverseMoreLess =! $scope.reverseMoreLess;
        if($scope.reverseMoreLess){
          $scope.showMoreUserInfo=true;
        }else{
          $scope.showMoreUserInfo=false;
        }
      };

      // Kasun_Wijeratne_15_May
		// $charge.storage().allTemplates().success(function (data) {
		// 	console.log(data);
		// 	// debugger;
		// 	if($scope.loadingEmailTemplates)
		// 	{
		// 		for (var i = 0; i < data.result.length; i++) {
		// 			vm.emailTemplateList.push({
		// 				url:data.result[i],
		// 				name:data.result[i].split('/')[data.result[i].split('/').length-1].split('.')[0],
		// 				isSelected:false
		// 			});
		// 		}
		// 		$scope.loadingEmailTemplates = false;
	  //
		// 		$scope.getDefaultEmailTemplate();
		// 	}
		// }).error(function (data) {
		// 	console.log(data);
		// 	vm.emailTemplateList=[];
		// 	$scope.loadingEmailTemplates = false;
		// });
		$charge.settingsapp().getDuobaseFieldsByTableNameAndFieldName("CTS_EmailTemplates", "TemplateUrl").success(function (data) {
			$scope.currentTemplateView=data[0][0].RecordFieldData.split('/')[data[0][0].RecordFieldData.split('/').length-1].split('.')[0];
		}).error(function (data) {
			$scope.currentTemplateView = null;
		});
      // Kasun_Wijeratne_15_May

    }
})();
