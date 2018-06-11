////////////////////////////////
// App : 360
// File : Threesixty Controller
// Owner  : GihanHerath
// Last changed date : 2017/01/13
// Version : 6.0.0.12
/////////////////////////////////

(function () {
  'use strict';

  angular
    .module('app.threesixty')
    .controller('ThreeSixtyController', ThreeSixtyController);

  /** @ngInject */
  function ThreeSixtyController($scope, $rootScope, $document, $timeout, notifications, $mdDialog, $mdToast, $window, $location, $mdMedia, $mdSidenav, $charge, $filter, $azureSearchHandle, logHelper) {
    var vm = this;

    vm.appInnerState = "default";
    vm.pageTitle = "Create New";
    vm.checked = [];
    vm.colors = ['blue-bg', 'blue-grey-bg', 'orange-bg', 'pink-bg', 'purple-bg'];

    vm.selectedProfile = {};
    vm.toggleSidenav = toggleSidenav;

    vm.responsiveReadPane = undefined;
    vm.activeInvoicePaneIndex = 0;
    vm.dynamicHeight = false;

    vm.scrollPos = 0;
    vm.scrollEl = angular.element('#content');

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
    vm.refreshAttachmentPreview = refreshAttachmentPreview;
    vm.downloadAttachment = downloadAttachment;
    vm.switchInnerView = switchInnerView;

    $scope.a = {};
    $scope.customer_supplier = {};
    $scope.tlLimit = 10;
    $scope.currLength = 0;
    $scope.moreLedgerLoaded = false;
    $scope.searchMoreInit = true;
    $scope.selectedDoc = {};

    function gst(name) {
      var nameEQ = name + "=";
      var ca = document.cookie.split(';');
      for (var i = 0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length);
      }
      //debugger;
      return null;
    }


    $scope.categories = [];
    $scope.isInvoiceTenant = false;
    $scope.TenantType = gst("category");
    if ($scope.TenantType == "invoice") $scope.isInvoiceTenant = true;


    /////////
    function refreshAttachmentPreview() {
      $scope.refreshPreview = false;
      $timeout(function () {
        $scope.refreshPreview = true;
      }, 5);
    };

    function tlLoadMore() {
      $scope.currLength = vm.ledgerLength - 10;
      if ($scope.currLength > 10) {
        $scope.tlLimit += 10;
      } else {
        $scope.tlLimit += $scope.currLength;
        vm.isLedgerLoaded = false;
      }
    }

    // Watch screen size to activate responsive read pane
    $scope.$watch(function () {
      return $mdMedia('gt-md');
    }, function (current) {
      vm.responsiveReadPane = !current;
    });

    // Watch screen size to activate dynamic height on tabs
    $scope.$watch(function () {
      return $mdMedia('xs');
    }, function (current) {
      vm.dynamicHeight = current;
    });

    function getDomainName() {
      var _st = gst("domain");
      return (_st != null) ? _st : "";
    }

    function getDomainExtension() {
      var _st = gst("extension_mode");
      return (_st != null) ? _st : "test";
    }

    /**
     * Select product
     *
     * @param product
     */
    vm.selectedProfileOriginal = "";
    vm.usingAvalaraTax = false;

    function selectThreeSixty(threesixty) {
      vm.isLoaded = false;
      vm.selectedProfile = threesixty;
      $scope.isAttachmentPreviewOn = false;

      $scope.customer_supplier.profile = threesixty;

      $scope.customer_supplier.profile.profilename = $scope.customer_supplier.profile.first_name;
      $scope.customer_supplier.profile.othername = $scope.customer_supplier.profile.last_name;
      $scope.customer_supplier.profile.contact = $scope.customer_supplier.profile.phone;
      vm.selectedProfileOriginal = angular.copy(threesixty);

      $charge.profile().getByIDWithStripeKey(threesixty.profileId).success(function (data) {
        //console.log(data);
        $scope.customer_supplier.profile = data[0];

        $scope.customer_supplier.profile.profilename = $scope.customer_supplier.profile.first_name;
        $scope.customer_supplier.profile.othername = $scope.customer_supplier.profile.last_name;
        $scope.customer_supplier.profile.contact = $scope.customer_supplier.profile.phone;

        if (vm.usingAvalaraTax) {
          var addressParts = $scope.customer_supplier.profile.bill_addr.split('|');

          $scope.customer_supplier.profile.line1 = addressParts[0];
          $scope.customer_supplier.profile.line2 = addressParts[1];
          $scope.customer_supplier.profile.line3 = addressParts[2];
          $scope.customer_supplier.profile.city = addressParts[3];
          $scope.customer_supplier.profile.region = addressParts[4];
          $scope.customer_supplier.profile.country = $scope.customer_supplier.profile.bill_country;
        }

        vm.selectedProfileOriginal = angular.copy(threesixty);

        $scope.addUpdateCardDetails(threesixty);

        // $scope.isLoading = false;
      }).error(function (data) {
        //console.log(data);
      })

      vm.profileDetailSubmitted = false;
      $scope.editProfileInfoEnabled = false;

      skipAuditTrails = 0;
      $scope.auditTrailList = [];
      vm.isAuditTrailLoaded = true;
      $scope.moreAuditTrailLoaded = false;

      $scope.userSelected(threesixty);
      $scope.getScheduledOrders(threesixty);
      $scope.getAuditTrailDetails(threesixty);
      $scope.getProfileCommentsInit(threesixty);
      //$scope.loadInvoiceByCustomerId(threesixty.guCustomerID);

      $timeout(function () {
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
    function closeReadPane() {
      vm.activeInvoicePaneIndex = 0;
      vm.isLoaded = false;

      $timeout(function () {
        vm.scrollEl.scrollTop(vm.scrollPos);
      }, 650);

      $scope.customer_supplier.profile = [];
      $scope.ledgerlist = [];
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
    function toggleStarred(mail, event) {
      event.stopPropagation();
      mail.starred = !mail.starred;
    }

    /**
     * Toggle checked status of the mail
     *
     * @param invoice
     * @param event
     */
    function toggleCheck(invoice, event) {
      if (event) {
        event.stopPropagation();
      }

      var idx = vm.checked.indexOf(invoice);

      if (idx > -1) {
        vm.checked.splice(idx, 1);
      } else {
        vm.checked.push(invoice);
      }
    }

    /**
     * Return checked status of the invoice
     *
     * @param invoice
     * @returns {boolean}
     */
    function isChecked(invoice) {
      return vm.checked.indexOf(invoice) > -1;
    }

    /**
     * Check all
     */
    function checkAll() {
      if (vm.allChecked) {
        vm.checked = [];
        vm.allChecked = false;
      } else {
        angular.forEach(vm.threesixty, function (invoice) {
          if (!isChecked(invoice)) {
            toggleCheck(invoice);
          }
        });

        vm.allChecked = true;
      }
    }

    /**
     * Toggle sidenav
     *
     * @param sidenavId
     */
    function toggleSidenav(sidenavId) {
      $mdSidenav(sidenavId).toggle();
    }

    /**
     * Toggle innerview
     *
     */

    function toggleinnerView() {
      if (vm.appInnerState === "default") {
        vm.appInnerState = "add";
        vm.pageTitle = "View 360";
      } else {
        vm.appInnerState = "default";
        vm.pageTitle = "Create New";
      }
    }

    function switchInnerView() {
      $scope.showInpageReadpane = false;
      if (vm.activeInvoicePaneIndex == 0) {
        vm.activeInvoicePaneIndex = 1;
        //$scope.checkAvalaraTax();
      } else {
        vm.activeInvoicePaneIndex = 0;
      }
    }


    $charge.settingsapp().getDuobaseFieldDetailsByTableNameAndFieldName("CTS_GeneralAttributes", "BaseCurrency").success(function (data) {
      $scope.BaseCurrency = data[0].RecordFieldData;
      //console.log($scope.BaseCurrency);

    }).error(function (data) {
      //console.log(data);
      $scope.BaseCurrency = "USD";
    });
    $charge.settingsapp().getDuobaseFieldDetailsByTableNameAndFieldName("CTS_ProfileAttributes", "ProfileCategory").success(function (data) {
      for (var i = 0; i < data.length; i++) {
        $scope.categories.push(data[i].RecordFieldData);
      }
      //console.log($scope.BaseCurrency);

    }).error(function (data) {
      //console.log(data);
      $scope.categories = ['Dealer', 'Supplier', 'Customer'];
    });
    $charge.settingsapp().getDuobaseValuesByTableName("CTS_CompanyAttributes").success(function (data) {
      $scope.CompanyProfile = data;
      $scope.companyName = data[0].RecordFieldData;
      $scope.companyAddress = data[1].RecordFieldData;
      $scope.companyPhone = data[2].RecordFieldData;
      $scope.companyEmail = data[3].RecordFieldData;
      $scope.companyLogo = data[4].RecordFieldData;

      // Ledger full-view info
      $scope.selectedDoc.companyName = $scope.companyName;
      $scope.selectedDoc.companyAddress = $scope.companyAddress;
      $scope.selectedDoc.companyPhone = $scope.companyPhone;
      $scope.selectedDoc.companyEmail = $scope.companyEmail;
      $scope.selectedDoc.companyLogo = $scope.companyLogo;
      $scope.selectedDoc.croppedLogo = (data[4].RecordFieldData == "") ? "" : data[4].RecordFieldData == "Array" ? "" : data[4].RecordFieldData;
      // Ledger full-view info
    }).error(function (data) {
      //console.log(data);
    });

    $charge.settingsapp().getDuobaseValuesByTableName("CTS_FooterAttributes").success(function (data) {
      $scope.isFooterDet = true;
      //debugger;
      $scope.selectedDoc.greeting = data[0].RecordFieldData;
      $scope.selectedDoc.disclaimer = data[1].RecordFieldData != "" ? atob(data[1].RecordFieldData) : "";
    }).error(function (data) {
      $scope.isFooterDet = false;
    })

    $charge.settingsapp().getDuobaseFieldDetailsByTableNameAndFieldName("CTS_GeneralAttributes", "DecimalPointLength").success(function (data) {
      $scope.decimalPoint = parseInt(data[0].RecordFieldData);
      //
      //
    }).error(function (data) {
      //console.log(data);
    });

    vm.items = [];
    vm.isdataavailable = true;
    var editfalse = true;
    vm.editOff = editfalse;
    $scope.hideSearchMore = false;

    var skipUserProfile = 0;
    var takeUserProfile = 100;
    vm.loading = true;

    $rootScope.refreshpage = function () {
      vm.profiles = [];
      vm.items = [];
      skipUserProfile = 0;
      vm.loading = true;
      $scope.searchMoreInit = true;
      $scope.hideSearchMore = false;
      $scope.more("category eq 'Customer'");
    }

	vm.filterStatus="category eq 'Customer'";
    $scope.applyFilters = function (filter) {
      vm.profiles = [];
      vm.items = [];
      skipUserProfile = 0;
      vm.loading = true;
      $scope.searchMoreInit = true;
      $scope.hideSearchMore = false;
      vm.filterStatus="";
      if(filter=="Customer"){
        vm.filterStatus="category eq 'Customer'";
      }
      else if(filter=="Supplier"){
        vm.filterStatus="category eq 'Supplier'";
      }
      else if(filter=="Dealer"){
        vm.filterStatus="category eq 'Dealer'";
      }
      $scope.more(vm.filterStatus);
    }

    $scope.more = function (filter) {


      $azureSearchHandle.getClient().SearchRequest("profile", skipUserProfile, takeUserProfile, 'desc', filter).onComplete(function (Response) {
        if (vm.loading) {
          skipUserProfile += takeUserProfile;
          //

          for (var i = 0; i < Response.length; i++) {
            //
            vm.items.push(Response[i]);

          }

          vm.profiles = vm.items;
          $scope.searchMoreInit = false;
          vm.isListLoaded = true;
          //selectProfile(data[0]);
          vm.loading = false;
          vm.isLoading = false;
          vm.isdataavailable = true;
          if (Response.length < takeUserProfile) {
            vm.isdataavailable = false;
            $scope.searchMoreInit = false;
            $scope.hideSearchMore = true;
          }
        }

      }).onError(function (data) {
        //console.log(data);
        vm.isSpinnerShown = false;
        vm.isdataavailable = false;
        vm.isLoading = false;
        vm.isListLoaded = true;
        $scope.hideSearchMore = true;

        //$scope.infoJson = {};
        //$scope.infoJson.message = JSON.stringify(data);
        //$scope.infoJson.app = '360';
        //logHelper.error($scope.infoJson);
      });

    };
    // we call the function twice to populate the list
    $scope.more("category eq 'Customer'");

    $scope.searchMoreProfileClick = function () {
      vm.loading = true;
      $scope.more(vm.filterStatus);
    }

    $scope.searchKeyPress = function (event, keyword, length) {
      if (event.keyCode === 13) {
        //console.log("Function Reached!");
        $scope.loadByKeywordProfile(keyword, length);
      }
    }

    var skipProfileSearch, takeProfileSearch;
    var tempList;
    $scope.loadByKeywordProfile = function (keyword, length) {
      if (vm.items.length >= 100) {
        //
        if (length == undefined) {
          keyword = "undefined";
          length = 0;
        }
        var searchLength = length;
        //if(keyword.toLowerCase().startsWith($scope.expensePrefix.toLowerCase()))
        //{
        //  keyword=keyword.substr($scope.expensePrefix.length);
        //  console.log(keyword);
        //  searchLength=1;
        //}
        if (keyword.length == searchLength) {
          //console.log(keyword);
          //
          skipProfileSearch = 0;
          takeProfileSearch = 100;
          tempList = [];

          var dbName = "";
          dbName = getDomainName().split('.')[0] + "_" + getDomainExtension();
          //filter="api-version=2016-09-01&?search=*&$orderby=createdDate desc&$skip="+skip+"&$top="+take+"&$filter=(domain eq '"+dbName+"')";
          var data = {
            "search": keyword + "*",
            "searchFields": "first_name,last_name,email_addr,phone",
            "filter": "(domain eq '" + dbName + "')",
            "orderby": "createddate desc",
            "top": takeProfileSearch,
            "skip": skipProfileSearch
          }


          $charge.azuresearch().getAllProfilesPost(data).success(function (data) {
            for (var i = 0; i < data.value.length; i++) {
              if (data.value[i].status == 0) {
                data.value[i].status = false;
              } else {
                data.value[i].status = true;
              }
              data.value[i].createddate = new Date(data.value[i].createddate);
              tempList.push(data.value[i]);
            }
            vm.profiles = tempList;
            //skipProfileSearch += takeProfileSearch;
            //$scope.loadPaging(keyword, skipProfileSearch, takeProfileSearch);
          }).error(function (data) {
            vm.profiles = [];

            //$scope.infoJson = {};
            //$scope.infoJson.message = JSON.stringify(data);
            //$scope.infoJson.app = '360';
            //logHelper.error($scope.infoJson);
          });
        } else if (keyword.length == 0 || keyword == null) {
          vm.profiles = vm.items;
        }

        if (searchLength == 0 || searchLength == undefined) {
          vm.loading = true;
          $scope.more(vm.filterStatus);
        }
      }
    }


    //--------------------------360readviewcontroller-----------------------------



    $scope.openProfile = function (profile) {

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
    self.selectedItem = null;
    self.searchText = "";
    self.querySearch = querySearch;

    function querySearch(query) {

      //Custom Filter
      var results = [];
      var len = 0;
      for (var i = 0, len = $scope.profilelist.length; i < len; ++i) {
        //console.log($scope.allBanks[i].value.value);

        if ($scope.profilelist[i].profilename.toLowerCase().indexOf(query.toLowerCase()) != -1) {
          results.push($scope.profilelist[i]);
        } else if ($scope.profilelist[i].othername.toLowerCase().indexOf(query.toLowerCase()) != -1) {
          results.push($scope.profilelist[i]);
        } else if ($scope.profilelist[i].bill_addr.toLowerCase().indexOf(query.toLowerCase()) != -1) {
          results.push($scope.profilelist[i]);
        } else if ($scope.profilelist[i].contact.toLowerCase().indexOf(query.toLowerCase()) != -1) {
          results.push($scope.profilelist[i]);
        } else if ($scope.profilelist[i].email_addr.toLowerCase().indexOf(query.toLowerCase()) != -1) {
          results.push($scope.profilelist[i]);
        } else if ($scope.profilelist[i].ssn_regno.toLowerCase().indexOf(query.toLowerCase()) != -1) {
          results.push($scope.profilelist[i]);
        }

      }
      return results;
    }
    $scope.profilelist = [];

    var skipprofiles = 0;
    var takeprofiles = 100;

    function loadAll() {

      $charge.profile().all(skipprofiles, takeprofiles, 'asc').success(function (data) {
        //console.log(data);
        skipprofiles += takeprofiles;
        for (var i = 0; i < data.length; i++) {
          var obj = data[i];

          if (obj.profile_type == 'Business') {
            $scope.profilelist.push({
              profilename: obj.business_name,
              profileId: obj.profileId,
              othername: obj.business_contact_name,
              profile_type: obj.profile_type,
              bill_addr: obj.bill_addr,
              ship_addr: obj.ship_addr,
              contact: obj.business_contact_no,
              email_addr: obj.email_addr,
              ssn_regno: obj.business_reg_no
            });
          } else if (obj.profile_type == 'Individual') {
            $scope.profilelist.push({
              profilename: obj.first_name,
              profileId: obj.profileId,
              othername: obj.last_name,
              profile_type: obj.profile_type,
              bill_addr: obj.bill_addr,
              ship_addr: obj.ship_addr,
              contact: obj.phone,
              email_addr: obj.email_addr,
              ssn_regno: obj.nic_ssn
            });
          }

        }
        loadAll();

      }).error(function (data) {
        //alert ("Error getting all banks");
      });

    }
    //loadAll();

    var skip = 0;
    var take = 20;
    var totbalance = 0;
    var invbalance = 0;
    var recbalance = 0;
    var adjustmentbalance = 0;
    $scope.isdataavailable = false;

    $scope.ledgerlist = $rootScope.ledgerlist;

    $scope.userSelected = function (customer) {

      $rootScope.selectedProfile = customer;
      skip = 0;
      var cusId = customer.profileId;

      $charge.ledger().getTotalAmounts(cusId, 'in').success(function (data) {
        //console.log(1);
        //console.log(data);
        recbalance = parseFloat(data[0]['sum(amount)']);

        $charge.ledger().getTotalAmounts(cusId, 'out').success(function (data) {
          //console.log(2);
          //console.log(data);
          invbalance = parseFloat(data[0]['sum(amount)']);

          $charge.ledger().getTotalAdjustment(cusId).success(function (data) {
            //console.log(3);
            //console.log(data);
            adjustmentbalance = parseFloat(data.sum);

            totbalance = invbalance + recbalance + adjustmentbalance;
            recbalance = -recbalance;

            $scope.ledgerlist = [];
            $scope.isdataavailable = true;
            $scope.loadLedger(customer);

          }).error(function (data) {
            //console.log(data);
            vm.isLoaded = true;

            //$scope.infoJson = {};
            //$scope.infoJson.message = JSON.stringify(data);
            //$scope.infoJson.app = '360';
            //logHelper.error($scope.infoJson);
          })

        }).error(function (data) {
          //console.log(data);
          vm.isLoaded = true;
        })

      }).error(function (data) {
        //console.log(data);
        vm.isLoaded = true;
      })

      //-- function removed --
      //$charge.order().getByAccountID(cusId, 0, 5000).success(function (data)
      //$rootScope.orderlist

    }

    $scope.loadLedger = function (customer) {
      //
      var cusId = customer.profileId;
      //$scope.ledgerlist = [];
      //console.log(cusId);
      $charge.ledger().getByAccountID(cusId, skip, take, 'desc').success(function (data) {
        //console.log(data);

        skip += take;


        for (var i = 0; i < data.length; i++) {
          var obj = data[i];
          //if(obj.accountId==cusId)
          //{
          if (obj.transactionType.toLowerCase() == "invoice") {
            //invbalance+=parseInt(obj.amount);
            //invbalance+=parseFloat(obj.amount);
          } else if (obj.transactionType.toLowerCase() == "receipt") {
            //recbalance+=parseInt(obj.amount);
            //recbalance+=parseFloat(obj.amount);
            obj.amount = -obj.amount;
          } else if (obj.transactionType.toLowerCase() == "creditnote") {
            obj.transactionType = "CREDIT NOTE";
          } else if (obj.transactionType.toLowerCase() == "debitnote") {
            obj.transactionType = "DEBIT NOTE";
          }
          var checkamount = parseFloat(obj.amount);
          if (checkamount < 0) {
            obj.amount = -obj.amount;
          }

          $scope.ledgerlist.push(obj);
          //}
        }
        vm.ledgerLength = $scope.ledgerlist.length;
        $scope.moreLedgerLoaded = true;
        //$scope.ledgerlist.sort($scope.ledgerlist.createdDate);
        //totbalance=invbalance+recbalance;
        //recbalance=-recbalance;
        $scope.ledgerlist.invbalance = invbalance;
        $scope.ledgerlist.recbalance = recbalance;
        $scope.ledgerlist.adjustmentbalance = adjustmentbalance;
        $scope.ledgerlist.totalbal = totbalance;

        vm.isLoaded = true;
        vm.isLedgerLoaded = true;

        $rootScope.ledgerlist = $scope.ledgerlist;

        if (data.length < take) {
          $scope.isdataavailable = false;
          vm.isLedgerLoaded = false;
        }

      }).error(function (data) {
        //console.log(data);
        if (data == 204) {
          $scope.ledgerlist.invbalance = invbalance;
          $scope.ledgerlist.recbalance = recbalance;
          $scope.ledgerlist.adjustmentbalance = adjustmentbalance;
          $scope.ledgerlist.totalbal = totbalance;
          $scope.ledgerlist.isDialogLoading = false;
        }
        //$scope.ledgerlist=[];
        $scope.isdataavailable = false;
        vm.isLoaded = true;
        vm.isLedgerLoaded = false;

        //$scope.infoJson = {};
        //$scope.infoJson.message = JSON.stringify(data);
        //$scope.infoJson.app = '360';
        //logHelper.error($scope.infoJson);
      })
    }


    $scope.noOrderScheduleLabel = false;

    $scope.getScheduledOrders = function (customer) {

      var skipScheduledOrders = 0;
      var takeScheduledOrders = 100;
      var cusId = customer.profileId;
      $scope.noOrderScheduleLabel = false;
      $scope.orderScheduledList = [];
      $charge.order().getScheduledOrders(cusId, skipScheduledOrders, takeScheduledOrders).success(function (data) {
        //console.log(data);
        for (var i = 0; i < data.length; i++) {
          var objOrderSchedule = data[i];
          objOrderSchedule.id = i + 1;
          objOrderSchedule.createDate = objOrderSchedule.createDate.split(' ')[0];
          objOrderSchedule.scheduleActive = true;
          if (objOrderSchedule.type == 'Recurring') {
            objOrderSchedule.occurences = "No End Date";
          }
          $scope.orderScheduledList.push(objOrderSchedule);
          $scope.orderScheduledLoaded = true;
          $scope.addProceedsInventoryCount(objOrderSchedule.guOrderId, i);
          $scope.checkOrderStatus(objOrderSchedule.guOrderId, objOrderSchedule);

          //$charge.invoice().getInvoiceCount(objOrderSchedule.guOrderId).success(function(dataInvoice)
        }

      }).error(function (data) {
        //console.log(data);
        if (data == 204) {
          $scope.noOrderScheduleLabel = true;
        }
        $scope.orderScheduledList = [];

        //$scope.infoJson = {};
        //$scope.infoJson.message = JSON.stringify(data);
        //$scope.infoJson.app = '360';
        //logHelper.error($scope.infoJson);
      })
    }

    var skipAuditTrails = 0;
    var takeAuditTrails = 100;
    $scope.auditTrailList = [];
    vm.isAuditTrailLoaded = true;
    $scope.moreAuditTrailLoaded = false;

    $scope.getAuditTrailDetails = function (customer) {


      var cusId = customer.profileId;
      $scope.noAuditTrailLabel = false;
      vm.isAuditTrailLoaded = true;
      $charge.orderhistory().getAuditHistoryByAccID(cusId, skipAuditTrails, takeAuditTrails, 'desc').success(function (data) {
        //console.log(data);
        skipAuditTrails += takeAuditTrails;
        //$scope.auditTrailList=data;
        for (var i = 0; i < data.result.length; i++) {
          var objAuditTrail = data.result[i];
          //objAuditTrail.id=i+1;
          //objAuditTrail.createdDate=objAuditTrail.createdDate.split(' ')[0];
          $scope.auditTrailList.push(objAuditTrail);

        }

        if (data.result.length < takeAuditTrails) {
          vm.isAuditTrailLoaded = false;
        }
        $scope.moreAuditTrailLoaded = true;

      }).error(function (data) {
        //console.log(data);
        if (data == 204) {
          $scope.noAuditTrailLabel = true;
        }
        $scope.moreAuditTrailLoaded = true;
        vm.isAuditTrailLoaded = false;
        //$scope.auditTrailList=[];
      })
    }

    $scope.searchmoreAuditTrails = function (customer) {
      $scope.moreAuditTrailLoaded = false;
      $scope.getAuditTrailDetails(customer);
    }

    vm.profileAttachmentList = {};
    // vm.profileAttachmentList={
    // 	result:{
    // 		0:"https://buidln.clipdealer.com/001/758/844//previews/16--1758844-grass.jpg",
    // 		1:"http://www.un.org/Depts/Cartographic/map/profile/world.pdf"
    // 	}
    // };
    $scope.isAttachmentPreviewOn = false;
    $scope.threesixtyTabs = 0;
    $scope.refreshPreview = true;
    $scope.openItemUrl = function (url) {
      vm.refreshAttachmentPreview();
      var tempname = url.split('/').pop();
      $scope.isAttachmentPreviewOn = true;
      $scope.attachmentPreview = url;
      $scope.fileExtension = tempname.split('.').pop().toLowerCase();
      getBlob(url, function (blob) {
        if (blob != null) {
          dataURLtoFile(blob, tempname, function (file) {
            if (file != null) {
              var fSExt = new Array('Bytes', 'KB', 'MB', 'GB'),
                i = 0,
                fileSize = file.size;
              while (fileSize > 900) {
                fileSize /= 1024;
                i++;
              }
              $scope.fileSize = (Math.round(fileSize * 100) / 100) + ' ' + fSExt[i];
              $scope.fileName = tempname;
              $scope.$apply();
            }
          });
        }
      });

      // $window.open(
      // 	url, '_blank'
      // );
    };

    $scope.removeAttachment = function (customer, file) {
      //$window.location.href=url;
      var path = "profileAttachments/CCProfile_" + customer.profileId + "/" + file;
      $charge.storage().deleteAttachmentByPath(path).success(function (data) {
        //console.log(data);
        notifications.toast("Attachment Removed!", "success");
        $scope.getProfileAttachments(customer);

        //$scope.infoJson = {};
        //$scope.infoJson.message = file + ' Attachment Removed';
        //$scope.infoJson.app = '360';
        //logHelper.info($scope.infoJson);

      }).error(function (data) {
        //console.log(data);
        notifications.toast("Attachment Removing failed!", "error");

        //$scope.infoJson = {};
        //$scope.infoJson.message = file + ' Attachment Removing failed';
        //$scope.infoJson.app = '360';
        //logHelper.error($scope.infoJson);
      })
    };

    var skipProfileComments = 0;
    var takeProfileComments = 10;
    $scope.commentsList = [];
    // $scope.commentsList = [{
    // 	comment:" this ti s a text comment",
    // 	createdDate: new Date('2012.12.12')
    // },{
    // 	comment:" this ti s a text comment",
    // 	createdDate: new Date('2012.12.12')
    // }];
    vm.isProfileCommentsLoaded = true;
    $scope.moreProfileCommentsLoaded = false;

    $scope.getProfileCommentsInit = function (customer) {
      skipProfileComments = 0;
      takeProfileComments = 10;
      $scope.commentsList = [];
      $scope.moreProfileCommentsLoaded = false;
      $scope.getProfileComments(customer);
      $scope.getProfileAttachments(customer);
      $scope.profileComment = {};
    }

    $scope.getProfileAttachments = function (customer) {

      var cusId = customer.profileId;
      var folderName = "profileAttachments/CCProfile_" + cusId;
      $charge.storage().getAttachmentsByFolder(folderName).success(function (data) {
        //console.log(data);
        vm.profileAttachmentList = data;

      }).error(function (data) {
        //console.log(data);
        // vm.profileAttachmentList={};
        //$scope.infoJson = {};
        //$scope.infoJson.message = JSON.stringify(data);
        //$scope.infoJson.app = '360';
        //logHelper.error($scope.infoJson);
      })
    }

    $scope.getProfileComments = function (customer) {

      var cusId = customer.profileId;
      $scope.noProfileComentsLabel = false;
      vm.isProfileCommentsLoaded = true;
      $charge.profile().getAllComments(skipProfileComments, takeProfileComments, 'desc', cusId).success(function (data) {
        //console.log(data);
        skipProfileComments += takeProfileComments;
        //$scope.auditTrailList=data;
        for (var i = 0; i < data.length; i++) {
          var objProfileComment = data[i];
          //objAuditTrail.id=i+1;
          //objAuditTrail.createdDate=objAuditTrail.createdDate.split(' ')[0];
          objProfileComment.createdDate = new Date(data[i].createdDate);
          $scope.commentsList.push(objProfileComment);

        }

        if (data.length < takeProfileComments) {
          $scope.moreProfileCommentsLoaded = true;
        }
        vm.isProfileCommentsLoaded = false;

      }).error(function (data) {
        //console.log(data);
        if (data == 204) {
          $scope.noProfileComentsLabel = true;
        }
        $scope.moreProfileCommentsLoaded = true;
        vm.isProfileCommentsLoaded = false;
        //$scope.auditTrailList=[];
        //$scope.infoJson = {};
        //$scope.infoJson.message = JSON.stringify(data);
        //$scope.infoJson.app = '360';
        //logHelper.error($scope.infoJson);
      })
    }

    $scope.searchmoreProfileComments = function (customer) {
      $scope.moreProfileCommentsLoaded = false;
      $scope.getProfileComments(customer);
    }

    vm.profileCommentSubmitted = false;
    $scope.profileComment = {};
    $scope.submitProfileComment = function (customer) {

      if ($scope.profileComment.comment != "" && $scope.profileComment.comment != undefined) {
        vm.profileCommentSubmitted = true;
        var cusId = customer.profileId;
        var profileComment = {
          "profileComment": [{
            "guProfileId": cusId,
            "comment": $scope.profileComment.comment
          }]
        };
        $charge.profile().addComments(profileComment).success(function (data) {
          //console.log(data);
          if (data == true) {
            notifications.toast("Comment Added!", "success");
            $scope.profileComment.comment = "";
            $scope.getProfileCommentsInit(customer);

            //$scope.infoJson = {};
            //$scope.infoJson.message = customer.profileId + ' Comment Added to the Profile';
            //$scope.infoJson.app = '360';
            //logHelper.info($scope.infoJson);
          }
          vm.profileCommentSubmitted = false;

        }).error(function (data) {
          //console.log(data);
          notifications.toast("Comment adding failed!", "error");
          vm.profileCommentSubmitted = false;
          //$scope.auditTrailList=[];
          //$scope.infoJson = {};
          //$scope.infoJson.message = customer.profileId + ' Comment Added Failed to the Profile';
          //$scope.infoJson.app = '360';
          //logHelper.error($scope.infoJson);
        })
      } else {
        notifications.toast("Comment cannot be empty!", "error");
      }
    }

    $scope.cardloadform = "";
    $scope.cardLastDigits = {};
    vm.isAddUpdateCardLoading = false;

    $scope.addUpdateCardDetails = function (customer) {
      vm.isAddUpdateCardLoading = true;
      var cardDetails = {};
      if ($scope.customer_supplier.profile.stripeCustId != null) {
        $charge.paymentgateway().getPaymentGatewayDetails(customer.profileId).success(function (response) {

          var cardDetailDigits = response.data[0];
          if (cardDetailDigits) {
            $scope.cardLastDigits = cardDetailDigits;

          } else {
            $scope.cardLastDigits = {};
          }

        }).error(function (data) {
          var cardloadfail = data;

        });

        cardDetails = {
          "profileId": customer.profileId,
          "redirectUrl": "https://app.cloudcharge.com/planEmbededForm/planSubscriptionScript.php/?method=cardFormShellResponse",
          "action": "update"
        };
      } else {
        $scope.cardLastDigits = {};

        cardDetails = {
          "profileId": customer.profileId,
          "redirectUrl": "https://app.cloudcharge.com/planEmbededForm/planSubscriptionScript.php/?method=cardFormShellResponse",
          "action": "insert"
        };
      }

      $charge.paymentgateway().addUpdateCard(cardDetails).success(function (data) {
        //
        $scope.cardloadform = data;
        angular.element("#addUpdateCardId").empty();

        var iframe = document.getElementById('addUpdateCardId');
        // iframe.append($scope.cardloadform);
        if (iframe) {
          iframe = iframe.contentWindow || (iframe.contentDocument.document || iframe.contentDocument);

          iframe.document.open();
          iframe.document.write($scope.cardloadform);
          iframe.document.close();
        }

        // angular.element("#addUpdateCardId").append($scope.cardloadform);

        vm.isAddUpdateCardLoading = false;
        //$scope.showMoreUserInfo=false;

      }).error(function (data) {
        //console.log(dataErrorInvoice);
        //$scope.orderScheduledList.push(objOrderSchedule);
        vm.isAddUpdateCardLoading = false;

        //$scope.infoJson = {};
        //$scope.infoJson.message = JSON.stringify(data);
        //$scope.infoJson.app = '360';
        //logHelper.error($scope.infoJson);
      })
    }

    $scope.$watch(function () {
      var iframe = document.getElementById('addUpdateCardId');
      // iframe.append($scope.cardloadform);
      if (iframe) {
        iframe = iframe.contentWindow || (iframe.contentDocument.document || iframe.contentDocument);
        if(iframe.document.children[0].children[1].children[1]){
			var elem = iframe.document.children[0].children[1].children[1].getAttribute('style');

			$('#addUpdateCardId').css({
				'height': 56 + 'px',
				'overflow-y': 'hidden!important'
			  });

			if (elem.indexOf('display: block') !== -1) {
				$('#addUpdateCardId').css('height', 550 + 'px');
			} else {
			$('#addUpdateCardId').css({
				'height': 56 + 'px',
				'overflow-y': 'hidden!important'
			});
			}
		}
      }
    });

    $scope.addProceedsInventoryCount = function (guOrderId, index) {
      $charge.invoice().getInvoiceCount(guOrderId).success(function (dataInvoice) {
        //
        $scope.orderScheduledList[index].proceedinvoices = dataInvoice[0].invoiceCount;
        //$scope.orderScheduledList.push(objOrderSchedule);
      }).error(function (dataErrorInvoice) {
        //console.log(dataErrorInvoice);

        $scope.orderScheduledList[index].proceedinvoices = 0;
        //$scope.orderScheduledList.push(objOrderSchedule);

        //$scope.infoJson = {};
        //$scope.infoJson.message = JSON.stringify(dataErrorInvoice);
        //$scope.infoJson.app = '360';
        //logHelper.error($scope.infoJson);
      })
    }

    $scope.disconnectOrder = function (orderId, detail) {

      $charge.job().disconnectJob(orderId).success(function (data) {
        //console.log(data);
        if (data.IsSuccess == true) {
          detail.scheduleActive = false;
          notifications.toast("Product Order has been Disconnected Successfully!", "success");
        } else {
          notifications.toast("Product Order Disconnection failed!", "error");
        }
      }).error(function (data) {
        //console.log(data);
        notifications.toast("Product Order Disconnection failed!", "error");
      })
    }

    $scope.resumeOrder = function (orderId, detail) {

      $charge.job().resumeJob(orderId).success(function (data) {
        //console.log(data);borzinaspe@deyom.com
        if (data.IsSuccess == true) {
          detail.scheduleActive = true;
          notifications.toast("Product Order has been Resumed Successfully!", "success");
        } else {
          notifications.toast("Product Order Resume failed!", "error");
        }
      }).error(function (data) {
        //console.log(data);
        notifications.toast("Product Order Resume failed!", "error");
      })
    }

    $scope.checkOrderStatus = function (orderId, detail) {
      //
      $charge.job().checkJobStatus(orderId).success(function (data) {
        //console.log(data);
        if (data.status == "Active") {
          detail.scheduleActive = true;
        } else {
          detail.scheduleActive = false;
        }
        detail.logic = data.logic;
        detail.logic = detail.logic.split('T')[0];
      }).error(function (data) {
        //console.log(data);
        detail.scheduleActive = true;
      })
    }

    $scope.searchmorebuttonclick = function (customer) {
      $scope.moreLedgerLoaded = false;
      $scope.loading = true;
      $scope.loadLedger(customer);
    }

    $scope.showAdvancedInvoice = function (ev, invoice) {

      vm.detailedInvoice = invoice;

      //$scope.openInvoiceLst(invoice);
      $mdDialog.show({
          controller: 'AdvanceViewInvoiceController',
          controllerAs: 'vm',
          templateUrl: 'app/main/360/views/customInvoiceThreesixty.html',
          parent: angular.element(document.body),
          locals: {
            selectedInvoice: invoice,
            currentTemplateView: $scope.currentTemplateView,
            isTimelineDialogLoaded: $scope.isTimelineDialogLoaded,
            docType: 'invoice',
            selectedDoc: $scope.selectedDoc
          },
          targetEvent: ev,
          clickOutsideToClose: false
        })
        .then(function (answer) {
          $scope.isTimelineDialogLoaded = true;
        }, function () {
          $scope.isTimelineDialogLoaded = true;
        });
    };

    $scope.showAdvancedPayment = function (ev, payment) {

      //$scope.openInvoiceLst(payment);

      $mdDialog.show({
          controller: 'AdvanceViewPaymentController',
          controllerAs: 'vm',
          templateUrl: 'app/main/360/views/customInvoiceThreesixty.html',
          parent: angular.element(document.body),
          locals: {
            selectedPayment: payment,
            currentTemplateView: $scope.currentTemplateView,
            isTimelineDialogLoaded: $scope.isTimelineDialogLoaded,
            docType: 'payment',
            selectedDoc: $scope.selectedDoc
          },
          targetEvent: ev,
          clickOutsideToClose: false
        })
        .then(function (answer) {
          $scope.isTimelineDialogLoaded = true;
        }, function () {
          $scope.isTimelineDialogLoaded = true;
        });
    };

    $scope.isTimelineDialogLoaded = true;

    $scope.clickLedgerItem = function (ev, item) {
      $scope.isTimelineDialogLoaded = false;
      item.isDialogLoading = true;
      if (item.transactionType.toLowerCase() == "invoice" || item.transactionType.toLowerCase() == "invoice-cancelled") {
        $scope.openInvoiceLst(ev, item);
      } else if (item.transactionType.toLowerCase() == "receipt" || item.transactionType.toLowerCase() == "receipt-cancelled") {
        $scope.openPaymentLst(ev, item);
      } else if (item.transactionType.toLowerCase() == "credit note" || item.transactionType.toLowerCase() == "debit note") {
        //$scope.openAdjustmentLst(ev,item);
        item.isDialogLoading = false;
      }
    }

    $scope.cancel = function ($scope, $mdDialog) {
      $mdDialog.cancel();
    };

    var prefixLength = "";
    var lenPrefix;
    $scope.prefixInvoice = localStorage.getItem("invoicePrefix");
    prefixLength = localStorage.getItem("prefixLength");
    $scope.lenPrefixInvoice = prefixLength != 0 ? parseInt(prefixLength) : 0;

    //$charge.commondata().getDuobaseFieldDetailsByTableNameAndFieldName("CTS_InvoiceAttributes","PrefixLength").success(function(data) {
    //  prefixLength=data[0];
    //  lenPrefix=prefixLength!=0? parseInt(prefixLength.RecordFieldData):0;
    //}).error(function(data) {
    //  console.log(data);
    //})

    $scope.openInvoiceLst = function (ev, invoice) {

      $charge.invoice().getByGuinvId(invoice.referenceID).success(function (data) {

        $scope.invProducts = [];
        var invoiceDetails = data[0].invoiceDetails;
        var count = invoiceDetails.length;
        var productName;
        var status = false;
        var totDiscount = 0;
        //var address = $scope.GetAddress(invoice.person_name);
        //var address = $filter('filter')($scope.users, { profilename: invoice.person_name })[0];
        //$scope.prefix=prefixLength!=0? parseInt(prefixLength.RecordFieldData):0;
        //var prefixInvoice=invoicePrefix!=""?invoicePrefix.RecordFieldData:"INV";

        var exchangeRate = parseFloat(data[0].rate);
        $scope.selectedInvoice = {};
        $scope.selectedInvoice = data[0];
        //$scope.selectedInvoice.prefix=prefixLength!=0? parseInt(prefixLength.RecordFieldData):0;
        var invoiceNum = $filter('numberFixedLen')($scope.selectedInvoice.invoiceNo, $scope.lenPrefixInvoice);
        $scope.selectedInvoice.invoiceNo = $scope.prefixInvoice + invoiceNum;

        $scope.selectedInvoice.bill_addr = data[0].bill_addr;
        $scope.selectedInvoice.person_name = data[0].profile_type == "Individual" ? data[0].first_name + " " + data[0].last_name : data[0].business_name;
        $scope.selectedInvoice.email_addr = data[0].email_addr;
        $scope.selectedInvoice.phone = data[0].phone;
        $scope.selectedInvoice.subTotal = angular.copy(data[0].subTotal * exchangeRate);
        $scope.selectedInvoice.discAmt = data[0].discAmt * exchangeRate;
        //$scope.selectedInvoice.invoiceNo=prefixInvoice;

        $scope.selectedInvoice.additionalcharge = data[0].additionalcharge * exchangeRate;
        $scope.selectedInvoice.invoiceAmount = data[0].invoiceAmount * exchangeRate;
        $scope.selectedInvoice.tax = data[0].tax * exchangeRate;
        $scope.selectedInvoice.dueDate = moment(data[0].dueDate.toString()).format('LL');
        $scope.selectedInvoice.logo = $rootScope.companyLogo;
        $scope.selectedInvoice.currency = data[0].currency;
        $scope.selectedInvoice.rate = exchangeRate;
        $scope.selectedInvoice.invoiceDetails = invoiceDetails;
        $scope.selectedInvoice.companyName = $scope.companyName;
        $scope.selectedInvoice.companyAddress = $scope.companyAddress;
        $scope.selectedInvoice.companyPhone = $scope.companyPhone;
        $scope.selectedInvoice.companyEmail = $scope.companyEmail;
        $scope.selectedInvoice.companyLogo = $scope.companyLogo;
        // Ledger full-view info
        $scope.selectedDoc.UserName = $scope.selectedInvoice.person_name; //business_name,business_contact_name
        $scope.selectedDoc.UserAddress = $scope.selectedInvoice.bill_addr;
        $scope.selectedDoc.UserContact = $scope.selectedInvoice.phone;
        $scope.selectedDoc.UserEmail = $scope.selectedInvoice.email_addr;
        // Ledger full-view info

        invoiceDetails.forEach(function (inv) {
          inv.product_name = inv.product_name;
          inv.unitPrice = inv.unitPrice * exchangeRate;
          inv.gty = inv.gty;
          inv.totalPrice = inv.totalPrice * exchangeRate;
          totDiscount = totDiscount + inv.discount * exchangeRate;
          inv.promotion = totDiscount
        });
        $scope.selectedInvoice.discount = totDiscount;
        $scope.selectedInvoice = $scope.selectedInvoice;
        $scope.selectedInvoice.transactionType = invoice.transactionType;


        $scope.showAdvancedInvoice(ev, $scope.selectedInvoice);
        invoice.isDialogLoading = false;

      }).error(function (data) {
        //console.log(data);
        $scope.spinnerInvoice = false;

        //$scope.infoJson = {};
        //$scope.infoJson.message = JSON.stringify(data);
        //$scope.infoJson.app = '360';
        //logHelper.error($scope.infoJson);

      });
    }

    //$charge.commondata().getDuobaseFieldDetailsByTableNameAndFieldName("CTS_PaymentAttributes","PaymentPrefix").success(function(data) {
    //  $scope.paymentPrefix=data[0].RecordFieldData;
    //  console.log($scope.paymentPrefix);
    //}).error(function(data) {
    //  console.log(data);
    //})
    $scope.paymentPrefix = localStorage.getItem("paymentPrefix");

    var prefixLengthPayment = localStorage.getItem("paymentPrefixLength");
    $scope.lenPrefixPayment = prefixLengthPayment != 0 ? parseInt(prefixLengthPayment) : 0;

    $scope.openPaymentLst = function (ev, payment) {

      $charge.payment().getByID(payment.referenceID).success(function (data) {

        //console.log(moment(data[i].paymentDate).format('LL'));
        data.paymentDate = moment(data.paymentDate).format('L');
        //data.paymentNo=$scope.paymentPrefix+data.paymentNo;
        var paymentNum = $filter('numberFixedLen')(data.paymentNo, $scope.lenPrefixPayment);
        data.paymentNo = $scope.paymentPrefix + paymentNum;
        //
        var insertedCurrency = data.currency;
        var insertedrate = 1;
        if (data.rate != null || data.rate != "" || data.rate != undefined) {
          insertedrate = parseFloat(data.rate);
        }

        if (insertedCurrency != $scope.BaseCurrency) {
          data.amount = Math.round((parseFloat(data.amount) * insertedrate) * 100) / 100;
          if (data.bankCharges != null || data.bankCharges != "" || data.bankCharges != undefined) {
            data.bankCharges = Math.round((parseFloat(data.bankCharges) * insertedrate) * 100) / 100;
          }
          $scope.selectedPayment = data;
        } else {
          $scope.selectedPayment = data;
        }

        $scope.selectedPayment.companyName = $scope.companyName;
        $scope.selectedPayment.companyAddress = $scope.companyAddress;
        $scope.selectedPayment.companyPhone = $scope.companyPhone;
        $scope.selectedPayment.companyEmail = $scope.companyEmail;
        $scope.selectedPayment.companyLogo = $scope.companyLogo;

        if (data.profile_type == 'Individual') {
          $scope.selectedPayment.UserName = data.first_name + " " + data.last_name;
          $scope.selectedPayment.UserAddress = data.bill_addr;
          $scope.selectedPayment.UserContact = data.phone;
          $scope.selectedPayment.UserEmail = data.email_addr;
          // Ledger full-view info
          $scope.selectedDoc.UserName = data.first_name + " " + data.last_name;
          $scope.selectedDoc.UserAddress = data.bill_addr;
          $scope.selectedDoc.UserContact = data.phone;
          $scope.selectedDoc.UserEmail = data.email_addr;
          // Ledger full-view info
        } else if (data.profile_type == 'Business') {
          $scope.selectedPayment.UserName = data.business_contact_name; //business_name,business_contact_name
          $scope.selectedPayment.UserAddress = data.bill_addr;
          $scope.selectedPayment.UserContact = data.business_contact_no;
          $scope.selectedPayment.UserEmail = data.email_addr;
          // Ledger full-view info
          $scope.selectedDoc.UserName = data.business_contact_name; //business_name,business_contact_name
          $scope.selectedDoc.UserAddress = data.bill_addr;
          $scope.selectedDoc.UserContact = data.business_contact_no;
          $scope.selectedDoc.UserEmail = data.email_addr;
          // Ledger full-view info
        }

        $scope.selectedPayment.transactionType = payment.transactionType;
        $scope.showAdvancedPayment(ev, $scope.selectedPayment);

        payment.isDialogLoading = false;

        //$scope.items.push(data[i]);  payment service Version - 6.1.0.5

        //vm.payments=$scope.selectedInvoice;

      }).error(function (data) {
        //console.log(data);
        $scope.selectedPayment = false;

        //$scope.infoJson = {};
        //$scope.infoJson.message = JSON.stringify(data);
        //$scope.infoJson.app = '360';
        //logHelper.error($scope.infoJson);

      });
    }

    $scope.openAdjustmentLst = function (ev, adjustment) {

      $scope.selectedInvoice = [];
      //adjustment.referenceID="91";
      $charge.adjustment().getByAdjustmentId(adjustment.referenceID).success(function (data) {

        $scope.selectedInvoice = data[0];

        $scope.selectedInvoice.companyName = $scope.companyName;
        $scope.selectedInvoice.companyAddress = $scope.companyAddress;
        $scope.selectedInvoice.companyPhone = $scope.companyPhone;
        $scope.selectedInvoice.companyEmail = $scope.companyEmail;
        $scope.selectedInvoice.companyLogo = $scope.companyLogo;

        if ($scope.selectedInvoice.amount != undefined && $scope.selectedInvoice.rate != undefined) {
          $scope.selectedInvoice.amount = parseFloat($scope.selectedInvoice.amount * $scope.selectedInvoice.rate);
        }

        $scope.SelectedInvoiceForAdjustment = [];

        if (data[0].invoiceid && data[0].invoiceid != 0) {

          //var invoiceId = data[0].invoiceid.split(' ');


          $charge.invoice().getByID(data[0].invoiceid).success(function (data) {

            //console.log(data);
            for (var i = 0; i < data.length; i++) {
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

              $scope.SelectedInvoiceForAdjustment = ({
                invoiceid: data[i]["invoiceNo"],
                invoiceno: $scope.prefixInvoice + ' ' + data[i]["invoiceNo"],
                currencyAmount: currencyAmount,
                invoiceAmount: data[i]["invoiceAmount"],
                invoiceDate: data[i]["invoiceDate"],
                invoiceStatus: data[i]["invoiceStatus"],
                currency: data[i]["currency"],
                invoiceType: data[i]["invoiceType"],
                paidAmount: data[i]["paidAmount"],
                subTotal: data[i]["subTotal"]
              });



            }
            $scope.showAdvancedAdjustment(ev, $scope.selectedInvoice, $scope.SelectedInvoiceForAdjustment);
            adjustment.isDialogLoading = false;

            // $scope.isLoading = false;
          }).error(function (data) {
            //console.log(data);
            $scope.showAdvancedAdjustment(ev, $scope.selectedInvoice, $scope.SelectedInvoiceForAdjustment);

            //$scope.infoJson = {};
            //$scope.infoJson.message = JSON.stringify(data);
            //$scope.infoJson.app = '360';
            //logHelper.error($scope.infoJson);
          })

        } else {
          $scope.showAdvancedAdjustment(ev, $scope.selectedInvoice, $scope.SelectedInvoiceForAdjustment);
        }

      }).error(function (data) {
        //console.log(data);
        $scope.spinnerInvoice = false;

        //$scope.infoJson = {};
        //$scope.infoJson.message = JSON.stringify(data);
        //$scope.infoJson.app = '360';
        //logHelper.error($scope.infoJson);

      });

    }

    $scope.showAdvancedAdjustment = function (ev, adjustment, invoice) {

      $mdDialog.show({
          controller: 'AdvanceViewAdjustmentController',
          controllerAs: 'vm',
          templateUrl: 'app/main/360/views/customInvoiceThreesixty.html',
          parent: angular.element(document.body),
          locals: {
            // selectedAdjustment: adjustment,
            selectedInvoice: adjustment,
            isTimelineDialogLoaded: $scope.isTimelineDialogLoaded,
            docType: 'adjustment'
          },
          targetEvent: ev,
          clickOutsideToClose: false
        })
        .then(function (answer) {
          $scope.isTimelineDialogLoaded = true;
        }, function () {
          $scope.isTimelineDialogLoaded = true;
        });
    }

    $scope.editProfileInfoEnabled = false;
    $scope.editProfileInfo = function (profile) {
      $scope.editProfileInfoEnabled = !$scope.editProfileInfoEnabled;
    }

    $scope.resetProfileInfo = function () {
      $scope.customer_supplier.profile = angular.copy(vm.selectedProfileOriginal);
    }

    $scope.cancelEditProfileInfo = function () {
      $scope.editProfileInfo();
      $scope.resetProfileInfo();
    }

    $scope.submitProfilePre = function () {
      if ($scope.customer_supplier.profile.attachment.length > 0) {
        angular.forEach($scope.customer_supplier.profile.attachment, function (obj) {

          var filename = obj.lfFileName.substr(0, obj.lfFileName.length - (obj.lfFileName.split('.')[obj.lfFileName.split('.').length - 1].length + 1));
          var format = obj.lfFileName.split('.')[obj.lfFileName.split('.').length - 1];
          var app = "profileAttachments/CCProfile_" + $scope.customer_supplier.profile.profileId;

          var FR = new FileReader();

          FR.readAsDataURL(obj.lfFile);
          FR.addEventListener("load", function (e) {
            // $timeout(function () {
            $scope.addedAttachment = e.target.result;
            $scope.$apply();
            $scope.divClass = false;
            // },0);
            var fileType = $scope.addedAttachment.split(',')[0] + ",";

            var uploadAttachmentObj = {
              "base64Image": $scope.addedAttachment,
              "fileName": filename,
              "format": format,
              "app": app,
              "fileType": fileType
            }
            $charge.storage().storeImage(uploadAttachmentObj).success(function (data) {
              $scope.customer_supplier.profile.attachment = data.fileUrl;
              $scope.submitProfile();

              //$scope.infoJson = {};
              //$scope.infoJson.message = obj.lfFileName + ' Attachment Uploaded';
              //$scope.infoJson.app = '360';
              //logHelper.info($scope.infoJson);

            }).error(function (data) {
              //console.log(data);
              notifications.toast("Uploading attachment Failed", "error");
              $scope.customer_supplier.profile.attachment = "";
              $scope.submitProfile();

              //$scope.infoJson = {};
              //$scope.infoJson.message = obj.lfFileName + ' Uploading attachment Failed';
              //$scope.infoJson.app = '360';
              //logHelper.error($scope.infoJson);
            })

          });
        });
      } else {
        $scope.submitProfile();
      }
    }

    $scope.submitProfile = function () {

      if (vm.editProfileForm.$valid == true) {
        //debugger;
        vm.profileDetailSubmitted = true;

        $scope.customer_supplier.profile.firstName = $scope.customer_supplier.profile.profilename;
        $scope.customer_supplier.profile.lastName = $scope.customer_supplier.profile.othername;
        $scope.customer_supplier.profile.phone = $scope.customer_supplier.profile.contact;
        $scope.customer_supplier.profile.email = $scope.customer_supplier.profile.email_addr;

        if (!vm.usingAvalaraTax) {
          $scope.customer_supplier.profile.billAddress = document.getElementById('autocomplete3').value;
          $scope.customer_supplier.profile.bill_addr = document.getElementById('autocomplete3').value;
          $scope.customer_supplier.profile.country = document.getElementById('country3').value;
          $scope.customer_supplier.profile.bill_country = document.getElementById('country3').value;
        } else {
          $scope.customer_supplier.profile.billAddress = $scope.customer_supplier.profile.line1 + "|" + $scope.customer_supplier.profile.line2 + "|" + $scope.customer_supplier.profile.line3 + "|" + $scope.customer_supplier.profile.city + "|" + $scope.customer_supplier.profile.region + "|" + $scope.customer_supplier.profile.country;
        }
        $scope.customer_supplier.profile.shipAddress = document.getElementById('autocomplete4').value;
        $scope.customer_supplier.profile.ship_addr = document.getElementById('autocomplete4').value;
        $scope.customer_supplier.profile.shipCountry = document.getElementById('country4').value;
        $scope.customer_supplier.profile.ship_country = document.getElementById('country4').value;

        $charge.profile().update($scope.customer_supplier.profile).success(function (data) {
          //console.log(data);

          if (data.response == "succeeded") {
            notifications.toast("Successfully Updated the Profile", "success");
            $scope.editProfileInfo();
            vm.selectedProfileOriginal = angular.copy($scope.customer_supplier.profile);
            vm.profileDetailSubmitted = false;
            $scope.getProfileAttachments($scope.customer_supplier.profile);
            $rootScope.refreshpage();

            //$scope.infoJson = {};
            //$scope.infoJson.message = $scope.customer_supplier.profile.email + ' Successfully Updated the Profile';
            //$scope.infoJson.app = '360';
            //logHelper.info($scope.infoJson);
          } else {
            notifications.toast("Updating Profile Failed", "error");
            vm.profileDetailSubmitted = false;

            //$scope.infoJson = {};
            //$scope.infoJson.message = $scope.customer_supplier.profile.email + ' Updating Profile Failed';
            //$scope.infoJson.app = '360';
            //logHelper.error($scope.infoJson);
          }

        }).error(function (data) {
          //console.log(data);
          notifications.toast("Updating Profile Failed", "error");

          var errorMsg = "Updating Profile Failed";
          for (key in data.error) {
            errorMsg = data.error[key][0];
            break;
          }
          notifications.toast(errorMsg, "error");
          vm.profileDetailSubmitted = false;

          //$scope.infoJson = {};
          //$scope.infoJson.message = $scope.customer_supplier.profile.email + ' Updating Profile Failed';
          //$scope.infoJson.app = '360';
          //logHelper.error($scope.infoJson);
        })
      }
    }

    $scope.removeUser = function (user, ev) {

      var confirm = $mdDialog.confirm()
        .title('Are you sure you want to deactivate this user?')
        .textContent('You can revert this account once you deativate it!')
        .ariaLabel('Lucky day')
        .targetEvent(ev)
        .ok('Yes')
        .cancel('No');

      $mdDialog.show(confirm).then(function () {
        $charge.profile().deactivateProfile(user.email_addr).success(function (data) {
          //console.log(data);

          if (data.response == "succeeded") {
            notifications.toast("Successfully Deactivated the Profile", "success");
            //$scope.editProfileInfo();
            //vm.selectedProfileOriginal=angular.copy($scope.customer_supplier.profile);
            //vm.profileDetailSubmitted = false;
            //$scope.getProfileAttachments($scope.customer_supplier.profile);
            $rootScope.refreshpage();

            //$scope.infoJson = {};
            //$scope.infoJson.message = $scope.customer_supplier.profile.email + ' Successfully Deactivated the Profile';
            //$scope.infoJson.app = '360';
            //logHelper.info($scope.infoJson);
          } else {
            notifications.toast("Remove Profile Failed", "error");
            vm.profileDetailSubmitted = false;

            //$scope.infoJson = {};
            //$scope.infoJson.message = $scope.customer_supplier.profile.email + ' Remove Profile Failed';
            //$scope.infoJson.app = '360';
            //logHelper.error($scope.infoJson);
          }

        }).error(function (data) {
          //console.log(data);
          notifications.toast("Remove Profile Failed", "error");
          vm.profileDetailSubmitted = false;

          //$scope.infoJson = {};
          //$scope.infoJson.message = $scope.customer_supplier.profile.email + ' Remove Profile Failed';
          //$scope.infoJson.app = '360';
          //logHelper.error($scope.infoJson);
        })
      }, function () {

      });

    }

    $scope.addCategory = function (ev) {
      //$scope.content.category = "";
      //$scope.content.newCatVal = "";
      //$scope.newCat=true;
      //$scope.requireCat=true;

      $mdDialog.show({
          controller: ThreeSixtyController,
          templateUrl: 'app/main/360/dialogs/prompt-dialog-cat.html',
          parent: angular.element(document.body),
          targetEvent: ev,
          clickOutsideToClose: false
        })
        .then(function (result) {
          if (result != undefined) {
            $scope.categories.push(result);
            $scope.createProfile.category = result;
            $scope.customer_supplier.profile.category = result;
          }
        }, function () {});
    }

    vm.isAddStoreClicked = false;
    $scope.saveCategory = function (form, cateval) {
      if (form.$valid) {
        if (cateval != undefined) {
          vm.isAddStoreClicked = true;
          vm.isDuplicateCat = false;

          for (var i = 0; i < $scope.categories.length; i++) {
            if ($scope.categories[i] == cateval) {
              vm.isDuplicateCat = true;
              notifications.toast("Category already exist.", "error");
              break;
            }
          }
          if (!vm.isDuplicateCat) {

            var req = {
              "RecordName": "CTS_ProfileAttributes",
              "FieldName": "ProfileCategory",
              "RecordFieldData": cateval
            }

            $charge.settingsapp().insertDuoBaseValuesAddition(req).success(function (data) {

              if (data.error == "00000") {
                //$scope.newCat = false;
                vm.isAddStoreClicked = false;
                notifications.toast("Category added.", "success");
                $mdDialog.hide(cateval);
                //notifications.toast("Record Inserted, Product ID " + data.Data[0].ID , "success");
              }
            }).error(function (data) {
              //console.log(data);
              //$scope.newCat = false;
              vm.isAddStoreClicked = false;
            })
          } else {
            vm.isAddStoreClicked = false;
          }
        } else {
          //notifications.toast("Category cannot be empty.", "error");
        }
      } else {
        angular.element(document.querySelector('#promptForm')).find('.ng-invalid:visible:first').focus();
      }
    }

    $scope.closeDialog = function () {
      //$scope.newCat=false;
      $mdDialog.hide();
    }



    $scope.createProfile = {};

    $scope.addProfileInfoEnabled = false;
    $scope.addNewProfileInfo = function () {
      $scope.addProfileInfoEnabled = !$scope.addProfileInfoEnabled;
    }

    $scope.cancelAddNewProfileInfo = function () {
      $scope.addNewProfileInfo();
      $scope.createProfile = {};
    }

    $scope.creditLimit = -1;
    $scope.getCreditLimit = function (){
      $charge.settingsapp().getDuobaseFieldDetailsByTableNameAndFieldName("CTS_InvoiceAttributes", "CreditLimit").success(function (data) {
        $scope.creditLimit = parseFloat(data[0].RecordFieldData);
        //
        //
      }).error(function (data) {
        //console.log(data);
        $scope.creditLimit = -1;
      });
    }
    $scope.getCreditLimit();

    vm.usingAvalaraTax = false;

    $scope.checkAvalaraTax = function () {
      $charge.ccapi().getAvalaraTax().success(function (data) {
        //
        if (data != undefined && data != null && data != "") {
          vm.usingAvalaraTax = true;

        } else {
          vm.usingAvalaraTax = false;
        }
      }).error(function (data) {
        //console.log(data);
        vm.usingAvalaraTax = false;

      })
    }
    $scope.checkAvalaraTax();

    $scope.clearNewProfilePage = function () {
      $scope.createProfile = {};
      document.getElementById('country2').value='';
      vm.addProfileForm.$setPristine();
      vm.addProfileForm.$setUntouched();
    }

    $scope.submitNewProfile = function () {

      if (vm.addProfileForm.$valid == true) {
        //debugger;
        vm.profileDetailSubmitted = true;

        //$scope.createProfile.firstName = $scope.createProfile.profilename;
        //$scope.createProfile.lastName = $scope.createProfile.othername;
        //$scope.createProfile.phone = $scope.createProfile.contact;
        //$scope.createProfile.email = $scope.createProfile.email_addr;
        if (!vm.usingAvalaraTax) {
          $scope.createProfile.billAddress = document.getElementById('autocomplete').value;
          //$scope.createProfile.bill_addr=document.getElementById('autocomplete').value;
          $scope.createProfile.country = document.getElementById('country').value;
          //$scope.createProfile.bill_country=document.getElementById('country').value;
        }
        $scope.createProfile.shipAddress = document.getElementById('autocomplete2').value;
        //$scope.createProfile.ship_addr=document.getElementById('autocomplete2').value;
        $scope.createProfile.shipCountry = document.getElementById('country2').value;
        //$scope.createProfile.ship_country=document.getElementById('country2').value;

        $scope.createProfile.creditLimit = $scope.creditLimit;

        $charge.profile().store($scope.createProfile).success(function (data) {
          //console.log(data);

          if (data.response == "succeeded") {
            notifications.toast("Successfully Created the Profile", "success");
            $scope.addNewProfileInfo();
            //vm.selectedProfileOriginal=angular.copy($scope.createProfile);
            vm.profileDetailSubmitted = false;
            //$scope.getProfileAttachments($scope.customer_supplier.profile);
            vm.activeInvoicePaneIndex = 0;

            $rootScope.refreshpage();
            $scope.clearNewProfilePage();
            //$scope.infoJson = {};
            //$scope.infoJson.message = $scope.customer_supplier.profile.email + ' Successfully Updated the Profile';
            //$scope.infoJson.app = '360';
            //logHelper.info($scope.infoJson);
          } else {
            notifications.toast("Creating Profile Failed", "error");
            vm.profileDetailSubmitted = false;

            //$scope.infoJson = {};
            //$scope.infoJson.message = $scope.createProfile.email + ' Creating Profile Failed';
            //$scope.infoJson.app = '360';
            //logHelper.error($scope.infoJson);
          }

        }).error(function (data) {
          //console.log(data);
          var errorMsg = "Profile creation failed";
          for (key in data.error) {
            errorMsg = data.error[key][0];
            if (errorMsg == "The user or account could not be authenticated." || errorMsg.indexOf('Cannot insert The duplicate key value') >= 0) {
              errorMsg = "Profile creation failed - Duplicate Email address";
            }
            break;
          }
          notifications.toast(errorMsg, "error");
          vm.profileDetailSubmitted = false;

          //$scope.infoJson = {};
          //$scope.infoJson.message = $scope.createProfile.email + ' Creating Profile Failed';
          //$scope.infoJson.app = '360';
          //logHelper.error($scope.infoJson);
        })
      }
    }

    $scope.addressChanged = function () {
      $scope.createProfile.country = document.getElementById('country').value;
    }

    $scope.showInpageReadpane = false;
    $scope.switchInfoPane = function (state, profile) {
      if (state == 'show') {
        $scope.showInpageReadpane = true;
        $scope.$watch(function () {
          vm.selectedProfile = profile;
        });
      } else if (state == 'close') {
        $scope.showInpageReadpane = false;
        $scope.inpageReadPaneEdit = false;
      }
    }

    $scope.showMoreUserInfo = false;
    $scope.contentExpandHandler = function () {
      $scope.reverseMoreLess = !$scope.reverseMoreLess;
      if ($scope.reverseMoreLess) {
        $scope.showMoreUserInfo = true;
        vm.isAddUpdateCardLoading = true;

        angular.element("#addUpdateCardId").empty();
        // angular.element("#addUpdateCardId").append($scope.cardloadform);

        var iframe = document.getElementById('addUpdateCardId');
        // iframe.append($scope.cardloadform);
        if (iframe) {
          iframe = iframe.contentWindow || (iframe.contentDocument.document || iframe.contentDocument);

          iframe.document.open();
          iframe.document.write($scope.cardloadform);
          iframe.document.close();
        }

        vm.isAddUpdateCardLoading = false;
      } else {
        $scope.showMoreUserInfo = false;
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
      $scope.currentTemplateView = data[0][0].RecordFieldData.split('/')[data[0][0].RecordFieldData.split('/').length - 1].split('.')[0];
    }).error(function (data) {
      $scope.currentTemplateView = null;
    });
    $scope.sortBy = function (propertyName, status, property) {
      vm.profiles = $filter('orderBy')(vm.profiles, propertyName, $scope.reverse);
      $scope.reverse = !$scope.reverse;

      if (status != null) {
        if (property == 'Name') {
          $scope.showName = status;
          $scope.showContact = false;
          $scope.showType = false;
          $scope.showDate = false;
          $scope.showState = false;
		  $scope.showCategory = false;
		}
        if (property == 'Contact') {
          $scope.showName = false;
          $scope.showContact = status;
          $scope.showType = false;
          $scope.showDate = false;
          $scope.showState = false;
		  $scope.showCategory = false;
		}
        if (property == 'Date') {
          $scope.showName = false;
          $scope.showContact = false;
          $scope.showType = false;
          $scope.showDate = status;
          $scope.showState = false;
		  $scope.showCategory = false;
		}
        if (property == 'Status') {
          $scope.showName = false;
          $scope.showContact = false;
          $scope.showType = false;
          $scope.showDate = false;
          $scope.showState = status;
		  $scope.showCategory = false;
		}
        if (property == 'Category') {
          $scope.showName = false;
          $scope.showContact = false;
          $scope.showType = false;
          $scope.showDate = false;
          $scope.showState = false;
          $scope.showCategory = status;
        }
      }
    };

    function dataURLtoFile(dataurl, filename, callback) {
      var arr = dataurl.split(','),
        mime = arr[0].match(/:(.*?);/)[1],
        bstr = atob(arr[1]),
        n = bstr.length,
        u8arr = new Uint8Array(n);
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }
      callback(new File([u8arr], filename, {
        type: mime
      }));
    }

    function getBlob(url, callback) {
      var request = new XMLHttpRequest();
      request.open('GET', url, true);
      request.responseType = 'blob';
      request.onload = function () {
        var reader = new FileReader();
        reader.readAsDataURL(request.response);
        reader.onload = function (e) {
          callback(e.target.result);
        };
      };
      request.send();
    }

    $scope.downloading = false;

    function downloadAttachment(url) {
      $scope.downloading = true;
      getBlob(url, function (blobFile) {
        var dlnk = document.getElementById('hidden-donwload-anchor');
        $timeout(function () {
          dlnk.href = blobFile;
          dlnk.click();
        }, 100);
        $scope.downloading = false;
      });
    }
    // Kasun_Wijeratne_15_May



  }
})();
